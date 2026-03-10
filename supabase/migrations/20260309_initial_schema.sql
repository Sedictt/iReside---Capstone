-- ============================================================
-- iReside Database Schema
-- Full migration for the property management platform
-- ============================================================

-- ======================== ENUMS ============================

CREATE TYPE user_role AS ENUM ('tenant', 'landlord');
CREATE TYPE property_type AS ENUM ('apartment', 'condo', 'house', 'townhouse', 'studio');
CREATE TYPE unit_status AS ENUM ('vacant', 'occupied', 'maintenance');
CREATE TYPE lease_status AS ENUM ('draft', 'pending_signature', 'active', 'expired', 'terminated');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('credit_card', 'debit_card', 'gcash', 'maya', 'bank_transfer', 'cash');
CREATE TYPE application_status AS ENUM ('pending', 'reviewing', 'approved', 'rejected', 'withdrawn');
CREATE TYPE maintenance_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE move_out_status AS ENUM ('pending', 'approved', 'denied', 'completed');
CREATE TYPE message_type AS ENUM ('text', 'system', 'image', 'file');
CREATE TYPE notification_type AS ENUM ('payment', 'lease', 'maintenance', 'announcement', 'message', 'application');


-- ====================== PROFILES ===========================
-- Extends Supabase auth.users with app-specific fields

CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    full_name   TEXT NOT NULL,
    role        user_role NOT NULL DEFAULT 'tenant',
    avatar_url  TEXT,
    phone       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile, landlords can read their tenants' profiles
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Public profiles are viewable by authenticated users (for messaging, tenant directory, etc.)
CREATE POLICY "Authenticated users can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);


-- ===================== PROPERTIES ==========================

CREATE TABLE properties (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    address     TEXT NOT NULL,
    city        TEXT NOT NULL DEFAULT 'Valenzuela',
    description TEXT,
    type        property_type NOT NULL DEFAULT 'apartment',
    lat         DOUBLE PRECISION,
    lng         DOUBLE PRECISION,
    amenities   TEXT[] NOT NULL DEFAULT '{}',
    house_rules TEXT[] NOT NULL DEFAULT '{}',
    images      TEXT[] NOT NULL DEFAULT '{}',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Anyone can browse properties (public listings)
CREATE POLICY "Properties are viewable by everyone"
    ON properties FOR SELECT
    USING (true);

CREATE POLICY "Landlords can insert own properties"
    ON properties FOR INSERT
    WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own properties"
    ON properties FOR UPDATE
    USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete own properties"
    ON properties FOR DELETE
    USING (auth.uid() = landlord_id);


-- ======================== UNITS ============================

CREATE TABLE units (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    floor       INT NOT NULL DEFAULT 1,
    status      unit_status NOT NULL DEFAULT 'vacant',
    rent_amount NUMERIC(12,2) NOT NULL,
    sqft        INT,
    beds        INT NOT NULL DEFAULT 1,
    baths       INT NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Units are viewable by everyone"
    ON units FOR SELECT
    USING (true);

CREATE POLICY "Landlords can manage units of own properties"
    ON units FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = property_id
            AND properties.landlord_id = auth.uid()
        )
    );

CREATE POLICY "Landlords can update units of own properties"
    ON units FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = property_id
            AND properties.landlord_id = auth.uid()
        )
    );

CREATE POLICY "Landlords can delete units of own properties"
    ON units FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = property_id
            AND properties.landlord_id = auth.uid()
        )
    );


-- ======================== LEASES ===========================

CREATE TABLE leases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id             UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    tenant_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    landlord_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    status              lease_status NOT NULL DEFAULT 'draft',
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    monthly_rent        NUMERIC(12,2) NOT NULL,
    security_deposit    NUMERIC(12,2) NOT NULL DEFAULT 0,
    terms               JSONB,
    tenant_signature    TEXT,
    landlord_signature  TEXT,
    signed_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT lease_dates_valid CHECK (end_date > start_date)
);

ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own leases"
    ON leases FOR SELECT
    USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view own leases"
    ON leases FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can create leases"
    ON leases FOR INSERT
    WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own leases"
    ON leases FOR UPDATE
    USING (auth.uid() = landlord_id);

