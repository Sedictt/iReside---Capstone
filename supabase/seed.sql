-- iReside local seed data
-- This file is designed for Supabase CLI local development via `supabase db reset`.
-- It uses deterministic UUIDs and ON CONFLICT upserts for idempotency.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Seed auth users (best effort)
-- ---------------------------------------------------------------------------
-- `profiles.id` references `auth.users(id)`. Supabase auth schema can vary by version,
-- so this block first tries a modern column set, then a minimal fallback.
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
    )
    VALUES
      (
        '00000000-0000-0000-0000-000000000000',
        '11111111-1111-1111-1111-111111111111',
        'authenticated',
        'authenticated',
        'landlord.one@ireside.local',
        crypt('Passw0rd!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Marina Reyes","role":"landlord","phone":"+639171110001","business_name":"Reyes Property Group","business_permits":["permit-001.pdf"]}'::jsonb,
        now(),
        now()
      ),
      (
        '00000000-0000-0000-0000-000000000000',
        '22222222-2222-2222-2222-222222222222',
        'authenticated',
        'authenticated',
        'landlord.two@ireside.local',
        crypt('Passw0rd!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Gabriel Santos","role":"landlord","phone":"+639171110002","business_name":"Santos Homes","business_permits":["permit-002.pdf"]}'::jsonb,
        now(),
        now()
      ),
      (
        '00000000-0000-0000-0000-000000000000',
        '33333333-3333-3333-3333-333333333333',
        'authenticated',
        'authenticated',
        'tenant.one@ireside.local',
        crypt('Passw0rd!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Ariana Cruz","role":"tenant","phone":"+639171110003"}'::jsonb,
        now(),
        now()
      ),
      (
        '00000000-0000-0000-0000-000000000000',
        '44444444-4444-4444-4444-444444444444',
        'authenticated',
        'authenticated',
        'tenant.two@ireside.local',
        crypt('Passw0rd!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Noah Villanueva","role":"tenant","phone":"+639171110004"}'::jsonb,
        now(),
        now()
      )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = now();
  EXCEPTION
    WHEN undefined_column THEN
      BEGIN
        INSERT INTO auth.users (
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
        )
        VALUES
          (
            '11111111-1111-1111-1111-111111111111',
            'authenticated',
            'authenticated',
            'landlord.one@ireside.local',
            crypt('Passw0rd!', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Marina Reyes","role":"landlord","phone":"+639171110001","business_name":"Reyes Property Group","business_permits":["permit-001.pdf"]}'::jsonb,
            now(),
            now()
          ),
          (
            '22222222-2222-2222-2222-222222222222',
            'authenticated',
            'authenticated',
            'landlord.two@ireside.local',
            crypt('Passw0rd!', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Gabriel Santos","role":"landlord","phone":"+639171110002","business_name":"Santos Homes","business_permits":["permit-002.pdf"]}'::jsonb,
            now(),
            now()
          ),
          (
            '33333333-3333-3333-3333-333333333333',
            'authenticated',
            'authenticated',
            'tenant.one@ireside.local',
            crypt('Passw0rd!', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Ariana Cruz","role":"tenant","phone":"+639171110003"}'::jsonb,
            now(),
            now()
          ),
          (
            '44444444-4444-4444-4444-444444444444',
            'authenticated',
            'authenticated',
            'tenant.two@ireside.local',
            crypt('Passw0rd!', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Noah Villanueva","role":"tenant","phone":"+639171110004"}'::jsonb,
            now(),
            now()
          )
        ON CONFLICT (id) DO UPDATE
        SET
          email = EXCLUDED.email,
          raw_user_meta_data = EXCLUDED.raw_user_meta_data,
          updated_at = now();
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Skipping auth.users seed: %', SQLERRM;
      END;
    WHEN OTHERS THEN
      RAISE NOTICE 'Skipping auth.users seed: %', SQLERRM;
  END;
END
$$;

-- ---------------------------------------------------------------------------
-- 2) Profiles
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  phone,
  business_name,
  business_permits
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'landlord.one@ireside.local',
    'Marina Reyes',
    'landlord',
    '+639171110001',
    'Reyes Property Group',
    ARRAY['permit-001.pdf']
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'landlord.two@ireside.local',
    'Gabriel Santos',
    'landlord',
    '+639171110002',
    'Santos Homes',
    ARRAY['permit-002.pdf']
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'tenant.one@ireside.local',
    'Ariana Cruz',
    'tenant',
    '+639171110003',
    NULL,
    ARRAY[]::text[]
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'tenant.two@ireside.local',
    'Noah Villanueva',
    'tenant',
    '+639171110004',
    NULL,
    ARRAY[]::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  business_name = EXCLUDED.business_name,
  business_permits = EXCLUDED.business_permits,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 3) Properties and units
-- ---------------------------------------------------------------------------
INSERT INTO public.properties (
  id,
  landlord_id,
  name,
  address,
  city,
  description,
  type,
  lat,
  lng,
  amenities,
  house_rules,
  images,
  is_featured
)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '11111111-1111-1111-1111-111111111111',
    'Maple Grove Residences',
    '123 McArthur Highway, Karuhatan',
    'Valenzuela',
    'Transit-friendly apartment complex near market and schools.',
    'apartment',
    14.7008,
    120.9835,
    ARRAY['wifi', 'cctv', 'laundry area', 'roof deck'],
    ARRAY['No smoking in common areas', 'Quiet hours after 10 PM'],
    ARRAY['/hero-images/1.jpg'],
    true
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '22222222-2222-2222-2222-222222222222',
    'Sunrise Townhomes',
    '45 Maysan Road, Maysan',
    'Valenzuela',
    'Family-friendly townhouse units with parking.',
    'townhouse',
    14.7184,
    120.9657,
    ARRAY['parking', 'pet-friendly'],
    ARRAY['No loud parties', 'Observe waste segregation'],
    ARRAY['/hero-images/2.jpg'],
    false
  )
ON CONFLICT (id) DO UPDATE
SET
  landlord_id = EXCLUDED.landlord_id,
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  amenities = EXCLUDED.amenities,
  house_rules = EXCLUDED.house_rules,
  images = EXCLUDED.images,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO public.units (
  id,
  property_id,
  name,
  floor,
  status,
  rent_amount,
  sqft,
  beds,
  baths
)
VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Unit 2A',
    2,
    'occupied',
    12000.00,
    380,
    1,
    1
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Unit 3B',
    3,
    'vacant',
    14500.00,
    460,
    2,
    1
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'Townhome 1',
    1,
    'vacant',
    18000.00,
    720,
    2,
    2
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

-- ---------------------------------------------------------------------------
-- 4) Lease and billing
-- ---------------------------------------------------------------------------
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
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'active',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '335 days',
    12000.00,
    12000.00,
    '{"due_day":5,"allow_partial":false,"late_fee":500}'::jsonb,
    'tenant-signature-seed',
    'landlord-signature-seed',
    now() - INTERVAL '31 days'
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
  tenant_signature = EXCLUDED.tenant_signature,
  landlord_signature = EXCLUDED.landlord_signature,
  signed_at = EXCLUDED.signed_at,
  updated_at = now();

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
  landlord_confirmed
)
VALUES
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    12000.00,
    'completed',
    'gcash',
    'March 2026 rental payment',
    date_trunc('month', CURRENT_DATE)::date + INTERVAL '4 days',
    now() - INTERVAL '8 days',
    'GCASH-SEED-0001',
    true
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    12000.00,
    'pending',
    NULL,
    'April 2026 rental payment',
    date_trunc('month', CURRENT_DATE)::date + INTERVAL '35 days',
    NULL,
    NULL,
    false
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
  updated_at = now();

INSERT INTO public.payment_items (
  id,
  payment_id,
  label,
  amount,
  category
)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'Monthly Rent',
    11500.00,
    'rent'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'Water Bill',
    500.00,
    'utility'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'Monthly Rent',
    12000.00,
    'rent'
  )
ON CONFLICT (id) DO UPDATE
SET
  payment_id = EXCLUDED.payment_id,
  label = EXCLUDED.label,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category;

-- ---------------------------------------------------------------------------
-- 5) Applications, maintenance, move-out
-- ---------------------------------------------------------------------------
INSERT INTO public.applications (
  id,
  unit_id,
  applicant_id,
  landlord_id,
  status,
  message,
  monthly_income,
  employment_status,
  move_in_date,
  documents,
  reviewed_at
)
VALUES
  (
    'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'pending',
    'Interested in Unit 3B. I work nearby and can move in soon.',
    42000.00,
    'Full-time employee',
    CURRENT_DATE + INTERVAL '10 days',
    ARRAY['proof-of-income.pdf', 'government-id.pdf'],
    NULL
  )
ON CONFLICT (id) DO UPDATE
SET
  unit_id = EXCLUDED.unit_id,
  applicant_id = EXCLUDED.applicant_id,
  landlord_id = EXCLUDED.landlord_id,
  status = EXCLUDED.status,
  message = EXCLUDED.message,
  monthly_income = EXCLUDED.monthly_income,
  employment_status = EXCLUDED.employment_status,
  move_in_date = EXCLUDED.move_in_date,
  documents = EXCLUDED.documents,
  reviewed_at = EXCLUDED.reviewed_at,
  updated_at = now();

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
  images,
  resolved_at
)
VALUES
  (
    'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Kitchen faucet leak',
    'Slow but continuous leak under the sink. Needs seal replacement.',
    'in_progress',
    'medium',
    'plumbing',
    ARRAY['/unit-seeds/sample-unit-01/kitchen-leak.jpg'],
    NULL
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
  images = EXCLUDED.images,
  resolved_at = EXCLUDED.resolved_at,
  updated_at = now();

INSERT INTO public.move_out_requests (
  id,
  lease_id,
  tenant_id,
  landlord_id,
  reason,
  requested_date,
  status,
  notes
)
VALUES
  (
    'f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3',
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Relocating for work assignment.',
    CURRENT_DATE + INTERVAL '60 days',
    'pending',
    'Can coordinate unit inspection on weekends.'
  )
ON CONFLICT (id) DO UPDATE
SET
  lease_id = EXCLUDED.lease_id,
  tenant_id = EXCLUDED.tenant_id,
  landlord_id = EXCLUDED.landlord_id,
  reason = EXCLUDED.reason,
  requested_date = EXCLUDED.requested_date,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 6) Messaging and notifications
