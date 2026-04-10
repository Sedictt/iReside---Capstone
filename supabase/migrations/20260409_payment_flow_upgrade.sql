-- ============================================================
-- Payment Flow Upgrade
-- Real monthly billing, utility metering, landlord GCash setup,
-- proof submission, confirmation, reminders, and receipts.
-- ============================================================

-- ======================== ENUMS ============================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'utility_type') THEN
        CREATE TYPE utility_type AS ENUM ('water', 'electricity');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'utility_billing_mode') THEN
        CREATE TYPE utility_billing_mode AS ENUM ('included_in_rent', 'tenant_paid');
    END IF;
END $$;

-- ================== PAYMENT DESTINATIONS ===================

CREATE TABLE IF NOT EXISTS landlord_payment_destinations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider        TEXT NOT NULL DEFAULT 'gcash',
    account_name    TEXT NOT NULL,
    account_number  TEXT NOT NULL,
    qr_image_path   TEXT,
    qr_image_url    TEXT,
    is_enabled      BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT landlord_payment_destinations_provider_check
        CHECK (provider IN ('gcash')),
    CONSTRAINT landlord_payment_destinations_unique_provider
        UNIQUE (landlord_id, provider)
);

ALTER TABLE landlord_payment_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own payment destinations"
    ON landlord_payment_destinations FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert own payment destinations"
    ON landlord_payment_destinations FOR INSERT
    WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own payment destinations"
    ON landlord_payment_destinations FOR UPDATE
    USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete own payment destinations"
    ON landlord_payment_destinations FOR DELETE
    USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can view payment destinations for own leases"
    ON landlord_payment_destinations FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM leases
            WHERE leases.landlord_id = landlord_payment_destinations.landlord_id
              AND leases.tenant_id = auth.uid()
        )
    );

-- ==================== UTILITY CONFIGS ======================

CREATE TABLE IF NOT EXISTS utility_configs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    property_id      UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id          UUID REFERENCES units(id) ON DELETE CASCADE,
    utility_type     utility_type NOT NULL,
    billing_mode     utility_billing_mode NOT NULL DEFAULT 'included_in_rent',
    rate_per_unit    NUMERIC(12,2) NOT NULL DEFAULT 0,
    unit_label       TEXT NOT NULL,
    is_active        BOOLEAN NOT NULL DEFAULT true,
    effective_from   DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to     DATE,
    note             TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT utility_configs_unit_label_check
        CHECK (
            (utility_type = 'water' AND unit_label = 'cubic_meter')
            OR
            (utility_type = 'electricity' AND unit_label = 'kwh')
        )
);

ALTER TABLE utility_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own utility configs"
    ON utility_configs FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert own utility configs"
    ON utility_configs FOR INSERT
    WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own utility configs"
    ON utility_configs FOR UPDATE
    USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete own utility configs"
    ON utility_configs FOR DELETE
    USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can view utility configs for own leases"
    ON utility_configs FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM leases
            JOIN units ON units.id = leases.unit_id
            WHERE leases.tenant_id = auth.uid()
              AND units.property_id = utility_configs.property_id
              AND (utility_configs.unit_id IS NULL OR utility_configs.unit_id = leases.unit_id)
        )
    );

CREATE UNIQUE INDEX IF NOT EXISTS idx_utility_configs_scope_period
    ON utility_configs(property_id, COALESCE(unit_id, '00000000-0000-0000-0000-000000000000'::uuid), utility_type, effective_from);

-- ==================== UTILITY READINGS =====================

CREATE TABLE IF NOT EXISTS utility_readings (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lease_id             UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    property_id          UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id              UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    utility_type         utility_type NOT NULL,
    billing_mode         utility_billing_mode NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end   DATE NOT NULL,
    previous_reading     NUMERIC(12,2) NOT NULL DEFAULT 0,
    current_reading      NUMERIC(12,2) NOT NULL DEFAULT 0,
    usage                NUMERIC(12,2) NOT NULL DEFAULT 0,
    billed_rate          NUMERIC(12,2) NOT NULL DEFAULT 0,
    computed_charge      NUMERIC(12,2) NOT NULL DEFAULT 0,
    entered_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    note                 TEXT,
    proof_image_path     TEXT,
    proof_image_url      TEXT,
    payment_id           UUID REFERENCES payments(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT utility_readings_positive_progress
        CHECK (current_reading >= previous_reading),
    CONSTRAINT utility_readings_usage_nonnegative
        CHECK (usage >= 0),
    CONSTRAINT utility_readings_period_order
        CHECK (billing_period_end >= billing_period_start)
);

ALTER TABLE utility_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own utility readings"
    ON utility_readings FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert own utility readings"
    ON utility_readings FOR INSERT
    WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own utility readings"
    ON utility_readings FOR UPDATE
    USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete own utility readings"
    ON utility_readings FOR DELETE
    USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can view own utility readings"
    ON utility_readings FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM leases
            WHERE leases.id = utility_readings.lease_id
              AND leases.tenant_id = auth.uid()
        )
    );

