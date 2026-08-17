-- Add normalized profile/security tables as the first additive step toward
-- removing sensitive and mixed-domain columns from public.profiles.
--
-- This migration intentionally does not drop columns from profiles yet. Current
-- application code still reads and writes legacy columns, so these tables are a
-- backfilled target for staged API migration and later cleanup.

CREATE TABLE IF NOT EXISTS public.profile_private (
    profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    phone text,
    address text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_security_settings (
    profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    two_factor_enabled boolean DEFAULT false NOT NULL,
    two_factor_email text,
    otp_code text,
    otp_expiry timestamptz,
    has_changed_password boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.external_account_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider text NOT NULL,
    access_token text,
    refresh_token text,
    token_expiry timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT external_account_tokens_provider_check CHECK (provider IN ('gmail')),
    CONSTRAINT external_account_tokens_profile_provider_key UNIQUE (profile_id, provider)
);

CREATE TABLE IF NOT EXISTS public.landlord_business_profiles (
    profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name text,
    business_permit_url text,
    business_permit_number text,
    business_permits text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.profile_private IS 'Private user contact fields split from public profiles.';
COMMENT ON TABLE public.user_security_settings IS 'Security and account-claim state split from public profiles. Service-role only until legacy profile reads are migrated.';
COMMENT ON TABLE public.external_account_tokens IS 'External provider tokens split from public profiles. Service-role only.';
COMMENT ON TABLE public.landlord_business_profiles IS 'Landlord business identity and permit metadata split from public profiles.';

INSERT INTO public.profile_private (profile_id, phone, address, created_at, updated_at)
SELECT id, phone, address, now(), now()
FROM public.profiles
WHERE phone IS NOT NULL OR address IS NOT NULL
ON CONFLICT (profile_id) DO UPDATE
SET phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    updated_at = now();

INSERT INTO public.user_security_settings (
    profile_id,
    two_factor_enabled,
    two_factor_email,
    otp_code,
    otp_expiry,
    has_changed_password,
    created_at,
    updated_at
)
SELECT
    id,
    COALESCE(two_factor_enabled, false),
    two_factor_email,
    otp_code,
    otp_expiry,
    COALESCE(has_changed_password, false),
    now(),
    now()
FROM public.profiles
WHERE two_factor_enabled IS NOT NULL
   OR two_factor_email IS NOT NULL
   OR otp_code IS NOT NULL
   OR otp_expiry IS NOT NULL
   OR has_changed_password IS NOT NULL
ON CONFLICT (profile_id) DO UPDATE
SET two_factor_enabled = EXCLUDED.two_factor_enabled,
    two_factor_email = EXCLUDED.two_factor_email,
    otp_code = EXCLUDED.otp_code,
    otp_expiry = EXCLUDED.otp_expiry,
    has_changed_password = EXCLUDED.has_changed_password,
    updated_at = now();

INSERT INTO public.external_account_tokens (
    profile_id,
    provider,
    access_token,
    refresh_token,
    token_expiry,
    created_at,
    updated_at
)
SELECT
    id,
    'gmail',
    gmail_access_token,
    gmail_refresh_token,
    gmail_token_expiry,
    now(),
    now()
FROM public.profiles
WHERE gmail_access_token IS NOT NULL
   OR gmail_refresh_token IS NOT NULL
   OR gmail_token_expiry IS NOT NULL
ON CONFLICT (profile_id, provider) DO UPDATE
SET access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    token_expiry = EXCLUDED.token_expiry,
    updated_at = now();

INSERT INTO public.landlord_business_profiles (
    profile_id,
    business_name,
    business_permit_url,
    business_permit_number,
    business_permits,
    created_at,
    updated_at
)
SELECT
    id,
    business_name,
    business_permit_url,
    business_permit_number,
    COALESCE(business_permits, '{}'::text[]),
    now(),
    now()
FROM public.profiles
WHERE business_name IS NOT NULL
   OR business_permit_url IS NOT NULL
   OR business_permit_number IS NOT NULL
   OR COALESCE(array_length(business_permits, 1), 0) > 0
ON CONFLICT (profile_id) DO UPDATE
SET business_name = EXCLUDED.business_name,
    business_permit_url = EXCLUDED.business_permit_url,
    business_permit_number = EXCLUDED.business_permit_number,
    business_permits = EXCLUDED.business_permits,
    updated_at = now();

CREATE INDEX IF NOT EXISTS idx_profile_private_phone
    ON public.profile_private(phone)
    WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_security_settings_2fa_enabled
    ON public.user_security_settings(profile_id)
    WHERE two_factor_enabled = true;

CREATE INDEX IF NOT EXISTS idx_user_security_settings_unclaimed
    ON public.user_security_settings(profile_id)
    WHERE has_changed_password = false;

CREATE INDEX IF NOT EXISTS idx_external_account_tokens_provider
    ON public.external_account_tokens(provider, profile_id);

CREATE INDEX IF NOT EXISTS idx_landlord_business_profiles_business_name
    ON public.landlord_business_profiles(business_name)
    WHERE business_name IS NOT NULL;

ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_account_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own private profile" ON public.profile_private;
CREATE POLICY "Users can view own private profile"
ON public.profile_private
FOR SELECT
TO authenticated
USING (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own private profile" ON public.profile_private;
CREATE POLICY "Users can update own private profile"
ON public.profile_private
FOR UPDATE
TO authenticated
USING (profile_id = (select auth.uid()))
WITH CHECK (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own private profile" ON public.profile_private;
CREATE POLICY "Users can insert own private profile"
ON public.profile_private
FOR INSERT
TO authenticated
WITH CHECK (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view private profiles" ON public.profile_private;
CREATE POLICY "Admins can view private profiles"
ON public.profile_private
FOR SELECT
TO authenticated
USING ((((select auth.jwt()) -> 'user_metadata'::text) ->> 'role'::text) = 'admin');

DROP POLICY IF EXISTS "Users can view own landlord business profile" ON public.landlord_business_profiles;
CREATE POLICY "Users can view own landlord business profile"
ON public.landlord_business_profiles
FOR SELECT
TO authenticated
USING (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own landlord business profile" ON public.landlord_business_profiles;
CREATE POLICY "Users can update own landlord business profile"
ON public.landlord_business_profiles
FOR UPDATE
TO authenticated
USING (profile_id = (select auth.uid()))
WITH CHECK (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own landlord business profile" ON public.landlord_business_profiles;
CREATE POLICY "Users can insert own landlord business profile"
ON public.landlord_business_profiles
FOR INSERT
TO authenticated
WITH CHECK (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view landlord business profiles" ON public.landlord_business_profiles;
CREATE POLICY "Admins can view landlord business profiles"
ON public.landlord_business_profiles
FOR SELECT
TO authenticated
USING ((((select auth.jwt()) -> 'user_metadata'::text) ->> 'role'::text) = 'admin');

-- user_security_settings and external_account_tokens intentionally have RLS
-- enabled without client policies. Server routes should access them with the
-- service role after legacy profile reads are migrated.

DROP TRIGGER IF EXISTS trg_profile_private_updated_at ON public.profile_private;
CREATE TRIGGER trg_profile_private_updated_at
BEFORE UPDATE ON public.profile_private
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_user_security_settings_updated_at ON public.user_security_settings;
CREATE TRIGGER trg_user_security_settings_updated_at
BEFORE UPDATE ON public.user_security_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_external_account_tokens_updated_at ON public.external_account_tokens;
CREATE TRIGGER trg_external_account_tokens_updated_at
BEFORE UPDATE ON public.external_account_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_landlord_business_profiles_updated_at ON public.landlord_business_profiles;
CREATE TRIGGER trg_landlord_business_profiles_updated_at
BEFORE UPDATE ON public.landlord_business_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
