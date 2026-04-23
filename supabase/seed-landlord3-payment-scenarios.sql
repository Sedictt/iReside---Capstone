-- Payment Scenario Seed for Landlord 3 (11111111-1111-1111-1111-111111111113)
-- Covers ALL iReside payment workflow states & guardrails
BEGIN;
ALTER TABLE public.payments DISABLE TRIGGER trg_payments_sync_compat_status;

-- 1) AUTH USERS (8 tenants)
DO $$ BEGIN BEGIN
INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) VALUES
('00000000-0000-0000-0000-000000000000','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b01','authenticated','authenticated','liam.santos@ireside.local',crypt('Passw0rd!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Liam Santos","role":"tenant","phone":"+639178000001"}'::jsonb,now(),now()),
('00000000-0000-0000-0000-000000000000','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b02','authenticated','authenticated','emma.reyes@ireside.local',crypt('Passw0rd!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Emma Reyes","role":"tenant","phone":"+639178000002"}'::jsonb,now(),now()),
('00000000-0000-0000-0000-000000000000','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b03','authenticated','authenticated','jake.cruz@ireside.local',crypt('Passw0rd!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Jake Cruz","role":"tenant","phone":"+639178000003"}'::jsonb,now(),now()),
('00000000-0000-0000-0000-000000000000','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04','authenticated','authenticated','mia.tan@ireside.local',crypt('Passw0rd!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Mia Tan","role":"tenant","phone":"+639178000004"}'::jsonb,now(),now()),
('00000000-0000-0000-0000-000000000000','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b05','authenticated','authenticated','lucas.gomez@ireside.local',crypt('Passw0rd!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Lucas Gomez","role":"tenant","phone":"+639178000005"}'::jsonb,now(),now()),
('00000000-0000-0000-0000-000000000000','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b06','authenticated','authenticated','chloe.lim@ireside.local',crypt('Passw0rd!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Chloe Lim","role":"tenant","phone":"+639178000006"}'::jsonb,now(),now()),
('00000000-0000-0000-0000-000000000000','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07','authenticated','authenticated','andre.bautista@ireside.local',crypt('Passw0rd!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Andre Bautista","role":"tenant","phone":"+639178000007"}'::jsonb,now(),now()),
('00000000-0000-0000-0000-000000000000','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b08','authenticated','authenticated','hannah.dizon@ireside.local',crypt('Passw0rd!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Hannah Dizon","role":"tenant","phone":"+639178000008"}'::jsonb,now(),now())
ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,raw_user_meta_data=EXCLUDED.raw_user_meta_data,encrypted_password=EXCLUDED.encrypted_password,updated_at=now();
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping auth.users: %', SQLERRM; END; END $$;

-- 2) PROFILES
INSERT INTO public.profiles (id,email,full_name,role,phone) VALUES
('3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b01','liam.santos@ireside.local','Liam Santos','tenant','+639178000001'),
('3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b02','emma.reyes@ireside.local','Emma Reyes','tenant','+639178000002'),
('3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b03','jake.cruz@ireside.local','Jake Cruz','tenant','+639178000003'),
('3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04','mia.tan@ireside.local','Mia Tan','tenant','+639178000004'),
('3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b05','lucas.gomez@ireside.local','Lucas Gomez','tenant','+639178000005'),
('3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b06','chloe.lim@ireside.local','Chloe Lim','tenant','+639178000006'),
('3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07','andre.bautista@ireside.local','Andre Bautista','tenant','+639178000007'),
('3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b08','hannah.dizon@ireside.local','Hannah Dizon','tenant','+639178000008')
ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,full_name=EXCLUDED.full_name,role=EXCLUDED.role,phone=EXCLUDED.phone,updated_at=now();

-- 3) PROPERTY + UNITS
INSERT INTO public.properties (id,landlord_id,name,address,city,description,type,lat,lng,amenities,house_rules,images,is_featured) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9','11111111-1111-1111-1111-111111111113',
'Mendoza Boarding House','56 P. Dela Cruz Street, Marulas','Valenzuela',
'Affordable boarding house with shared kitchen and laundry. Ideal for students and workers.',
'boarding_house',14.6760,121.0410,
ARRAY['wifi','cctv','laundry area','shared kitchen'],
ARRAY['No visitors after 10 PM','No smoking indoors','Keep common areas clean'],
ARRAY['/hero-images/dorm-01.png','/hero-images/dorm-02.png'],true)
ON CONFLICT (id) DO UPDATE SET landlord_id=EXCLUDED.landlord_id,name=EXCLUDED.name,address=EXCLUDED.address,city=EXCLUDED.city,description=EXCLUDED.description,type=EXCLUDED.type,lat=EXCLUDED.lat,lng=EXCLUDED.lng,amenities=EXCLUDED.amenities,house_rules=EXCLUDED.house_rules,images=EXCLUDED.images,is_featured=EXCLUDED.is_featured,updated_at=now();

INSERT INTO public.units (id,property_id,name,floor,status,rent_amount,sqft,beds,baths) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb25','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9','Room 101',1,'occupied',5500.00,200,1,1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb26','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9','Room 102',1,'occupied',5500.00,200,1,1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb27','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9','Room 103',2,'occupied',6000.00,250,1,1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb28','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9','Room 104',2,'occupied',6000.00,250,1,1)
ON CONFLICT (id) DO UPDATE SET property_id=EXCLUDED.property_id,name=EXCLUDED.name,floor=EXCLUDED.floor,status=EXCLUDED.status,rent_amount=EXCLUDED.rent_amount,sqft=EXCLUDED.sqft,beds=EXCLUDED.beds,baths=EXCLUDED.baths,updated_at=now();

UPDATE public.units SET status='occupied',updated_at=now()
WHERE id IN ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb17','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb18','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb19');

-- 4) PROPERTY ENVIRONMENT POLICY
INSERT INTO public.property_environment_policies (property_id,environment_mode,max_occupants_per_unit,curfew_enabled,curfew_time,visitor_cutoff_enabled,visitor_cutoff_time,quiet_hours_start,quiet_hours_end,gender_restriction_mode,utility_policy_mode,payment_profile_defaults,needs_review) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9','boarding_house',2,true,'22:00',true,'21:00','22:00','06:00','none','split','{"due_day":5,"allow_partial":true,"late_fee":300}'::jsonb,false)
ON CONFLICT (property_id) DO UPDATE SET environment_mode=EXCLUDED.environment_mode,max_occupants_per_unit=EXCLUDED.max_occupants_per_unit,curfew_enabled=EXCLUDED.curfew_enabled,curfew_time=EXCLUDED.curfew_time,visitor_cutoff_enabled=EXCLUDED.visitor_cutoff_enabled,visitor_cutoff_time=EXCLUDED.visitor_cutoff_time,quiet_hours_start=EXCLUDED.quiet_hours_start,quiet_hours_end=EXCLUDED.quiet_hours_end,gender_restriction_mode=EXCLUDED.gender_restriction_mode,utility_policy_mode=EXCLUDED.utility_policy_mode,payment_profile_defaults=EXCLUDED.payment_profile_defaults,needs_review=EXCLUDED.needs_review,updated_at=now();

-- 5) GCASH DESTINATION
INSERT INTO public.landlord_payment_destinations (id,landlord_id,provider,account_name,account_number,qr_image_path,qr_image_url,is_enabled) VALUES
('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b301','11111111-1111-1111-1111-111111111113','gcash','Isabella Mendoza','09178000050','/gcash/landlord3-qr.png','/gcash/landlord3-qr.png',true)
ON CONFLICT (id) DO UPDATE SET landlord_id=EXCLUDED.landlord_id,account_name=EXCLUDED.account_name,account_number=EXCLUDED.account_number,is_enabled=EXCLUDED.is_enabled,updated_at=now();

-- 6) LEASES (8 active)
INSERT INTO public.leases (id,unit_id,tenant_id,landlord_id,status,start_date,end_date,monthly_rent,security_deposit,terms,tenant_signature,landlord_signature,signed_at,signing_mode,tenant_signed_at,landlord_signed_at) VALUES
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c301','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b01','11111111-1111-1111-1111-111111111113','active',CURRENT_DATE-INTERVAL '60 days',CURRENT_DATE+INTERVAL '305 days',9000.00,9000.00,'{"due_day":5,"allow_partial":false,"late_fee":450}'::jsonb,'sig-l3-1','sig-l3-1l',now()-INTERVAL '61 days','remote',now()-INTERVAL '61 days',now()-INTERVAL '61 days'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c302','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb17','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b02','11111111-1111-1111-1111-111111111113','active',CURRENT_DATE-INTERVAL '45 days',CURRENT_DATE+INTERVAL '320 days',9500.00,9500.00,'{"due_day":5,"allow_partial":false,"late_fee":475}'::jsonb,'sig-l3-2','sig-l3-2l',now()-INTERVAL '46 days','remote',now()-INTERVAL '46 days',now()-INTERVAL '46 days'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c303','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb18','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b03','11111111-1111-1111-1111-111111111113','active',CURRENT_DATE-INTERVAL '90 days',CURRENT_DATE+INTERVAL '275 days',25000.00,25000.00,'{"due_day":1,"allow_partial":false,"late_fee":1250}'::jsonb,'sig-l3-3','sig-l3-3l',now()-INTERVAL '91 days','remote',now()-INTERVAL '91 days',now()-INTERVAL '91 days'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c304','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb19','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04','11111111-1111-1111-1111-111111111113','active',CURRENT_DATE-INTERVAL '30 days',CURRENT_DATE+INTERVAL '335 days',28000.00,28000.00,'{"due_day":5,"allow_partial":true,"late_fee":1400}'::jsonb,'sig-l3-4','sig-l3-4l',now()-INTERVAL '31 days','remote',now()-INTERVAL '31 days',now()-INTERVAL '31 days'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c305','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb25','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b05','11111111-1111-1111-1111-111111111113','active',CURRENT_DATE-INTERVAL '120 days',CURRENT_DATE+INTERVAL '245 days',5500.00,5500.00,'{"due_day":5,"allow_partial":true,"late_fee":300}'::jsonb,'sig-l3-5','sig-l3-5l',now()-INTERVAL '121 days','remote',now()-INTERVAL '121 days',now()-INTERVAL '121 days'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c306','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb26','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b06','11111111-1111-1111-1111-111111111113','active',CURRENT_DATE-INTERVAL '75 days',CURRENT_DATE+INTERVAL '290 days',5500.00,5500.00,'{"due_day":5,"allow_partial":true,"late_fee":300}'::jsonb,'sig-l3-6','sig-l3-6l',now()-INTERVAL '76 days','remote',now()-INTERVAL '76 days',now()-INTERVAL '76 days'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c307','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb27','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07','11111111-1111-1111-1111-111111111113','active',CURRENT_DATE-INTERVAL '50 days',CURRENT_DATE+INTERVAL '315 days',6000.00,6000.00,'{"due_day":5,"allow_partial":false,"late_fee":300}'::jsonb,'sig-l3-7','sig-l3-7l',now()-INTERVAL '51 days','remote',now()-INTERVAL '51 days',now()-INTERVAL '51 days'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c308','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb28','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b08','11111111-1111-1111-1111-111111111113','active',CURRENT_DATE-INTERVAL '100 days',CURRENT_DATE+INTERVAL '265 days',6000.00,6000.00,'{"due_day":5,"allow_partial":true,"late_fee":300}'::jsonb,'sig-l3-8','sig-l3-8l',now()-INTERVAL '101 days','remote',now()-INTERVAL '101 days',now()-INTERVAL '101 days')
ON CONFLICT (id) DO UPDATE SET unit_id=EXCLUDED.unit_id,tenant_id=EXCLUDED.tenant_id,landlord_id=EXCLUDED.landlord_id,status=EXCLUDED.status,start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,monthly_rent=EXCLUDED.monthly_rent,security_deposit=EXCLUDED.security_deposit,terms=EXCLUDED.terms,tenant_signature=EXCLUDED.tenant_signature,landlord_signature=EXCLUDED.landlord_signature,signed_at=EXCLUDED.signed_at,updated_at=now();

