-- Add missing SELECT RLS policy for the messages table.
-- RLS is auto-enabled on all tables, but messages has no SELECT policy,
-- causing 500 errors on any read/head query (including unread message count).

BEGIN;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
);

COMMIT;
