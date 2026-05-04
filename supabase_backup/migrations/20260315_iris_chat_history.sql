-- Persist iRis chat history per user so conversations survive refreshes and device changes.

CREATE TABLE IF NOT EXISTS public.iris_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.iris_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own iRis chat messages"
    ON public.iris_chat_messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own iRis chat messages"
    ON public.iris_chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_iris_chat_messages_user_created_at
    ON public.iris_chat_messages(user_id, created_at);
