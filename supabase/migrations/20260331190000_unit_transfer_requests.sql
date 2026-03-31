CREATE TYPE unit_transfer_status AS ENUM ('pending', 'approved', 'denied', 'cancelled');

CREATE TABLE unit_transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    current_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    requested_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    reason TEXT,
    status unit_transfer_status NOT NULL DEFAULT 'pending',
    landlord_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unit_transfer_requests_distinct_units CHECK (current_unit_id <> requested_unit_id)
);

CREATE INDEX idx_unit_transfer_requests_tenant ON unit_transfer_requests(tenant_id);
CREATE INDEX idx_unit_transfer_requests_landlord ON unit_transfer_requests(landlord_id);
CREATE INDEX idx_unit_transfer_requests_property ON unit_transfer_requests(property_id);
CREATE INDEX idx_unit_transfer_requests_requested_unit ON unit_transfer_requests(requested_unit_id);

CREATE UNIQUE INDEX uniq_pending_transfer_per_tenant_property
    ON unit_transfer_requests(tenant_id, property_id)
    WHERE status = 'pending';

ALTER TABLE unit_transfer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own transfer requests"
    ON unit_transfer_requests FOR SELECT
    USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view own transfer requests"
    ON unit_transfer_requests FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can create transfer requests"
    ON unit_transfer_requests FOR INSERT
    WITH CHECK (
        auth.uid() = unit_transfer_requests.tenant_id
        AND EXISTS (
            SELECT 1
            FROM leases l
            JOIN units current_u ON current_u.id = l.unit_id
            JOIN units requested_u ON requested_u.id = unit_transfer_requests.requested_unit_id
            WHERE l.id = unit_transfer_requests.lease_id
                AND l.tenant_id = auth.uid()
                AND l.landlord_id = unit_transfer_requests.landlord_id
                AND l.status = 'active'
                AND current_u.id = unit_transfer_requests.current_unit_id
                AND current_u.property_id = unit_transfer_requests.property_id
                AND requested_u.property_id = unit_transfer_requests.property_id
                AND requested_u.status = 'vacant'
        )
    );

CREATE POLICY "Landlords can update transfer requests"
    ON unit_transfer_requests FOR UPDATE
    USING (auth.uid() = landlord_id);

CREATE TRIGGER trg_unit_transfer_requests_updated_at
BEFORE UPDATE ON unit_transfer_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
