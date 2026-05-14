-- Re-add map_decorations column to properties table
-- This was accidentally removed during legacy discovery purge (20260427_purge_legacy_discovery.sql)
-- The unit map feature requires this column to store visual overlay data (corridors, structures)

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS map_decorations JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.properties.map_decorations IS 'Visual map decorations per floor_key: { floor_key: { corridors?: Corridor[], structures?: Structure[] } }';