-- Migration: Add Security Recovery Keys to user_security_settings
-- Enables single-use AES-256 encrypted security keys for landlord and tenant account recovery.

ALTER TABLE public.user_security_settings
    ADD COLUMN IF NOT EXISTS security_key_encrypted text,
    ADD COLUMN IF NOT EXISTS security_key_iv text,
    ADD COLUMN IF NOT EXISTS security_key_auth_tag text,
    ADD COLUMN IF NOT EXISTS security_key_updated_at timestamptz,
    ADD COLUMN IF NOT EXISTS security_key_failed_attempts integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS security_key_locked_until timestamptz;

COMMENT ON COLUMN public.user_security_settings.security_key_encrypted IS 'AES-256-GCM encrypted single-use security recovery key';
COMMENT ON COLUMN public.user_security_settings.security_key_iv IS 'Initialization vector for AES-256-GCM encryption';
COMMENT ON COLUMN public.user_security_settings.security_key_auth_tag IS 'Authentication tag for AES-256-GCM encryption';
COMMENT ON COLUMN public.user_security_settings.security_key_updated_at IS 'Timestamp when the security key was generated or rotated';
COMMENT ON COLUMN public.user_security_settings.security_key_failed_attempts IS 'Failed recovery attempts counter for progressive lockout';
COMMENT ON COLUMN public.user_security_settings.security_key_locked_until IS 'Lockout expiration timestamp if rate limit exceeded';
