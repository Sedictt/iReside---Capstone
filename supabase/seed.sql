-- iReside local seed data
-- This file is designed for Supabase CLI local development via `supabase db reset`.
-- It uses deterministic UUIDs and ON CONFLICT upserts for idempotency.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Seed auth users
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES
      -- Landlords
      ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
       'authenticated','authenticated','landlord.one@ireside.local',
       crypt('Passw0rd!', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       '{"full_name":"Marina Reyes","role":"landlord","phone":"+639171110001","business_name":"Reyes Property Group","business_permits":["permit-001.pdf"]}'::jsonb,
       now(), now()),
      ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
       'authenticated','authenticated','landlord.two@ireside.local',
       crypt('Passw0rd!', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       '{"full_name":"Gabriel Santos","role":"landlord","phone":"+639171110002","business_name":"Santos Homes","business_permits":["permit-002.pdf"]}'::jsonb,
       now(), now()),
      ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111113',
       'authenticated','authenticated','landlord.three@ireside.local',
       crypt('Passw0rd!', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       '{"full_name":"Isabella Mendoza","role":"landlord","phone":"+639171110005","business_name":"Mendoza Realty","business_permits":["permit-003.pdf"]}'::jsonb,
       now(), now()),
      ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111114',
       'authenticated','authenticated','landlord.four@ireside.local',
       crypt('Passw0rd!', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       '{"full_name":"Carlos Villanueva","role":"landlord","phone":"+639171110006","business_name":"Villanueva Estates","business_permits":["permit-004.pdf"]}'::jsonb,
       now(), now()),
      -- Tenants
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
       'authenticated','authenticated','tenant.one@ireside.local',
       crypt('Passw0rd!', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       '{"full_name":"Ariana Cruz","role":"tenant","phone":"+639171110003"}'::jsonb,
       now(), now()),
      ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444',
       'authenticated','authenticated','tenant.two@ireside.local',
       crypt('Passw0rd!', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       '{"full_name":"Noah Villanueva","role":"tenant","phone":"+639171110004"}'::jsonb,
       now(), now()),
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333335',
       'authenticated','authenticated','tenant.three@ireside.local',
       crypt('Passw0rd!', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       '{"full_name":"Sophia Tan","role":"tenant","phone":"+639171110007"}'::jsonb,
       now(), now()),
      ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333336',
       'authenticated','authenticated','tenant.four@ireside.local',
       crypt('Passw0rd!', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       '{"full_name":"Miguel Ramos","role":"tenant","phone":"+639171110008"}'::jsonb,
       now(), now())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, raw_user_meta_data = EXCLUDED.raw_user_meta_data, updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping auth.users seed: %', SQLERRM;
  END;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Profiles
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, role, phone, business_name, business_permits) VALUES
  ('11111111-1111-1111-1111-111111111111','landlord.one@ireside.local','Marina Reyes','landlord','+639171110001','Reyes Property Group',ARRAY['permit-001.pdf']),
  ('22222222-2222-2222-2222-222222222222','landlord.two@ireside.local','Gabriel Santos','landlord','+639171110002','Santos Homes',ARRAY['permit-002.pdf']),
  ('11111111-1111-1111-1111-111111111113','landlord.three@ireside.local','Isabella Mendoza','landlord','+639171110005','Mendoza Realty',ARRAY['permit-003.pdf']),
  ('11111111-1111-1111-1111-111111111114','landlord.four@ireside.local','Carlos Villanueva','landlord','+639171110006','Villanueva Estates',ARRAY['permit-004.pdf']),
  ('33333333-3333-3333-3333-333333333333','tenant.one@ireside.local','Ariana Cruz','tenant','+639171110003',NULL,ARRAY[]::text[]),
  ('44444444-4444-4444-4444-444444444444','tenant.two@ireside.local','Noah Villanueva','tenant','+639171110004',NULL,ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333335','tenant.three@ireside.local','Sophia Tan','tenant','+639171110007',NULL,ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333336','tenant.four@ireside.local','Miguel Ramos','tenant','+639171110008',NULL,ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  email=EXCLUDED.email, full_name=EXCLUDED.full_name, role=EXCLUDED.role,
  phone=EXCLUDED.phone, business_name=EXCLUDED.business_name, business_permits=EXCLUDED.business_permits, updated_at=now();

-- ---------------------------------------------------------------------------
-- 3) Properties (8 total — spread across landlords, Valenzuela City)
-- ---------------------------------------------------------------------------
INSERT INTO public.properties (id, landlord_id, name, address, city, description, type, lat, lng, amenities, house_rules, images, is_featured) VALUES
  -- Landlord 1 properties
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','11111111-1111-1111-1111-111111111111',
   'Maple Grove Residences','123 McArthur Highway, Karuhatan','Valenzuela',
   'Transit-friendly apartment complex near market and schools. Features modern finishes, dedicated parking, and 24/7 security.',
   'apartment',14.7008,120.9835,
   ARRAY['wifi','cctv','laundry area','roof deck','parking','gym'],
   ARRAY['No smoking in common areas','Quiet hours after 10 PM','Pets allowed with deposit'],
   ARRAY['/hero-images/apartment-01.png','/hero-images/apartment-02.png'],true),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','11111111-1111-1111-1111-111111111111',
   'Skyline Lofts','456 Gen. T. de Leon Road, Paso de Blas','Valenzuela',
   'Premium loft-style living with floor-to-ceiling windows and stunning city views. Smart home features throughout.',
   'condo',14.6865,121.0366,
   ARRAY['wifi','air conditioning','gym','security','elevator','pool'],
   ARRAY['No smoking','No parties','Pets allowed'],
   ARRAY['/hero-images/apartment-03.png','/hero-images/dorm-01.png','/hero-images/apartment-01.png'],true),

  -- Landlord 2 properties
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3','22222222-2222-2222-2222-222222222222',
   'Sunrise Townhomes','45 Maysan Road, Maysan','Valenzuela',
   'Family-friendly townhouse units with private parking and garden area. Close to schools and commercial centers.',
   'townhouse',14.7184,120.9657,
   ARRAY['parking','pet-friendly','garden','laundry area'],
   ARRAY['No loud parties','Observe waste segregation','Guest registration required'],
   ARRAY['/hero-images/dorm-02.png','/hero-images/apartment-02.png'],false),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4','22222222-2222-2222-2222-222222222222',
   'The Garden Residences','78 Paso de Blas Road','Valenzuela',
   'Spacious family home with a private garden and modern kitchen. Perfect for families looking for comfort and convenience.',
   'house',14.6930,121.0450,
   ARRAY['parking','garden','kitchen','laundry area','cctv'],
   ARRAY['No smoking','No pets allowed'],
   ARRAY['/hero-images/apartment-02.png','/hero-images/dorm-03.png'],false),

  -- Landlord 3 properties
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5','11111111-1111-1111-1111-111111111113',
   'Metro Studio Hub','12 Marulas Avenue, Marulas','Valenzuela',
   'Perfect for students or young professionals. Compact studios with modern amenities and fast internet.',
   'studio',14.6750,121.0400,
   ARRAY['wifi','air conditioning','cable tv','cctv','laundry area'],
   ARRAY['No pets','No smoking','Quiet hours 10 PM - 7 AM'],
   ARRAY['/hero-images/dorm-01.png','/hero-images/dorm-02.png'],true),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6','11111111-1111-1111-1111-111111111113',
   'Lakeside Villa Estates','99 Dalandanan Road, Dalandanan','Valenzuela',
   'Luxurious villa with premium amenities including pool, fireplace, and scenic balcony views. Gated community with 24/7 security.',
   'house',14.6990,121.0550,
   ARRAY['pool','parking','wifi','fireplace','balcony','security','gym'],
   ARRAY['Pets allowed','No smoking indoors','Guest registration required'],
   ARRAY['/hero-images/apartment-03.png','/hero-images/apartment-01.png'],true),

  -- Landlord 4 properties
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7','11111111-1111-1111-1111-111111111114',
   'Downtown Apartment Complex','321 Karuhatan Street','Valenzuela',
   'Conveniently located near the city center and public transport. Modern interiors with complete amenities for urban living.',
   'apartment',14.6890,121.0330,
   ARRAY['wifi','water','security','elevator','cctv'],
   ARRAY['No pets allowed','No smoking'],
   ARRAY['/hero-images/dorm-03.png','/hero-images/dorm-01.png'],false),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8','11111111-1111-1111-1111-111111111114',
   'Riverside Condominiums','555 Malinta Road, Malinta','Valenzuela',
   'Modern condominium with river views and resort-style amenities. Walking distance to malls and restaurants.',
   'condo',14.7100,120.9750,
   ARRAY['pool','gym','parking','wifi','air conditioning','elevator','security'],
   ARRAY['No smoking','Quiet hours after 10 PM','Pets allowed with approval'],
   ARRAY['/hero-images/apartment-01.png','/hero-images/apartment-03.png','/hero-images/dorm-02.png'],true)