-- ============================================================
-- 7) PAYMENTS – 13 invoices covering ALL workflow states
-- ============================================================
-- SCENARIO MAP:
--  d301: Liam    | pending               | Fresh invoice, no reminder
--  d302: Liam    | receipted/gcash/exact | Prev month – full GCash flow complete
--  d303: Emma    | reminder_sent         | IRIS reminder sent, Pay Now available
--  d304: Jake    | intent_submitted/gcash| Tenant just submitted GCash proof
--  d305: Mia     | under_review/gcash/exact  | Landlord reviewing exact payment
--  d306: Mia     | rejected/gcash        | Prev month – rejected with reason
--  d307: Lucas   | under_review/gcash/partial | Partial GCash (₱3k of ₱5.5k)
--  d308: Chloe   | under_review/gcash/overpaid | Overpaid GCash (₱6k of ₱5.5k)
--  d309: Chloe   | confirmed/gcash/exact | Prev month – confirmed, no receipt yet
--  d310: Andre   | awaiting_in_person    | Face-to-face intent, not expired
--  d311: Andre   | pending (expired)     | Prev month – in-person expired, reverted
--  d312: Hannah  | receipted/in_person/exact | Prev month – full face-to-face flow
--  d313: Hannah  | under_review/gcash/short_paid | Short paid GCash (₱5k of ₱6k)

BEGIN;
ALTER TABLE public.payments DISABLE TRIGGER trg_payments_sync_compat_status;

