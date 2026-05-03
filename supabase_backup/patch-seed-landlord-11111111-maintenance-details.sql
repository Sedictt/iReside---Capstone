-- Add maintenance requests and ensure tenants are correctly wired for unit map walkthrough
-- Landlord: 11111111-1111-1111-1111-111111111111

BEGIN;

-- 1) Create maintenance requests for units with 'maintenance' status
-- These will now show up in the unit map sidebar instead of "Unspecified Issue"
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
    created_at
)
SELECT 
    gen_random_uuid() as id,
    u.id as unit_id,
    COALESCE(l.tenant_id, '33333333-3333-3333-3333-333333333351'::uuid) as tenant_id,
    p.landlord_id,
    CASE 
        WHEN u.name LIKE '%Loft%' THEN 'AC Compressor Failure'
        ELSE 'Water Leakage in Bathroom'
    END as title,
    CASE 
        WHEN u.name LIKE '%Loft%' THEN 'The AC unit is making a loud grinding noise and not cooling. Needs immediate inspection.'
        ELSE 'There is a persistent leak under the sink causing water to pool on the floor.'
    END as description,
    'open' as status,
    'high' as priority,
    'electrical' as category,
    now() - INTERVAL '2 days'
FROM public.units u
JOIN public.properties p ON p.id = u.property_id
LEFT JOIN public.leases l ON l.unit_id = u.id AND l.status = 'active'
WHERE u.property_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid
  AND u.status = 'maintenance'
ON CONFLICT DO NOTHING;

-- 2) Ensure some 'occupied' units have leases if they were missing
-- This ensures 'blue' units actually show a tenant name
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
    signed_at
)
SELECT 
    gen_random_uuid() as id,
    u.id,
    '33333333-3333-3333-3333-333333333356'::uuid,
    p.landlord_id,
    'active',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '335 days',
    u.rent_amount,
    u.rent_amount,
    '{"due_day":5}'::jsonb,
    now()
FROM public.units u
JOIN public.properties p ON p.id = u.property_id
LEFT JOIN public.leases l ON l.unit_id = u.id
WHERE u.status = 'occupied'
  AND l.id IS NULL
ON CONFLICT DO NOTHING;

COMMIT;