-- ---------------------------------------------------------------------------
INSERT INTO public.conversations (id)
VALUES ('f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4')
ON CONFLICT (id) DO UPDATE
SET updated_at = now();

INSERT INTO public.conversation_participants (
  id,
  conversation_id,
  user_id
)
VALUES
  (
    'f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f1',
    'f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f2',
    'f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4',
    '33333333-3333-3333-3333-333333333333'
  )
ON CONFLICT (id) DO UPDATE
SET
  conversation_id = EXCLUDED.conversation_id,
  user_id = EXCLUDED.user_id;

INSERT INTO public.messages (
  id,
  conversation_id,
  sender_id,
  type,
  content,
  metadata,
  read_at,
  created_at
)
VALUES
  (
    'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f1',
    'f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4',
    '33333333-3333-3333-3333-333333333333',
    'text',
    'Hi, just confirming if maintenance can come tomorrow morning.',
    '{"channel":"in_app"}'::jsonb,
    now() - INTERVAL '1 day',
    now() - INTERVAL '2 days'
  ),
  (
    'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f2',
    'f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4',
    '11111111-1111-1111-1111-111111111111',
    'text',
    'Yes, maintenance team is scheduled at 9 AM.',
    '{"channel":"in_app"}'::jsonb,
    NULL,
    now() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO UPDATE
SET
  conversation_id = EXCLUDED.conversation_id,
  sender_id = EXCLUDED.sender_id,
  type = EXCLUDED.type,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  read_at = EXCLUDED.read_at,
  created_at = EXCLUDED.created_at;

INSERT INTO public.notifications (
  id,
  user_id,
  type,
  title,
  message,
  data,
  read,
  created_at
)
VALUES
  (
    'f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f1',
    '33333333-3333-3333-3333-333333333333',
    'maintenance',
    'Maintenance Scheduled',
    'Your maintenance request has been scheduled for tomorrow at 9:00 AM.',
    '{"request_id":"f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2"}'::jsonb,
    false,
    now() - INTERVAL '12 hours'
  ),
  (
    'f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f2',
    '11111111-1111-1111-1111-111111111111',
    'application',
    'New Rental Application',
    'A new application was submitted for Unit 3B.',
    '{"application_id":"f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1"}'::jsonb,
    false,
    now() - INTERVAL '8 hours'
  )
ON CONFLICT (id) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  type = EXCLUDED.type,
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  data = EXCLUDED.data,
  read = EXCLUDED.read,
  created_at = EXCLUDED.created_at;

INSERT INTO public.saved_properties (
  id,
  user_id,
  property_id
)
VALUES
  (
    'f8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f1',
    '44444444-4444-4444-4444-444444444444',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
  )
ON CONFLICT (id) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  property_id = EXCLUDED.property_id;

-- ---------------------------------------------------------------------------
-- 7) Newer feature tables (2026-03 updates)
-- ---------------------------------------------------------------------------
INSERT INTO public.landlord_applications (
  id,
  profile_id,
  phone,
  identity_document_url,
  ownership_document_url,
  liveness_document_url,
  status,
  admin_notes
)
VALUES
  (
    'f9f9f9f9-f9f9-f9f9-f9f9-f9f9f9f9f9f1',
    '44444444-4444-4444-4444-444444444444',
    '+639171110004',
    '/docs/id-tenant-two.pdf',
    '/docs/title-tenant-two.pdf',
    '/docs/liveness-tenant-two.mp4',
    'reviewing',
    'Documents look complete. Awaiting final verification.'
  )
