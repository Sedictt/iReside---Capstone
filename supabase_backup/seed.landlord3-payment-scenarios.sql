-- Landlord payment workflow scenario seed
-- Landlord: 11111111-1111-1111-1111-111111111113

BEGIN;

-- Tenants for scenario coverage
DO $$
BEGIN
  BEGIN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
      email_change, reauthentication_token, phone_change, phone_change_token,
      created_at, updated_at
    ) VALUES
      ('00000000-0000-0000-0000-000000000000','33333333-3333-3333-3333-333333333341','authenticated','authenticated','tenant.scenario.one@ireside.local',crypt('Passw0rd!', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Rhea Bautista","role":"tenant","phone":"+639171110341"}'::jsonb,'','','','','','','','',now(),now()),
      ('00000000-0000-0000-0000-000000000000','33333333-3333-3333-3333-333333333342','authenticated','authenticated','tenant.scenario.two@ireside.local',crypt('Passw0rd!', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Kenji dela Cruz","role":"tenant","phone":"+639171110342"}'::jsonb,'','','','','','','','',now(),now()),
      ('00000000-0000-0000-0000-000000000000','33333333-3333-3333-3333-333333333343','authenticated','authenticated','tenant.scenario.three@ireside.local',crypt('Passw0rd!', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Paolo Lim","role":"tenant","phone":"+639171110343"}'::jsonb,'','','','','','','','',now(),now()),
      ('00000000-0000-0000-0000-000000000000','33333333-3333-3333-3333-333333333344','authenticated','authenticated','tenant.scenario.four@ireside.local',crypt('Passw0rd!', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Lia Navarro","role":"tenant","phone":"+639171110344"}'::jsonb,'','','','','','','','',now(),now())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, raw_user_meta_data = EXCLUDED.raw_user_meta_data, updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping auth.users workflow seed users: %', SQLERRM;
  END;
END $$;

-- Compatibility guard: some hosted projects allow NULL token fields in auth.users,
-- which can trigger /auth/v1/token password login 500s in GoTrue.
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

INSERT INTO public.profiles (id, email, full_name, role, phone, business_name, business_permits)
VALUES
  ('33333333-3333-3333-3333-333333333341','tenant.scenario.one@ireside.local','Rhea Bautista','tenant','+639171110341',NULL,ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333342','tenant.scenario.two@ireside.local','Kenji dela Cruz','tenant','+639171110342',NULL,ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333343','tenant.scenario.three@ireside.local','Paolo Lim','tenant','+639171110343',NULL,ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333344','tenant.scenario.four@ireside.local','Lia Navarro','tenant','+639171110344',NULL,ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  updated_at = now();

INSERT INTO public.landlord_payment_destinations (
  id, landlord_id, provider, account_name, account_number, qr_image_path, qr_image_url, is_enabled
)
VALUES (
  '5c5c0000-0000-0000-0000-000000000113','11111111-1111-1111-1111-111111111113','gcash','Isabella Mendoza','09171110005',NULL,NULL,true
)
ON CONFLICT (landlord_id, provider) DO UPDATE SET
  account_name = EXCLUDED.account_name,
  account_number = EXCLUDED.account_number,
  is_enabled = EXCLUDED.is_enabled,
  updated_at = now();

UPDATE public.units
SET status = 'occupied'
WHERE id IN (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb17',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb18',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb19'
);

INSERT INTO public.leases (
  id, unit_id, tenant_id, landlord_id, status, start_date, end_date, monthly_rent, security_deposit, terms, tenant_signature, landlord_signature, signed_at
)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccd11','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16','33333333-3333-3333-3333-333333333341','11111111-1111-1111-1111-111111111113','active',CURRENT_DATE - INTERVAL '95 days',CURRENT_DATE + INTERVAL '270 days',9000.00,9000.00,'{"due_day":8,"allow_partial":false,"late_fee":350}'::jsonb,'tenant-sig-l3-11','landlord-sig-l3-11',now()-INTERVAL '94 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccd12','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb17','33333333-3333-3333-3333-333333333342','11111111-1111-1111-1111-111111111113','active',CURRENT_DATE - INTERVAL '82 days',CURRENT_DATE + INTERVAL '283 days',9500.00,9500.00,'{"due_day":10,"allow_partial":true,"late_fee":400}'::jsonb,'tenant-sig-l3-12','landlord-sig-l3-12',now()-INTERVAL '81 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccd13','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb18','33333333-3333-3333-3333-333333333343','11111111-1111-1111-1111-111111111113','active',CURRENT_DATE - INTERVAL '120 days',CURRENT_DATE + INTERVAL '245 days',25000.00,25000.00,'{"due_day":12,"allow_partial":false,"late_fee":1200}'::jsonb,'tenant-sig-l3-13','landlord-sig-l3-13',now()-INTERVAL '119 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccd14','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb19','33333333-3333-3333-3333-333333333344','11111111-1111-1111-1111-111111111113','active',CURRENT_DATE - INTERVAL '76 days',CURRENT_DATE + INTERVAL '289 days',28000.00,28000.00,'{"due_day":15,"allow_partial":true,"late_fee":1500}'::jsonb,'tenant-sig-l3-14','landlord-sig-l3-14',now()-INTERVAL '75 days')
ON CONFLICT (id) DO UPDATE SET
  unit_id = EXCLUDED.unit_id,
  tenant_id = EXCLUDED.tenant_id,
  landlord_id = EXCLUDED.landlord_id,
  status = EXCLUDED.status,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  monthly_rent = EXCLUDED.monthly_rent,
  security_deposit = EXCLUDED.security_deposit,
  terms = EXCLUDED.terms,
  signed_at = EXCLUDED.signed_at,
  updated_at = now();

INSERT INTO public.conversations (id)
VALUES
  ('c3c30000-0000-0000-0000-000000000001'),
  ('c3c30000-0000-0000-0000-000000000002'),
  ('c3c30000-0000-0000-0000-000000000003'),
  ('c3c30000-0000-0000-0000-000000000004'),
  ('c3c30000-0000-0000-0000-000000000005')
ON CONFLICT (id) DO UPDATE SET updated_at = now();

INSERT INTO public.conversation_participants (id, conversation_id, user_id)
VALUES
  ('c3c31000-0000-0000-0000-000000000001','c3c30000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111113'),
  ('c3c31000-0000-0000-0000-000000000002','c3c30000-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333336'),
  ('c3c31000-0000-0000-0000-000000000003','c3c30000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111113'),
  ('c3c31000-0000-0000-0000-000000000004','c3c30000-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333341'),
  ('c3c31000-0000-0000-0000-000000000005','c3c30000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111113'),
  ('c3c31000-0000-0000-0000-000000000006','c3c30000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333342'),
  ('c3c31000-0000-0000-0000-000000000007','c3c30000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111113'),
  ('c3c31000-0000-0000-0000-000000000008','c3c30000-0000-0000-0000-000000000004','33333333-3333-3333-3333-333333333343'),
  ('c3c31000-0000-0000-0000-000000000009','c3c30000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111113'),
  ('c3c31000-0000-0000-0000-00000000000a','c3c30000-0000-0000-0000-000000000005','33333333-3333-3333-3333-333333333344')
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (
  id, lease_id, tenant_id, landlord_id, amount, subtotal, status, workflow_status, method, intent_method,
  amount_tag, review_action, description, due_date, billing_cycle, invoice_period_start, invoice_period_end,
  paid_amount, balance_remaining, allow_partial_payments, due_day_snapshot,
  reference_number, payment_proof_url, payment_submitted_at, reminder_sent_at,
  in_person_intent_expires_at, rejection_reason, receipt_number, payment_note,
  last_action_by, last_action_at, metadata, paid_at
)
VALUES
  ('d3d30000-0000-0000-0000-000000000001','cccccccc-cccc-cccc-cccc-ccccccccccc4','33333333-3333-3333-3333-333333333336','11111111-1111-1111-1111-111111111113',9000,9000,'pending','pending',NULL,NULL,NULL,NULL,'Auto-generated monthly rent invoice',(CURRENT_DATE + INTERVAL '12 days')::date,(date_trunc('month',CURRENT_DATE)::date + INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE)::date + INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE)::date + INTERVAL '2 months - 1 day')::date,0,9000,false,10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'11111111-1111-1111-1111-111111111113',now()-INTERVAL '2 days','{"scenario":"pending_auto_generated"}'::jsonb,NULL),
  ('d3d30000-0000-0000-0000-000000000002','cccccccc-cccc-cccc-cccc-ccccccccccc4','33333333-3333-3333-3333-333333333336','11111111-1111-1111-1111-111111111113',9000,9000,'pending','reminder_sent',NULL,NULL,NULL,NULL,'Invoice with reminder sent',(CURRENT_DATE + INTERVAL '2 days')::date,date_trunc('month',CURRENT_DATE)::date,date_trunc('month',CURRENT_DATE)::date,(date_trunc('month',CURRENT_DATE)::date + INTERVAL '1 month - 1 day')::date,0,9000,false,10,NULL,NULL,NULL,now()-INTERVAL '4 hours',NULL,NULL,NULL,NULL,'11111111-1111-1111-1111-111111111113',now()-INTERVAL '4 hours','{"scenario":"reminder_sent"}'::jsonb,NULL),
  ('d3d30000-0000-0000-0000-000000000003','cccccccc-cccc-cccc-cccc-cccccccccd11','33333333-3333-3333-3333-333333333341','11111111-1111-1111-1111-111111111113',9600,9600,'processing','intent_submitted',NULL,'gcash',NULL,NULL,'Tenant selected GCash and started submission',(CURRENT_DATE + INTERVAL '5 days')::date,date_trunc('month',CURRENT_DATE)::date,date_trunc('month',CURRENT_DATE)::date,(date_trunc('month',CURRENT_DATE)::date + INTERVAL '1 month - 1 day')::date,0,9600,false,8,NULL,NULL,now()-INTERVAL '3 hours',NULL,NULL,NULL,NULL,'GCash selected, waiting to upload proof.','33333333-3333-3333-3333-333333333341',now()-INTERVAL '3 hours','{"scenario":"intent_submitted"}'::jsonb,NULL),
  ('d3d30000-0000-0000-0000-000000000004','cccccccc-cccc-cccc-cccc-cccccccccd11','33333333-3333-3333-3333-333333333341','11111111-1111-1111-1111-111111111113',9600,9600,'processing','under_review','gcash','gcash','exact',NULL,'GCash proof submitted for validation',(CURRENT_DATE - INTERVAL '1 day')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 day')::date,9600,0,false,8,'GCASH-L3-0004','https://example.local/storage/payment-proofs/l3-0004.png',now()-INTERVAL '6 hours',NULL,NULL,NULL,NULL,'Transferred via GCash wallet ending in 3421.','33333333-3333-3333-3333-333333333341',now()-INTERVAL '6 hours','{"scenario":"under_review_gcash_exact"}'::jsonb,NULL),
  ('d3d30000-0000-0000-0000-000000000005','cccccccc-cccc-cccc-cccc-cccccccccd11','33333333-3333-3333-3333-333333333341','11111111-1111-1111-1111-111111111113',9600,9600,'completed','receipted','gcash','gcash','exact','accept_partial','GCash payment confirmed and receipted',(CURRENT_DATE - INTERVAL '25 days')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '2 months')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '2 months')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 month - 1 day')::date,9600,0,false,8,'GCASH-L3-0005','https://example.local/storage/payment-proofs/l3-0005.png',now()-INTERVAL '24 days',now()-INTERVAL '26 days',NULL,NULL,'REC-L3-202602-0005','Confirmed by landlord and receipted.','11111111-1111-1111-1111-111111111113',now()-INTERVAL '24 days','{"scenario":"receipted_gcash_exact"}'::jsonb,now()-INTERVAL '24 days'),
  ('d3d30000-0000-0000-0000-000000000006','cccccccc-cccc-cccc-cccc-cccccccccd12','33333333-3333-3333-3333-333333333342','11111111-1111-1111-1111-111111111113',10200,10200,'failed','rejected','gcash','gcash','short_paid','request_completion','Short-paid submission rejected and completion requested',(CURRENT_DATE + INTERVAL '3 days')::date,date_trunc('month',CURRENT_DATE)::date,date_trunc('month',CURRENT_DATE)::date,(date_trunc('month',CURRENT_DATE)::date + INTERVAL '1 month - 1 day')::date,0,10200,true,10,'GCASH-L3-0006','https://example.local/storage/payment-proofs/l3-0006.png',now()-INTERVAL '1 day',NULL,NULL,'Submitted amount is short. Please complete the remaining balance and resubmit.',NULL,'Submitted amount did not match expected balance.','11111111-1111-1111-1111-111111111113',now()-INTERVAL '16 hours','{"scenario":"rejected_short_paid_request_completion"}'::jsonb,NULL),
  ('d3d30000-0000-0000-0000-000000000007','cccccccc-cccc-cccc-cccc-cccccccccd12','33333333-3333-3333-3333-333333333342','11111111-1111-1111-1111-111111111113',10200,10200,'processing','under_review','gcash','gcash','exact',NULL,'Corrected GCash proof resubmitted for the same invoice',(CURRENT_DATE - INTERVAL '3 days')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 day')::date,10200,0,true,10,'GCASH-L3-0007-RESUBMIT','https://example.local/storage/payment-proofs/l3-0007-resubmit.png',now()-INTERVAL '2 hours',NULL,NULL,NULL,NULL,'Resubmitting corrected proof after rejection.','33333333-3333-3333-3333-333333333342',now()-INTERVAL '2 hours','{"scenario":"resubmitted_without_new_invoice"}'::jsonb,NULL),
  ('d3d30000-0000-0000-0000-000000000008','cccccccc-cccc-cccc-cccc-cccccccccd13','33333333-3333-3333-3333-333333333343','11111111-1111-1111-1111-111111111113',26500,26500,'pending','awaiting_in_person',NULL,'in_person',NULL,NULL,'Tenant triggered in-person payment',(CURRENT_DATE + INTERVAL '4 days')::date,date_trunc('month',CURRENT_DATE)::date,date_trunc('month',CURRENT_DATE)::date,(date_trunc('month',CURRENT_DATE)::date + INTERVAL '1 month - 1 day')::date,0,26500,false,12,NULL,NULL,now()-INTERVAL '2 hours',NULL,now()+INTERVAL '2 days',NULL,NULL,'Will pay at the front desk this evening.','33333333-3333-3333-3333-333333333343',now()-INTERVAL '2 hours','{"scenario":"awaiting_in_person_active"}'::jsonb,NULL),
  ('d3d30000-0000-0000-0000-000000000009','cccccccc-cccc-cccc-cccc-cccccccccd13','33333333-3333-3333-3333-333333333343','11111111-1111-1111-1111-111111111113',26500,26500,'pending','pending',NULL,NULL,NULL,NULL,'In-person intent expired and invoice returned to pending',(CURRENT_DATE - INTERVAL '8 days')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 day')::date,0,26500,false,12,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Previous in-person intent elapsed without confirmation.','11111111-1111-1111-1111-111111111113',now()-INTERVAL '5 days','{"scenario":"in_person_intent_expired_reverted_pending"}'::jsonb,NULL),
  ('d3d30000-0000-0000-0000-00000000000a','cccccccc-cccc-cccc-cccc-cccccccccd14','33333333-3333-3333-3333-333333333344','11111111-1111-1111-1111-111111111113',29500,29500,'completed','confirmed','gcash','gcash','partial','accept_partial','Partial payment accepted by landlord',(CURRENT_DATE + INTERVAL '6 days')::date,date_trunc('month',CURRENT_DATE)::date,date_trunc('month',CURRENT_DATE)::date,(date_trunc('month',CURRENT_DATE)::date + INTERVAL '1 month - 1 day')::date,22000,7500,true,15,'GCASH-L3-0010-PARTIAL','https://example.local/storage/payment-proofs/l3-0010.png',now()-INTERVAL '1 day',NULL,NULL,NULL,NULL,'Landlord accepted partial and requested settlement next cycle.','11111111-1111-1111-1111-111111111113',now()-INTERVAL '22 hours','{"scenario":"confirmed_partial_accept"}'::jsonb,now()-INTERVAL '1 day'),
  ('d3d30000-0000-0000-0000-00000000000b','cccccccc-cccc-cccc-cccc-cccccccccd14','33333333-3333-3333-3333-333333333344','11111111-1111-1111-1111-111111111113',29500,29500,'failed','rejected','gcash','gcash','overpaid','reject','Overpaid submission rejected',(CURRENT_DATE - INTERVAL '2 days')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 month')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 day')::date,0,29500,true,15,'GCASH-L3-0011-OVER','https://example.local/storage/payment-proofs/l3-0011.png',now()-INTERVAL '10 hours',NULL,NULL,'Overpayment detected. Submit exact amount only.',NULL,'Submitted amount exceeded invoice and was rejected for correction.','11111111-1111-1111-1111-111111111113',now()-INTERVAL '9 hours','{"scenario":"rejected_overpaid"}'::jsonb,NULL),
  ('d3d30000-0000-0000-0000-00000000000c','cccccccc-cccc-cccc-cccc-cccccccccd13','33333333-3333-3333-3333-333333333343','11111111-1111-1111-1111-111111111113',26500,26500,'completed','receipted','cash','in_person','exact','confirm_received','In-person payment confirmed by landlord and receipted',(CURRENT_DATE - INTERVAL '40 days')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '2 months')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '2 months')::date,(date_trunc('month',CURRENT_DATE)::date - INTERVAL '1 month - 1 day')::date,26500,0,false,12,NULL,NULL,now()-INTERVAL '39 days',now()-INTERVAL '41 days',NULL,NULL,'REC-L3-202602-0012','Paid in person at property office.','11111111-1111-1111-1111-111111111113',now()-INTERVAL '39 days','{"scenario":"receipted_in_person_confirm_received"}'::jsonb,now()-INTERVAL '39 days')
ON CONFLICT (id) DO UPDATE SET
  workflow_status = EXCLUDED.workflow_status,
  method = EXCLUDED.method,
  intent_method = EXCLUDED.intent_method,
  amount_tag = EXCLUDED.amount_tag,
  review_action = EXCLUDED.review_action,
  paid_amount = EXCLUDED.paid_amount,
  balance_remaining = EXCLUDED.balance_remaining,
  reminder_sent_at = EXCLUDED.reminder_sent_at,
  in_person_intent_expires_at = EXCLUDED.in_person_intent_expires_at,
  rejection_reason = EXCLUDED.rejection_reason,
  receipt_number = EXCLUDED.receipt_number,
  payment_note = EXCLUDED.payment_note,
  reference_number = EXCLUDED.reference_number,
  payment_proof_url = EXCLUDED.payment_proof_url,
  payment_submitted_at = EXCLUDED.payment_submitted_at,
  last_action_by = EXCLUDED.last_action_by,
  last_action_at = EXCLUDED.last_action_at,
  metadata = EXCLUDED.metadata,
  paid_at = EXCLUDED.paid_at,
  updated_at = now();

INSERT INTO public.payment_items (id, payment_id, label, amount, category, sort_order, metadata)
VALUES
  ('e3d30000-0000-0000-0000-000000000001','d3d30000-0000-0000-0000-000000000001','Monthly Rent + Water',9000,'rent',0,'{"scenario":"pending"}'::jsonb),
  ('e3d30000-0000-0000-0000-000000000002','d3d30000-0000-0000-0000-000000000002','Monthly Rent + Water',9000,'rent',0,'{"scenario":"reminder"}'::jsonb),
  ('e3d30000-0000-0000-0000-000000000003','d3d30000-0000-0000-0000-000000000003','Monthly Rent + Electricity',9600,'rent',0,'{"scenario":"intent"}'::jsonb),
  ('e3d30000-0000-0000-0000-000000000004','d3d30000-0000-0000-0000-000000000004','Monthly Rent + Electricity',9600,'rent',0,'{"scenario":"under_review"}'::jsonb),
  ('e3d30000-0000-0000-0000-000000000005','d3d30000-0000-0000-0000-000000000005','Monthly Rent + Electricity',9600,'rent',0,'{"scenario":"receipted_gcash"}'::jsonb),
  ('e3d30000-0000-0000-0000-000000000006','d3d30000-0000-0000-0000-000000000006','Monthly Rent + Water',10200,'rent',0,'{"scenario":"rejected_short_paid"}'::jsonb),
  ('e3d30000-0000-0000-0000-000000000007','d3d30000-0000-0000-0000-000000000007','Monthly Rent + Water',10200,'rent',0,'{"scenario":"resubmitted"}'::jsonb),
  ('e3d30000-0000-0000-0000-000000000008','d3d30000-0000-0000-0000-000000000008','Monthly Rent + Utilities',26500,'rent',0,'{"scenario":"awaiting_in_person"}'::jsonb),
  ('e3d30000-0000-0000-0000-000000000009','d3d30000-0000-0000-0000-000000000009','Monthly Rent + Utilities',26500,'rent',0,'{"scenario":"expired_intent"}'::jsonb),
  ('e3d30000-0000-0000-0000-00000000000a','d3d30000-0000-0000-0000-00000000000a','Monthly Rent + Electricity',29500,'rent',0,'{"scenario":"confirmed_partial"}'::jsonb),
  ('e3d30000-0000-0000-0000-00000000000b','d3d30000-0000-0000-0000-00000000000b','Monthly Rent + Electricity',29500,'rent',0,'{"scenario":"rejected_overpaid"}'::jsonb),
  ('e3d30000-0000-0000-0000-00000000000c','d3d30000-0000-0000-0000-00000000000c','Monthly Rent + Utilities',26500,'rent',0,'{"scenario":"receipted_cash"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  payment_id = EXCLUDED.payment_id,
  label = EXCLUDED.label,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  metadata = EXCLUDED.metadata;

INSERT INTO public.payment_receipts (
  id, payment_id, landlord_id, tenant_id, receipt_number, amount, issued_at, issued_by, notes, method, amount_breakdown, metadata
)
VALUES
  ('9c9c0000-0000-0000-0000-000000000001','d3d30000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111113','33333333-3333-3333-3333-333333333341','REC-L3-202602-0005',9600,now()-INTERVAL '24 days','11111111-1111-1111-1111-111111111113','GCash receipt issued after landlord confirmation.','gcash','{"originalAmount":9600,"acceptedAmount":9600,"amountTag":"exact"}'::jsonb,'{"immutable":true}'::jsonb),
  ('9c9c0000-0000-0000-0000-000000000002','d3d30000-0000-0000-0000-00000000000c','11111111-1111-1111-1111-111111111113','33333333-3333-3333-3333-333333333343','REC-L3-202602-0012',26500,now()-INTERVAL '39 days','11111111-1111-1111-1111-111111111113','Face-to-face receipt generated from Confirm Received.','cash','{"originalAmount":26500,"acceptedAmount":26500,"amountTag":"exact"}'::jsonb,'{"immutable":true}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.payment_workflow_audit_events (
  id, payment_id, actor_id, action, source, idempotency_key, before_state, after_state, metadata, created_at
)
VALUES
  ('8c8c0000-0000-0000-0000-000000000001','d3d30000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111113','invoice_generated','api','p01-gen','{}'::jsonb,'{"workflow_status":"pending"}'::jsonb,'{"billingCycle":"next_month"}'::jsonb,now()-INTERVAL '2 days'),
  ('8c8c0000-0000-0000-0000-000000000002','d3d30000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111113','reminder_sent','api','p02-remind','{"workflow_status":"pending"}'::jsonb,'{"workflow_status":"reminder_sent"}'::jsonb,'{"actionLabel":"Pay Now"}'::jsonb,now()-INTERVAL '4 hours'),
  ('8c8c0000-0000-0000-0000-000000000003','d3d30000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333341','gcash_submission_blocked_missing_fields','api','p03-blocked','{"workflow_status":"intent_submitted"}'::jsonb,'{"workflow_status":"intent_submitted"}'::jsonb,'{"missing":["reference_number","proof_image"],"blocked":true}'::jsonb,now()-INTERVAL '170 minutes'),
  ('8c8c0000-0000-0000-0000-000000000004','d3d30000-0000-0000-0000-000000000004','33333333-3333-3333-3333-333333333341','tenant_payment_submitted_gcash','api','p04-submit','{"workflow_status":"intent_submitted"}'::jsonb,'{"workflow_status":"under_review","amount_tag":"exact"}'::jsonb,'{"reference":"GCASH-L3-0004"}'::jsonb,now()-INTERVAL '6 hours'),
  ('8c8c0000-0000-0000-0000-000000000005','d3d30000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111113','landlord_review_receipted','api','p05-review','{"workflow_status":"under_review"}'::jsonb,'{"workflow_status":"receipted"}'::jsonb,'{"duplicateSuppressed":true,"repeatClickCount":2}'::jsonb,now()-INTERVAL '24 days'),
  ('8c8c0000-0000-0000-0000-000000000006','d3d30000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111113','landlord_review_rejected','api','p06-review','{"workflow_status":"under_review"}'::jsonb,'{"workflow_status":"rejected","amount_tag":"short_paid","review_action":"request_completion"}'::jsonb,'{"reason":"Submitted amount is short. Please complete the remaining balance and resubmit."}'::jsonb,now()-INTERVAL '16 hours'),
  ('8c8c0000-0000-0000-0000-000000000007','d3d30000-0000-0000-0000-000000000007','33333333-3333-3333-3333-333333333342','tenant_resubmitted_corrected_proof','api','p07-resubmit','{"workflow_status":"rejected"}'::jsonb,'{"workflow_status":"under_review"}'::jsonb,'{"sameInvoiceResubmission":true}'::jsonb,now()-INTERVAL '2 hours'),
  ('8c8c0000-0000-0000-0000-000000000008','d3d30000-0000-0000-0000-000000000008','33333333-3333-3333-3333-333333333343','tenant_in_person_intent_submitted','api','p08-intent','{"workflow_status":"pending"}'::jsonb,'{"workflow_status":"awaiting_in_person"}'::jsonb,'{"expiresInHours":72}'::jsonb,now()-INTERVAL '2 hours'),
  ('8c8c0000-0000-0000-0000-000000000009','d3d30000-0000-0000-0000-000000000009','11111111-1111-1111-1111-111111111113','in_person_intent_expired','system_expiry','p09-expire','{"workflow_status":"awaiting_in_person"}'::jsonb,'{"workflow_status":"pending"}'::jsonb,'{"reason":"deadline_elapsed"}'::jsonb,now()-INTERVAL '5 days'),
  ('8c8c0000-0000-0000-0000-00000000000a','d3d30000-0000-0000-0000-00000000000a','11111111-1111-1111-1111-111111111113','landlord_review_confirmed','api','p10-review','{"workflow_status":"under_review"}'::jsonb,'{"workflow_status":"confirmed","amount_tag":"partial","review_action":"accept_partial"}'::jsonb,'{"acceptedAmount":22000}'::jsonb,now()-INTERVAL '22 hours'),
  ('8c8c0000-0000-0000-0000-00000000000b','d3d30000-0000-0000-0000-00000000000b','11111111-1111-1111-1111-111111111113','landlord_review_rejected','api','p11-review','{"workflow_status":"under_review"}'::jsonb,'{"workflow_status":"rejected","amount_tag":"overpaid","review_action":"reject"}'::jsonb,'{"reason":"Overpayment detected. Submit exact amount only."}'::jsonb,now()-INTERVAL '9 hours'),
  ('8c8c0000-0000-0000-0000-00000000000c','d3d30000-0000-0000-0000-00000000000c','11111111-1111-1111-1111-111111111113','landlord_review_receipted','api','p12-review','{"workflow_status":"awaiting_in_person"}'::jsonb,'{"workflow_status":"receipted","review_action":"confirm_received"}'::jsonb,'{"method":"cash"}'::jsonb,now()-INTERVAL '39 days')
ON CONFLICT (id) DO UPDATE SET
  action = EXCLUDED.action,
  source = EXCLUDED.source,
  idempotency_key = EXCLUDED.idempotency_key,
  before_state = EXCLUDED.before_state,
  after_state = EXCLUDED.after_state,
  metadata = EXCLUDED.metadata,
  created_at = EXCLUDED.created_at;

INSERT INTO public.notifications (id, user_id, type, title, message, data, read, created_at)
VALUES
  ('7c7c0000-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333336','payment','Rent payment reminder','Invoice INV-L3-REMINDER-202604-02 is due soon. Tap Pay Now to continue.','{"paymentId":"d3d30000-0000-0000-0000-000000000002","workflowStatus":"reminder_sent","actionLabel":"Pay Now","payNowPath":"/tenant/payments/d3d30000-0000-0000-0000-000000000002/checkout"}'::jsonb,false,now()-INTERVAL '4 hours'),
  ('7c7c0000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111113','payment','Payment proof submitted','Tenant submitted GCash proof for invoice INV-L3-UNDERREVIEW-202603-04.','{"paymentId":"d3d30000-0000-0000-0000-000000000004","workflowStatus":"under_review","actionButtons":["Confirm Payment","Reject","Request Completion"]}'::jsonb,false,now()-INTERVAL '6 hours'),
  ('7c7c0000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333342','payment','Payment review rejected','Invoice INV-L3-REJECTED-SHORT-202604-06 was rejected.','{"paymentId":"d3d30000-0000-0000-0000-000000000006","workflowStatus":"rejected","amountTag":"short_paid","reviewAction":"request_completion"}'::jsonb,false,now()-INTERVAL '16 hours'),
  ('7c7c0000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111113','payment','Payment proof resubmitted','Tenant resubmitted corrected proof for invoice INV-L3-RESUBMIT-202603-07.','{"paymentId":"d3d30000-0000-0000-0000-000000000007","workflowStatus":"under_review","actionButtons":["Confirm Payment","Reject","Request Completion"]}'::jsonb,false,now()-INTERVAL '2 hours'),
  ('7c7c0000-0000-0000-0000-000000000005','33333333-3333-3333-3333-333333333343','payment','In-person payment intent submitted','Invoice INV-L3-AWAITING-IP-202604-08 is awaiting in-person confirmation.','{"paymentId":"d3d30000-0000-0000-0000-000000000008","workflowStatus":"awaiting_in_person","actionLabel":"Confirm Received","landlordTransactionPath":"/landlord/invoices?invoiceId=d3d30000-0000-0000-0000-000000000008"}'::jsonb,false,now()-INTERVAL '2 hours'),
  ('7c7c0000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111113','payment','In-person payment intent submitted','Invoice INV-L3-AWAITING-IP-202604-08 is awaiting in-person confirmation.','{"paymentId":"d3d30000-0000-0000-0000-000000000008","workflowStatus":"awaiting_in_person","actionLabel":"Confirm Received","landlordTransactionPath":"/landlord/invoices?invoiceId=d3d30000-0000-0000-0000-000000000008"}'::jsonb,false,now()-INTERVAL '2 hours'),
  ('7c7c0000-0000-0000-0000-000000000007','33333333-3333-3333-3333-333333333343','payment','In-person payment intent expired','Invoice INV-L3-EXPIRED-IP-202603-09 was returned to Pending after no confirmation in 3 days.','{"paymentId":"d3d30000-0000-0000-0000-000000000009","workflowStatus":"pending","reason":"in_person_intent_expired"}'::jsonb,false,now()-INTERVAL '5 days'),
  ('7c7c0000-0000-0000-0000-000000000008','33333333-3333-3333-3333-333333333344','payment','Payment review updated','Invoice INV-L3-CONFIRMED-PARTIAL-202604-10 was confirmed as partial.','{"paymentId":"d3d30000-0000-0000-0000-00000000000a","workflowStatus":"confirmed","amountTag":"partial","reviewAction":"accept_partial"}'::jsonb,false,now()-INTERVAL '22 hours'),
  ('7c7c0000-0000-0000-0000-000000000009','33333333-3333-3333-3333-333333333344','payment','Payment review rejected','Invoice INV-L3-REJECTED-OVERPAID-202603-11 was rejected.','{"paymentId":"d3d30000-0000-0000-0000-00000000000b","workflowStatus":"rejected","amountTag":"overpaid","reviewAction":"reject"}'::jsonb,false,now()-INTERVAL '9 hours'),
  ('7c7c0000-0000-0000-0000-00000000000a','33333333-3333-3333-3333-333333333343','payment','Payment review updated','Invoice INV-L3-RECEIPTED-CASH-202602-12 is confirmed and receipted.','{"paymentId":"d3d30000-0000-0000-0000-00000000000c","workflowStatus":"receipted","amountTag":"exact","reviewAction":"confirm_received"}'::jsonb,false,now()-INTERVAL '39 days'),
  ('7c7c0000-0000-0000-0000-00000000000b','33333333-3333-3333-3333-333333333341','payment','Payment validation blocked','Submission requires reference number and clear proof image.','{"paymentId":"d3d30000-0000-0000-0000-000000000003","workflowStatus":"intent_submitted","blocked":true}'::jsonb,false,now()-INTERVAL '170 minutes'),
  ('7c7c0000-0000-0000-0000-00000000000c','33333333-3333-3333-3333-333333333341','payment','Payment review updated','Invoice INV-L3-RECEIPTED-202602-05 is confirmed and receipted.','{"paymentId":"d3d30000-0000-0000-0000-000000000005","workflowStatus":"receipted","amountTag":"exact"}'::jsonb,true,now()-INTERVAL '24 days')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  data = EXCLUDED.data,
  read = EXCLUDED.read,
  created_at = EXCLUDED.created_at;

INSERT INTO public.messages (
  id, conversation_id, sender_id, type, content, metadata, read_at, created_at
)
VALUES
  ('6c6c0000-0000-0000-0000-000000000001','c3c30000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111113','system','Payment reminder sent for invoice INV-L3-REMINDER-202604-02. Pay Now: /tenant/payments/d3d30000-0000-0000-0000-000000000002/checkout','{"event":"reminder_sent","actorName":"IRIS","paymentId":"d3d30000-0000-0000-0000-000000000002","actionLabel":"Pay Now","payNowPath":"/tenant/payments/d3d30000-0000-0000-0000-000000000002/checkout"}'::jsonb,NULL,now()-INTERVAL '4 hours'),
  ('6c6c0000-0000-0000-0000-000000000002','c3c30000-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333341','system','Payment proof submitted for invoice INV-L3-UNDERREVIEW-202603-04. Status is now Under Review.','{"event":"payment_submitted","actorName":"Tenant","paymentId":"d3d30000-0000-0000-0000-000000000004","workflowStatus":"under_review"}'::jsonb,NULL,now()-INTERVAL '6 hours'),
  ('6c6c0000-0000-0000-0000-000000000003','c3c30000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111113','system','Your digital receipt for invoice INV-L3-RECEIPTED-202602-05 has been generated.','{"systemType":"invoice","invoiceId":"INV-L3-RECEIPTED-202602-05","tenantName":"Rhea Bautista","unitName":"Studio 202","amount":"9,600","date":"Feb 15, 2026","description":"Monthly Rent + Electricity","paymentId":"d3d30000-0000-0000-0000-000000000005","workflowStatus":"receipted"}'::jsonb,NULL,now()-INTERVAL '24 days'),
  ('6c6c0000-0000-0000-0000-000000000004','c3c30000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111113','system','Payment rejected for invoice INV-L3-REJECTED-SHORT-202604-06. Reason: Submitted amount is short. Please complete the remaining balance and resubmit.','{"event":"landlord_review","actorName":"Landlord","paymentId":"d3d30000-0000-0000-0000-000000000006","workflowStatus":"rejected","reviewAction":"request_completion"}'::jsonb,NULL,now()-INTERVAL '16 hours'),
  ('6c6c0000-0000-0000-0000-000000000005','c3c30000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333342','system','Payment proof submitted for invoice INV-L3-RESUBMIT-202603-07. Status is now Under Review.','{"event":"payment_submitted","actorName":"Tenant","paymentId":"d3d30000-0000-0000-0000-000000000007","workflowStatus":"under_review"}'::jsonb,NULL,now()-INTERVAL '2 hours'),
  ('6c6c0000-0000-0000-0000-000000000006','c3c30000-0000-0000-0000-000000000004','33333333-3333-3333-3333-333333333343','system','In-person payment triggered for invoice INV-L3-AWAITING-IP-202604-08. Landlord link: /landlord/invoices?invoiceId=d3d30000-0000-0000-0000-000000000008','{"event":"awaiting_in_person","actorName":"Tenant","paymentId":"d3d30000-0000-0000-0000-000000000008","workflowStatus":"awaiting_in_person","actionLabel":"Confirm Received","landlordTransactionPath":"/landlord/invoices?invoiceId=d3d30000-0000-0000-0000-000000000008"}'::jsonb,NULL,now()-INTERVAL '2 hours'),
  ('6c6c0000-0000-0000-0000-000000000007','c3c30000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111113','system','In-person payment intent expired for invoice INV-L3-EXPIRED-IP-202603-09. Status reverted to Pending.','{"event":"in_person_intent_expired","actorName":"IRIS","paymentId":"d3d30000-0000-0000-0000-000000000009","workflowStatus":"pending"}'::jsonb,NULL,now()-INTERVAL '5 days'),
  ('6c6c0000-0000-0000-0000-000000000008','c3c30000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111113','system','Payment confirmed for invoice INV-L3-CONFIRMED-PARTIAL-202604-10.','{"event":"landlord_review","actorName":"Landlord","paymentId":"d3d30000-0000-0000-0000-00000000000a","workflowStatus":"confirmed","amountTag":"partial"}'::jsonb,NULL,now()-INTERVAL '22 hours'),
  ('6c6c0000-0000-0000-0000-000000000009','c3c30000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111113','system','Payment rejected for invoice INV-L3-REJECTED-OVERPAID-202603-11. Reason: Overpayment detected. Submit exact amount only.','{"event":"landlord_review","actorName":"Landlord","paymentId":"d3d30000-0000-0000-0000-00000000000b","workflowStatus":"rejected","amountTag":"overpaid"}'::jsonb,NULL,now()-INTERVAL '9 hours'),
  ('6c6c0000-0000-0000-0000-00000000000a','c3c30000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111113','system','Your digital receipt for in-person payment INV-L3-RECEIPTED-CASH-202602-12 has been generated.','{"systemType":"invoice","invoiceId":"INV-L3-RECEIPTED-CASH-202602-12","tenantName":"Paolo Lim","unitName":"Villa 1","amount":"26,500","date":"Feb 1, 2026","description":"Monthly Rent + Utilities","paymentId":"d3d30000-0000-0000-0000-00000000000c","workflowStatus":"receipted"}'::jsonb,NULL,now()-INTERVAL '39 days')
ON CONFLICT (id) DO UPDATE SET
  conversation_id = EXCLUDED.conversation_id,
  sender_id = EXCLUDED.sender_id,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  created_at = EXCLUDED.created_at;

INSERT INTO public.iris_chat_messages (id, user_id, role, content, metadata, created_at)
VALUES
  ('ac3d0000-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333336','assistant','Reminder sent. You can tap Pay Now to open checkout immediately.','{"topic":"payments","paymentId":"d3d30000-0000-0000-0000-000000000002","workflowStatus":"reminder_sent"}'::jsonb,now()-INTERVAL '4 hours'),
  ('ac3d0000-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333341','assistant','Your GCash proof is now under review by the landlord.','{"topic":"payments","paymentId":"d3d30000-0000-0000-0000-000000000004","workflowStatus":"under_review"}'::jsonb,now()-INTERVAL '6 hours'),
  ('ac3d0000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333342','assistant','Your previous submission was rejected with a reason. You can resubmit corrected proof on the same invoice.','{"topic":"payments","paymentId":"d3d30000-0000-0000-0000-000000000006","workflowStatus":"rejected"}'::jsonb,now()-INTERVAL '15 hours'),
  ('ac3d0000-0000-0000-0000-000000000004','33333333-3333-3333-3333-333333333343','assistant','In-person intent is active for this invoice. Landlord can confirm directly from the transaction screen.','{"topic":"payments","paymentId":"d3d30000-0000-0000-0000-000000000008","workflowStatus":"awaiting_in_person"}'::jsonb,now()-INTERVAL '2 hours'),
  ('ac3d0000-0000-0000-0000-000000000005','33333333-3333-3333-3333-333333333344','assistant','Partial payment was accepted and your remaining balance is still tracked on the ledger.','{"topic":"payments","paymentId":"d3d30000-0000-0000-0000-00000000000a","workflowStatus":"confirmed","amountTag":"partial"}'::jsonb,now()-INTERVAL '22 hours')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  created_at = EXCLUDED.created_at;

COMMIT;
