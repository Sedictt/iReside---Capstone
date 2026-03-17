CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_type') THEN
        CREATE TYPE public.location_type AS ENUM ('city', 'barangay', 'street');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.geo_locations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    type public.location_type NOT NULL,
    city_name text,
    barangay_name text,
    full_label text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Index for searching
CREATE INDEX IF NOT EXISTS idx_geo_locations_name_trgm ON public.geo_locations USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_geo_locations_full_label_trgm ON public.geo_locations USING gin (full_label gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_geo_locations_type ON public.geo_locations (type);

-- Seed with Metro Manila Cities
INSERT INTO public.geo_locations (name, type, city_name, full_label)
VALUES 
    ('Manila', 'city', 'Manila', 'Manila, Metro Manila'),
    ('Quezon City', 'city', 'Quezon City', 'Quezon City, Metro Manila'),
    ('Caloocan', 'city', 'Caloocan', 'Caloocan, Metro Manila'),
    ('Las Piñas', 'city', 'Las Piñas', 'Las Piñas, Metro Manila'),
    ('Makati', 'city', 'Makati', 'Makati City, Metro Manila'),
    ('Malabon', 'city', 'Malabon', 'Malabon, Metro Manila'),
    ('Mandaluyong', 'city', 'Mandaluyong', 'Mandaluyong, Metro Manila'),
    ('Marikina', 'city', 'Marikina', 'Marikina, Metro Manila'),
    ('Muntinlupa', 'city', 'Muntinlupa', 'Muntinlupa, Metro Manila'),
    ('Navotas', 'city', 'Navotas', 'Navotas, Metro Manila'),
    ('Parañaque', 'city', 'Parañaque', 'Parañaque, Metro Manila'),
    ('Pasay', 'city', 'Pasay', 'Pasay, Metro Manila'),
    ('Pasig', 'city', 'Pasig', 'Pasig, Metro Manila'),
    ('Pateros', 'city', 'Pateros', 'Pateros, Metro Manila'),
    ('San Juan', 'city', 'San Juan', 'San Juan, Metro Manila'),
    ('Taguig', 'city', 'Taguig', 'Taguig, Metro Manila'),
    ('Valenzuela', 'city', 'Valenzuela', 'Valenzuela, Metro Manila')
ON CONFLICT DO NOTHING;

-- Seed with some prominent Barangays/Areas in Metro Manila
INSERT INTO public.geo_locations (name, type, city_name, full_label)
VALUES
    ('BGC', 'barangay', 'Taguig', 'Bonifacio Global City (BGC), Taguig'),
    ('Poblacion', 'barangay', 'Makati', 'Poblacion, Makati City'),
    ('Bel-Air', 'barangay', 'Makati', 'Bel-Air, Makati City'),
    ('Guadalupe Nuevo', 'barangay', 'Makati', 'Guadalupe Nuevo, Makati City'),
    ('Greenhills', 'barangay', 'San Juan', 'Greenhills, San Juan'),
    ('Ortigas Center', 'barangay', 'Pasig', 'Ortigas Center, Pasig/Mandaluyong'),
    ('Eastwood City', 'barangay', 'Quezon City', 'Eastwood City, Quezon City'),
    ('Katipunan', 'barangay', 'Quezon City', 'Katipunan, Quezon City'),
    ('Loyola Heights', 'barangay', 'Quezon City', 'Loyola Heights, Quezon City'),
    ('Diliman', 'barangay', 'Quezon City', 'Diliman, Quezon City'),
    ('Cubao', 'barangay', 'Quezon City', 'Cubao, Quezon City'),
    ('New Manila', 'barangay', 'Quezon City', 'New Manila, Quezon City'),
    ('Alabang', 'barangay', 'Muntinlupa', 'Alabang, Muntinlupa'),
    ('Binondo', 'barangay', 'Manila', 'Binondo, Manila'),
    ('Malate', 'barangay', 'Manila', 'Malate, Manila'),
    ('Ermita', 'barangay', 'Manila', 'Ermita, Manila'),
    ('Intramuros', 'barangay', 'Manila', 'Intramuros, Manila'),
    ('Sampaloc', 'barangay', 'Manila', 'Sampaloc, Manila'),
    ('Quiapo', 'barangay', 'Manila', 'Quiapo, Manila'),
    ('Don Manuel', 'barangay', 'Quezon City', 'Don Manuel, Quezon City')
ON CONFLICT DO NOTHING;

-- Seed with some prominent Streets
INSERT INTO public.geo_locations (name, type, city_name, barangay_name, full_label)
VALUES
    ('Ayala Avenue', 'street', 'Makati', 'San Lorenzo/Bel-Air', 'Ayala Avenue, Makati'),
    ('EDSA', 'street', 'Multi-City', 'Multiple', 'Epifanio de los Santos Avenue (EDSA)'),
    ('Roxas Boulevard', 'street', 'Manila/Pasay/Parañaque', 'Multiple', 'Roxas Boulevard'),
    ('Macapagal Boulevard', 'street', 'Pasay/Parañaque', 'Multiple', 'Macapagal Boulevard'),
    ('Katipunan Avenue', 'street', 'Quezon City', 'Multiple', 'Katipunan Avenue, Quezon City'),
    ('Commonwealth Avenue', 'street', 'Quezon City', 'Multiple', 'Commonwealth Avenue, Quezon City'),
    ('Shaw Boulevard', 'street', 'Mandaluyong/Pasig', 'Multiple', 'Shaw Boulevard'),
    ('Bonifacio High Street', 'street', 'Taguig', 'BGC', 'Bonifacio High Street, BGC, Taguig')
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.geo_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Geo locations are viewable by everyone"
ON public.geo_locations FOR SELECT
USING (true);
