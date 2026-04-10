-- Add business verification fields to landlord_applications table
ALTER TABLE public.landlord_applications
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_verified' CHECK (verification_status IN ('not_verified', 'verified', 'not_found', 'error')),
ADD COLUMN IF NOT EXISTS verification_data JSONB,
ADD COLUMN IF NOT EXISTS verification_checked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Create index on verification_status for faster queries
CREATE INDEX IF NOT EXISTS idx_landlord_applications_verification_status 
ON public.landlord_applications(verification_status);

-- Add comment to explain the new fields
COMMENT ON COLUMN public.landlord_applications.business_name IS 'Business name to verify against Valenzuela City Business Directory';
COMMENT ON COLUMN public.landlord_applications.business_address IS 'Business address for verification purposes';
COMMENT ON COLUMN public.landlord_applications.verification_status IS 'Status of business verification: not_verified, verified, not_found, or error';
COMMENT ON COLUMN public.landlord_applications.verification_data IS 'JSON data from verification source (e.g., Valenzuela business databank)';
COMMENT ON COLUMN public.landlord_applications.verification_checked_at IS 'Timestamp when verification was last performed';
COMMENT ON COLUMN public.landlord_applications.verification_notes IS 'Admin notes about verification results';
