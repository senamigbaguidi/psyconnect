-- ============================================================
-- 1. REFERRAL TICKETS (mise en relation depuis PsyBot)
-- ============================================================
CREATE TYPE public.referral_status AS ENUM ('open', 'contacted', 'closed');

CREATE TABLE public.referral_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID,
  expert_type public.expert_type NOT NULL,
  expert_id UUID,
  message TEXT,
  status public.referral_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_tickets_user ON public.referral_tickets(user_id);
CREATE INDEX idx_referral_tickets_expert ON public.referral_tickets(expert_id) WHERE expert_id IS NOT NULL;
CREATE INDEX idx_referral_tickets_status ON public.referral_tickets(status);

ALTER TABLE public.referral_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own tickets"
  ON public.referral_tickets FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Targeted experts view tickets"
  ON public.referral_tickets FOR SELECT TO authenticated
  USING (
    expert_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.expert_profiles ep
      WHERE ep.id = referral_tickets.expert_id
        AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Targeted experts update status"
  ON public.referral_tickets FOR UPDATE TO authenticated
  USING (
    expert_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.expert_profiles ep
      WHERE ep.id = referral_tickets.expert_id
        AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all tickets"
  ON public.referral_tickets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_referral_tickets_updated
  BEFORE UPDATE ON public.referral_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. CRISIS EVENTS (audit journalisation crise)
-- ============================================================
CREATE TYPE public.crisis_severity AS ENUM ('low', 'medium', 'high');

CREATE TABLE public.crisis_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  message_id UUID,
  severity public.crisis_severity NOT NULL,
  intensity_score INT NOT NULL DEFAULT 0,
  matched_keywords TEXT[] NOT NULL DEFAULT '{}',
  ai_flagged BOOLEAN NOT NULL DEFAULT false,
  excerpt TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crisis_events_conv ON public.crisis_events(conversation_id);
CREATE INDEX idx_crisis_events_severity ON public.crisis_events(severity, created_at DESC);
CREATE INDEX idx_crisis_events_unresolved ON public.crisis_events(resolved, created_at DESC) WHERE resolved = false;

ALTER TABLE public.crisis_events ENABLE ROW LEVEL SECURITY;

-- Admins only (lecture + update pour résolution). Insertion réservée au backend (service role bypass RLS).
CREATE POLICY "Admins view crisis events"
  ON public.crisis_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins resolve crisis events"
  ON public.crisis_events FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- L'utilisateur peut savoir si SES propres conversations ont déclenché une crise (pour info, pas le contenu sensible)
CREATE POLICY "Users view own crisis flags"
  ON public.crisis_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. INDEX RECHERCHE FULL-TEXT chat_messages
-- ============================================================
CREATE INDEX idx_chat_messages_conv_created
  ON public.chat_messages(conversation_id, created_at DESC);

CREATE INDEX idx_chat_messages_user_created
  ON public.chat_messages(user_id, created_at DESC);

-- Index trigram pour ILIKE rapide sur le contenu
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_chat_messages_content_trgm
  ON public.chat_messages USING gin (content gin_trgm_ops);

CREATE INDEX idx_chat_conversations_user_last
  ON public.chat_conversations(user_id, last_message_at DESC);