ON CONFLICT (id) DO UPDATE SET
  landlord_id=EXCLUDED.landlord_id, name=EXCLUDED.name, address=EXCLUDED.address, city=EXCLUDED.city,
  description=EXCLUDED.description, type=EXCLUDED.type, lat=EXCLUDED.lat, lng=EXCLUDED.lng,
  amenities=EXCLUDED.amenities, house_rules=EXCLUDED.house_rules, images=EXCLUDED.images,
  is_featured=EXCLUDED.is_featured, updated_at=now();

-- ---------------------------------------------------------------------------
-- 4) Units (2-3 per property)
-- ---------------------------------------------------------------------------
INSERT INTO public.units (id, property_id, name, floor, status, rent_amount, sqft, beds, baths) VALUES
  -- Maple Grove (prop 1)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','Unit 2A',2,'occupied',12000.00,380,1,1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','Unit 3B',3,'vacant',14500.00,460,2,1),
  -- Skyline Lofts (prop 2)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','Loft 5A',5,'occupied',15000.00,520,2,2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','Loft 7C',7,'vacant',18000.00,680,3,2),
  -- Sunrise Townhomes (prop 3)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3','Townhome 1',1,'occupied',18000.00,720,2,2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb12','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3','Townhome 2',1,'vacant',19500.00,780,3,2),
  -- The Garden Residences (prop 4)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb13','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4','House A',1,'occupied',12500.00,950,3,2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb14','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4','House B',1,'vacant',13000.00,1000,3,2),
  -- Metro Studio Hub (prop 5)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb15','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5','Studio 101',1,'occupied',8500.00,350,1,1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5','Studio 202',2,'vacant',9000.00,380,1,1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb17','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5','Studio 303',3,'vacant',9500.00,400,1,1),
  -- Lakeside Villa (prop 6)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb18','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6','Villa 1',1,'vacant',25000.00,1800,4,3),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb19','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6','Villa 2',1,'vacant',28000.00,2200,4,3),
  -- Downtown Apartment (prop 7)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb20','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7','Unit 101',1,'occupied',10000.00,550,2,1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb21','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7','Unit 205',2,'vacant',11000.00,600,2,1),
  -- Riverside Condominiums (prop 8)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8','Condo 8A',8,'vacant',20000.00,750,2,2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb23','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8','Condo 12B',12,'vacant',22000.00,850,3,2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb24','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8','Penthouse 15A',15,'vacant',35000.00,1200,3,3)
