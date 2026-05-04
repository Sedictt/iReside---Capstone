-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the lease renewal check to run every day at midnight (00:00)
-- This function checks for leases ending within their property's renewal window (default 90 days)
-- and creates notifications for eligible tenants.
SELECT cron.schedule(
    'check-lease-renewals',
    '0 0 * * *',
    $$ SELECT public.check_renewal_windows() $$
);

-- For testing or manual triggers, you can run:
-- SELECT public.check_renewal_windows();
