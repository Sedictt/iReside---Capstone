-- Walkthrough-ready unit map seed patch for landlord:
-- 11111111-1111-1111-1111-111111111111
--
-- Purpose:
-- - Add more tenants + units (realistic mix)
-- - Add floor configs for unit-map
-- - Seed valid unit_map_positions (no "none"/0-size placeholders)
-- - Provide varied statuses (occupied, vacant, maintenance)
--
-- Usage:
--   psql "$SUPABASE_DB_URL" -f supabase/patch-seed-landlord-11111111-unit-map-walkthrough.sql

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
-- 1) Add synthetic-but-realistic tenant accounts for walkthrough
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
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333341', 'authenticated', 'authenticated', 'tenant.maple.a@ireside.local', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Lea Mendoza","role":"tenant","phone":"+639171110341"}'::jsonb, now(), now()),
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333342', 'authenticated', 'authenticated', 'tenant.maple.b@ireside.local', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Paolo Lim","role":"tenant","phone":"+639171110342"}'::jsonb, now(), now()),
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333343', 'authenticated', 'authenticated', 'tenant.maple.c@ireside.local', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Rica Navarro","role":"tenant","phone":"+639171110343"}'::jsonb, now(), now()),
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333344', 'authenticated', 'authenticated', 'tenant.skyline.a@ireside.local', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Ethan Flores","role":"tenant","phone":"+639171110344"}'::jsonb, now(), now()),
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333345', 'authenticated', 'authenticated', 'tenant.skyline.b@ireside.local', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Camille Reyes","role":"tenant","phone":"+639171110345"}'::jsonb, now(), now()),
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333346', 'authenticated', 'authenticated', 'tenant.skyline.c@ireside.local', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Jared Santos","role":"tenant","phone":"+639171110346"}'::jsonb, now(), now())
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
  ('33333333-3333-3333-3333-333333333341', 'tenant.maple.a@ireside.local', 'Lea Mendoza', 'tenant', '+639171110341', NULL, ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333342', 'tenant.maple.b@ireside.local', 'Paolo Lim', 'tenant', '+639171110342', NULL, ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333343', 'tenant.maple.c@ireside.local', 'Rica Navarro', 'tenant', '+639171110343', NULL, ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333344', 'tenant.skyline.a@ireside.local', 'Ethan Flores', 'tenant', '+639171110344', NULL, ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333345', 'tenant.skyline.b@ireside.local', 'Camille Reyes', 'tenant', '+639171110345', NULL, ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333346', 'tenant.skyline.c@ireside.local', 'Jared Santos', 'tenant', '+639171110346', NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  updated_at = now();

-- -------------------------------------------------------------------
-- 2) Add more units + normalize statuses for walkthrough realism
-- -------------------------------------------------------------------
INSERT INTO public.units (id, property_id, name, floor, status, rent_amount, sqft, beds, baths)
VALUES
  -- Maple Grove Residences (aaaaaaaa-...-aaa1)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb31', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Unit 1A', 1, 'occupied',    10500.00, 350, 1, 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb32', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Unit 1B', 1, 'maintenance', 10800.00, 360, 1, 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb33', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Unit 2C', 2, 'vacant',      13200.00, 430, 2, 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb34', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Unit 3A', 3, 'occupied',    14500.00, 470, 2, 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb35', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Unit 3C', 3, 'vacant',      14800.00, 480, 2, 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb36', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Unit 4A', 4, 'occupied',    16500.00, 560, 3, 2),

  -- Skyline Lofts (aaaaaaaa-...-aaa2)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb41', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 5B', 5, 'occupied',    15200.00, 530, 2, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb42', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 6A', 6, 'maintenance', 15800.00, 560, 2, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb43', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 6B', 6, 'occupied',    16200.00, 590, 2, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb44', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 7A', 7, 'vacant',      17000.00, 640, 3, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb45', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 8A', 8, 'occupied',    18200.00, 700, 3, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb46', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Loft 8B', 8, 'vacant',      18800.00, 730, 3, 2)
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

-- Keep a mixed status distribution on existing landlord-1 units too.
UPDATE public.units
SET status = 'maintenance', updated_at = now()
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11'::uuid;

