-- Dashboard representation seed for landlord:
-- 11111111-1111-1111-1111-111111111111
--
-- Usage:
--   psql "$SUPABASE_DB_URL" -f supabase/patch-seed-landlord-11111111-dashboard.sql
--
-- Notes:
-- - Idempotent: uses fixed UUIDs + ON CONFLICT upserts.
-- - Assumes the landlord profile already exists in public.profiles.
-- - Uses landlord_id as tenant_id for synthetic dashboard-only representation data.

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = '11111111-1111-1111-1111-111111111111'::uuid
    ) THEN
        RAISE EXCEPTION
            'Missing landlord profile %. Insert auth.users + public.profiles first.',
            '11111111-1111-1111-1111-111111111111';
    END IF;
END $$;

-- -------------------------------------------------------------------
-- Properties
-- -------------------------------------------------------------------
INSERT INTO public.properties (
    id,
    landlord_id,
    name,
    address,
    city,
    description,
    type,
    amenities,
    house_rules,
    images,
    is_featured,
    created_at,
    updated_at
) VALUES
(
    '11111111-1111-1111-1111-11111111a001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Riverside Residences',
    '12 Riverside St., Karuhatan',
    'Valenzuela',
    'Apartment cluster seeded for landlord analytics dashboard.',
    'apartment'::public.property_type,
    ARRAY['WiFi', 'CCTV', 'Laundry Area', 'Gated'],
    ARRAY['No smoking indoors', 'Observe quiet hours 10PM-6AM'],
    ARRAY[]::text[],
    true,
    now() - interval '200 days',
    now()
),
(
    '11111111-1111-1111-1111-11111111a002'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Maple Corner Homes',
    '88 Maysan Rd., Marulas',
    'Valenzuela',
    'Secondary property with mixed occupied/vacant units for KPI variance.',
    'apartment'::public.property_type,
    ARRAY['Parking', 'Water Tank'],
    ARRAY['Visitor log required'],
    ARRAY[]::text[],
    false,
    now() - interval '160 days',
    now()
)
ON CONFLICT (id) DO UPDATE
SET
    landlord_id = EXCLUDED.landlord_id,
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    amenities = EXCLUDED.amenities,
    house_rules = EXCLUDED.house_rules,
    images = EXCLUDED.images,
    is_featured = EXCLUDED.is_featured,
    updated_at = now();

-- -------------------------------------------------------------------
-- Units
-- -------------------------------------------------------------------
INSERT INTO public.units (
    id,
    property_id,
    name,
    floor,
    status,
    rent_amount,
    sqft,
    beds,
    baths,
    created_at,
    updated_at
) VALUES
(
    '11111111-1111-1111-1111-11111111b001'::uuid,
    '11111111-1111-1111-1111-11111111a001'::uuid,
    'A-101',
    1,
    'occupied'::public.unit_status,
    8500.00,
    22,
    1,
    1,
    now() - interval '180 days',
    now()
),
(
    '11111111-1111-1111-1111-11111111b002'::uuid,
    '11111111-1111-1111-1111-11111111a001'::uuid,
    'A-102',
    1,
    'occupied'::public.unit_status,
    9000.00,
    24,
    1,
    1,
    now() - interval '170 days',
    now()
),
(
    '11111111-1111-1111-1111-11111111b003'::uuid,
    '11111111-1111-1111-1111-11111111a002'::uuid,
    'B-201',
    2,
    'occupied'::public.unit_status,
    10500.00,
    30,
    1,
    1,
    now() - interval '150 days',
    now()
),
(
    '11111111-1111-1111-1111-11111111b004'::uuid,
    '11111111-1111-1111-1111-11111111a002'::uuid,
    'B-202',
    2,
    'vacant'::public.unit_status,
    11000.00,
    32,
    1,
    1,
    now() - interval '145 days',
    now()
)
ON CONFLICT (id) DO UPDATE
SET
    property_id = EXCLUDED.property_id,
    name = EXCLUDED.name,
    floor = EXCLUDED.floor,
    status = EXCLUDED.status,
    rent_amount = EXCLUDED.rent_amount,
    sqft = EXCLUDED.sqft,
    beds = EXCLUDED.beds,
    baths = EXCLUDED.baths,
    updated_at = now();