INSERT INTO public.payments (id,lease_id,tenant_id,landlord_id,amount,status,method,description,due_date,paid_at,reference_number,landlord_confirmed,invoice_number,billing_cycle,invoice_period_start,invoice_period_end,subtotal,paid_amount,balance_remaining,late_fee_amount,allow_partial_payments,due_day_snapshot,payment_submitted_at,payment_proof_path,payment_proof_url,payment_note,reminder_sent_at,receipt_number,workflow_status,intent_method,amount_tag,review_action,in_person_intent_expires_at,rejection_reason,last_action_at,last_action_by,metadata) VALUES
-- d301: Liam – PENDING (fresh, no reminder)
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d301','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c301','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b01','11111111-1111-1111-1111-111111111113',9000.00,'pending',NULL,'April 2026 rent – Studio 202',date_trunc('month',CURRENT_DATE)::date+4,NULL,NULL,false,'INV-L3-202604-0001',date_trunc('month',CURRENT_DATE)::date,date_trunc('month',CURRENT_DATE)::date,(date_trunc('month',CURRENT_DATE)+INTERVAL '1 month - 1 day')::date,9000.00,0,9000.00,0,false,5,NULL,NULL,NULL,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}'::jsonb),
-- d302: Liam – RECEIPTED via GCash, exact (prev month)
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c301','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b01','11111111-1111-1111-1111-111111111113',9000.00,'completed','gcash','March 2026 rent – Studio 202',date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date+4,now()-INTERVAL '10 days','GCASH-LIAM-0301',true,'INV-L3-202603-0001',date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date,date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE-INTERVAL '1 month')+INTERVAL '1 month - 1 day')::date,9000.00,9000.00,0,0,false,5,now()-INTERVAL '12 days','/proof/liam-gcash-mar.png','/proof/liam-gcash-mar.png','Monthly rent paid via GCash',now()-INTERVAL '15 days','REC-202603-0001','receipted','gcash','exact',NULL,NULL,NULL,now()-INTERVAL '10 days','11111111-1111-1111-1111-111111111113','{}'::jsonb),
-- d303: Emma – REMINDER SENT
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d303','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c302','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b02','11111111-1111-1111-1111-111111111113',9500.00,'pending',NULL,'April 2026 rent – Studio 303',date_trunc('month',CURRENT_DATE)::date+4,NULL,NULL,false,'INV-L3-202604-0002',date_trunc('month',CURRENT_DATE)::date,date_trunc('month',CURRENT_DATE)::date,(date_trunc('month',CURRENT_DATE)+INTERVAL '1 month - 1 day')::date,9500.00,0,9500.00,0,false,5,NULL,NULL,NULL,NULL,now()-INTERVAL '6 hours',NULL,'reminder_sent',NULL,NULL,NULL,NULL,NULL,now()-INTERVAL '6 hours',NULL,'{"iris_reminder_sent":true}'::jsonb),
-- d304: Jake – INTENT SUBMITTED via GCash
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d304','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c303','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b03','11111111-1111-1111-1111-111111111113',25000.00,'processing','gcash','April 2026 rent – Villa 1',date_trunc('month',CURRENT_DATE)::date,NULL,'GCASH-JAKE-0401',false,'INV-L3-202604-0003',date_trunc('month',CURRENT_DATE)::date,date_trunc('month',CURRENT_DATE)::date,(date_trunc('month',CURRENT_DATE)+INTERVAL '1 month - 1 day')::date,25000.00,0,25000.00,0,false,1,now()-INTERVAL '30 minutes','/proof/jake-gcash-apr.png','/proof/jake-gcash-apr.png','GCash payment for April rent',now()-INTERVAL '2 days',NULL,'intent_submitted','gcash',NULL,NULL,NULL,NULL,now()-INTERVAL '30 minutes','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b03','{}'::jsonb),
-- d305: Mia – UNDER REVIEW via GCash, exact
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d305','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c304','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04','11111111-1111-1111-1111-111111111113',28000.00,'processing','gcash','April 2026 rent – Villa 2',date_trunc('month',CURRENT_DATE)::date+4,NULL,'GCASH-MIA-0401',false,'INV-L3-202604-0004',date_trunc('month',CURRENT_DATE)::date,date_trunc('month',CURRENT_DATE)::date,(date_trunc('month',CURRENT_DATE)+INTERVAL '1 month - 1 day')::date,28000.00,28000.00,0,0,true,5,now()-INTERVAL '4 hours','/proof/mia-gcash-apr.png','/proof/mia-gcash-apr.png','Full April rent via GCash',now()-INTERVAL '2 days',NULL,'under_review','gcash','exact',NULL,NULL,NULL,now()-INTERVAL '4 hours','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04','{}'::jsonb),
-- d306: Mia – REJECTED via GCash (prev month, bad proof)
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d306','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c304','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04','11111111-1111-1111-1111-111111111113',28000.00,'failed','gcash','March 2026 rent – Villa 2 (REJECTED)',date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date+4,NULL,'GCASH-MIA-REJ-0301',false,'INV-L3-202603-0002',date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date,date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE-INTERVAL '1 month')+INTERVAL '1 month - 1 day')::date,28000.00,0,28000.00,0,true,5,now()-INTERVAL '35 days','/proof/mia-gcash-mar-rejected.png','/proof/mia-gcash-mar-rejected.png','March rent GCash',now()-INTERVAL '38 days',NULL,'rejected','gcash',NULL,'reject',NULL,'Screenshot is unclear and reference number is unreadable. Please resubmit with a clearer image.',now()-INTERVAL '33 days','11111111-1111-1111-1111-111111111113','{"resubmit_available":true}'::jsonb),
-- d307: Lucas – UNDER REVIEW via GCash, PARTIAL (₱3,000 of ₱5,500)
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d307','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c305','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b05','11111111-1111-1111-1111-111111111113',5500.00,'processing','gcash','April 2026 rent – Room 101 (partial)',date_trunc('month',CURRENT_DATE)::date+4,NULL,'GCASH-LUCAS-0401',false,'INV-L3-202604-0005',date_trunc('month',CURRENT_DATE)::date,date_trunc('month',CURRENT_DATE)::date,(date_trunc('month',CURRENT_DATE)+INTERVAL '1 month - 1 day')::date,5500.00,3000.00,2500.00,0,true,5,now()-INTERVAL '2 hours','/proof/lucas-gcash-apr.png','/proof/lucas-gcash-apr.png','Partial payment – will pay balance next week',now()-INTERVAL '3 days',NULL,'under_review','gcash','partial',NULL,NULL,NULL,now()-INTERVAL '2 hours','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b05','{}'::jsonb),
-- d308: Chloe – UNDER REVIEW via GCash, OVERPAID (₱6,000 of ₱5,500)
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d308','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c306','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b06','11111111-1111-1111-1111-111111111113',5500.00,'processing','gcash','April 2026 rent – Room 102 (overpaid)',date_trunc('month',CURRENT_DATE)::date+4,NULL,'GCASH-CHLOE-0401',false,'INV-L3-202604-0006',date_trunc('month',CURRENT_DATE)::date,date_trunc('month',CURRENT_DATE)::date,(date_trunc('month',CURRENT_DATE)+INTERVAL '1 month - 1 day')::date,5500.00,6000.00,-500.00,0,true,5,now()-INTERVAL '1 hour','/proof/chloe-gcash-apr.png','/proof/chloe-gcash-apr.png','Accidentally sent extra ₱500',now()-INTERVAL '2 days',NULL,'under_review','gcash','overpaid',NULL,NULL,NULL,now()-INTERVAL '1 hour','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b06','{}'::jsonb),
-- d309: Chloe – CONFIRMED via GCash, exact (prev month, no receipt yet)
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d309','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c306','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b06','11111111-1111-1111-1111-111111111113',5500.00,'completed','gcash','March 2026 rent – Room 102',date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date+4,now()-INTERVAL '8 days','GCASH-CHLOE-0301',true,'INV-L3-202603-0003',date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date,date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE-INTERVAL '1 month')+INTERVAL '1 month - 1 day')::date,5500.00,5500.00,0,0,true,5,now()-INTERVAL '10 days','/proof/chloe-gcash-mar.png','/proof/chloe-gcash-mar.png','March rent via GCash',now()-INTERVAL '12 days',NULL,'confirmed','gcash','exact',NULL,NULL,NULL,now()-INTERVAL '8 days','11111111-1111-1111-1111-111111111113','{}'::jsonb),
-- d310: Andre – AWAITING IN-PERSON (active, expires in 2 days)
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d310','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c307','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07','11111111-1111-1111-1111-111111111113',6000.00,'pending','cash','April 2026 rent – Room 103 (in-person)',date_trunc('month',CURRENT_DATE)::date+4,NULL,NULL,false,'INV-L3-202604-0007',date_trunc('month',CURRENT_DATE)::date,date_trunc('month',CURRENT_DATE)::date,(date_trunc('month',CURRENT_DATE)+INTERVAL '1 month - 1 day')::date,6000.00,0,6000.00,0,false,5,NULL,NULL,NULL,NULL,now()-INTERVAL '1 day',NULL,'awaiting_in_person','in_person',NULL,NULL,now()+INTERVAL '2 days',NULL,now()-INTERVAL '1 day','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07','{}'::jsonb),
-- d311: Andre – PENDING (in-person expired, reverted) prev month
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d311','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c307','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07','11111111-1111-1111-1111-111111111113',6000.00,'pending',NULL,'March 2026 rent – Room 103 (in-person expired)',date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date+4,NULL,NULL,false,'INV-L3-202603-0004',date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date,date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE-INTERVAL '1 month')+INTERVAL '1 month - 1 day')::date,6000.00,0,6000.00,0,false,5,NULL,NULL,NULL,NULL,now()-INTERVAL '35 days',NULL,'pending',NULL,NULL,NULL,NULL,NULL,now()-INTERVAL '28 days',NULL,'{"expired_in_person":true,"system_reverted":true}'::jsonb),
-- d312: Hannah – RECEIPTED via In-Person, exact (prev month)
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d312','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c308','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b08','11111111-1111-1111-1111-111111111113',6000.00,'completed','cash','March 2026 rent – Room 104 (in-person)',date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date+4,now()-INTERVAL '15 days',NULL,true,'INV-L3-202603-0005',date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date,date_trunc('month',CURRENT_DATE-INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE-INTERVAL '1 month')+INTERVAL '1 month - 1 day')::date,6000.00,6000.00,0,0,true,5,NULL,NULL,NULL,NULL,now()-INTERVAL '20 days','REC-202603-0002','receipted','in_person','exact','confirm_received',NULL,NULL,now()-INTERVAL '15 days','11111111-1111-1111-1111-111111111113','{}'::jsonb),
-- d313: Hannah – UNDER REVIEW via GCash, SHORT PAID (₱5,000 of ₱6,000)
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d313','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c308','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b08','11111111-1111-1111-1111-111111111113',6000.00,'processing','gcash','April 2026 rent – Room 104 (short paid)',date_trunc('month',CURRENT_DATE)::date+4,NULL,'GCASH-HANNAH-0401',false,'INV-L3-202604-0008',date_trunc('month',CURRENT_DATE)::date,date_trunc('month',CURRENT_DATE)::date,(date_trunc('month',CURRENT_DATE)+INTERVAL '1 month - 1 day')::date,6000.00,5000.00,1000.00,0,true,5,now()-INTERVAL '45 minutes','/proof/hannah-gcash-apr.png','/proof/hannah-gcash-apr.png','Short by ₱1,000 – will complete tomorrow',now()-INTERVAL '3 days',NULL,'under_review','gcash','short_paid',NULL,NULL,NULL,now()-INTERVAL '45 minutes','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b08','{}'::jsonb)
ON CONFLICT (id) DO UPDATE SET lease_id=EXCLUDED.lease_id,tenant_id=EXCLUDED.tenant_id,landlord_id=EXCLUDED.landlord_id,amount=EXCLUDED.amount,status=EXCLUDED.status,method=EXCLUDED.method,description=EXCLUDED.description,due_date=EXCLUDED.due_date,paid_at=EXCLUDED.paid_at,reference_number=EXCLUDED.reference_number,landlord_confirmed=EXCLUDED.landlord_confirmed,invoice_number=EXCLUDED.invoice_number,billing_cycle=EXCLUDED.billing_cycle,subtotal=EXCLUDED.subtotal,paid_amount=EXCLUDED.paid_amount,balance_remaining=EXCLUDED.balance_remaining,workflow_status=EXCLUDED.workflow_status,intent_method=EXCLUDED.intent_method,amount_tag=EXCLUDED.amount_tag,review_action=EXCLUDED.review_action,rejection_reason=EXCLUDED.rejection_reason,metadata=EXCLUDED.metadata,updated_at=now();

