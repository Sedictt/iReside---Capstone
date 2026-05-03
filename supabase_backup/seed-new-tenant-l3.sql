-- New Seed Tenant for Landlord 11111111-1111-1111-1111-111111111113
-- Scenario: Successful transaction with receipt sent in chat

BEGIN;

-- 1) Create Auth User
DO $$
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
    email_change, reauthentication_token, phone_change, phone_change_token,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333350',
    'authenticated',
    'authenticated',
    'tenant.new.l3@ireside.local',
    crypt('Passw0rd!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Elena Gilbert","role":"tenant","phone":"+639171110350"}'::jsonb,
    '', '', '', '', '', '', '', '',
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;
END $$;

-- 2) Create Profile
INSERT INTO public.profiles (id, email, full_name, role, phone)
VALUES ('33333333-3333-3333-3333-333333333350', 'tenant.new.l3@ireside.local', 'Elena Gilbert', 'tenant', '+639171110350')
ON CONFLICT (id) DO NOTHING;

-- 3) Ensure Unit status is occupied
UPDATE public.units
SET status = 'occupied'
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16';

-- 4) Create Lease
INSERT INTO public.leases (
  id, unit_id, tenant_id, landlord_id, status, start_date, end_date, monthly_rent, security_deposit, terms, tenant_signature, landlord_signature, signed_at
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccd50',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16',
  '33333333-3333-3333-3333-333333333350',
  '11111111-1111-1111-1111-111111111113',
  'active',
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '335 days',
  9000.00,
  9000.00,
  '{"due_day":10,"allow_partial":false,"late_fee":350}'::jsonb,
  'tenant-sig-elena',
  'landlord-sig-l3',
  now() - INTERVAL '30 days'
) ON CONFLICT (id) DO NOTHING;

-- 5) Create Payment (Completed)
INSERT INTO public.payments (
  id, lease_id, tenant_id, landlord_id, amount, subtotal, status, workflow_status, method, intent_method,
  description, due_date, billing_cycle, paid_amount, balance_remaining,
  receipt_number, payment_note, last_action_by, last_action_at, metadata, paid_at
) VALUES (
  'd3d30000-0000-0000-0000-000000000050',
  'cccccccc-cccc-cccc-cccc-cccccccccd50',
  '33333333-3333-3333-3333-333333333350',
  '11111111-1111-1111-1111-111111111113',
  9000, 9000, 'completed', 'receipted', 'gcash', 'gcash',
  'First month rent for Elena',
  (CURRENT_DATE - INTERVAL '5 days')::date,
  date_trunc('month', CURRENT_DATE)::date,
  9000, 0,
  'REC-L3-ELENA-001',
  'Paid via GCash.',
  '11111111-1111-1111-1111-111111111113',
  now() - INTERVAL '4 days',
  '{"scenario":"new_tenant_success"}'::jsonb,
  now() - INTERVAL '4 days'
) ON CONFLICT (id) DO NOTHING;

-- 6) Create Payment Item
INSERT INTO public.payment_items (id, payment_id, label, amount, category)
VALUES ('e3d30000-0000-0000-0000-000000000050', 'd3d30000-0000-0000-0000-000000000050', 'Monthly Rent', 9000, 'rent')
ON CONFLICT (id) DO NOTHING;

-- 7) Create Payment Receipt
INSERT INTO public.payment_receipts (
  id, payment_id, landlord_id, tenant_id, receipt_number, amount, issued_at, issued_by, notes, method, amount_breakdown, metadata
) VALUES (
  '9c9c0000-0000-0000-0000-000000000050',
  'd3d30000-0000-0000-0000-000000000050',
  '11111111-1111-1111-1111-111111111113',
  '33333333-3333-3333-3333-333333333350',
  'REC-L3-ELENA-001',
  9000,
  now() - INTERVAL '4 days',
  '11111111-1111-1111-1111-111111111113',
  'Welcome to your new home, Elena!',
  'gcash',
  '{"originalAmount":9000,"acceptedAmount":9000,"amountTag":"exact"}'::jsonb,
  '{"immutable":true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 8) Create Conversation
INSERT INTO public.conversations (id)
VALUES ('c3c30000-0000-0000-0000-000000000050')
ON CONFLICT (id) DO NOTHING;

-- 9) Add Participants
INSERT INTO public.conversation_participants (id, conversation_id, user_id)
VALUES 
  ('c3c31000-0000-0000-0000-000000000051', 'c3c30000-0000-0000-0000-000000000050', '11111111-1111-1111-1111-111111111113'),
  ('c3c31000-0000-0000-0000-000000000052', 'c3c30000-0000-0000-0000-000000000050', '33333333-3333-3333-3333-333333333350')
ON CONFLICT (id) DO NOTHING;

-- 10) Add Message with Receipt (Embedded Invoice)
INSERT INTO public.messages (
  id, conversation_id, sender_id, type, content, metadata, read_at, created_at
) VALUES (
  '6c6c0000-0000-0000-0000-000000000050',
  'c3c30000-0000-0000-0000-000000000050',
  '11111111-1111-1111-1111-111111111113',
  'system',
  'Your digital receipt for February 2026 rent has been generated.',
  '{"systemType":"invoice","invoiceId":"REC-L3-ELENA-001","tenantName":"Elena Gilbert","unitName":"Studio 101","amount":"9,000","date":"Feb 5, 2026","description":"Monthly Rent - February 2026","paymentId":"d3d30000-0000-0000-0000-000000000050","workflowStatus":"receipted"}'::jsonb,
  now() - INTERVAL '3 days',
  now() - INTERVAL '4 days'
) ON CONFLICT (id) DO NOTHING;

-- 11) Add Notification
INSERT INTO public.notifications (id, user_id, type, title, message, data, read, created_at)
VALUES (
  '7c7c0000-0000-0000-0000-000000000050',
  '33333333-3333-3333-3333-333333333350',
  'payment',
  'Payment Review Updated',
  'Invoice REC-L3-ELENA-001 is confirmed and receipted.',
  '{"paymentId":"d3d30000-0000-0000-0000-000000000050","workflowStatus":"receipted","amountTag":"exact"}'::jsonb,
  true,
  now() - INTERVAL '4 days'
) ON CONFLICT (id) DO NOTHING;

-- 12) Add Audit Event
INSERT INTO public.payment_workflow_audit_events (
  id, payment_id, actor_id, action, source, idempotency_key, before_state, after_state, metadata, created_at
) VALUES (
  '8c8c0000-0000-0000-0000-000000000050',
  'd3d30000-0000-0000-0000-000000000050',
  '11111111-1111-1111-1111-111111111113',
  'landlord_review_receipted',
  'api',
  'elena-receipt-001',
  '{"workflow_status":"under_review"}'::jsonb,
  '{"workflow_status":"receipted"}'::jsonb,
  '{"scenario":"new_tenant_success"}'::jsonb,
  now() - INTERVAL '4 days'
) ON CONFLICT (id) DO NOTHING;

COMMIT;