ON CONFLICT (id) DO UPDATE SET
  property_id=EXCLUDED.property_id, name=EXCLUDED.name, floor=EXCLUDED.floor, status=EXCLUDED.status,
  rent_amount=EXCLUDED.rent_amount, sqft=EXCLUDED.sqft, beds=EXCLUDED.beds, baths=EXCLUDED.baths, updated_at=now();

-- ---------------------------------------------------------------------------
-- 5) Leases (4 active leases across different properties)
-- ---------------------------------------------------------------------------
INSERT INTO public.leases (id, unit_id, tenant_id, landlord_id, status, start_date, end_date, monthly_rent, security_deposit, terms, tenant_signature, landlord_signature, signed_at) VALUES
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
   '33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111',
   'active', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '335 days',
   12000.00,12000.00,'{"due_day":5,"allow_partial":false,"late_fee":500}'::jsonb,
   'tenant-sig-1','landlord-sig-1', now() - INTERVAL '31 days'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10',
   '44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111',
   'active', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days',
   15000.00,15000.00,'{"due_day":1,"allow_partial":false,"late_fee":750}'::jsonb,
   'tenant-sig-2','landlord-sig-2', now() - INTERVAL '61 days'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
   '33333333-3333-3333-3333-333333333335','22222222-2222-2222-2222-222222222222',
   'active', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '275 days',
   18000.00,18000.00,'{"due_day":5,"allow_partial":true,"late_fee":900}'::jsonb,
   'tenant-sig-3','landlord-sig-3', now() - INTERVAL '91 days'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc4','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb15',
   '33333333-3333-3333-3333-333333333336','11111111-1111-1111-1111-111111111113',
   'active', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '350 days',
   8500.00,8500.00,'{"due_day":10,"allow_partial":false,"late_fee":400}'::jsonb,
   'tenant-sig-4','landlord-sig-4', now() - INTERVAL '16 days'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc5','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb13',
   '33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222',
   'expired', CURRENT_DATE - INTERVAL '400 days', CURRENT_DATE - INTERVAL '35 days',
   12500.00,12500.00,'{"due_day":5,"allow_partial":false,"late_fee":600}'::jsonb,
   'tenant-sig-5','landlord-sig-5', now() - INTERVAL '401 days'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc6','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb20',
   '44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111114',
   'active', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '320 days',
   10000.00,10000.00,'{"due_day":5,"allow_partial":false,"late_fee":500}'::jsonb,
   'tenant-sig-6','landlord-sig-6', now() - INTERVAL '46 days')