-- -------------------------------------------------------------------
-- 3) Add leases for newly occupied units
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
  ('cccccccc-cccc-cccc-cccc-cccccccccc41', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb31', '33333333-3333-3333-3333-333333333341', '11111111-1111-1111-1111-111111111111', 'active', CURRENT_DATE - INTERVAL '95 days', CURRENT_DATE + INTERVAL '270 days', 10500.00, 10500.00, '{"due_day":5,"allow_partial":false,"late_fee":500}'::jsonb, 'tenant-sig-w1', 'landlord-sig-w1', now() - INTERVAL '95 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc42', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb34', '33333333-3333-3333-3333-333333333342', '11111111-1111-1111-1111-111111111111', 'active', CURRENT_DATE - INTERVAL '64 days', CURRENT_DATE + INTERVAL '301 days', 14500.00, 14500.00, '{"due_day":1,"allow_partial":false,"late_fee":750}'::jsonb, 'tenant-sig-w2', 'landlord-sig-w2', now() - INTERVAL '64 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc43', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb36', '33333333-3333-3333-3333-333333333343', '11111111-1111-1111-1111-111111111111', 'active', CURRENT_DATE - INTERVAL '38 days', CURRENT_DATE + INTERVAL '327 days', 16500.00, 16500.00, '{"due_day":8,"allow_partial":true,"late_fee":600}'::jsonb, 'tenant-sig-w3', 'landlord-sig-w3', now() - INTERVAL '38 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc44', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb41', '33333333-3333-3333-3333-333333333344', '11111111-1111-1111-1111-111111111111', 'active', CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE + INTERVAL '245 days', 15200.00, 15200.00, '{"due_day":3,"allow_partial":false,"late_fee":700}'::jsonb, 'tenant-sig-w4', 'landlord-sig-w4', now() - INTERVAL '120 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc45', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb43', '33333333-3333-3333-3333-333333333345', '11111111-1111-1111-1111-111111111111', 'active', CURRENT_DATE - INTERVAL '51 days', CURRENT_DATE + INTERVAL '314 days', 16200.00, 16200.00, '{"due_day":10,"allow_partial":false,"late_fee":800}'::jsonb, 'tenant-sig-w5', 'landlord-sig-w5', now() - INTERVAL '51 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc46', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb45', '33333333-3333-3333-3333-333333333346', '11111111-1111-1111-1111-111111111111', 'active', CURRENT_DATE - INTERVAL '17 days', CURRENT_DATE + INTERVAL '348 days', 18200.00, 18200.00, '{"due_day":15,"allow_partial":false,"late_fee":950}'::jsonb, 'tenant-sig-w6', 'landlord-sig-w6', now() - INTERVAL '17 days')
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

-- -------------------------------------------------------------------
-- 4) Floor configs for walkthrough map UX
-- -------------------------------------------------------------------
INSERT INTO public.property_floor_configs (
  property_id,
  floor_number,
  floor_key,
  display_name,
  sort_order
)
VALUES
  -- Maple Grove
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 1, 'floor1', 'Ground / Lobby', 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 2, 'floor2', 'Second Floor', 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 3, 'floor3', 'Third Floor', 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 4, 'floor4', 'Top Floor', 4),

  -- Skyline Lofts
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 5, 'floor5', 'Level 5', 5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 6, 'floor6', 'Level 6', 6),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 7, 'floor7', 'Level 7', 7),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 8, 'floor8', 'Level 8', 8)
ON CONFLICT (property_id, floor_key) DO UPDATE
SET
  floor_number = EXCLUDED.floor_number,
  display_name = EXCLUDED.display_name,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- -------------------------------------------------------------------