ALTER TABLE public.payments ENABLE TRIGGER trg_payments_sync_compat_status;

-- 8) PAYMENT ITEMS
INSERT INTO public.payment_items (id,payment_id,label,amount,category,sort_order) VALUES
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e301','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d301','Monthly Rent',8500.00,'rent',1),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e302','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d301','Water Bill',300.00,'utility',2),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e303','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d301','Electricity',200.00,'utility',3),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e304','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302','Monthly Rent',8500.00,'rent',1),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e305','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302','Water Bill',300.00,'utility',2),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e306','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302','Electricity',200.00,'utility',3),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e307','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d303','Monthly Rent',9000.00,'rent',1),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e308','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d303','Electricity',500.00,'utility',2),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e309','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d304','Monthly Rent',24000.00,'rent',1),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e310','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d304','Water Bill',600.00,'utility',2),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e311','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d304','Electricity',400.00,'utility',3),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e312','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d305','Monthly Rent',26500.00,'rent',1),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e313','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d305','Water Bill',800.00,'utility',2),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e314','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d305','Electricity',700.00,'utility',3),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e315','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d306','Monthly Rent',26500.00,'rent',1),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e316','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d306','Water Bill',800.00,'utility',2),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e317','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d306','Electricity',700.00,'utility',3),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e318','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d307','Monthly Rent',5000.00,'rent',1),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e319','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d307','Water Bill',300.00,'utility',2),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e320','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d307','Electricity',200.00,'utility',3),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e321','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d308','Monthly Rent',5000.00,'rent',1),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e322','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d308','Water Bill',300.00,'utility',2),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e323','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d308','Electricity',200.00,'utility',3),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e324','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d309','Monthly Rent',5000.00,'rent',1),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e325','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d309','Water Bill',300.00,'utility',2),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e326','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d309','Electricity',200.00,'utility',3),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e327','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d310','Monthly Rent',5500.00,'rent',1),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e328','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d310','Water Bill',250.00,'utility',2),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e329','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d310','Electricity',250.00,'utility',3),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e330','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d311','Monthly Rent',5500.00,'rent',1),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e331','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d311','Water Bill',250.00,'utility',2),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e332','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d311','Electricity',250.00,'utility',3),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e333','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d312','Monthly Rent',5500.00,'rent',1),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e334','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d312','Water Bill',250.00,'utility',2),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e335','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d312','Electricity',250.00,'utility',3),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e336','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d313','Monthly Rent',5500.00,'rent',1),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e337','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d313','Water Bill',250.00,'utility',2),
('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e338','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d313','Electricity',250.00,'utility',3)
ON CONFLICT (id) DO UPDATE SET payment_id=EXCLUDED.payment_id,label=EXCLUDED.label,amount=EXCLUDED.amount,category=EXCLUDED.category;

