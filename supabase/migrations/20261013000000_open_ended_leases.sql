-- Open-ended (month-to-month) tenancy
--
-- Landlords do not use fixed lease durations: a tenant stays for as long as
-- rent is paid and leaves through the move-out flow. This migration makes the
-- lease end date optional and records the term type explicitly.
--
--   term_type = 'open_ended'  (default) no fixed end. end_date is NULL until a
--                             move-out is approved, at which point it holds
--                             the agreed move-out date.
--   term_type = 'fixed'       classic dated term. end_date is required and the
--                             renewal workflow applies.
--
-- Existing rows keep their dates and are tagged 'fixed' so nothing changes for
-- them; the auto-generated 2099-12-31 placeholder used by draft billing leases
-- becomes a real open-ended lease. Landlords can switch a fixed lease to
-- open-ended from the lease card.

ALTER TABLE public.leases
  ADD COLUMN IF NOT EXISTS term_type text NOT NULL DEFAULT 'open_ended';

ALTER TABLE public.leases
  ALTER COLUMN end_date DROP NOT NULL;

-- Preserve existing dated leases as fixed-term so their behaviour is unchanged.
UPDATE public.leases
SET term_type = 'fixed'
WHERE end_date IS NOT NULL
  AND end_date <> DATE '2099-12-31';

-- Placeholder "forever" dates were never a real term.
UPDATE public.leases
SET end_date = NULL,
    term_type = 'open_ended'
WHERE end_date = DATE '2099-12-31';

ALTER TABLE public.leases DROP CONSTRAINT IF EXISTS lease_dates_valid;
ALTER TABLE public.leases DROP CONSTRAINT IF EXISTS leases_term_type_check;
ALTER TABLE public.leases DROP CONSTRAINT IF EXISTS leases_fixed_term_requires_end;

ALTER TABLE public.leases
  ADD CONSTRAINT lease_dates_valid CHECK (end_date IS NULL OR end_date > start_date),
  ADD CONSTRAINT leases_term_type_check CHECK (term_type IN ('open_ended', 'fixed')),
  ADD CONSTRAINT leases_fixed_term_requires_end CHECK (term_type <> 'fixed' OR end_date IS NOT NULL);

COMMENT ON COLUMN public.leases.term_type IS
  'open_ended (month-to-month, no fixed end; default) or fixed (dated term, end_date required).';
COMMENT ON COLUMN public.leases.end_date IS
  'Fixed-term end date. NULL for open-ended leases until a move-out date is agreed.';

-- Renewal reminders only make sense for dated terms.
CREATE OR REPLACE FUNCTION public.check_renewal_windows() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
    AS $$
DECLARE
    lease_record RECORD;
BEGIN
    FOR lease_record IN
        SELECT
            l.id as lease_id,
            l.tenant_id,
            l.landlord_id,
            l.end_date,
            p.renewal_window_days
        FROM public.leases l
        JOIN public.properties p ON p.id = (SELECT property_id FROM public.units WHERE id = l.unit_id)
        WHERE
            l.status = 'active'
            AND l.term_type = 'fixed'
            AND l.end_date IS NOT NULL
            AND l.end_date > CURRENT_DATE
            AND l.end_date <= CURRENT_DATE + (p.renewal_window_days || ' days')::interval
            AND NOT EXISTS (
                SELECT 1 FROM public.renewal_requests rr
                WHERE rr.current_lease_id = l.id
                AND rr.status IN ('pending', 'approved')
            )
            AND NOT EXISTS (
                SELECT 1 FROM public.notifications n
                WHERE n.user_id = l.tenant_id
                AND n.type = 'lease_renewal_available'
                AND n.data->>'lease_id' = l.id::text
            )
    LOOP
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            lease_record.tenant_id,
            'lease_renewal_available',
            'Lease Renewal Available',
            'Your lease renewal window is now open. You can request a renewal.',
            jsonb_build_object('lease_id', lease_record.lease_id, 'end_date', lease_record.end_date)
        );
    END LOOP;
END;
$$;
