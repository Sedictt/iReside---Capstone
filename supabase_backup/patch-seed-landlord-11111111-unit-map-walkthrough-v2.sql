-- Walkthrough-ready unit map seed patch (v2) for landlord:
-- 11111111-1111-1111-1111-111111111111
--
-- Changes from prior patch:
-- - Skyline Lofts only
-- - Exactly 2 floors (floor1, floor2)
-- - 10 total units (5 per floor)
-- - Mixed statuses (occupied, vacant, maintenance)
-- - No map decorations
--
-- Usage:
--   psql "$SUPABASE_DB_URL" -f supabase/patch-seed-landlord-11111111-unit-map-walkthrough-v2.sql

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
-- 1) Add tenant accounts used by occupied walkthrough units
-- -------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333351', 'authenticated', 'authenticated', 'tenant.skyline.d@ireside.local', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Mika Torres","role":"tenant","phone":"+639171110351"}'::jsonb, now(), now()),
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333352', 'authenticated', 'authenticated', 'tenant.skyline.e@ireside.local', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Neil Garcia","role":"tenant","phone":"+639171110352"}'::jsonb, now(), now()),
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333353', 'authenticated', 'authenticated', 'tenant.skyline.f@ireside.local', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Ivy Santos","role":"tenant","phone":"+639171110353"}'::jsonb, now(), now()),
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333354', 'authenticated', 'authenticated', 'tenant.skyline.g@ireside.local', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Ralph Cruz","role":"tenant","phone":"+639171110354"}'::jsonb, now(), now()),
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333355', 'authenticated', 'authenticated', 'tenant.skyline.h@ireside.local', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Sam Delos Reyes","role":"tenant","phone":"+639171110355"}'::jsonb, now(), now()),
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333356', 'authenticated', 'authenticated', 'tenant.skyline.i@ireside.local', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Kaye Ramos","role":"tenant","phone":"+639171110356"}'::jsonb, now(), now())
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping auth.users tenant seed: %', SQLERRM;
  END;
END $$;

INSERT INTO public.profiles (id, email, full_name, role, phone, business_name, business_permits)
VALUES
  ('33333333-3333-3333-3333-333333333351', 'tenant.skyline.d@ireside.local', 'Mika Torres', 'tenant', '+639171110351', NULL, ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333352', 'tenant.skyline.e@ireside.local', 'Neil Garcia', 'tenant', '+639171110352', NULL, ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333353', 'tenant.skyline.f@ireside.local', 'Ivy Santos', 'tenant', '+639171110353', NULL, ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333354', 'tenant.skyline.g@ireside.local', 'Ralph Cruz', 'tenant', '+639171110354', NULL, ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333355', 'tenant.skyline.h@ireside.local', 'Sam Delos Reyes', 'tenant', '+639171110355', NULL, ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333356', 'tenant.skyline.i@ireside.local', 'Kaye Ramos', 'tenant', '+639171110356', NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  updated_at = now();

-- -------------------------------------------------------------------
-- 2) Ensure Skyline Lofts has only 2 floor configs
-- -------------------------------------------------------------------
DELETE FROM public.property_floor_configs
WHERE property_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid
  AND floor_key NOT IN ('floor1', 'floor2');

INSERT INTO public.property_floor_configs (
  property_id,
  floor_number,
  floor_key,
  display_name,
  sort_order
)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 1, 'floor1', 'Level 1', 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 2, 'floor2', 'Level 2', 2)
ON CONFLICT (property_id, floor_key) DO UPDATE
SET
  floor_number = EXCLUDED.floor_number,
  display_name = EXCLUDED.display_name,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- -------------------------------------------------------------------
-- 3) Seed 10 skyline units (5 per floor) with mixed statuses
-- -------------------------------------------------------------------
INSERT INTO public.units (id, property_id, name, floor, status, rent_amount, sqft, beds, baths)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 1A', 1, 'occupied',    14500.00, 510, 2, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 1B', 1, 'vacant',      14800.00, 520, 2, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb61', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 1C', 1, 'maintenance', 15000.00, 535, 2, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb62', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 1D', 1, 'occupied',    15500.00, 560, 2, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb63', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 1E', 1, 'vacant',      16000.00, 590, 3, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb64', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 2A', 2, 'occupied',    16500.00, 620, 3, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb65', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 2B', 2, 'maintenance', 17000.00, 650, 3, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb66', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 2C', 2, 'occupied',    17400.00, 670, 3, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb67', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 2D', 2, 'vacant',      17800.00, 700, 3, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb68', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 2E', 2, 'occupied',    18200.00, 730, 3, 2)
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

