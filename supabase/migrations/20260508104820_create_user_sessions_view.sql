-- Create a secure view to expose auth.sessions to the authenticated user (v2)
CREATE OR REPLACE VIEW public.user_sessions AS
SELECT id, user_id, created_at, updated_at, ip, user_agent, not_after
FROM auth.sessions
WHERE user_id = auth.uid();

-- Grant select permission to authenticated users
GRANT SELECT ON public.user_sessions TO authenticated;
