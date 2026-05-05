-- Migration: Add business permit columns, property onboarding fields, and landlord-documents bucket
-- Merged from: 20260502_add_business_permit_columns.sql,
--             20260502_add_property_onboarding_fields.sql,
--             20260502_create_landlord_documents_bucket.sql

BEGIN;

-- 1. Add business permit columns to landlord_applications
ALTER TABLE public.landlord_applications
ADD COLUMN IF NOT EXISTS business_permit_url TEXT,
ADD COLUMN IF NOT EXISTS business_permit_card_url TEXT;

COMMENT ON COLUMN public.landlord_applications.business_permit_url IS 'URL to the uploaded paper business permit';
COMMENT ON COLUMN public.landlord_applications.business_permit_card_url IS 'URL to the uploaded business permit card';

-- 2. Add missing columns for property onboarding
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS total_units INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_floors INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS base_rent_amount NUMERIC(10, 2) DEFAULT 0;

-- 3. Create landlord-documents Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('landlord-documents', 'landlord-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'landlord-documents'
-- Allow public access to view documents
DROP POLICY IF EXISTS "Public Access on landlord-documents" ON storage.objects;
CREATE POLICY "Public Access on landlord-documents"
ON storage.objects FOR SELECT
USING ( bucket_id = 'landlord-documents' );

-- Allow uploading documents
DROP POLICY IF EXISTS "Public Upload on landlord-documents" ON storage.objects;
CREATE POLICY "Public Upload on landlord-documents"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'landlord-documents' );

-- Allow admin to manage all files
DROP POLICY IF EXISTS "Admin Management on landlord-documents" ON storage.objects;
CREATE POLICY "Admin Management on landlord-documents"
ON storage.objects FOR ALL
USING ( bucket_id = 'landlord-documents' AND (auth.jwt() ->> 'email' IN (SELECT email FROM profiles WHERE role = 'admin')) );

COMMIT;
