-- ============================================================
-- Unit Map Infrastructure
-- Adds: property_floor_configs, unit_map_positions,
--       map_decorations JSONB on properties
-- ============================================================

-- ----------------------------------------------------------
-- 1. Floor configurations defined during property creation
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS property_floor_configs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,        -- 0 = ground, 1 = floor 1, etc.
    floor_key    TEXT NOT NULL,       -- "ground", "floor1", "floor2"…
    display_name TEXT,                -- custom name (nullable → uses default)
    sort_order   INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_property_floor UNIQUE (property_id, floor_number),
    CONSTRAINT uq_property_floor_key UNIQUE (property_id, floor_key)
);

ALTER TABLE property_floor_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage own floor configs"
    ON property_floor_configs
    USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = property_id
            AND properties.landlord_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = property_id
            AND properties.landlord_id = auth.uid()
        )
    );

CREATE POLICY "Floor configs viewable by everyone"
    ON property_floor_configs FOR SELECT
    USING (true);

-- ----------------------------------------------------------
-- 2. Per-unit visual positions on the canvas
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS unit_map_positions (
    unit_id    UUID PRIMARY KEY REFERENCES units(id) ON DELETE CASCADE,
    floor_key  TEXT NOT NULL,   -- matches property_floor_configs.floor_key
    x          INT NOT NULL DEFAULT 0,
    y          INT NOT NULL DEFAULT 0,
    w          INT NOT NULL DEFAULT 200,
    h          INT NOT NULL DEFAULT 140,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE unit_map_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage unit map positions"
    ON unit_map_positions
    USING (
        EXISTS (
            SELECT 1 FROM units u
            JOIN properties p ON p.id = u.property_id
            WHERE u.id = unit_id
            AND p.landlord_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM units u
            JOIN properties p ON p.id = u.property_id
            WHERE u.id = unit_id
            AND p.landlord_id = auth.uid()
        )
    );

CREATE POLICY "Unit map positions viewable by everyone"
    ON unit_map_positions FOR SELECT
    USING (true);

-- ----------------------------------------------------------
-- 3. JSONB blob for decorative corridor/structure layout
-- ----------------------------------------------------------
ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS map_decorations JSONB DEFAULT '{}'::jsonb;

-- ----------------------------------------------------------
-- 4. Indexes
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_floor_configs_property
    ON property_floor_configs(property_id);

CREATE INDEX IF NOT EXISTS idx_unit_map_positions_floor
    ON unit_map_positions(floor_key);

-- ----------------------------------------------------------
-- 5. Auto-update triggers
-- ----------------------------------------------------------
CREATE TRIGGER trg_floor_configs_updated_at
    BEFORE UPDATE ON property_floor_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_unit_map_positions_updated_at
    BEFORE UPDATE ON unit_map_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
