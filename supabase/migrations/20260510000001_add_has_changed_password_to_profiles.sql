-- Migration: Add has_changed_password to profiles table
-- Purpose: Track if tenant has claimed their account by changing their initial password
-- A claimed account (has_changed_password = true) should not allow landlords to resend credentials

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_changed_password boolean DEFAULT false NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.has_changed_password IS 'True once tenant changes their initial password. When true, landlord cannot resend credentials.';

-- Create index for faster lookups on unclaimed accounts
CREATE INDEX IF NOT EXISTS idx_profiles_has_changed_password ON profiles(has_changed_password) WHERE has_changed_password = false;