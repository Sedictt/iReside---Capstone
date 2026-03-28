-- Migration: Lease Signing Workflow Enhancement
-- Date: 2026-03-28
-- Description: Add dual signing mode support, audit trail, and signing link management

-- ======================== ENUM UPDATES ============================

-- Add new lease status values for signing workflow
ALTER TYPE lease_status ADD VALUE IF NOT EXISTS 'pending_tenant_signature';
ALTER TYPE lease_status ADD VALUE IF NOT EXISTS 'pending_landlord_signature';

-- ======================== LEASES TABLE UPDATES ============================

-- Add new columns to support dual signing modes and tracking
ALTER TABLE leases
    ADD COLUMN IF NOT EXISTS signing_mode TEXT 
        CHECK (signing_mode IN ('in_person', 'remote')),
    ADD COLUMN IF NOT EXISTS tenant_signed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS landlord_signed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS signing_link_token_hash TEXT,
    ADD COLUMN IF NOT EXISTS signature_lock_version INTEGER NOT NULL DEFAULT 0;

-- ======================== APPLICATIONS TABLE UPDATES ============================

-- Add lease_id to applications to link them directly to created leases
ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS lease_id UUID REFERENCES leases(id) ON DELETE SET NULL;

-- Add index for lease lookup
CREATE INDEX IF NOT EXISTS idx_applications_lease_id ON applications(lease_id);

-- Add index for signing link token lookup (for JWT validation)
CREATE INDEX IF NOT EXISTS idx_leases_signing_link_token_hash 
    ON leases(signing_link_token_hash) 
    WHERE signing_link_token_hash IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN leases.signing_mode IS 'Signing mode: in_person (both sign in same session) or remote (tenant signs via email link)';
COMMENT ON COLUMN leases.tenant_signed_at IS 'Timestamp when tenant signed the lease';
COMMENT ON COLUMN leases.landlord_signed_at IS 'Timestamp when landlord signed the lease';
COMMENT ON COLUMN leases.signing_link_token_hash IS 'SHA-256 hash of JWT token for remote signing link';
COMMENT ON COLUMN leases.signature_lock_version IS 'Optimistic lock version for concurrent signature prevention';

-- ======================== AUDIT TRAIL TABLE ============================

-- Create lease signing audit trail table
CREATE TABLE IF NOT EXISTS lease_signing_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'signing_link_generated',
        'signing_link_accessed',
        'signing_link_expired',
        'signing_link_regenerated',
        'tenant_signed',
        'landlord_signed',
        'lease_activated',
        'signing_failed'
    )),
    actor_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for lease audit queries
CREATE INDEX IF NOT EXISTS idx_lease_signing_audit_lease_id 
    ON lease_signing_audit(lease_id, created_at DESC);

-- Add index for event type queries
CREATE INDEX IF NOT EXISTS idx_lease_signing_audit_event_type 
    ON lease_signing_audit(event_type, created_at DESC);

-- Enable RLS for audit trail
ALTER TABLE lease_signing_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit trail
DROP POLICY IF EXISTS "Landlords can view audit for their leases" ON lease_signing_audit;
CREATE POLICY "Landlords can view audit for their leases"
    ON lease_signing_audit FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM leases 
            WHERE leases.id = lease_signing_audit.lease_id 
            AND leases.landlord_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can insert audit events" ON lease_signing_audit;
CREATE POLICY "System can insert audit events"
    ON lease_signing_audit FOR INSERT
    WITH CHECK (true);  -- Any authenticated user can create audit events (validated in API layer)

-- Comment for documentation
COMMENT ON TABLE lease_signing_audit IS 'Audit trail for all lease signing events';
COMMENT ON COLUMN lease_signing_audit.event_type IS 'Type of signing event: signing_link_generated, tenant_signed, landlord_signed, etc.';
COMMENT ON COLUMN lease_signing_audit.ip_address IS 'IP address of the user performing the action';
COMMENT ON COLUMN lease_signing_audit.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN lease_signing_audit.metadata IS 'Additional event-specific metadata (error details, link expiration, etc.)';

-- ======================== DATA BACKFILL ============================

-- Backfill existing leases with default signing_mode
UPDATE leases
SET signing_mode = 'in_person'
WHERE signing_mode IS NULL;

-- Backfill tenant_signed_at and landlord_signed_at for existing active leases
UPDATE leases
SET 
    tenant_signed_at = COALESCE(signed_at, updated_at),
    landlord_signed_at = COALESCE(signed_at, updated_at)
WHERE status = 'active' 
  AND tenant_signature IS NOT NULL 
  AND landlord_signature IS NOT NULL
  AND tenant_signed_at IS NULL;

-- ======================== FUNCTIONS ============================

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_lease_signature_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Update tenant_signed_at when tenant_signature changes
    IF NEW.tenant_signature IS NOT NULL AND OLD.tenant_signature IS NULL THEN
        NEW.tenant_signed_at = now();
    END IF;
    
    -- Update landlord_signed_at when landlord_signature changes
    IF NEW.landlord_signature IS NOT NULL AND OLD.landlord_signature IS NULL THEN
        NEW.landlord_signed_at = now();
    END IF;
    
    -- Update signed_at when both signatures are present
    IF NEW.tenant_signature IS NOT NULL 
       AND NEW.landlord_signature IS NOT NULL 
       AND NEW.signed_at IS NULL THEN
        NEW.signed_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS trigger_update_lease_signature_timestamps ON leases;
CREATE TRIGGER trigger_update_lease_signature_timestamps
    BEFORE UPDATE ON leases
    FOR EACH ROW
    WHEN (
        NEW.tenant_signature IS DISTINCT FROM OLD.tenant_signature 
        OR NEW.landlord_signature IS DISTINCT FROM OLD.landlord_signature
    )
    EXECUTE FUNCTION update_lease_signature_timestamps();

-- Function to validate lease status transitions
CREATE OR REPLACE FUNCTION validate_lease_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent transition to active without both signatures
    IF NEW.status = 'active' THEN
        IF NEW.tenant_signature IS NULL OR NEW.landlord_signature IS NULL THEN
            RAISE EXCEPTION 'Cannot set lease status to active without both signatures';
        END IF;
    END IF;
    
    -- Prevent invalid status transitions (basic validation)
    IF OLD.status = 'active' AND NEW.status = 'draft' THEN
        RAISE EXCEPTION 'Cannot transition from active to draft status';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status transition validation
DROP TRIGGER IF EXISTS trigger_validate_lease_status_transition ON leases;
CREATE TRIGGER trigger_validate_lease_status_transition
    BEFORE UPDATE OF status ON leases
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION validate_lease_status_transition();

-- ======================== GRANTS ============================

-- Grant necessary permissions
GRANT SELECT, INSERT ON lease_signing_audit TO authenticated;
GRANT SELECT, UPDATE ON leases TO authenticated;