ON CONFLICT (id) DO UPDATE SET
  unit_id=EXCLUDED.unit_id, tenant_id=EXCLUDED.tenant_id, landlord_id=EXCLUDED.landlord_id,
  status=EXCLUDED.status, start_date=EXCLUDED.start_date, end_date=EXCLUDED.end_date,
  monthly_rent=EXCLUDED.monthly_rent, security_deposit=EXCLUDED.security_deposit, terms=EXCLUDED.terms,
  tenant_signature=EXCLUDED.tenant_signature, landlord_signature=EXCLUDED.landlord_signature,
  signed_at=EXCLUDED.signed_at, updated_at=now();

-- ---------------------------------------------------------------------------
-- 6) Payments
-- ---------------------------------------------------------------------------
INSERT INTO public.payments (id, lease_id, tenant_id, landlord_id, amount, status, method, description, due_date, paid_at, reference_number, landlord_confirmed) VALUES
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1','cccccccc-cccc-cccc-cccc-ccccccccccc1','33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111',
   12000.00,'completed','gcash','March 2026 rent',date_trunc('month',CURRENT_DATE)::date + 4, now()-INTERVAL '8 days','GCASH-SEED-0001',true),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2','cccccccc-cccc-cccc-cccc-ccccccccccc1','33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111',
   12000.00,'pending',NULL,'April 2026 rent',date_trunc('month',CURRENT_DATE)::date + 35, NULL,NULL,false),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd3','cccccccc-cccc-cccc-cccc-ccccccccccc2','44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111',
   15000.00,'completed','maya','Feb 2026 rent',date_trunc('month',CURRENT_DATE)::date - 27, now()-INTERVAL '40 days','MAYA-SEED-0001',true),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd4','cccccccc-cccc-cccc-cccc-ccccccccccc3','33333333-3333-3333-3333-333333333335','22222222-2222-2222-2222-222222222222',
   18000.00,'completed','bank_transfer','March 2026 rent',date_trunc('month',CURRENT_DATE)::date + 4, now()-INTERVAL '5 days','BT-SEED-0001',true),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd5','cccccccc-cccc-cccc-cccc-ccccccccccc4','33333333-3333-3333-3333-333333333336','11111111-1111-1111-1111-111111111113',
   8500.00,'pending',NULL,'March 2026 rent',date_trunc('month',CURRENT_DATE)::date + 9, NULL,NULL,false)
ON CONFLICT (id) DO UPDATE SET
  lease_id=EXCLUDED.lease_id, tenant_id=EXCLUDED.tenant_id, landlord_id=EXCLUDED.landlord_id,
  amount=EXCLUDED.amount, status=EXCLUDED.status, method=EXCLUDED.method, description=EXCLUDED.description,
  due_date=EXCLUDED.due_date, paid_at=EXCLUDED.paid_at, reference_number=EXCLUDED.reference_number,
  landlord_confirmed=EXCLUDED.landlord_confirmed, updated_at=now();

INSERT INTO public.payment_items (id, payment_id, label, amount, category) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1','dddddddd-dddd-dddd-dddd-ddddddddddd1','Monthly Rent',11500.00,'rent'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2','dddddddd-dddd-dddd-dddd-ddddddddddd1','Water Bill',500.00,'utility'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3','dddddddd-dddd-dddd-dddd-ddddddddddd2','Monthly Rent',12000.00,'rent'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4','dddddddd-dddd-dddd-dddd-ddddddddddd3','Monthly Rent',15000.00,'rent'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5','dddddddd-dddd-dddd-dddd-ddddddddddd4','Monthly Rent',17000.00,'rent'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6','dddddddd-dddd-dddd-dddd-ddddddddddd4','Water Bill',1000.00,'utility'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7','dddddddd-dddd-dddd-dddd-ddddddddddd5','Monthly Rent',8500.00,'rent')
ON CONFLICT (id) DO UPDATE SET payment_id=EXCLUDED.payment_id, label=EXCLUDED.label, amount=EXCLUDED.amount, category=EXCLUDED.category;

