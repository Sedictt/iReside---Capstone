-- Create consultation_documents table
CREATE TABLE IF NOT EXISTS consultation_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    signed_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE consultation_documents ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin can do anything
CREATE POLICY "Admins have full access to consultation_documents"
    ON consultation_documents
    FOR ALL
    USING (auth.jwt() ->> 'email' IN (SELECT email FROM profiles WHERE role = 'admin'));

-- Public can read any document (for signing)
CREATE POLICY "Public can read documents for signing"
    ON consultation_documents
    FOR SELECT
    USING (status = 'pending' OR status = 'signed');

-- Public can update documents (to add signed_file_url)
CREATE POLICY "Public can update documents to sign them"
    ON consultation_documents
    FOR UPDATE
    USING (status = 'pending');

-- Create Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('consultation-documents', 'consultation-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'consultation-documents'
-- Allow public access to view files (so TA can load the PDF)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'consultation-documents' );

-- Allow public to upload files (so TA can upload the signed version)
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'consultation-documents' );

-- Allow admin to manage all files
CREATE POLICY "Admin Management"
ON storage.objects FOR ALL
USING ( bucket_id = 'consultation-documents' AND (auth.jwt() ->> 'email' IN (SELECT email FROM profiles WHERE role = 'admin')) );
