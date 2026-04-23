-- NINA LUCIA APARTMENT RENTAL - Seed Patch
-- Paste this directly into Supabase SQL Editor

BEGIN;

-- 0) Ensure business verification columns exist (run first)
ALTER TABLE public.landlord_applications
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_verified' CHECK (verification_status IN ('not_verified', 'verified', 'not_found', 'error')),
ADD COLUMN IF NOT EXISTS verification_data JSONB,
ADD COLUMN IF NOT EXISTS verification_checked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- 1) Auth user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555',
   'authenticated','authenticated','nina.lucia@ireside.local',
   crypt('Passw0rd!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Nina Lucia","role":"landlord","phone":"+639171110009","business_name":"NINA LUCIA APARTMENT RENTAL","business_permits":["permit-005.pdf"]}'::jsonb,
   now(), now())
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email, 
  raw_user_meta_data = EXCLUDED.raw_user_meta_data, 
  encrypted_password = EXCLUDED.encrypted_password,
  updated_at = now();

-- 2) Profile
INSERT INTO public.profiles (id, email, full_name, role, phone, business_name, business_permits) 
VALUES
  ('55555555-5555-5555-5555-555555555555','nina.lucia@ireside.local','Nina Lucia','landlord','+639171110009','NINA LUCIA APARTMENT RENTAL',ARRAY['permit-005.pdf'])
ON CONFLICT (id) DO UPDATE SET
  email=EXCLUDED.email, 
  full_name=EXCLUDED.full_name, 
  role=EXCLUDED.role,
  phone=EXCLUDED.phone, 
  business_name=EXCLUDED.business_name, 
  business_permits=EXCLUDED.business_permits, 
  updated_at=now();

-- 3) Landlord application (pending registration for admin review)
INSERT INTO public.landlord_applications (
  id, profile_id, phone, 
  identity_document_url, ownership_document_url, liveness_document_url, 
  status, admin_notes, business_name, business_address
) VALUES
  ('f9f9f9f9-f9f9-f9f9-f9f9-f9f9f9f9f9f2','55555555-5555-5555-5555-555555555555','+639171110009',
   '/docs/id-nina-lucia.pdf','/docs/title-nina-lucia.pdf','/docs/liveness-nina-lucia.mp4',
   'pending','New registration from Valenzuela.','NINA LUCIA APARTMENT RENTAL','123 McArthur Highway, Valenzuela City')
ON CONFLICT (id) DO UPDATE SET
  profile_id=EXCLUDED.profile_id, 
  phone=EXCLUDED.phone, 
  identity_document_url=EXCLUDED.identity_document_url,
  ownership_document_url=EXCLUDED.ownership_document_url, 
  liveness_document_url=EXCLUDED.liveness_document_url,
  status=EXCLUDED.status, 
  admin_notes=EXCLUDED.admin_notes,
  business_name=EXCLUDED.business_name,
  business_address=EXCLUDED.business_address,
  updated_at=now();

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