-- ---------------------------------------------------------------------------
-- 7) Applications
-- ---------------------------------------------------------------------------
INSERT INTO public.applications (id, unit_id, applicant_id, landlord_id, status, message, monthly_income, employment_status, move_in_date, documents, reviewed_at) VALUES
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2','44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111',
   'pending','Interested in Unit 3B. I work nearby.',42000.00,'Full-time employee',CURRENT_DATE + 10,ARRAY['proof-of-income.pdf','gov-id.pdf'],NULL),
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f2','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb18','33333333-3333-3333-3333-333333333336','11111111-1111-1111-1111-111111111113',
   'reviewing','Love the villa. My family of four would suit it well.',65000.00,'Business owner',CURRENT_DATE + 20,ARRAY['biz-permit.pdf','id.pdf'],now()-INTERVAL '2 days'),
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f3','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22','33333333-3333-3333-3333-333333333335','11111111-1111-1111-1111-111111111114',
   'pending','Looking for a riverside unit.',35000.00,'Freelancer',CURRENT_DATE + 15,ARRAY['portfolio.pdf'],NULL)
ON CONFLICT (id) DO UPDATE SET
  unit_id=EXCLUDED.unit_id, applicant_id=EXCLUDED.applicant_id, landlord_id=EXCLUDED.landlord_id,
  status=EXCLUDED.status, message=EXCLUDED.message, monthly_income=EXCLUDED.monthly_income,
  employment_status=EXCLUDED.employment_status, move_in_date=EXCLUDED.move_in_date,
  documents=EXCLUDED.documents, reviewed_at=EXCLUDED.reviewed_at, updated_at=now();

-- ---------------------------------------------------------------------------
-- 8) Maintenance requests
-- ---------------------------------------------------------------------------
INSERT INTO public.maintenance_requests (id, unit_id, tenant_id, landlord_id, title, description, status, priority, category, images, resolved_at) VALUES
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1','33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111',
   'Kitchen faucet leak','Slow but continuous leak under the sink.','in_progress','medium','plumbing',ARRAY[]::text[],NULL),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f3','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10','44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111',
   'AC not cooling','Air conditioning unit blows warm air only.','open','high','electrical',ARRAY[]::text[],NULL),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f4','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3','33333333-3333-3333-3333-333333333335','22222222-2222-2222-2222-222222222222',
   'Broken window lock','Window lock is jammed and won''t close.','open','medium','general',ARRAY[]::text[],NULL)
ON CONFLICT (id) DO UPDATE SET
  unit_id=EXCLUDED.unit_id, tenant_id=EXCLUDED.tenant_id, landlord_id=EXCLUDED.landlord_id,
  title=EXCLUDED.title, description=EXCLUDED.description, status=EXCLUDED.status,
  priority=EXCLUDED.priority, category=EXCLUDED.category, images=EXCLUDED.images,
  resolved_at=EXCLUDED.resolved_at, updated_at=now();

-- ---------------------------------------------------------------------------
-- 9) Move-out requests
-- ---------------------------------------------------------------------------
INSERT INTO public.move_out_requests (id, lease_id, tenant_id, landlord_id, reason, requested_date, status, notes) VALUES
  ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3','cccccccc-cccc-cccc-cccc-ccccccccccc1','33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111',
   'Relocating for work assignment.',CURRENT_DATE + 60,'pending','Can coordinate unit inspection on weekends.')
ON CONFLICT (id) DO UPDATE SET
  lease_id=EXCLUDED.lease_id, tenant_id=EXCLUDED.tenant_id, landlord_id=EXCLUDED.landlord_id,
  reason=EXCLUDED.reason, requested_date=EXCLUDED.requested_date, status=EXCLUDED.status,
  notes=EXCLUDED.notes, updated_at=now();

-- ---------------------------------------------------------------------------
-- 10) Conversations & messages
-- ---------------------------------------------------------------------------
INSERT INTO public.conversations (id) VALUES
  ('f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4'),
  ('f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f5')
ON CONFLICT (id) DO UPDATE SET updated_at=now();

INSERT INTO public.conversation_participants (id, conversation_id, user_id) VALUES
  ('f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f1','f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4','11111111-1111-1111-1111-111111111111'),
  ('f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f2','f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4','33333333-3333-3333-3333-333333333333'),
  ('f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f3','f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f5','22222222-2222-2222-2222-222222222222'),
  ('f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f4','f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f5','33333333-3333-3333-3333-333333333335')
ON CONFLICT (id) DO UPDATE SET conversation_id=EXCLUDED.conversation_id, user_id=EXCLUDED.user_id;