ON CONFLICT (id) DO UPDATE
SET
  profile_id = EXCLUDED.profile_id,
  phone = EXCLUDED.phone,
  identity_document_url = EXCLUDED.identity_document_url,
  ownership_document_url = EXCLUDED.ownership_document_url,
  liveness_document_url = EXCLUDED.liveness_document_url,
  status = EXCLUDED.status,
  admin_notes = EXCLUDED.admin_notes,
  updated_at = now();

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
)
VALUES
  (
    'abababab-abab-abab-abab-ababababab01',
    '11111111-1111-1111-1111-111111111111',
    'csv',
    'Last 30 days',
    'Detailed',
    true,
    18,
    '{"gross_revenue":24000,"occupancy_rate":0.66}'::jsonb,
    now() - INTERVAL '2 days'
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

INSERT INTO public.iris_chat_messages (
  id,
  user_id,
  role,
  content,
  metadata,
  created_at
)
VALUES
  (
    'acacacac-acac-acac-acac-acacacacac01',
    '33333333-3333-3333-3333-333333333333',
    'user',
    'Can I pay my rent via GCash this month?',
    '{"topic":"payments"}'::jsonb,
    now() - INTERVAL '3 hours'
  ),
  (
    'acacacac-acac-acac-acac-acacacacac02',
    '33333333-3333-3333-3333-333333333333',
    'assistant',
    'Yes. GCash is enabled for your active lease. You can pay from the Payments page.',
    '{"topic":"payments","confidence":"high"}'::jsonb,
    now() - INTERVAL '3 hours' + INTERVAL '8 seconds'
  )
ON CONFLICT (id) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  created_at = EXCLUDED.created_at;

INSERT INTO public.landlord_inquiry_actions (
  id,
  inquiry_id,
  landlord_id,
  is_read,
  is_archived,
  deleted_at
)
VALUES
  (
    'adadadad-adad-adad-adad-adadadadad01',
    'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
    '11111111-1111-1111-1111-111111111111',
    true,
    false,
    NULL
  )
ON CONFLICT (id) DO UPDATE
SET
  inquiry_id = EXCLUDED.inquiry_id,
  landlord_id = EXCLUDED.landlord_id,
  is_read = EXCLUDED.is_read,
  is_archived = EXCLUDED.is_archived,
  deleted_at = EXCLUDED.deleted_at,
  updated_at = now();

INSERT INTO public.landlord_reviews (
  id,
  lease_id,
  landlord_id,
  tenant_id,
  rating,
  comment,
  created_at
)
VALUES
  (
    'aeaeaeae-aeae-aeae-aeae-aeaeaeaeae01',
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    5,
    'Responsive and professional landlord. Repairs are handled quickly.',
    now() - INTERVAL '5 days'
  )
ON CONFLICT (id) DO UPDATE
SET
  lease_id = EXCLUDED.lease_id,
  landlord_id = EXCLUDED.landlord_id,
  tenant_id = EXCLUDED.tenant_id,
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment,
  updated_at = now();

INSERT INTO public.message_user_actions (
  id,
  actor_user_id,
  target_user_id,
  archived,
  blocked
)
VALUES
  (
    'afafafaf-afaf-afaf-afaf-afafafafaf01',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    false,
    false
  )
ON CONFLICT (id) DO UPDATE
SET
  actor_user_id = EXCLUDED.actor_user_id,
  target_user_id = EXCLUDED.target_user_id,
  archived = EXCLUDED.archived,
  blocked = EXCLUDED.blocked,
  updated_at = now();

INSERT INTO public.message_user_reports (
  id,
  reporter_user_id,
  target_user_id,
  conversation_id,
  category,
  details,
  status,
  metadata
)
VALUES
  (
    'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b001',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    NULL,
    'spam',
    'Repeated unsolicited messages about unrelated listings.',
    'open',
    '{"source":"seed"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  reporter_user_id = EXCLUDED.reporter_user_id,
  target_user_id = EXCLUDED.target_user_id,
  conversation_id = EXCLUDED.conversation_id,
  category = EXCLUDED.category,
  details = EXCLUDED.details,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = now();

COMMIT;
