-- Harden public function execution privileges.
--
-- Supabase dumps can show broad function grants to anon/authenticated. These
-- functions are internal triggers, scheduled maintenance, or currently unwired
-- helpers, so direct client execution should not be public.

REVOKE ALL ON FUNCTION public.check_renewal_windows() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_lease_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_post_view(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_payment_receipt_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_compat_payment_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_lease_signature_timestamps() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_lease_status_transition() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.check_renewal_windows() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_lease_status_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_message() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_post_view(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_payment_receipt_update() TO service_role;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_compat_payment_status() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_lease_signature_timestamps() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_lease_status_transition() TO service_role;