INSERT INTO public.messages (id, conversation_id, sender_id, type, content, metadata, read_at, created_at) VALUES
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f1','f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4','33333333-3333-3333-3333-333333333333',
   'text','Hi, confirming if maintenance can come tomorrow morning.','{"channel":"in_app"}'::jsonb,now()-INTERVAL '1 day',now()-INTERVAL '2 days'),
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f2','f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4','11111111-1111-1111-1111-111111111111',
   'text','Yes, maintenance team is scheduled at 9 AM.','{"channel":"in_app"}'::jsonb,NULL,now()-INTERVAL '1 day'),
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f3','f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f5','33333333-3333-3333-3333-333333333335',
   'text','Good afternoon! Is the Townhome 2 still available?','{"channel":"in_app"}'::jsonb,now()-INTERVAL '6 hours',now()-INTERVAL '12 hours'),
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f4','f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f5','22222222-2222-2222-2222-222222222222',
   'text','Yes it is! Would you like to schedule a viewing?','{"channel":"in_app"}'::jsonb,NULL,now()-INTERVAL '6 hours')
ON CONFLICT (id) DO UPDATE SET
  conversation_id=EXCLUDED.conversation_id, sender_id=EXCLUDED.sender_id, type=EXCLUDED.type,
  content=EXCLUDED.content, metadata=EXCLUDED.metadata, read_at=EXCLUDED.read_at, created_at=EXCLUDED.created_at;

-- ---------------------------------------------------------------------------
-- 11) Notifications
-- ---------------------------------------------------------------------------
INSERT INTO public.notifications (id, user_id, type, title, message, data, read, created_at) VALUES
  ('f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f1','33333333-3333-3333-3333-333333333333','maintenance',
   'Maintenance Scheduled','Your maintenance request has been scheduled for tomorrow at 9 AM.',
   '{"request_id":"f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2"}'::jsonb,false,now()-INTERVAL '12 hours'),
  ('f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f2','11111111-1111-1111-1111-111111111111','application',
   'New Rental Application','A new application was submitted for Unit 3B.',
   '{"application_id":"f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1"}'::jsonb,false,now()-INTERVAL '8 hours'),
  ('f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f3','44444444-4444-4444-4444-444444444444','payment',
   'Payment Confirmed','Your February rent payment of ₱15,000 has been confirmed.',
   '{"payment_id":"dddddddd-dddd-dddd-dddd-ddddddddddd3"}'::jsonb,true,now()-INTERVAL '38 days'),
  ('f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f4','33333333-3333-3333-3333-333333333335','lease',
   'Lease Active','Your lease for Townhome 1 is now active.',
   '{"lease_id":"cccccccc-cccc-cccc-cccc-ccccccccccc3"}'::jsonb,true,now()-INTERVAL '90 days')
ON CONFLICT (id) DO UPDATE SET
  user_id=EXCLUDED.user_id, type=EXCLUDED.type, title=EXCLUDED.title, message=EXCLUDED.message,
  data=EXCLUDED.data, read=EXCLUDED.read, created_at=EXCLUDED.created_at;

-- ---------------------------------------------------------------------------
-- 12) Saved properties
-- ---------------------------------------------------------------------------
INSERT INTO public.saved_properties (id, user_id, property_id) VALUES
  ('f8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f1','44444444-4444-4444-4444-444444444444','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  ('f8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f2','33333333-3333-3333-3333-333333333335','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'),
  ('f8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f3','33333333-3333-3333-3333-333333333336','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8')
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, property_id=EXCLUDED.property_id;

-- ---------------------------------------------------------------------------
-- 13) Landlord applications, reviews, exports, IRIS chat, etc.
-- ---------------------------------------------------------------------------
INSERT INTO public.landlord_applications (id, profile_id, phone, identity_document_url, ownership_document_url, liveness_document_url, status, admin_notes) VALUES
  ('f9f9f9f9-f9f9-f9f9-f9f9-f9f9f9f9f9f1','44444444-4444-4444-4444-444444444444','+639171110004',
   '/docs/id-tenant-two.pdf','/docs/title-tenant-two.pdf','/docs/liveness-tenant-two.mp4','reviewing','Documents complete. Awaiting verification.')
ON CONFLICT (id) DO UPDATE SET
  profile_id=EXCLUDED.profile_id, phone=EXCLUDED.phone, identity_document_url=EXCLUDED.identity_document_url,
  ownership_document_url=EXCLUDED.ownership_document_url, liveness_document_url=EXCLUDED.liveness_document_url,
  status=EXCLUDED.status, admin_notes=EXCLUDED.admin_notes, updated_at=now();