-- Tenants can update leases (for signing)
CREATE POLICY "Tenants can update own leases for signing"
    ON leases FOR UPDATE
    USING (auth.uid() = tenant_id);


-- ======================= PAYMENTS ==========================

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id            UUID NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
    tenant_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    landlord_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    amount              NUMERIC(12,2) NOT NULL,
    status              payment_status NOT NULL DEFAULT 'pending',
    method              payment_method,
    description         TEXT,
    due_date            DATE NOT NULL,
    paid_at             TIMESTAMPTZ,
    reference_number    TEXT,
    landlord_confirmed  BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "System can create payments"
    ON payments FOR INSERT
    WITH CHECK (auth.uid() = landlord_id OR auth.uid() = tenant_id);

CREATE POLICY "Payment updates"
    ON payments FOR UPDATE
    USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);


-- ==================== PAYMENT ITEMS ========================
-- Line items for each payment (rent, water, electricity, etc.)

CREATE TABLE payment_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id  UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    amount      NUMERIC(12,2) NOT NULL,
    category    TEXT NOT NULL DEFAULT 'rent',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment items follow payment access"
    ON payment_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM payments
            WHERE payments.id = payment_id
            AND (payments.tenant_id = auth.uid() OR payments.landlord_id = auth.uid())
        )
    );

CREATE POLICY "Payment items insert via payment owner"
    ON payment_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM payments
            WHERE payments.id = payment_id
            AND (payments.tenant_id = auth.uid() OR payments.landlord_id = auth.uid())
        )
    );


-- ===================== APPLICATIONS ========================

CREATE TABLE applications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id             UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    applicant_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    landlord_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status              application_status NOT NULL DEFAULT 'pending',
    message             TEXT,
    monthly_income      NUMERIC(12,2),
    employment_status   TEXT,
    move_in_date        DATE,
    documents           TEXT[] NOT NULL DEFAULT '{}',
    reviewed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_application UNIQUE (unit_id, applicant_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view own applications"
    ON applications FOR SELECT
    USING (auth.uid() = applicant_id);

CREATE POLICY "Landlords can view applications for their units"
    ON applications FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "Authenticated users can create applications"
    ON applications FOR INSERT
    WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants can update own applications"
    ON applications FOR UPDATE
    USING (auth.uid() = applicant_id);

CREATE POLICY "Landlords can update applications for their units"
    ON applications FOR UPDATE
    USING (auth.uid() = landlord_id);


-- ================ MAINTENANCE REQUESTS =====================

CREATE TABLE maintenance_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id     UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    tenant_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    status      maintenance_status NOT NULL DEFAULT 'open',
    priority    maintenance_priority NOT NULL DEFAULT 'medium',
    category    TEXT,
    images      TEXT[] NOT NULL DEFAULT '{}',
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own maintenance requests"
    ON maintenance_requests FOR SELECT
    USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view maintenance requests for their properties"
    ON maintenance_requests FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can create maintenance requests"
    ON maintenance_requests FOR INSERT
    WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can update own maintenance requests"
    ON maintenance_requests FOR UPDATE
    USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can update maintenance requests"
    ON maintenance_requests FOR UPDATE
    USING (auth.uid() = landlord_id);


-- ================== MOVE-OUT REQUESTS ======================

CREATE TABLE move_out_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id        UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    landlord_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason          TEXT,
    requested_date  DATE NOT NULL,
    status          move_out_status NOT NULL DEFAULT 'pending',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE move_out_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own move-out requests"
    ON move_out_requests FOR SELECT
    USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view move-out requests"
    ON move_out_requests FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can create move-out requests"
    ON move_out_requests FOR INSERT
    WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Landlords can update move-out requests"
    ON move_out_requests FOR UPDATE
    USING (auth.uid() = landlord_id);


-- ==================== CONVERSATIONS ========================

CREATE TABLE conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE conversation_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_participant UNIQUE (conversation_id, user_id)
);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Users can only view conversations they participate in
CREATE POLICY "Participants can view conversations"
    ON conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_participants.conversation_id = id
            AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create conversations"
    ON conversations FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Participants can view their participant records"
    ON conversation_participants FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "View co-participants"
    ON conversation_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can add participants"
    ON conversation_participants FOR INSERT
    TO authenticated
    WITH CHECK (true);


