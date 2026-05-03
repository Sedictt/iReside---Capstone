-- Enable pg_trgm for fuzzy search if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indexes for fast fuzzy searching on property names and addresses
CREATE INDEX IF NOT EXISTS idx_properties_name_trgm ON public.properties USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_address_trgm ON public.properties USING gin (address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_city_trgm ON public.properties USING gin (city gin_trgm_ops);