-- 9) RECEIPTS (for receipted payments)
INSERT INTO public.payment_receipts (id,payment_id,landlord_id,tenant_id,receipt_number,amount,issued_at,issued_by,notes,method,amount_breakdown,metadata) VALUES
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1301','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302','11111111-1111-1111-1111-111111111113','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b01','REC-202603-0001',9000.00,now()-INTERVAL '10 days','11111111-1111-1111-1111-111111111113','Monthly rent for March 2026 – Studio 202. Paid via GCash.','gcash','{"rent":8500,"water":300,"electricity":200,"total":9000}'::jsonb,'{"intent_method":"gcash","amount_tag":"exact","reference_number":"GCASH-LIAM-0301"}'::jsonb),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1302','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d312','11111111-1111-1111-1111-111111111113','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b08','REC-202603-0002',6000.00,now()-INTERVAL '15 days','11111111-1111-1111-1111-111111111113','Monthly rent for March 2026 – Room 104. Paid in person (cash).','cash','{"rent":5500,"water":250,"electricity":250,"total":6000}'::jsonb,'{"intent_method":"in_person","amount_tag":"exact","review_action":"confirm_received"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET payment_id=EXCLUDED.payment_id,landlord_id=EXCLUDED.landlord_id,tenant_id=EXCLUDED.tenant_id,receipt_number=EXCLUDED.receipt_number,amount=EXCLUDED.amount,method=EXCLUDED.method,amount_breakdown=EXCLUDED.amount_breakdown;

-- 10) CONVERSATIONS (one per tenant-landlord pair)
INSERT INTO public.conversations (id) VALUES
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c201'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c202'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c203'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c204'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c205'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c206'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c207'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c208')
ON CONFLICT (id) DO UPDATE SET updated_at=now();

INSERT INTO public.conversation_participants (id,conversation_id,user_id) VALUES
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c401','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c201','11111111-1111-1111-1111-111111111113'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c402','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c201','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b01'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c403','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c202','11111111-1111-1111-1111-111111111113'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c404','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c202','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b02'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c405','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c203','11111111-1111-1111-1111-111111111113'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c406','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c203','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b03'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c407','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c204','11111111-1111-1111-1111-111111111113'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c408','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c204','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c409','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c205','11111111-1111-1111-1111-111111111113'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c410','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c205','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b05'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c411','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c206','11111111-1111-1111-1111-111111111113'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c412','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c206','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b06'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c413','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c207','11111111-1111-1111-1111-111111111113'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c414','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c207','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c415','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c208','11111111-1111-1111-1111-111111111113'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c416','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c208','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b08')
ON CONFLICT (id) DO UPDATE SET conversation_id=EXCLUDED.conversation_id,user_id=EXCLUDED.user_id;

