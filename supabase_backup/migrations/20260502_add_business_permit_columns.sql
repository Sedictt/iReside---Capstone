-- Add business permit columns to landlord_applications
ALTER TABLE public.landlord_applications
ADD COLUMN IF NOT EXISTS business_permit_url TEXT,
ADD COLUMN IF NOT EXISTS business_permit_card_url TEXT;

COMMENT ON COLUMN public.landlord_applications.business_permit_url IS 'URL to the uploaded paper business permit';
COMMENT ON COLUMN public.landlord_applications.business_permit_card_url IS 'URL to the uploaded business permit card';
