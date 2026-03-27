-- ============================================================================
-- Migration: Landlord-Centric Refactor
-- Purpose: Support landlord-initiated walk-in applications & auto tenant creation
-- ============================================================================

-- 1. Allow applications without a pre-existing tenant account
ALTER TABLE applications ALTER COLUMN applicant_id DROP NOT NULL;

-- 2. Add walk-in application fields
ALTER TABLE applications 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS applicant_name TEXT,
    ADD COLUMN IF NOT EXISTS applicant_phone TEXT,
    ADD COLUMN IF NOT EXISTS applicant_email TEXT,
    ADD COLUMN IF NOT EXISTS employment_info JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS requirements_checklist JSONB DEFAULT '{}';

-- 3. Drop unique constraint on (unit_id, applicant_id) if it exists
-- This allows multiple walk-in applications for the same unit
DO $$ BEGIN
    ALTER TABLE applications DROP CONSTRAINT IF EXISTS unique_application;
    ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_unit_id_applicant_id_key;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 4. Add index for landlord-created applications
CREATE INDEX IF NOT EXISTS idx_applications_created_by ON applications(created_by);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_email ON applications(applicant_email);

-- 5. Update RLS policies: restrict properties & units from public access
-- Drop old public-access policies
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Units are viewable by everyone" ON units;

-- New restricted policies: properties visible to owner + tenants with leases
CREATE POLICY "Properties visible to owner and tenants"
    ON properties FOR SELECT
    USING (
        landlord_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM leases l
            JOIN units u ON u.id = l.unit_id
            WHERE u.property_id = properties.id
            AND l.tenant_id = auth.uid()
            AND l.status IN ('active', 'pending_signature')
        )
    );

-- Units visible to property owner + tenants with leases on that property
CREATE POLICY "Units visible to owner and tenants"
    ON units FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = units.property_id
            AND p.landlord_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM leases l
            WHERE l.unit_id = units.id
            AND l.tenant_id = auth.uid()
            AND l.status IN ('active', 'pending_signature')
        )
    );

-- 6. Allow landlords to create applications for their properties
CREATE POLICY "Landlords can create walk-in applications"
    ON applications FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM units u
            JOIN properties p ON p.id = u.property_id
            WHERE u.id = applications.unit_id
            AND p.landlord_id = auth.uid()
        )
    );