-- 11) IRIS CHAT MESSAGES + SYSTEM MESSAGES (payment workflow notifications in chat)
INSERT INTO public.messages (id,conversation_id,sender_id,type,content,metadata,read_at,created_at) VALUES
-- Liam conv: receipt delivered for March
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c501','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c201','11111111-1111-1111-1111-111111111113','system','📄 Receipt issued for March 2026 rent – Studio 202. Amount: ₱9,000 via GCash. Receipt #: REC-202603-0001','{"type":"receipt","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302","receipt_number":"REC-202603-0001","amount":9000,"method":"gcash"}'::jsonb,now()-INTERVAL '10 days',now()-INTERVAL '10 days'),
-- Emma conv: IRIS reminder with Pay Now button
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c502','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c202','11111111-1111-1111-1111-111111111113','system','🔔 Your rent of ₱9,500 for April 2026 is due on the 5th. Tap Pay Now to settle your invoice.','{"type":"payment_reminder","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d303","amount":9500,"due_date":"' || to_char(date_trunc('month',CURRENT_DATE)::date+4,'YYYY-MM-DD') || '","action":"pay_now","invoice_number":"INV-L3-202604-0002"}'::jsonb,NULL,now()-INTERVAL '6 hours'),
-- Jake conv: IRIS payment submitted notification to landlord
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c503','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c203','11111111-1111-1111-1111-111111111113','system','💰 Jake Cruz submitted GCash payment proof for April rent (₱25,000). Reference: GCASH-JAKE-0401. [Review Payment] [Reject]','{"type":"payment_submitted","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d304","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b03","amount":25000,"reference":"GCASH-JAKE-0401","intent_method":"gcash","actions":["review_payment","reject"],"invoice_number":"INV-L3-202604-0003"}'::jsonb,NULL,now()-INTERVAL '30 minutes'),
-- Mia conv: landlord review notification for exact GCash
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c504','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c204','11111111-1111-1111-1111-111111111113','system','💰 Mia Tan submitted GCash payment for April rent (₱28,000 – exact). Reference: GCASH-MIA-0401. [Confirm Payment] [Reject]','{"type":"payment_submitted","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d305","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04","amount":28000,"reference":"GCASH-MIA-0401","intent_method":"gcash","amount_tag":"exact","actions":["confirm_payment","reject"],"invoice_number":"INV-L3-202604-0004"}'::jsonb,NULL,now()-INTERVAL '4 hours'),
-- Mia conv: rejection notice for prev month
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c505','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c204','11111111-1111-1111-1111-111111111113','system','❌ Your March rent payment was rejected. Reason: Screenshot is unclear and reference number is unreadable. Please resubmit with a clearer image. [Resubmit Proof]','{"type":"payment_rejected","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d306","amount":28000,"rejection_reason":"Screenshot is unclear and reference number is unreadable. Please resubmit with a clearer image.","action":"resubmit","invoice_number":"INV-L3-202603-0002"}'::jsonb,now()-INTERVAL '33 days',now()-INTERVAL '33 days'),
-- Lucas conv: partial payment notification
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c506','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c205','11111111-1111-1111-1111-111111111113','system','💰 Lucas Gomez submitted partial GCash payment for April rent (₱3,000 of ₱5,500). Balance: ₱2,500. [Accept Partial] [Request Completion] [Reject]','{"type":"payment_submitted","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d307","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b05","amount":5500,"paid_amount":3000,"balance_remaining":2500,"reference":"GCASH-LUCAS-0401","intent_method":"gcash","amount_tag":"partial","actions":["accept_partial","request_completion","reject"],"invoice_number":"INV-L3-202604-0005"}'::jsonb,NULL,now()-INTERVAL '2 hours'),
-- Chloe conv: overpaid notification
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c507','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c206','11111111-1111-1111-1111-111111111113','system','💰 Chloe Lim overpaid April rent via GCash (₱6,000 of ₱5,500 – overpaid by ₱500). Reference: GCASH-CHLOE-0401. [Confirm Payment] [Reject]','{"type":"payment_submitted","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d308","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b06","amount":5500,"paid_amount":6000,"overpaid_by":500,"reference":"GCASH-CHLOE-0401","intent_method":"gcash","amount_tag":"overpaid","actions":["confirm_payment","reject"],"invoice_number":"INV-L3-202604-0006"}'::jsonb,NULL,now()-INTERVAL '1 hour'),
-- Chloe conv: confirmed notification for prev month
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c508','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c206','11111111-1111-1111-1111-111111111113','system','✅ Your March rent payment of ₱5,500 has been confirmed by the landlord.','{"type":"payment_confirmed","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d309","amount":5500,"invoice_number":"INV-L3-202603-0003"}'::jsonb,now()-INTERVAL '8 days',now()-INTERVAL '8 days'),
-- Andre conv: in-person intent notification to landlord
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c509','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c207','11111111-1111-1111-1111-111111111113','system','🤝 Andre Bautista triggered in-person payment for April rent (₱6,000). Expires in 3 days. [Confirm Received]','{"type":"in_person_intent","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d310","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07","amount":6000,"expires_at":"' || to_char(now()+INTERVAL '2 days','YYYY-MM-DD"T"HH24:MI:SS"Z"') || '","intent_method":"in_person","actions":["confirm_received"],"invoice_number":"INV-L3-202604-0007"}'::jsonb,NULL,now()-INTERVAL '1 day'),
-- Andre conv: in-person expired notification (prev month)
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c510','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c207','11111111-1111-1111-1111-111111111113','system','⏰ Your in-person payment intent for March rent has expired. The invoice has been reverted to Pending. Please initiate payment again.','{"type":"in_person_expired","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d311","amount":6000,"invoice_number":"INV-L3-202603-0004"}'::jsonb,now()-INTERVAL '28 days',now()-INTERVAL '28 days'),
-- Hannah conv: receipt delivered for March in-person
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c511','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c208','11111111-1111-1111-1111-111111111113','system','📄 Receipt issued for March 2026 rent – Room 104. Amount: ₱6,000 paid in person. Receipt #: REC-202603-0002','{"type":"receipt","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d312","receipt_number":"REC-202603-0002","amount":6000,"method":"cash","intent_method":"in_person"}'::jsonb,now()-INTERVAL '15 days',now()-INTERVAL '15 days'),
-- Hannah conv: short paid notification
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c512','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c208','11111111-1111-1111-1111-111111111113','system','💰 Hannah Dizon submitted short GCash payment for April rent (₱5,000 of ₱6,000 – short by ₱1,000). Reference: GCASH-HANNAH-0401. [Accept Partial] [Request Completion] [Reject]','{"type":"payment_submitted","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d313","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b08","amount":6000,"paid_amount":5000,"short_by":1000,"reference":"GCASH-HANNAH-0401","intent_method":"gcash","amount_tag":"short_paid","actions":["accept_partial","request_completion","reject"],"invoice_number":"INV-L3-202604-0008"}'::jsonb,NULL,now()-INTERVAL '45 minutes'),
-- Also add some regular tenant-landlord chat messages for realism
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c513','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c201','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b01','text','Hi Ms. Mendoza, I already paid my March rent via GCash. Reference number is GCASH-LIAM-0301.','{"channel":"in_app"}'::jsonb,now()-INTERVAL '12 days',now()-INTERVAL '12 days'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c514','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c201','11111111-1111-1111-1111-111111111113','text','Received, Liam! I can see the payment. Let me confirm it now.','{"channel":"in_app"}'::jsonb,now()-INTERVAL '12 days',now()-INTERVAL '12 days'+INTERVAL '5 minutes'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c515','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c207','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07','text','Hi Ms. Mendoza, I''d like to pay in person this month. Can I drop by tomorrow?','{"channel":"in_app"}'::jsonb,now()-INTERVAL '1 day',now()-INTERVAL '1 day'+INTERVAL '2 hours'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c516','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c207','11111111-1111-1111-1111-111111111113','text','Sure, Andre! I''ll be at the boarding house from 9 AM to 5 PM tomorrow.','{"channel":"in_app"}'::jsonb,NULL,now()-INTERVAL '1 day'+INTERVAL '2 hours'+INTERVAL '10 minutes')
ON CONFLICT (id) DO UPDATE SET conversation_id=EXCLUDED.conversation_id,sender_id=EXCLUDED.sender_id,type=EXCLUDED.type,content=EXCLUDED.content,metadata=EXCLUDED.metadata,read_at=EXCLUDED.read_at,created_at=EXCLUDED.created_at;

