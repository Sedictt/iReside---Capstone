-- Lease hub and move-out request seed for landlord:
-- 11111111-1111-1111-1111-111111111111
--
-- Usage:
--   psql "$SUPABASE_DB_URL" -f supabase/patch-seed-landlord-11111111-lease-hub.sql
--
-- Notes:
-- - Idempotent: uses fixed UUIDs + ON CONFLICT upserts.
-- - Assumes the landlord profile, properties, units, and tenant profiles already exist.
-- - Adds leases for vacant units and move-out requests for selected tenants.

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = '11111111-1111-1111-1111-111111111111'::uuid
    ) THEN
        RAISE EXCEPTION
            'Missing landlord profile %. Seed auth.users + public.profiles first.',
            '11111111-1111-1111-1111-111111111111';
    END IF;
END $$;

-- -------------------------------------------------------------------
-- 1) Add leases for vacant Skyline Lofts units (to populate lease hub)
-- -------------------------------------------------------------------
-- For seed data purposes, we use existing tenant profiles as placeholders.
-- In production, draft leases would be created when onboarding new tenants.

INSERT INTO public.leases (
    id,
    unit_id,
    tenant_id,
    landlord_id,
    status,
    start_date,
    end_date,
    monthly_rent,
    security_deposit,
    terms,
    created_at,
    updated_at
)
VALUES
    -- Unit bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11 (floor1 unit 2) - draft lease
    -- Using existing tenant profile as placeholder
    (
        'dddddddd-dddd-dddd-dddd-dddddddd5061'::uuid,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11'::uuid,
        '33333333-3333-3333-3333-333333333356'::uuid, -- Kaye Ramos (placeholder tenant)
        '11111111-1111-1111-1111-111111111111'::uuid,
        'draft'::public.lease_status,
        CURRENT_DATE + INTERVAL '7 days',
        CURRENT_DATE + INTERVAL '372 days',
        14000.00,
        14000.00,
        '{"due_day":5,"allow_partial":false,"late_fee":700,"source":"lease-hub-seed"}'::jsonb,
        now(),
        now()
    ),
    -- Unit bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb61 (floor1 unit 3) - pending
    (
        'dddddddd-dddd-dddd-dddd-dddddddd5062'::uuid,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb61'::uuid,
        '33333333-3333-3333-3333-333333333356'::uuid, -- Kaye Ramos (placeholder tenant)
        '11111111-1111-1111-1111-111111111111'::uuid,
        'pending_tenant_signature'::public.lease_status,
        CURRENT_DATE + INTERVAL '14 days',
        CURRENT_DATE + INTERVAL '379 days',
        14800.00,
        14800.00,
        '{"due_day":5,"allow_partial":false,"late_fee":740,"source":"lease-hub-seed"}'::jsonb,
        now(),
        now()
    ),
    -- Unit bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb63 (floor1 unit 5) - active (for demo)
    (
        'dddddddd-dddd-dddd-dddd-dddddddd5063'::uuid,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb63'::uuid,
        '33333333-3333-3333-3333-333333333356'::uuid, -- Kaye Ramos (placeholder tenant)
        '11111111-1111-1111-1111-111111111111'::uuid,
        'active'::public.lease_status,
        CURRENT_DATE - INTERVAL '5 days',
        CURRENT_DATE + INTERVAL '360 days',
        15200.00,
        15200.00,
        '{"due_day":5,"allow_partial":false,"late_fee":760,"source":"lease-hub-seed"}'::jsonb,
        now() - INTERVAL '5 days',
        now()
    ),
    -- Unit bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb65 (floor2 unit 2) - expired
    (
        'dddddddd-dddd-dddd-dddd-dddddddd5064'::uuid,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb65'::uuid,
        '33333333-3333-3333-3333-333333333356'::uuid, -- Kaye Ramos (placeholder tenant)
        '11111111-1111-1111-1111-111111111111'::uuid,
        'expired'::public.lease_status,
        CURRENT_DATE - INTERVAL '400 days',
        CURRENT_DATE - INTERVAL '40 days',
        17000.00,
        17000.00,
        '{"due_day":5,"allow_partial":false,"late_fee":850,"source":"lease-hub-seed"}'::jsonb,
        now() - INTERVAL '400 days',
        now() - INTERVAL '40 days'
    ),
    -- Unit bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb67 (floor2 unit 4) - draft
    (
        'dddddddd-dddd-dddd-dddd-dddddddd5065'::uuid,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb67'::uuid,
        '33333333-3333-3333-3333-333333333356'::uuid, -- Kaye Ramos (placeholder tenant)
        '11111111-1111-1111-1111-111111111111'::uuid,
        'draft'::public.lease_status,
        CURRENT_DATE + INTERVAL '10 days',
        CURRENT_DATE + INTERVAL '375 days',
        17800.00,
        17800.00,
        '{"due_day":5,"allow_partial":false,"late_fee":890,"source":"lease-hub-seed"}'::jsonb,
        now(),
        now()
    )
ON CONFLICT (id) DO UPDATE
SET
    unit_id = EXCLUDED.unit_id,
    tenant_id = EXCLUDED.tenant_id,
    landlord_id = EXCLUDED.landlord_id,
    status = EXCLUDED.status,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    monthly_rent = EXCLUDED.monthly_rent,
    security_deposit = EXCLUDED.security_deposit,
    terms = EXCLUDED.terms,
    updated_at = now();

-- -------------------------------------------------------------------
-- 2) Add move-out requests for selected active leases
-- -------------------------------------------------------------------
-- These simulate tenants who have submitted move-out requests for their leases.
-- Status: pending, approved, denied, completed

