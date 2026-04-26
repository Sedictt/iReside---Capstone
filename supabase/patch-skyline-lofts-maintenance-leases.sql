-- Update existing maintenance unit leases to different tenants
-- Property: Skyline Lofts (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2)

BEGIN;

-- Find unit IDs first
\echo 'Units in maintenance:'
SELECT id, name FROM public.units 
WHERE property_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2' AND status = 'maintenance';

-- Update 1C to Ivy Santos
UPDATE public.leases
SET tenant_id = '33333333-3333-3333-3333-333333333353'
WHERE unit_id = (SELECT id FROM public.units WHERE name ILIKE '%1C%' LIMIT 1)
  AND status = 'active';

-- Update 6A to Neil Garcia  
UPDATE public.leases
SET tenant_id = '33333333-3333-3333-3333-333333333352'
WHERE unit_id = (SELECT id FROM public.units WHERE name ILIKE '%6A%' LIMIT 1)
  AND status = 'active';

COMMIT;