INSERT INTO public.landlord_statistics_exports (id, landlord_id, format, report_range, mode, include_expanded_kpis, row_count, metadata, created_at) VALUES
  ('abababab-abab-abab-abab-ababababab01','11111111-1111-1111-1111-111111111111','csv','Last 30 days','Detailed',true,18,
   '{"gross_revenue":24000,"occupancy_rate":0.66}'::jsonb, now()-INTERVAL '2 days')
ON CONFLICT (id) DO UPDATE SET landlord_id=EXCLUDED.landlord_id, format=EXCLUDED.format,
  report_range=EXCLUDED.report_range, mode=EXCLUDED.mode, include_expanded_kpis=EXCLUDED.include_expanded_kpis,
  row_count=EXCLUDED.row_count, metadata=EXCLUDED.metadata, created_at=EXCLUDED.created_at;

INSERT INTO public.iris_chat_messages (id, user_id, role, content, metadata, created_at) VALUES
  ('acacacac-acac-acac-acac-acacacacac01','33333333-3333-3333-3333-333333333333','user',
   'Can I pay my rent via GCash this month?','{"topic":"payments"}'::jsonb, now()-INTERVAL '3 hours'),
  ('acacacac-acac-acac-acac-acacacacac02','33333333-3333-3333-3333-333333333333','assistant',
   'Yes. GCash is enabled for your active lease.','{"topic":"payments","confidence":"high"}'::jsonb, now()-INTERVAL '3 hours' + INTERVAL '8 seconds')
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, role=EXCLUDED.role, content=EXCLUDED.content,
  metadata=EXCLUDED.metadata, created_at=EXCLUDED.created_at;

INSERT INTO public.landlord_inquiry_actions (id, inquiry_id, landlord_id, is_read, is_archived, deleted_at) VALUES
  ('adadadad-adad-adad-adad-adadadadad01','f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1','11111111-1111-1111-1111-111111111111',true,false,NULL)
ON CONFLICT (id) DO UPDATE SET inquiry_id=EXCLUDED.inquiry_id, landlord_id=EXCLUDED.landlord_id,
  is_read=EXCLUDED.is_read, is_archived=EXCLUDED.is_archived, deleted_at=EXCLUDED.deleted_at, updated_at=now();

INSERT INTO public.landlord_reviews (id, lease_id, landlord_id, tenant_id, rating, comment, created_at) VALUES
  ('aeaeaeae-aeae-aeae-aeae-aeaeaeaeae01','cccccccc-cccc-cccc-cccc-ccccccccccc1','11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333',
   5,'Responsive and professional landlord. Repairs are handled quickly.',now()-INTERVAL '5 days'),
  ('aeaeaeae-aeae-aeae-aeae-aeaeaeaeae02','cccccccc-cccc-cccc-cccc-ccccccccccc5','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333',
   4,'Good landlord overall. Garden area could use better maintenance.',now()-INTERVAL '40 days')
ON CONFLICT (id) DO UPDATE SET lease_id=EXCLUDED.lease_id, landlord_id=EXCLUDED.landlord_id,
  tenant_id=EXCLUDED.tenant_id, rating=EXCLUDED.rating, comment=EXCLUDED.comment, updated_at=now();

INSERT INTO public.message_user_actions (id, actor_user_id, target_user_id, archived, blocked) VALUES
  ('afafafaf-afaf-afaf-afaf-afafafafaf01','33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111',false,false)
ON CONFLICT (id) DO UPDATE SET actor_user_id=EXCLUDED.actor_user_id, target_user_id=EXCLUDED.target_user_id,
  archived=EXCLUDED.archived, blocked=EXCLUDED.blocked, updated_at=now();

