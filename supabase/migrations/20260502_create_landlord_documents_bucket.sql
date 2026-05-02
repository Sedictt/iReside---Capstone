-- Create landlord-documents Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('landlord-documents', 'landlord-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'landlord-documents'
-- Allow public access to view documents
CREATE POLICY "Public Access on landlord-documents"
ON storage.objects FOR SELECT
USING ( bucket_id = 'landlord-documents' );

-- Allow uploading documents
CREATE POLICY "Public Upload on landlord-documents"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'landlord-documents' );

-- Allow admin to manage all files
CREATE POLICY "Admin Management on landlord-documents"
ON storage.objects FOR ALL
USING ( bucket_id = 'landlord-documents' AND (auth.jwt() ->> 'email' IN (SELECT email FROM profiles WHERE role = 'admin')) );