-- 12) SYSTEM NOTIFICATIONS
INSERT INTO public.notifications (id,user_id,type,title,message,data,read,created_at) VALUES
-- Liam: receipt notification
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c601','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b01','payment','Receipt Issued','Your receipt for March 2026 rent (₱9,000) has been issued. Receipt #: REC-202603-0001','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302","receipt_number":"REC-202603-0001","amount":9000}'::jsonb,true,now()-INTERVAL '10 days'),
-- Liam: new invoice
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c602','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b01','payment','New Invoice','Your April 2026 rent invoice of ₱9,000 is ready. Due date: ' || to_char(date_trunc('month',CURRENT_DATE)::date+4,'Month DD, YYYY'),'{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d301","invoice_number":"INV-L3-202604-0001","amount":9000}'::jsonb,false,now()-INTERVAL '3 days'),
-- Emma: IRIS reminder notification
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c603','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b02','payment','Rent Reminder','Your April rent of ₱9,500 is due on the 5th. Pay now to avoid late fees.','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d303","invoice_number":"INV-L3-202604-0002","amount":9500,"action":"pay_now"}'::jsonb,false,now()-INTERVAL '6 hours'),
-- Jake: payment submitted confirmation to tenant
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c604','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b03','payment','Payment Submitted','Your GCash payment proof for April rent (₱25,000) has been submitted. Awaiting landlord review.','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d304","reference":"GCASH-JAKE-0401","amount":25000}'::jsonb,false,now()-INTERVAL '30 minutes'),
-- Jake: landlord alert for new payment
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c605','11111111-1111-1111-1111-111111111113','payment','Payment Proof Submitted','Jake Cruz submitted GCash proof for April rent (₱25,000). Review required.','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d304","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b03","amount":25000,"action":"review"}'::jsonb,false,now()-INTERVAL '30 minutes'),
-- Mia: landlord alert for exact GCash
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c606','11111111-1111-1111-1111-111111111113','payment','Payment Proof Submitted','Mia Tan submitted GCash proof for April rent (₱28,000 – exact). Review required.','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d305","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04","amount":28000,"amount_tag":"exact","action":"review"}'::jsonb,false,now()-INTERVAL '4 hours'),
-- Mia: rejection notification to tenant
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c607','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04','payment','Payment Rejected','Your March rent payment was rejected. Reason: Screenshot is unclear and reference number is unreadable. Please resubmit.','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d306","rejection_reason":"Screenshot is unclear and reference number is unreadable. Please resubmit with a clearer image.","action":"resubmit"}'::jsonb,true,now()-INTERVAL '33 days'),
-- Mia: landlord rejection confirmation
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c608','11111111-1111-1111-1111-111111111113','payment','Payment Rejected','You rejected Mia Tan''s March rent payment. Reason: Screenshot is unclear.','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d306","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04"}'::jsonb,true,now()-INTERVAL '33 days'),
-- Lucas: partial payment landlord alert
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c609','11111111-1111-1111-1111-111111111113','payment','Partial Payment Submitted','Lucas Gomez paid ₱3,000 of ₱5,500 for April rent (partial). Choose: Accept partial, request completion, or reject.','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d307","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b05","amount":5500,"paid_amount":3000,"amount_tag":"partial","actions":["accept_partial","request_completion","reject"]}'::jsonb,false,now()-INTERVAL '2 hours'),
-- Chloe: overpaid landlord alert
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c610','11111111-1111-1111-1111-111111111113','payment','Overpaid – Review Required','Chloe Lim overpaid April rent (₱6,000 of ₱5,500). Excess: ₱500. Review and confirm or reject.','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d308","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b06","amount":5500,"paid_amount":6000,"overpaid_by":500,"amount_tag":"overpaid","action":"review"}'::jsonb,false,now()-INTERVAL '1 hour'),
-- Chloe: confirmed notification to tenant
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c611','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b06','payment','Payment Confirmed','Your March rent payment of ₱5,500 has been confirmed by the landlord.','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d309","amount":5500,"invoice_number":"INV-L3-202603-0003"}'::jsonb,true,now()-INTERVAL '8 days'),
-- Andre: in-person intent landlord alert
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c612','11111111-1111-1111-1111-111111111113','payment','In-Person Payment Initiated','Andre Bautista triggered in-person payment for April rent (₱6,000). Expires in 3 days. Open the transaction to confirm when paid.','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d310","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07","amount":6000,"intent_method":"in_person","action":"confirm_received"}'::jsonb,false,now()-INTERVAL '1 day'),
-- Andre: in-person expired notification to both
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c613','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07','payment','In-Person Payment Expired','Your in-person payment intent for March rent has expired. The invoice has been reverted to Pending. Please try again.','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d311","amount":6000,"invoice_number":"INV-L3-202603-0004"}'::jsonb,true,now()-INTERVAL '28 days'),
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c614','11111111-1111-1111-1111-111111111113','payment','In-Person Payment Expired','Andre Bautista''s in-person payment for March rent has expired. Invoice reverted to Pending.','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d311","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07","amount":6000}'::jsonb,true,now()-INTERVAL '28 days'),
-- Hannah: receipt notification
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c615','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b08','payment','Receipt Issued','Your receipt for March 2026 rent (₱6,000) has been issued. Receipt #: REC-202603-0002','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d312","receipt_number":"REC-202603-0002","amount":6000}'::jsonb,true,now()-INTERVAL '15 days'),
-- Hannah: short paid landlord alert
('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c616','11111111-1111-1111-1111-111111111113','payment','Short Payment – Review Required','Hannah Dizon submitted ₱5,000 of ₱6,000 for April rent (short by ₱1,000). Choose: Accept partial, request completion, or reject.','{"payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d313","tenant_id":"3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b08","amount":6000,"paid_amount":5000,"short_by":1000,"amount_tag":"short_paid","actions":["accept_partial","request_completion","reject"]}'::jsonb,false,now()-INTERVAL '45 minutes')
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id,type=EXCLUDED.type,title=EXCLUDED.title,message=EXCLUDED.message,data=EXCLUDED.data,read=EXCLUDED.read,created_at=EXCLUDED.created_at;

-- 13) PAYMENT WORKFLOW AUDIT EVENTS
INSERT INTO public.payment_workflow_audit_events (id,payment_id,actor_id,action,source,idempotency_key,before_state,after_state,metadata,created_at) VALUES
-- Liam: full GCash flow audit trail (d302)
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a301','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302',NULL,'invoice_generated','api','inv-gen-d302','{}'::jsonb,'{"workflow_status":"pending","amount":9000}'::jsonb,'{}'::jsonb,now()-INTERVAL '35 days'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a302','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302',NULL,'reminder_sent','api','rem-d302','{"workflow_status":"pending"}'::jsonb,'{"workflow_status":"reminder_sent"}'::jsonb,'{}'::jsonb,now()-INTERVAL '15 days'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a303','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b01','intent_submitted','api','intent-d302','{"workflow_status":"reminder_sent"}'::jsonb,'{"workflow_status":"intent_submitted","intent_method":"gcash","reference":"GCASH-LIAM-0301"}'::jsonb,'{"reference_number":"GCASH-LIAM-0301","proof_submitted":true}'::jsonb,now()-INTERVAL '12 days'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a304','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b01','proof_submitted','api','proof-d302','{"workflow_status":"intent_submitted"}'::jsonb,'{"workflow_status":"under_review"}'::jsonb,'{"proof_path":"/proof/liam-gcash-mar.png"}'::jsonb,now()-INTERVAL '12 days'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a305','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302','11111111-1111-1111-1111-111111111113','payment_confirmed','api','confirm-d302','{"workflow_status":"under_review"}'::jsonb,'{"workflow_status":"confirmed","amount_tag":"exact"}'::jsonb,'{"amount_tag":"exact","paid_at":"' || to_char(now()-INTERVAL '10 days','YYYY-MM-DD"T"HH24:MI:SS"Z"') || '"}'::jsonb,now()-INTERVAL '10 days'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a306','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302','11111111-1111-1111-1111-111111111113','receipt_issued','api','receipt-d302','{"workflow_status":"confirmed"}'::jsonb,'{"workflow_status":"receipted","receipt_number":"REC-202603-0001"}'::jsonb,'{"receipt_number":"REC-202603-0001","amount":9000}'::jsonb,now()-INTERVAL '10 days'),
-- Mia: rejection audit trail (d306)
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a307','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d306','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04','intent_submitted','api','intent-d306','{"workflow_status":"reminder_sent"}'::jsonb,'{"workflow_status":"intent_submitted","intent_method":"gcash"}'::jsonb,'{}'::jsonb,now()-INTERVAL '35 days'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a308','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d306','11111111-1111-1111-1111-111111111113','payment_rejected','api','reject-d306','{"workflow_status":"under_review"}'::jsonb,'{"workflow_status":"rejected","rejection_reason":"Screenshot is unclear and reference number is unreadable."}'::jsonb,'{"rejection_reason":"Screenshot is unclear and reference number is unreadable. Please resubmit with a clearer image."}'::jsonb,now()-INTERVAL '33 days'),
-- Andre: in-person expired audit (d311)
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a309','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d311','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07','in_person_intent','api','inperson-d311','{"workflow_status":"reminder_sent"}'::jsonb,'{"workflow_status":"awaiting_in_person","intent_method":"in_person"}'::jsonb,'{}'::jsonb,now()-INTERVAL '35 days'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a310','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d311',NULL,'in_person_expired','system_expiry','expire-d311','{"workflow_status":"awaiting_in_person"}'::jsonb,'{"workflow_status":"pending","expired_in_person":true}'::jsonb,'{"system_reverted":true}'::jsonb,now()-INTERVAL '28 days'),
-- Hannah: full in-person flow audit (d312)
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a311','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d312','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b08','in_person_intent','api','inperson-d312','{"workflow_status":"reminder_sent"}'::jsonb,'{"workflow_status":"awaiting_in_person","intent_method":"in_person"}'::jsonb,'{}'::jsonb,now()-INTERVAL '20 days'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a312','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d312','11111111-1111-1111-1111-111111111113','confirm_received','api','confirm-d312','{"workflow_status":"awaiting_in_person"}'::jsonb,'{"workflow_status":"confirmed","amount_tag":"exact","review_action":"confirm_received"}'::jsonb,'{"amount_tag":"exact","paid_at":"' || to_char(now()-INTERVAL '15 days','YYYY-MM-DD"T"HH24:MI:SS"Z"') || '"}'::jsonb,now()-INTERVAL '15 days'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a313','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d312','11111111-1111-1111-1111-111111111113','receipt_issued','api','receipt-d312','{"workflow_status":"confirmed"}'::jsonb,'{"workflow_status":"receipted","receipt_number":"REC-202603-0002"}'::jsonb,'{"receipt_number":"REC-202603-0002","amount":6000,"method":"cash"}'::jsonb,now()-INTERVAL '15 days'),
-- Chloe: confirmed audit (d309)
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a314','d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d309','11111111-1111-1111-1111-111111111113','payment_confirmed','api','confirm-d309','{"workflow_status":"under_review"}'::jsonb,'{"workflow_status":"confirmed","amount_tag":"exact"}'::jsonb,'{"amount_tag":"exact"}'::jsonb,now()-INTERVAL '8 days')
ON CONFLICT (id) DO UPDATE SET payment_id=EXCLUDED.payment_id,actor_id=EXCLUDED.actor_id,action=EXCLUDED.action,source=EXCLUDED.source,before_state=EXCLUDED.before_state,after_state=EXCLUDED.after_state,metadata=EXCLUDED.metadata,created_at=EXCLUDED.created_at;