CREATE UNIQUE INDEX IF NOT EXISTS idx_utility_readings_unique_period
    ON utility_readings(unit_id, utility_type, billing_period_start, billing_period_end);

-- ==================== PAYMENT RECEIPTS =====================

CREATE TABLE IF NOT EXISTS payment_receipts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id      UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    landlord_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receipt_number  TEXT NOT NULL UNIQUE,
    amount          NUMERIC(12,2) NOT NULL,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    issued_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes           TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own payment receipts"
    ON payment_receipts FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert own payment receipts"
    ON payment_receipts FOR INSERT
    WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Tenants can view own payment receipts"
    ON payment_receipts FOR SELECT
    USING (auth.uid() = tenant_id);

-- ===================== PAYMENT FIELDS ======================

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS invoice_number TEXT,
    ADD COLUMN IF NOT EXISTS billing_cycle DATE,
    ADD COLUMN IF NOT EXISTS invoice_period_start DATE,
    ADD COLUMN IF NOT EXISTS invoice_period_end DATE,
    ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS balance_remaining NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS late_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS late_fee_applied_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS allow_partial_payments BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS due_day_snapshot INT,
    ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payment_proof_path TEXT,
    ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
    ADD COLUMN IF NOT EXISTS payment_note TEXT,
    ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS receipt_number TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

WITH payment_backfill AS (
    SELECT
        id,
        COALESCE(billing_cycle, date_trunc('month', due_date)::date) AS next_billing_cycle,
        COALESCE(invoice_period_start, date_trunc('month', due_date)::date) AS next_period_start,
        COALESCE(invoice_period_end, (date_trunc('month', due_date) + interval '1 month - 1 day')::date) AS next_period_end,
        CASE WHEN subtotal = 0 THEN amount ELSE subtotal END AS next_subtotal,
        CASE
            WHEN status = 'completed' THEN 0
            WHEN balance_remaining = 0 THEN amount
            ELSE balance_remaining
        END AS next_balance_remaining,
        CASE
            WHEN status = 'completed' AND paid_amount = 0 THEN amount
            ELSE paid_amount
        END AS next_paid_amount,
        COALESCE(
            invoice_number,
            'INV-' || to_char(date_trunc('month', due_date), 'YYYYMM') || '-' ||
            lpad(
                row_number() OVER (
                    PARTITION BY date_trunc('month', due_date)
                    ORDER BY created_at, id
                )::text,
                4,
                '0'
            )
        ) AS next_invoice_number,
        COALESCE(
            receipt_number,
            CASE
                WHEN status = 'completed' THEN
                    'REC-' || to_char(COALESCE(paid_at, created_at), 'YYYYMM') || '-' ||
                    lpad(
                        row_number() OVER (
                            PARTITION BY date_trunc('month', COALESCE(paid_at, created_at))
                            ORDER BY COALESCE(paid_at, created_at), id
                        )::text,
                        4,
                        '0'
                    )
                ELSE NULL
            END
        ) AS next_receipt_number
    FROM payments
)
UPDATE payments
SET
    billing_cycle = payment_backfill.next_billing_cycle,
    invoice_period_start = payment_backfill.next_period_start,
    invoice_period_end = payment_backfill.next_period_end,
    subtotal = payment_backfill.next_subtotal,
    balance_remaining = payment_backfill.next_balance_remaining,
    paid_amount = payment_backfill.next_paid_amount,
    invoice_number = payment_backfill.next_invoice_number,
    receipt_number = payment_backfill.next_receipt_number
FROM payment_backfill
WHERE payments.id = payment_backfill.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_billing_cycle
    ON payments(lease_id, billing_cycle)
    WHERE billing_cycle IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_invoice_number
    ON payments(invoice_number)
    WHERE invoice_number IS NOT NULL;

ALTER TABLE payment_items
    ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS utility_type utility_type,
    ADD COLUMN IF NOT EXISTS billing_mode utility_billing_mode,
    ADD COLUMN IF NOT EXISTS reading_id UUID REFERENCES utility_readings(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ======================== INDEXES ==========================

CREATE INDEX IF NOT EXISTS idx_landlord_payment_destinations_landlord
    ON landlord_payment_destinations(landlord_id);

CREATE INDEX IF NOT EXISTS idx_utility_configs_property
    ON utility_configs(property_id, unit_id, utility_type, is_active);

CREATE INDEX IF NOT EXISTS idx_utility_readings_payment
    ON utility_readings(payment_id);

CREATE INDEX IF NOT EXISTS idx_utility_readings_lease
    ON utility_readings(lease_id, utility_type, billing_period_start DESC);

CREATE INDEX IF NOT EXISTS idx_payment_receipts_payment
    ON payment_receipts(payment_id);
