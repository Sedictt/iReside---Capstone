-- Amenity Management Migration
-- Create tables for managing property facilities/amenities and their bookings

BEGIN;

-- 1) Create amenities table
CREATE TABLE IF NOT EXISTS public.amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Room', 'Amenity', 'Utility'
    image_url TEXT,
    description TEXT,
    price_per_unit NUMERIC(10, 2) DEFAULT 0,
    unit_type TEXT DEFAULT 'hour', -- 'hour', 'day', 'free'
    status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Maintenance'
    capacity INTEGER,
    icon_name TEXT,
    location_details TEXT, -- e.g., 'Main Wing', 'Rooftop'
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Create amenity_bookings table
CREATE TABLE IF NOT EXISTS public.amenity_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_price NUMERIC(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Enable RLS
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenity_bookings ENABLE ROW LEVEL SECURITY;

-- 4) RLS Policies for amenities
-- Landlords can manage their own amenities
CREATE POLICY "Landlords can manage their own amenities"
    ON public.amenities
    FOR ALL
    USING (auth.uid() = landlord_id);

-- Tenants can view amenities for properties they belong to (simplified for now: anyone can view)
CREATE POLICY "Anyone can view amenities"
    ON public.amenities
    FOR SELECT
    USING (true);

-- 5) RLS Policies for amenity_bookings
-- Landlords can manage bookings for their amenities
CREATE POLICY "Landlords can manage bookings for their amenities"
    ON public.amenity_bookings
    FOR ALL
    USING (auth.uid() = landlord_id);

-- Tenants can view their own bookings
CREATE POLICY "Tenants can view their own bookings"
    ON public.amenity_bookings
    FOR SELECT
    USING (auth.uid() = tenant_id);

-- Tenants can create bookings
CREATE POLICY "Tenants can create bookings"
    ON public.amenity_bookings
    FOR INSERT
    WITH CHECK (auth.uid() = tenant_id);

-- 6) Seed some data (using deterministic UUIDs for existing properties/landlords)
-- Landlord 1: 11111111-1111-1111-1111-111111111111
-- Property 1 (Maple Grove): aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1
-- Property 2 (Skyline Lofts): aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2

INSERT INTO public.amenities (id, property_id, landlord_id, name, type, image_url, description, price_per_unit, unit_type, status, capacity, icon_name, location_details, tags) VALUES
    ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e101', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 
     'Grand Function Hall', 'Room', '/utilities/function_hall.png', 'Perfect for parties, seminars, and gatherings. Includes sound system and chairs.', 500, 'hour', 'Active', 100, 'Users', 'Main Wing', ARRAY['Event', 'Sound System']),
    ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e102', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', 
     'Sky Pool & Lounge', 'Amenity', '/utilities/sky_pool.png', 'Rooftop swimming pool with city view. Access limited to residents.', 0, 'free', 'Active', 30, 'Waves', 'Rooftop', ARRAY['Outdoor', 'Leisure']),
    ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e103', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 
     'Music Studio', 'Utility', '/utilities/music_studio.png', 'Soundproof room for practice and recording. Instruments available on request.', 200, 'hour', 'Maintenance', 5, 'Music', 'Basement', ARRAY['Studio', 'Soundproof']),
    ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e104', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', 
     'Co-working Space', 'Room', '/utilities/coworking.png', 'Quiet area for work and study. High-speed Wi-Fi and coffee available.', 0, 'free', 'Active', 20, 'Coffee', '2nd Floor', ARRAY['Workspace', 'WiFi'])
ON CONFLICT (id) DO NOTHING;

-- Seed some bookings
-- Tenant 1: 33333333-3333-3333-3333-333333333333
INSERT INTO public.amenity_bookings (id, amenity_id, tenant_id, landlord_id, booking_date, start_time, end_time, total_price, status, notes) VALUES
    ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b101', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e101', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '2024-05-15', '14:00', '18:00', 2000, 'Pending', 'Birthday party'),
    ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b102', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e103', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '2024-05-10', '10:00', '12:00', 400, 'Approved', 'Band practice')
ON CONFLICT (id) DO NOTHING;

COMMIT;