-- 5) Unit map positions (all valid + walkthrough-friendly)
-- -------------------------------------------------------------------
INSERT INTO public.unit_map_positions (unit_id, floor_key, x, y, w, h)
VALUES
  -- Maple floor2/floor3 existing
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',  'floor2',  120, 120, 200, 140), -- Unit 2A
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',  'floor3',  430, 120, 220, 140), -- Unit 3B

  -- Maple new
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb31',  'floor1',  120, 110, 180, 120), -- Unit 1A
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb32',  'floor1',  360, 110, 180, 120), -- Unit 1B
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb33',  'floor2',  430, 120, 220, 140), -- Unit 2C
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb34',  'floor3',  120, 120, 220, 140), -- Unit 3A
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb35',  'floor3',  740, 120, 220, 140), -- Unit 3C
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb36',  'floor4',  120, 120, 280, 160), -- Unit 4A

  -- Skyline existing (fixes previous "none"/0x0)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10',  'floor5',  110, 120, 220, 140), -- Loft 5A
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11',  'floor7',  430, 120, 280, 160), -- Loft 7C

  -- Skyline new
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb41',  'floor5',  430, 120, 220, 140), -- Loft 5B
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb42',  'floor6',  110, 120, 220, 140), -- Loft 6A
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb43',  'floor6',  430, 120, 220, 140), -- Loft 6B
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb44',  'floor7',  110, 120, 280, 160), -- Loft 7A
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb45',  'floor8',  110, 120, 280, 160), -- Loft 8A
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb46',  'floor8',  430, 120, 280, 160)  -- Loft 8B
ON CONFLICT (unit_id) DO UPDATE
SET
  floor_key = EXCLUDED.floor_key,
  x = EXCLUDED.x,
  y = EXCLUDED.y,
  w = EXCLUDED.w,
  h = EXCLUDED.h,
  updated_at = now();

-- -------------------------------------------------------------------
-- 6) Optional visual decorations to make blueprint feel alive
-- -------------------------------------------------------------------
UPDATE public.properties
SET map_decorations = jsonb_strip_nulls(jsonb_build_object(
  'floor1', jsonb_build_object(
    'corridors', jsonb_build_array(
      jsonb_build_object('id','corr-maple-f1-01','label','Corridor','x',100,'y',300,'w',520,'h',60)
    ),
    'structures', jsonb_build_array(
      jsonb_build_object('id','str-maple-f1-e1','type','elevator','label','Elevator','x',660,'y',280,'w',100,'h',100)
    )
  ),
  'floor2', jsonb_build_object(
    'corridors', jsonb_build_array(
      jsonb_build_object('id','corr-maple-f2-01','label','Corridor','x',100,'y',300,'w',640,'h',60)
    ),
    'structures', jsonb_build_array()
  ),
  'floor3', jsonb_build_object(
    'corridors', jsonb_build_array(
      jsonb_build_object('id','corr-maple-f3-01','label','Corridor','x',100,'y',300,'w',860,'h',60)
    ),
    'structures', jsonb_build_array()
  ),
  'floor4', jsonb_build_object(
    'corridors', jsonb_build_array(
      jsonb_build_object('id','corr-maple-f4-01','label','Corridor','x',100,'y',320,'w',420,'h',60)
    ),
    'structures', jsonb_build_array()
  )
))
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid;

UPDATE public.properties
SET map_decorations = jsonb_strip_nulls(jsonb_build_object(
  'floor5', jsonb_build_object(
    'corridors', jsonb_build_array(
      jsonb_build_object('id','corr-sky-f5-01','label','Corridor','x',100,'y',300,'w',560,'h',60)
    ),
    'structures', jsonb_build_array(
      jsonb_build_object('id','str-sky-f5-e1','type','elevator','label','Elevator','x',700,'y',280,'w',100,'h',100)
    )
  ),
  'floor6', jsonb_build_object(
    'corridors', jsonb_build_array(
      jsonb_build_object('id','corr-sky-f6-01','label','Corridor','x',100,'y',300,'w',560,'h',60)
    ),
    'structures', jsonb_build_array()
  ),
  'floor7', jsonb_build_object(
    'corridors', jsonb_build_array(
      jsonb_build_object('id','corr-sky-f7-01','label','Corridor','x',100,'y',300,'w',700,'h',60)
    ),
    'structures', jsonb_build_array()
  ),
  'floor8', jsonb_build_object(
    'corridors', jsonb_build_array(
      jsonb_build_object('id','corr-sky-f8-01','label','Corridor','x',100,'y',300,'w',700,'h',60)
    ),
    'structures', jsonb_build_array()
  )
))
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid;

COMMIT;
