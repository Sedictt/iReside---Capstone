-- Persist messaging moderation and visibility actions per user pair.

CREATE TABLE IF NOT EXISTS public.message_user_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    archived BOOLEAN NOT NULL DEFAULT false,
    blocked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT message_user_actions_actor_target_unique UNIQUE (actor_user_id, target_user_id),
    CONSTRAINT message_user_actions_no_self_target CHECK (actor_user_id <> target_user_id)
);

ALTER TABLE public.message_user_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own message actions"
    ON public.message_user_actions FOR SELECT
    USING (auth.uid() = actor_user_id);

CREATE POLICY "Users can create own message actions"
    ON public.message_user_actions FOR INSERT
    WITH CHECK (auth.uid() = actor_user_id);

CREATE POLICY "Users can update own message actions"
    ON public.message_user_actions FOR UPDATE
    USING (auth.uid() = actor_user_id)
    WITH CHECK (auth.uid() = actor_user_id);

CREATE INDEX IF NOT EXISTS idx_message_user_actions_actor_target
    ON public.message_user_actions(actor_user_id, target_user_id);

-- Persist user reports submitted from messaging.
CREATE TABLE IF NOT EXISTS public.message_user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT message_user_reports_no_self_target CHECK (reporter_user_id <> target_user_id)
);

ALTER TABLE public.message_user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own message reports"
    ON public.message_user_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Users can view own message reports"
    ON public.message_user_reports FOR SELECT
    USING (auth.uid() = reporter_user_id);

CREATE INDEX IF NOT EXISTS idx_message_user_reports_reporter_created
    ON public.message_user_reports(reporter_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_user_reports_target
    ON public.message_user_reports(target_user_id, created_at DESC);
