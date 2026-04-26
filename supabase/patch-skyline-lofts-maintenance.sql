-- Add maintenance requests for Skyline Lofts units in 'maintenance' status
-- This creates REAL records in maintenance_requests table (visible in Maintenance page)
-- Property: Skyline Lofts (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2)
-- Landlord: 11111111-1111-1111-1111-111111111111

BEGIN;

-- Insert maintenance requests for units that are in 'maintenance' status
-- Using gen_random_uuid() for unique IDs
INSERT INTO public.maintenance_requests (id, unit_id, tenant_id, landlord_id, title, description, status, priority, category, created_at)
SELECT 
    gen_random_uuid() as id,
    u.id as unit_id,
    '33333333-3333-3333-3333-333333333351'::uuid as tenant_id, -- Use a fallback tenant
    '11111111-1111-1111-1111-111111111111'::uuid as landlord_id,
    'AC Compressor Failure' as title,
    'The AC unit is making a loud grinding noise and not cooling properly. Requires immediate inspection.' as description,
    'open' as status,
    'high' as priority,
    'electrical' as category,
    now() - INTERVAL '2 days' as created_at
FROM public.units u
WHERE u.property_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid
  AND u.status = 'maintenance'
  AND NOT EXISTS (
    SELECT 1 FROM public.maintenance_requests mr 
    WHERE mr.unit_id = u.id AND mr.status IN ('open', 'assigned', 'in_progress')
  );

COMMIT;