INSERT INTO public.message_user_reports (id, reporter_user_id, target_user_id, conversation_id, category, details, status, metadata) VALUES
  ('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b001','44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222',
   NULL,'spam','Repeated unsolicited messages.','open','{"source":"seed"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET reporter_user_id=EXCLUDED.reporter_user_id, target_user_id=EXCLUDED.target_user_id,
  conversation_id=EXCLUDED.conversation_id, category=EXCLUDED.category, details=EXCLUDED.details,
  status=EXCLUDED.status, metadata=EXCLUDED.metadata, updated_at=now();

-- ---------------------------------------------------------------------------
-- 14) Listings
-- ---------------------------------------------------------------------------
INSERT INTO public.listings (id, landlord_id, property_id, unit_id, scope, title, rent_amount, status, views, leads) VALUES
  ('1e1e1e1e-1e1e-1e1e-1e1e-1e1e1e1e1e01', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'unit', 'Modern 2BR at Maple Grove', 14500.00, 'published', 150, 5),
  ('1e1e1e1e-1e1e-1e1e-1e1e-1e1e1e1e1e02', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11', 'unit', 'Luxury Penthouse with Skyline View', 18000.00, 'published', 320, 12),
  ('1e1e1e1e-1e1e-1e1e-1e1e-1e1e1e1e1e03', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb12', 'unit', 'Comfortable Townhome for Family', 19500.00, 'published', 85, 3),
  ('1e1e1e1e-1e1e-1e1e-1e1e-1e1e1e1e1e04', '11111111-1111-1111-1111-111111111113', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16', 'unit', 'Affordable Studio for Professionals', 9000.00, 'published', 210, 8),
  ('1e1e1e1e-1e1e-1e1e-1e1e-1e1e1e1e1e05', '11111111-1111-1111-1111-111111111113', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb18', 'unit', 'Spacious Villa for Large Group', 25000.00, 'published', 45, 1),
  ('1e1e1e1e-1e1e-1e1e-1e1e-1e1e1e1e1e06', '11111111-1111-1111-1111-111111111114', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb21', 'unit', 'Downtown Urban Living', 11000.00, 'published', 130, 4),
  ('1e1e1e1e-1e1e-1e1e-1e1e-1e1e1e1e1e07', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NULL, 'property', 'Skyline Lofts - Premium Condo Living', 15000.00, 'published', 500, 25)
ON CONFLICT (id) DO UPDATE SET
  landlord_id=EXCLUDED.landlord_id, property_id=EXCLUDED.property_id, unit_id=EXCLUDED.unit_id,
  scope=EXCLUDED.scope, title=EXCLUDED.title, rent_amount=EXCLUDED.rent_amount,
  status=EXCLUDED.status, views=EXCLUDED.views, leads=EXCLUDED.leads, updated_at=now();

-- ---------------------------------------------------------------------------
-- Admin user (deterministic UUID 00000000-0000-0000-0000-000000000001)
-- ---------------------------------------------------------------------------
DO $
BEGIN
  BEGIN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES
      ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001',
       'authenticated', 'authenticated', 'admin@ireside.local',
       crypt('Passw0rd!', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       '{"role":"admin"}'::jsonb,
       now(), now())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping admin auth.users seed: %', SQLERRM;
  END;
END $;

INSERT INTO public.profiles (id, email, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@ireside.local', 'System Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Landlord applications — one row per status variant
-- ---------------------------------------------------------------------------
INSERT INTO public.landlord_applications (id, profile_id, phone, identity_document_url, ownership_document_url, liveness_document_url, status, admin_notes) VALUES
  -- pending: tenant.one
  ('fafafafa-fafa-fafa-fafa-fafafafafaf1', '33333333-3333-3333-3333-333333333333', '+639171110003',
   '/docs/id-tenant-one.pdf', '/docs/title-tenant-one.pdf', '/docs/liveness-tenant-one.mp4',
   'pending', NULL),
  -- approved: tenant.two
  ('fafafafa-fafa-fafa-fafa-fafafafafaf2', '44444444-4444-4444-4444-444444444444', '+639171110004',
   '/docs/id-tenant-two-v2.pdf', '/docs/title-tenant-two-v2.pdf', '/docs/liveness-tenant-two-v2.mp4',
   'approved', 'All documents verified. Application approved.'),
  -- reviewing: tenant.three
  ('fafafafa-fafa-fafa-fafa-fafafafafaf3', '33333333-3333-3333-3333-333333333335', '+639171110007',
   '/docs/id-tenant-three.pdf', '/docs/title-tenant-three.pdf', '/docs/liveness-tenant-three.mp4',
   'reviewing', 'Documents under review.'),
  -- rejected: tenant.four
  ('fafafafa-fafa-fafa-fafa-fafafafafaf4', '33333333-3333-3333-3333-333333333336', '+639171110008',
   '/docs/id-tenant-four.pdf', '/docs/title-tenant-four.pdf', '/docs/liveness-tenant-four.mp4',
   'rejected', 'Insufficient ownership documentation.')
ON CONFLICT (id) DO UPDATE SET
  profile_id = EXCLUDED.profile_id,
  phone = EXCLUDED.phone,
  identity_document_url = EXCLUDED.identity_document_url,
  ownership_document_url = EXCLUDED.ownership_document_url,
  liveness_document_url = EXCLUDED.liveness_document_url,
  status = EXCLUDED.status,
  admin_notes = EXCLUDED.admin_notes,
  updated_at = now();

COMMIT;