-- 14) IRIS CHAT MESSAGES (global IRIS assistant interactions)
INSERT INTO public.iris_chat_messages (id,user_id,role,content,metadata,created_at) VALUES
('c7c7c7c7-c7c7-c7c7-c7c7-c7c7c7c7c701','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b02','user','When is my rent due?','{"topic":"payments"}'::jsonb,now()-INTERVAL '6 hours'),
('c7c7c7c7-c7c7-c7c7-c7c7-c7c7c7c7c702','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b02','assistant','Your April rent of ₱9,500 is due on the 5th. You can pay now via GCash or in person. Tap the Pay Now button in your invoice or chat to get started.','{"topic":"payments","confidence":"high","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d303"}'::jsonb,now()-INTERVAL '6 hours'+INTERVAL '5 seconds'),
('c7c7c7c7-c7c7-c7c7-c7c7-c7c7c7c7c703','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07','user','Can I pay in person?','{"topic":"payments"}'::jsonb,now()-INTERVAL '1 day'),
('c7c7c7c7-c7c7-c7c7-c7c7-c7c7c7c7c704','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b07','assistant','Yes! You can trigger an in-person payment from your invoice page. The landlord will be notified and you can pay them directly. Note: in-person intents expire after 3 days if not confirmed.','{"topic":"payments","confidence":"high"}'::jsonb,now()-INTERVAL '1 day'+INTERVAL '6 seconds'),
('c7c7c7c7-c7c7-c7c7-c7c7-c7c7c7c7c705','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04','user','My payment was rejected. What do I do?','{"topic":"payments"}'::jsonb,now()-INTERVAL '33 days'),
('c7c7c7c7-c7c7-c7c7-c7c7-c7c7c7c7c706','3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b04','assistant','Your March payment was rejected because the screenshot was unclear. You can resubmit corrected proof on the same invoice without creating a new one. Make sure your reference number and screenshot are clear and readable.','{"topic":"payments","confidence":"high","payment_id":"d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d306"}'::jsonb,now()-INTERVAL '33 days'+INTERVAL '8 seconds')
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id,role=EXCLUDED.role,content=EXCLUDED.content,metadata=EXCLUDED.metadata,created_at=EXCLUDED.created_at;

-- Auth compatibility guard for hosted GoTrue:
-- prevent NULL string fields that can cause /auth/v1/token 500 scan errors.
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change = COALESCE(email_change, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, '')
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_new IS NULL
  OR email_change_token_current IS NULL
  OR email_change IS NULL
  OR reauthentication_token IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL;

COMMIT;