-- -------------------------------------------------------------------
-- Leases
-- -------------------------------------------------------------------
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
) VALUES
(
    '11111111-1111-1111-1111-11111111c001'::uuid,
    '11111111-1111-1111-1111-11111111b001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'active'::public.lease_status,
    current_date - 180,
    current_date + 185,
    8500.00,
    8500.00,
    '{"source":"dashboard_seed","term_months":12}'::jsonb,
    now() - interval '180 days',
    now()
),
(
    '11111111-1111-1111-1111-11111111c002'::uuid,
    '11111111-1111-1111-1111-11111111b002'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'active'::public.lease_status,
    current_date - 120,
    current_date + 245,
    9000.00,
    9000.00,
    '{"source":"dashboard_seed","term_months":12}'::jsonb,
    now() - interval '120 days',
    now()
),
(
    '11111111-1111-1111-1111-11111111c003'::uuid,
    '11111111-1111-1111-1111-11111111b003'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'active'::public.lease_status,
    current_date - 75,
    current_date + 290,
    10500.00,
    10500.00,
    '{"source":"dashboard_seed","term_months":12}'::jsonb,
    now() - interval '75 days',
    now()
),
(
    '11111111-1111-1111-1111-11111111c004'::uuid,
    '11111111-1111-1111-1111-11111111b004'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'expired'::public.lease_status,
    current_date - 420,
    current_date - 60,
    11000.00,
    11000.00,
    '{"source":"dashboard_seed","term_months":12}'::jsonb,
    now() - interval '420 days',
    now() - interval '60 days'
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
-- Payments (mix of completed, pending, and processing)
-- -------------------------------------------------------------------
INSERT INTO public.payments (
    id,
    lease_id,
    tenant_id,
    landlord_id,
    amount,
    status,
    method,
    description,
    due_date,
    paid_at,
    reference_number,
    landlord_confirmed,
    workflow_status,
    created_at,
    updated_at
) VALUES
(
    '11111111-1111-1111-1111-11111111d001'::uuid,
    '11111111-1111-1111-1111-11111111c001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    8500.00,
    'completed'::public.payment_status,
    'gcash'::public.payment_method,
    'Monthly rent - A-101',
    (date_trunc('month', now()) - interval '3 month')::date + 5,
    date_trunc('month', now()) - interval '3 month' + interval '6 days',
    'SEED-RENT-001',
    true,
    'receipted'::public.payment_workflow_status,
    now() - interval '88 days',
    now() - interval '88 days'
),
(
    '11111111-1111-1111-1111-11111111d002'::uuid,
    '11111111-1111-1111-1111-11111111c002'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    9000.00,
    'completed'::public.payment_status,
    'bank_transfer'::public.payment_method,
    'Monthly rent - A-102',
    (date_trunc('month', now()) - interval '2 month')::date + 5,
    date_trunc('month', now()) - interval '2 month' + interval '7 days',
    'SEED-RENT-002',
    true,
    'confirmed'::public.payment_workflow_status,
    now() - interval '58 days',
    now() - interval '58 days'
),
(
    '11111111-1111-1111-1111-11111111d003'::uuid,
    '11111111-1111-1111-1111-11111111c003'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    10500.00,
    'completed'::public.payment_status,
    'maya'::public.payment_method,
    'Monthly rent - B-201',
    (date_trunc('month', now()) - interval '1 month')::date + 5,
    date_trunc('month', now()) - interval '1 month' + interval '8 days',
    'SEED-RENT-003',
    true,
    'confirmed'::public.payment_workflow_status,
    now() - interval '28 days',
    now() - interval '28 days'
),
(
    '11111111-1111-1111-1111-11111111d004'::uuid,
    '11111111-1111-1111-1111-11111111c003'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    10500.00,
    'pending'::public.payment_status,
    NULL,
    'Monthly rent - current month',
    (date_trunc('month', now()))::date + 5,
    NULL,
    'SEED-RENT-004',
    false,
    'reminder_sent'::public.payment_workflow_status,
    now() - interval '3 days',
    now() - interval '1 day'
),
(
    '11111111-1111-1111-1111-11111111d005'::uuid,
    '11111111-1111-1111-1111-11111111c001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    1600.00,
    'processing'::public.payment_status,
    'gcash'::public.payment_method,
    'Maintenance reimbursement - plumbing fix',
    (date_trunc('month', now()))::date + 12,
    NULL,
    'SEED-MNT-001',
    false,
    'under_review'::public.payment_workflow_status,
    now() - interval '2 days',
    now() - interval '2 days'
)
ON CONFLICT (id) DO UPDATE
SET
    lease_id = EXCLUDED.lease_id,
    tenant_id = EXCLUDED.tenant_id,
    landlord_id = EXCLUDED.landlord_id,
    amount = EXCLUDED.amount,
    status = EXCLUDED.status,
    method = EXCLUDED.method,
    description = EXCLUDED.description,
    due_date = EXCLUDED.due_date,
    paid_at = EXCLUDED.paid_at,
    reference_number = EXCLUDED.reference_number,
    landlord_confirmed = EXCLUDED.landlord_confirmed,
    workflow_status = EXCLUDED.workflow_status,
    updated_at = now();

-- Additional dense earnings history so KPI cards and charts render fuller
-- across week/month/year windows.
INSERT INTO public.payments (
    id,
    lease_id,
    tenant_id,
    landlord_id,
    amount,
    status,
    method,
    description,
    due_date,
    paid_at,
    reference_number,
    landlord_confirmed,
    workflow_status,
    created_at,
    updated_at
) VALUES
(
    '11111111-1111-1111-1111-11111111d006'::uuid,
    '11111111-1111-1111-1111-11111111c001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    8500.00,
    'completed'::public.payment_status,
    'gcash'::public.payment_method,
    'Monthly rent top-up - week 1',
    (date_trunc('month', now()))::date + 2,
    now() - interval '27 days',
    'SEED-RENT-006',
    true,
    'receipted'::public.payment_workflow_status,
    now() - interval '27 days',
    now() - interval '27 days'
),
(
    '11111111-1111-1111-1111-11111111d007'::uuid,
    '11111111-1111-1111-1111-11111111c002'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    9000.00,
    'completed'::public.payment_status,
    'bank_transfer'::public.payment_method,
    'Monthly rent top-up - week 1',
    (date_trunc('month', now()))::date + 3,
    now() - interval '23 days',
    'SEED-RENT-007',
    true,
    'receipted'::public.payment_workflow_status,
    now() - interval '23 days',
    now() - interval '23 days'
),
(
    '11111111-1111-1111-1111-11111111d008'::uuid,
    '11111111-1111-1111-1111-11111111c003'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    10500.00,
    'completed'::public.payment_status,
    'maya'::public.payment_method,
    'Monthly rent - week 2',
    (date_trunc('month', now()))::date + 9,
    now() - interval '18 days',
    'SEED-RENT-008',
    true,
    'confirmed'::public.payment_workflow_status,
    now() - interval '18 days',
    now() - interval '18 days'
),
(
    '11111111-1111-1111-1111-11111111d009'::uuid,
    '11111111-1111-1111-1111-11111111c001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    8500.00,
    'completed'::public.payment_status,
    'gcash'::public.payment_method,
    'Monthly rent - week 2',
    (date_trunc('month', now()))::date + 10,
    now() - interval '16 days',
    'SEED-RENT-009',
    true,
    'confirmed'::public.payment_workflow_status,
    now() - interval '16 days',
    now() - interval '16 days'
),
(
    '11111111-1111-1111-1111-11111111d010'::uuid,
    '11111111-1111-1111-1111-11111111c002'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    9000.00,
    'completed'::public.payment_status,
    'bank_transfer'::public.payment_method,
    'Monthly rent - week 3',
    (date_trunc('month', now()))::date + 15,
    now() - interval '12 days',
    'SEED-RENT-010',
    true,
    'confirmed'::public.payment_workflow_status,
    now() - interval '12 days',
    now() - interval '12 days'
),
(
    '11111111-1111-1111-1111-11111111d011'::uuid,
    '11111111-1111-1111-1111-11111111c003'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    10500.00,
    'completed'::public.payment_status,
    'gcash'::public.payment_method,
    'Monthly rent - week 3',
    (date_trunc('month', now()))::date + 17,
    now() - interval '9 days',
    'SEED-RENT-011',
    true,
    'confirmed'::public.payment_workflow_status,
    now() - interval '9 days',
    now() - interval '9 days'
),
(
    '11111111-1111-1111-1111-11111111d012'::uuid,
    '11111111-1111-1111-1111-11111111c001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    8500.00,
    'completed'::public.payment_status,
    'maya'::public.payment_method,
    'Monthly rent - week 4',
    (date_trunc('month', now()))::date + 22,
    now() - interval '5 days',
    'SEED-RENT-012',
    true,
    'confirmed'::public.payment_workflow_status,
    now() - interval '5 days',
    now() - interval '5 days'
),
(
    '11111111-1111-1111-1111-11111111d013'::uuid,
    '11111111-1111-1111-1111-11111111c002'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    9000.00,
    'completed'::public.payment_status,
    'gcash'::public.payment_method,
    'Monthly rent - week 4',
    (date_trunc('month', now()))::date + 24,
    now() - interval '3 days',
    'SEED-RENT-013',
    true,
    'confirmed'::public.payment_workflow_status,
    now() - interval '3 days',
    now() - interval '3 days'
),
(
    '11111111-1111-1111-1111-11111111d014'::uuid,
    '11111111-1111-1111-1111-11111111c003'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    10500.00,
    'completed'::public.payment_status,
    'bank_transfer'::public.payment_method,
    'Monthly rent - week 5',
    (date_trunc('month', now()))::date + 28,
    now() - interval '1 day',
    'SEED-RENT-014',
    true,
    'confirmed'::public.payment_workflow_status,
    now() - interval '1 day',
    now() - interval '1 day'
),
(
    '11111111-1111-1111-1111-11111111d015'::uuid,
    '11111111-1111-1111-1111-11111111c001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    16000.00,
    'completed'::public.payment_status,
    'cash'::public.payment_method,
    'Advance + utility settlement',
    (date_trunc('month', now()))::date + 25,
    now() - interval '2 days',
    'SEED-RENT-015',
    true,
    'receipted'::public.payment_workflow_status,
    now() - interval '2 days',
    now() - interval '2 days'
),
(
    '11111111-1111-1111-1111-11111111d016'::uuid,
    '11111111-1111-1111-1111-11111111c003'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    12000.00,
    'completed'::public.payment_status,
    'gcash'::public.payment_method,
    'Monthly rent - prior period anchor',
    (date_trunc('month', now()) - interval '1 month')::date + 12,
    now() - interval '36 days',
    'SEED-RENT-016',
    true,
    'confirmed'::public.payment_workflow_status,
    now() - interval '36 days',
    now() - interval '36 days'
),
(
    '11111111-1111-1111-1111-11111111d017'::uuid,
    '11111111-1111-1111-1111-11111111c002'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    14500.00,
    'completed'::public.payment_status,
    'maya'::public.payment_method,
    'Monthly rent - prior period anchor',
    (date_trunc('month', now()) - interval '1 month')::date + 20,
    now() - interval '44 days',
    'SEED-RENT-017',
    true,
    'confirmed'::public.payment_workflow_status,
    now() - interval '44 days',
    now() - interval '44 days'
)
ON CONFLICT (id) DO UPDATE
SET
    lease_id = EXCLUDED.lease_id,
    tenant_id = EXCLUDED.tenant_id,
    landlord_id = EXCLUDED.landlord_id,
    amount = EXCLUDED.amount,
    status = EXCLUDED.status,
    method = EXCLUDED.method,
    description = EXCLUDED.description,
    due_date = EXCLUDED.due_date,
    paid_at = EXCLUDED.paid_at,
    reference_number = EXCLUDED.reference_number,
    landlord_confirmed = EXCLUDED.landlord_confirmed,
    workflow_status = EXCLUDED.workflow_status,
    updated_at = now();

-- -------------------------------------------------------------------
-- Maintenance requests (mix of open/in_progress/resolved)
-- -------------------------------------------------------------------
INSERT INTO public.maintenance_requests (
    id,
    unit_id,
    tenant_id,
    landlord_id,
    title,
    description,
    status,
    priority,
    category,
    resolved_at,
    created_at,
    updated_at
) VALUES
(
    '11111111-1111-1111-1111-11111111e001'::uuid,
    '11111111-1111-1111-1111-11111111b001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Kitchen faucet leak',
    'Slow leak under sink cabinet.',
    'open'::public.maintenance_status,
    'high'::public.maintenance_priority,
    'plumbing',
    NULL,
    now() - interval '6 days',
    now() - interval '6 days'
),
(
    '11111111-1111-1111-1111-11111111e002'::uuid,
    '11111111-1111-1111-1111-11111111b002'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Hallway light replacement',
    'Bulb keeps flickering near entrance.',
    'in_progress'::public.maintenance_status,
    'medium'::public.maintenance_priority,
    'electrical',
    NULL,
    now() - interval '4 days',
    now() - interval '1 day'
),
(
    '11111111-1111-1111-1111-11111111e003'::uuid,
    '11111111-1111-1111-1111-11111111b003'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'AC filter cleaning',
    'Periodic cleaning done during inspection.',
    'resolved'::public.maintenance_status,
    'low'::public.maintenance_priority,
    'hvac',
    now() - interval '8 days',
    now() - interval '12 days',
    now() - interval '8 days'
)
ON CONFLICT (id) DO UPDATE
SET
    unit_id = EXCLUDED.unit_id,
    tenant_id = EXCLUDED.tenant_id,
    landlord_id = EXCLUDED.landlord_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    priority = EXCLUDED.priority,
    category = EXCLUDED.category,
    resolved_at = EXCLUDED.resolved_at,
    updated_at = now();

-- -------------------------------------------------------------------
-- Export history (for statistics Export History card)
-- -------------------------------------------------------------------
INSERT INTO public.landlord_statistics_exports (
    id,
    landlord_id,
    format,
    report_range,
    mode,
    include_expanded_kpis,
    row_count,
    metadata,
    created_at
) VALUES
(
    '11111111-1111-1111-1111-11111111f001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'pdf',
    'Last 30 Days',
    'Simplified',
    false,
    8,
    '{"source":"seed_patch","report":"landlord_dashboard"}'::jsonb,
    now() - interval '3 days'
),
(
    '11111111-1111-1111-1111-11111111f002'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'csv',
    'Last 90 Days',
    'Detailed',
    true,
    12,
    '{"source":"seed_patch","report":"landlord_dashboard"}'::jsonb,
    now() - interval '9 days'
)
ON CONFLICT (id) DO UPDATE
SET
    landlord_id = EXCLUDED.landlord_id,
    format = EXCLUDED.format,
    report_range = EXCLUDED.report_range,
    mode = EXCLUDED.mode,
    include_expanded_kpis = EXCLUDED.include_expanded_kpis,
    row_count = EXCLUDED.row_count,
    metadata = EXCLUDED.metadata,
    created_at = EXCLUDED.created_at;

COMMIT;
