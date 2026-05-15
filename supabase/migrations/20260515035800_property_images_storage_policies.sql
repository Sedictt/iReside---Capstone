
-- Add RLS policies for property-images storage bucket
-- This allows landlords to upload amenity and property images

BEGIN;

-- 1. Ensure the bucket exists (just in case, though it should already exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view property images (Select)
DROP POLICY IF EXISTS "Public Access on property-images" ON storage.objects;
CREATE POLICY "Public Access on property-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'property-images' );

-- 3. Allow authenticated users to upload property images (Insert)
-- Security: first path segment must match the authenticated user's ID.
-- This avoids depending on the profiles table (which has RLS that can block subqueries)
-- and ensures data ownership via the path structure: auth_uid/property_id/amenities/file
DROP POLICY IF EXISTS "Landlords can upload property images" ON storage.objects;
CREATE POLICY "Landlords can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'property-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow landlords to manage their own uploads
-- NOTE: We must NOT use `owner = auth.uid()` for INSERT because at insert time
-- the `owner` column is NULL (set by Supabase after RLS check passes).
-- Instead, INSERT uses the landlord role check from policy #3 above.
-- UPDATE and DELETE can safely use owner since the row exists.

-- Remove old FOR ALL policy (its owner check broke INSERT since owner is NULL at insert time)
DROP POLICY IF EXISTS "Landlords can manage their own property images" ON storage.objects;

-- UPDATE: only the uploader can modify
DROP POLICY IF EXISTS "Landlords can update their own property images" ON storage.objects;
CREATE POLICY "Landlords can update their own property images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'property-images' AND
    owner = auth.uid()
)
WITH CHECK (
    bucket_id = 'property-images' AND
    owner = auth.uid()
);

-- DELETE: only the uploader can delete
DROP POLICY IF EXISTS "Landlords can delete their own property images" ON storage.objects;
CREATE POLICY "Landlords can delete their own property images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'property-images' AND
    owner = auth.uid()
);

COMMIT;