-- Remove stale skyline positions for units not in this walkthrough set.
WITH skyline_units AS (
  SELECT u.id
  FROM public.units u
  WHERE u.property_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid
),
walkthrough_units AS (
  SELECT unnest(ARRAY[
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb61'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb62'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb63'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb64'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb65'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb66'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb67'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb68'::uuid
  ]) AS id
)
DELETE FROM public.unit_map_positions ump
USING skyline_units su
LEFT JOIN walkthrough_units wu ON wu.id = su.id
WHERE ump.unit_id = su.id
  AND wu.id IS NULL;

-- -------------------------------------------------------------------
-- 4) Unit-map positions (2 floors, 5 units each)
-- -------------------------------------------------------------------
INSERT INTO public.unit_map_positions (unit_id, floor_key, x, y, w, h)
VALUES
  -- floor1
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10', 'floor1', 110, 110, 220, 140),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11', 'floor1', 360, 110, 220, 140),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb61', 'floor1', 610, 110, 220, 140),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb62', 'floor1', 860, 110, 220, 140),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb63', 'floor1', 1110, 110, 220, 140),
  -- floor2
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb64', 'floor2', 110, 110, 220, 140),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb65', 'floor2', 360, 110, 220, 140),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb66', 'floor2', 610, 110, 220, 140),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb67', 'floor2', 860, 110, 220, 140),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb68', 'floor2', 1110, 110, 220, 140)
ON CONFLICT (unit_id) DO UPDATE
SET
  floor_key = EXCLUDED.floor_key,
  x = EXCLUDED.x,
  y = EXCLUDED.y,
  w = EXCLUDED.w,
  h = EXCLUDED.h,
  updated_at = now();

-- -------------------------------------------------------------------
-- 5) Keep map decorations empty for this simplified walkthrough
-- -------------------------------------------------------------------
UPDATE public.properties
SET map_decorations = '{}'::jsonb
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid;

-- -------------------------------------------------------------------
-- 6) Add active leases for occupied units (for realistic occupancy)
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
  tenant_signature,
  landlord_signature,
  signed_at
)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc51', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10', '33333333-3333-3333-3333-333333333351', '11111111-1111-1111-1111-111111111111', 'active', CURRENT_DATE - INTERVAL '88 days', CURRENT_DATE + INTERVAL '277 days', 14500.00, 14500.00, '{"due_day":5,"allow_partial":false,"late_fee":700}'::jsonb, 'tenant-sig-v2-1', 'landlord-sig-v2-1', now() - INTERVAL '88 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc52', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb62', '33333333-3333-3333-3333-333333333352', '11111111-1111-1111-1111-111111111111', 'active', CURRENT_DATE - INTERVAL '57 days', CURRENT_DATE + INTERVAL '308 days', 15500.00, 15500.00, '{"due_day":1,"allow_partial":false,"late_fee":800}'::jsonb, 'tenant-sig-v2-2', 'landlord-sig-v2-2', now() - INTERVAL '57 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc53', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb64', '33333333-3333-3333-3333-333333333353', '11111111-1111-1111-1111-111111111111', 'active', CURRENT_DATE - INTERVAL '43 days', CURRENT_DATE + INTERVAL '322 days', 16500.00, 16500.00, '{"due_day":10,"allow_partial":false,"late_fee":850}'::jsonb, 'tenant-sig-v2-3', 'landlord-sig-v2-3', now() - INTERVAL '43 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc54', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb66', '33333333-3333-3333-3333-333333333354', '11111111-1111-1111-1111-111111111111', 'active', CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE + INTERVAL '336 days', 17400.00, 17400.00, '{"due_day":15,"allow_partial":true,"late_fee":900}'::jsonb, 'tenant-sig-v2-4', 'landlord-sig-v2-4', now() - INTERVAL '29 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc55', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb68', '33333333-3333-3333-3333-333333333355', '11111111-1111-1111-1111-111111111111', 'active', CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE + INTERVAL '352 days', 18200.00, 18200.00, '{"due_day":20,"allow_partial":false,"late_fee":950}'::jsonb, 'tenant-sig-v2-5', 'landlord-sig-v2-5', now() - INTERVAL '13 days')
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
  tenant_signature = EXCLUDED.tenant_signature,
  landlord_signature = EXCLUDED.landlord_signature,
  signed_at = EXCLUDED.signed_at,
  updated_at = now();

COMMIT;
