-- Add fields for public profile
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS socials JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS business_permit_url TEXT,
ADD COLUMN IF NOT EXISTS business_permit_number TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.cover_url IS 'URL for the profile cover photo';
COMMENT ON COLUMN public.profiles.socials IS 'Social media links (e.g., facebook, twitter, linkedin)';
COMMENT ON COLUMN public.profiles.business_permit_url IS 'URL for the business permit image';
COMMENT ON COLUMN public.profiles.business_permit_number IS 'Official business permit number';
COMMENT ON COLUMN public.profiles.business_name IS 'Official business name for the landlord';
