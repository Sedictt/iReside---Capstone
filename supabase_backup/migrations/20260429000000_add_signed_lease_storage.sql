-- Add signed document storage to leases
ALTER TABLE leases ADD COLUMN IF NOT EXISTS signed_document_url TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS signed_document_path TEXT;

-- Update RLS for leases to ensure both landlord and tenant can view the signed document
-- (Assuming landlord_id and tenant_id columns exist and are populated)
-- The existing policies should already cover this if they allow access based on these IDs.
