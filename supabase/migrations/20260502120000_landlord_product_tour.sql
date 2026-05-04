-- Migration: Landlord Product Tour
-- Date: 2026-05-02
-- Description: Adds landlord product tour state and lifecycle telemetry.

CREATE TABLE IF NOT EXISTS landlord_product_tour_states (
    landlord_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'skipped', 'completed')),
    current_step_index INTEGER NOT NULL DEFAULT 0 CHECK (current_step_index >= 0),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    skip_suppressed_until TIMESTAMPTZ,
    replay_count INTEGER NOT NULL DEFAULT 0 CHECK (replay_count >= 0),
    last_event_at TIMESTAMPTZ,
    last_route TEXT,
    last_anchor_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_landlord_product_tour_states_status
    ON landlord_product_tour_states (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_landlord_product_tour_states_last_event
    ON landlord_product_tour_states (last_event_at DESC)
    WHERE last_event_at IS NOT NULL;

ALTER TABLE landlord_product_tour_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Landlords can view own product tour state" ON landlord_product_tour_states;
CREATE POLICY "Landlords can view own product tour state"
    ON landlord_product_tour_states FOR SELECT
    USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords can update own product tour state" ON landlord_product_tour_states;
CREATE POLICY "Landlords can update own product tour state"
    ON landlord_product_tour_states FOR UPDATE
    USING (auth.uid() = landlord_id)
    WITH CHECK (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords can create own product tour state" ON landlord_product_tour_states;
CREATE POLICY "Landlords can create own product tour state"
    ON landlord_product_tour_states FOR INSERT
    WITH CHECK (auth.uid() = landlord_id);

DROP TRIGGER IF EXISTS trg_landlord_product_tour_states_updated_at ON landlord_product_tour_states;
CREATE TRIGGER trg_landlord_product_tour_states_updated_at
    BEFORE UPDATE ON landlord_product_tour_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS landlord_product_tour_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'tour_started',
        'tour_step_completed',
        'tour_skipped',
        'tour_completed',
        'tour_replayed',
        'tour_failed'
    )),
    step_id TEXT,
    trigger_source TEXT NOT NULL CHECK (trigger_source IN (
        'onboarding_handoff',
        'auto_portal_entry',
        'manual',
        'resume',
        'replay',
        'step_progression',
        'fallback',
        'system'
    )),
    is_replay BOOLEAN NOT NULL DEFAULT false,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_landlord_product_tour_events_landlord_created
    ON landlord_product_tour_events (landlord_id, created_at DESC);

ALTER TABLE landlord_product_tour_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Landlords can view own product tour events" ON landlord_product_tour_events;
CREATE POLICY "Landlords can view own product tour events"
    ON landlord_product_tour_events FOR SELECT
    USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords can insert own product tour events" ON landlord_product_tour_events;
CREATE POLICY "Landlords can insert own product tour events"
    ON landlord_product_tour_events FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = landlord_id);
