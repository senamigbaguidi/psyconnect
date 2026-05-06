
-- Helper: can a user create a community? (admin or expert)
CREATE OR REPLACE FUNCTION public.can_create_community(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
      OR public.has_role(_user_id, 'expert'::app_role);
$$;

-- Communities
CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  can_members_post boolean NOT NULL DEFAULT true,
  can_members_comment boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, user_id)
);
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- Helper: is user member of community?
CREATE OR REPLACE FUNCTION public.is_community_member(_user_id uuid, _community_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE user_id = _user_id AND community_id = _community_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_community_creator(_user_id uuid, _community_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.communities
    WHERE id = _community_id AND creator_id = _user_id
  );
$$;

-- RLS communities
CREATE POLICY "Authenticated view communities" ON public.communities
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Eligible users create communities" ON public.communities
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id AND public.can_create_community(auth.uid()));
CREATE POLICY "Creator updates community" ON public.communities
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Creator deletes community" ON public.communities
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- RLS members
CREATE POLICY "Authenticated view members" ON public.community_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "User joins community" ON public.community_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User leaves community" ON public.community_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS posts
CREATE POLICY "Members view posts" ON public.community_posts
  FOR SELECT TO authenticated
  USING (public.is_community_member(auth.uid(), community_id));
CREATE POLICY "Eligible users post" ON public.community_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND public.is_community_member(auth.uid(), community_id)
    AND (
      public.is_community_creator(auth.uid(), community_id)
      OR EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.can_members_post = true)
    )
  );
CREATE POLICY "Authors update own post" ON public.community_posts
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Authors or creator delete post" ON public.community_posts
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_community_creator(auth.uid(), community_id));

-- RLS comments
CREATE POLICY "Members view comments" ON public.community_comments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.community_posts p
    WHERE p.id = post_id AND public.is_community_member(auth.uid(), p.community_id)
  ));
CREATE POLICY "Eligible users comment" ON public.community_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.community_posts p
      JOIN public.communities c ON c.id = p.community_id
      WHERE p.id = post_id
        AND public.is_community_member(auth.uid(), p.community_id)
        AND (c.creator_id = auth.uid() OR c.can_members_comment = true)
    )
  );
CREATE POLICY "Authors delete own comment" ON public.community_comments
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- updated_at triggers
CREATE TRIGGER set_communities_updated_at BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_community_posts_updated_at BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-add creator as owner member
CREATE OR REPLACE FUNCTION public.add_creator_as_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'owner');
  RETURN NEW;
END;
$$;
CREATE TRIGGER add_creator_member AFTER INSERT ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.add_creator_as_member();