-- ====================== MESSAGES ===========================

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type            message_type NOT NULL DEFAULT 'text',
    content         TEXT NOT NULL,
    metadata        JSONB,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_participants.conversation_id = conversation_id
            AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_participants.conversation_id = conversation_id
            AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Recipient can update message read status"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_participants.conversation_id = conversation_id
            AND conversation_participants.user_id = auth.uid()
        )
    );


-- ==================== NOTIFICATIONS ========================

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type        notification_type NOT NULL,
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    data        JSONB,
    read        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);


-- ================== SAVED PROPERTIES =======================

CREATE TABLE saved_properties (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_saved UNIQUE (user_id, property_id)
);

ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved properties"
    ON saved_properties FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save properties"
    ON saved_properties FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave properties"
    ON saved_properties FOR DELETE
    USING (auth.uid() = user_id);


-- ==================== INDEXES ==============================

CREATE INDEX idx_properties_landlord   ON properties(landlord_id);
CREATE INDEX idx_properties_city       ON properties(city);
CREATE INDEX idx_properties_type       ON properties(type);

CREATE INDEX idx_units_property        ON units(property_id);
CREATE INDEX idx_units_status          ON units(status);

CREATE INDEX idx_leases_tenant         ON leases(tenant_id);
CREATE INDEX idx_leases_landlord       ON leases(landlord_id);
CREATE INDEX idx_leases_unit           ON leases(unit_id);
CREATE INDEX idx_leases_status         ON leases(status);

CREATE INDEX idx_payments_tenant       ON payments(tenant_id);
CREATE INDEX idx_payments_landlord     ON payments(landlord_id);
CREATE INDEX idx_payments_lease        ON payments(lease_id);
CREATE INDEX idx_payments_status       ON payments(status);
CREATE INDEX idx_payments_due_date     ON payments(due_date);

CREATE INDEX idx_payment_items_payment ON payment_items(payment_id);

CREATE INDEX idx_applications_unit     ON applications(unit_id);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);
CREATE INDEX idx_applications_landlord ON applications(landlord_id);
CREATE INDEX idx_applications_status   ON applications(status);

CREATE INDEX idx_maintenance_tenant    ON maintenance_requests(tenant_id);
CREATE INDEX idx_maintenance_landlord  ON maintenance_requests(landlord_id);
CREATE INDEX idx_maintenance_status    ON maintenance_requests(status);

CREATE INDEX idx_move_out_lease        ON move_out_requests(lease_id);
CREATE INDEX idx_move_out_tenant       ON move_out_requests(tenant_id);

CREATE INDEX idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender       ON messages(sender_id);
CREATE INDEX idx_messages_created_at   ON messages(created_at);

CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_read    ON notifications(user_id, read);

CREATE INDEX idx_saved_properties_user ON saved_properties(user_id);


-- ================ AUTO-UPDATE TRIGGERS =====================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_units_updated_at
    BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leases_updated_at
    BEFORE UPDATE ON leases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_maintenance_updated_at
    BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_move_out_updated_at
    BEFORE UPDATE ON move_out_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ========= AUTO-CREATE PROFILE ON AUTH SIGNUP ==============

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'tenant'::user_role)
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ===== AUTO-UPDATE UNIT STATUS WHEN LEASE CHANGES ==========

CREATE OR REPLACE FUNCTION handle_lease_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' THEN
        UPDATE units SET status = 'occupied' WHERE id = NEW.unit_id;
    ELSIF NEW.status IN ('expired', 'terminated') AND OLD.status = 'active' THEN
        UPDATE units SET status = 'vacant' WHERE id = NEW.unit_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_lease_status_change
    AFTER UPDATE OF status ON leases
    FOR EACH ROW EXECUTE FUNCTION handle_lease_status_change();


-- ==== AUTO-UPDATE CONVERSATION TIMESTAMP ON NEW MESSAGE ====

CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION handle_new_message();
