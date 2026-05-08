-- Final attempt to create the secure view for sessions
DROP VIEW IF EXISTS public.user_sessions;

CREATE VIEW public.user_sessions AS
SELECT id, user_id, created_at, updated_at, ip, user_agent, not_after
FROM auth.sessions
WHERE user_id = auth.uid();

GRANT SELECT ON public.user_sessions TO authenticated;
