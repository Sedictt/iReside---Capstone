-- Add Two-Factor Authentication columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_email text,
ADD COLUMN IF NOT EXISTS gmail_access_token text,
ADD COLUMN IF NOT EXISTS gmail_refresh_token text,
ADD COLUMN IF NOT EXISTS gmail_token_expiry timestamptz,
ADD COLUMN IF NOT EXISTS otp_code text,
ADD COLUMN IF NOT EXISTS otp_expiry timestamptz;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_two_factor_enabled ON public.profiles(two_factor_enabled) WHERE two_factor_enabled = true;