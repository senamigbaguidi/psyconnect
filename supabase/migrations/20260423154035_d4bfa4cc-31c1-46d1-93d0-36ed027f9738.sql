-- 1. Enum pour les niveaux d'abonnement pro
CREATE TYPE public.subscription_tier AS ENUM ('none', 'standard', 'premium');

-- 2. Table des profils experts (visibles publiquement aux utilisateurs connectés)
CREATE TABLE public.expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  expert_type public.expert_type NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  cabinet_name TEXT,
  address TEXT NOT NULL,
  languages TEXT[] NOT NULL DEFAULT ARRAY['fr'],
  consultation_price NUMERIC(10,2),
  subscription_tier public.subscription_tier NOT NULL DEFAULT 'none',
  subscription_expires_at TIMESTAMPTZ,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expert_profiles ENABLE ROW LEVEL SECURITY;

-- Helper: vérifier si l'expert a un abonnement actif
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE user_id = _user_id
      AND subscription_tier IN ('standard', 'premium')
      AND (subscription_expires_at IS NULL OR subscription_expires_at > now())
  )
$$;

-- RLS expert_profiles
-- Tout utilisateur authentifié peut voir les pros avec abonnement actif (recherche)
CREATE POLICY "Authenticated users view active experts"
ON public.expert_profiles FOR SELECT TO authenticated
USING (
  subscription_tier IN ('standard', 'premium')
  AND (subscription_expires_at IS NULL OR subscription_expires_at > now())
);

-- L'expert voit son propre profil
CREATE POLICY "Experts view own profile"
ON public.expert_profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- L'expert met à jour son propre profil
CREATE POLICY "Experts update own profile"
ON public.expert_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'expert'));

-- Admins voient et gèrent tout
CREATE POLICY "Admins view all expert profiles"
ON public.expert_profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage expert profiles"
ON public.expert_profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- L'expert peut créer son profil après approbation
CREATE POLICY "Approved experts insert own profile"
ON public.expert_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'expert'));

-- Trigger updated_at
CREATE TRIGGER trg_expert_profiles_updated_at
BEFORE UPDATE ON public.expert_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Table des publications (articles)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_created ON public.posts(created_at DESC);

-- RLS posts
-- Tout utilisateur authentifié peut LIRE les publications publiées d'experts actifs
CREATE POLICY "Authenticated read published posts"
ON public.posts FOR SELECT TO authenticated
USING (
  published = true
  AND public.has_active_subscription(author_id)
);

-- L'auteur voit ses propres posts (même non publiés)
CREATE POLICY "Authors view own posts"
ON public.posts FOR SELECT TO authenticated
USING (auth.uid() = author_id);

-- SEULS les experts avec abonnement actif peuvent créer
CREATE POLICY "Active experts create posts"
ON public.posts FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND public.has_role(auth.uid(), 'expert')
  AND public.has_active_subscription(auth.uid())
);

-- L'auteur met à jour ses posts (s'il est toujours actif)
CREATE POLICY "Authors update own posts"
ON public.posts FOR UPDATE TO authenticated
USING (auth.uid() = author_id AND public.has_active_subscription(auth.uid()));

-- L'auteur ou admin supprime
CREATE POLICY "Authors or admins delete posts"
ON public.posts FOR DELETE TO authenticated
USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- Admin : voir tout / modérer
CREATE POLICY "Admins manage all posts"
ON public.posts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Bucket storage pour images de publications (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Active experts upload post images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND public.has_active_subscription(auth.uid())
);

CREATE POLICY "Experts delete own post images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