INSERT INTO public.move_out_requests (
    id,
    lease_id,
    tenant_id,
    landlord_id,
    reason,
    requested_date,
    status,
    notes,
    created_at,
    updated_at
)
VALUES
    -- Move-out request for Mika Torres (lease cccccccc-cccc-cccc-cccc-cccccccccc51)
    -- Status: pending - tenant wants to move out next month
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeee0051'::uuid,
        'cccccccc-cccc-cccc-cccc-cccccccccc51'::uuid,
        '33333333-3333-3333-3333-333333333351'::uuid,
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Job relocation to Makati. Moving closer to new workplace.',
        CURRENT_DATE - INTERVAL '3 days',
        'pending'::public.move_out_status,
        'Tenant will vacate by end of next month if approved.',
        now() - INTERVAL '3 days',
        now()
    ),
    -- Move-out request for Neil Garcia (lease cccccccc-cccc-cccc-cccc-cccccccccc52)
    -- Status: approved - landlord approved the move-out
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeee0052'::uuid,
        'cccccccc-cccc-cccc-cccc-cccccccccc52'::uuid,
        '33333333-3333-3333-3333-333333333352'::uuid,
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Purchased own property in Quezon City.',
        CURRENT_DATE - INTERVAL '15 days',
        'approved'::public.move_out_status,
        'Approved. Tenant to vacate by 15th of next month. Deposit refund processed.',
        now() - INTERVAL '15 days',
        now() - INTERVAL '10 days'
    ),
    -- Move-out request for Ivy Santos (lease cccccccc-cccc-cccc-cccc-cccccccccc53)
    -- Status: pending - just submitted
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeee0053'::uuid,
        'cccccccc-cccc-cccc-cccc-cccccccccc53'::uuid,
        '33333333-3333-3333-3333-333333333353'::uuid,
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Relocating to province to care for elderly parents.',
        CURRENT_DATE - INTERVAL '1 day',
        'pending'::public.move_out_status,
        'Needs final inspection scheduled.',
        now() - INTERVAL '1 day',
        now()
    ),
    -- Move-out request for Ralph Cruz (lease cccccccc-cccc-cccc-cccc-cccccccccc54)
    -- Status: completed - tenant already moved out
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeee0054'::uuid,
        'cccccccc-cccc-cccc-cccc-cccccccccc54'::uuid,
        '33333333-3333-3333-3333-333333333354'::uuid,
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Rent became too expensive with recent price increase.',
        CURRENT_DATE - INTERVAL '45 days',
        'completed'::public.move_out_status,
        'Unit inspected and keys returned. Deposit refunded in full.',
        now() - INTERVAL '45 days',
        now() - INTERVAL '30 days'
    ),
    -- Move-out request for Sam Delos Reyes (lease cccccccc-cccc-cccc-cccc-cccccccccc55)
    -- Status: denied - landlord denied the request (late notice)
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeee0055'::uuid,
        'cccccccc-cccc-cccc-cccc-cccccccccc55'::uuid,
        '33333333-3333-3333-3333-333333333355'::uuid,
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Need to move out earlier than lease end date.',
        CURRENT_DATE - INTERVAL '20 days',
        'denied'::public.move_out_status,
        'Denied: Less than 30 days notice. Tenant can resubmit with proper notice period.',
        now() - INTERVAL '20 days',
        now() - INTERVAL '18 days'
    )
ON CONFLICT (id) DO UPDATE
SET
    lease_id = EXCLUDED.lease_id,
    tenant_id = EXCLUDED.tenant_id,
    landlord_id = EXCLUDED.landlord_id,
    reason = EXCLUDED.reason,
    requested_date = EXCLUDED.requested_date,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    updated_at = now();

-- -------------------------------------------------------------------
-- 3) Add move-out request for the expired lease (B-202 from dashboard)
-- -------------------------------------------------------------------
-- This lease already expired, so a move-out request completes the cycle.
-- Note: lease c004 was created with landlord_id as tenant_id, so we use that same pattern.
INSERT INTO public.move_out_requests (
    id,
    lease_id,
    tenant_id,
    landlord_id,
    reason,
    requested_date,
    status,
    notes,
    created_at,
    updated_at
)
VALUES
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeee0056'::uuid,
        '11111111-1111-1111-1111-11111111c004'::uuid, -- expired lease for B-202
        '11111111-1111-1111-1111-111111111111'::uuid, -- tenant_id matches what was seeded
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Lease expired - tenant moved out.',
        CURRENT_DATE - INTERVAL '58 days',
        'completed'::public.move_out_status,
        'Lease naturally expired. Unit B-202 is now vacant and ready for new tenant.',
        now() - INTERVAL '60 days',
        now() - INTERVAL '58 days'
    )
ON CONFLICT (id) DO UPDATE
SET
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    updated_at = now();

COMMIT;

-- Verification query (run separately):
-- SELECT lr.status, lr.unit_id, lr.tenant_id, lr.start_date, lr.end_date, u.name as unit_name
-- FROM public.leases lr
-- JOIN public.units u ON u.id = lr.unit_id
-- WHERE lr.landlord_id = '11111111-1111-1111-1111-111111111111'::uuid
-- ORDER BY lr.created_at DESC;
--
-- SELECT mor.status, mor.reason, mor.requested_date, lr.id as lease_id, p.full_name as tenant_name
-- FROM public.move_out_requests mor
-- JOIN public.leases lr ON lr.id = mor.lease_id
-- JOIN public.profiles p ON p.id = mor.tenant_id
-- WHERE mor.landlord_id = '11111111-1111-1111-1111-111111111111'::uuid
-- ORDER BY mor.created_at DESC;