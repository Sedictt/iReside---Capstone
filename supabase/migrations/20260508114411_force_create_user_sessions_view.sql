-- Force recreation of the secure view to expose auth.sessions
DROP VIEW IF EXISTS public.user_sessions;

CREATE VIEW public.user_sessions AS
SELECT id, user_id, created_at, updated_at, ip, user_agent, not_after
FROM auth.sessions
WHERE user_id = auth.uid();

-- Grant select permission to authenticated users
GRANT SELECT ON public.user_sessions TO authenticated;
