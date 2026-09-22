-- Migration: Add is_account_claimed to profiles table
-- Purpose: Track if landlord/admin has claimed their sovereign workspace by updating from default setup credentials to their permanent email & password

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_account_claimed boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN public.profiles.is_account_claimed IS 'True once landlord/admin has claimed their account with permanent verified email and password.';

-- Backfill: Any existing non-turnkey landlords with verified non-placeholder emails are marked as claimed
UPDATE public.profiles
SET is_account_claimed = true
WHERE role IN ('landlord', 'admin')
  AND email IS NOT NULL
  AND email NOT LIKE '%@turnkey.local'
  AND email NOT IN (
    'landlord@reyesresidences.com',
    'admin@reyesresidences.com',
    'admin@property.com',
    'landlord@property.com',
    'landlord@example.com',
    'landlord@turnkey.local',
    'admin@turnkey.local'
  );

-- Tenants who have changed their password or completed onboarding are also marked as claimed
UPDATE public.profiles
SET is_account_claimed = true
WHERE role = 'tenant' AND (has_changed_password = true OR onboarding_completed = true);

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_profiles_is_account_claimed ON public.profiles(is_account_claimed) WHERE is_account_claimed = false;
