DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_scope') THEN
        CREATE TYPE public.listing_scope AS ENUM ('property', 'unit');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        CREATE TYPE public.listing_status AS ENUM ('draft', 'published', 'paused');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.listings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    landlord_id uuid NOT NULL,
    property_id uuid NOT NULL,
    unit_id uuid,
    scope public.listing_scope NOT NULL,
    title text NOT NULL,
    rent_amount numeric(12,2) NOT NULL,
    status public.listing_status DEFAULT 'draft'::public.listing_status NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    leads integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT listings_pkey PRIMARY KEY (id),
    CONSTRAINT listings_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT listings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE,
    CONSTRAINT listings_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE,
    CONSTRAINT listings_rent_amount_check CHECK (rent_amount >= 0),
    CONSTRAINT listings_scope_unit_consistency CHECK (
        (scope = 'property'::public.listing_scope AND unit_id IS NULL) OR
        (scope = 'unit'::public.listing_scope AND unit_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_listings_landlord_created ON public.listings USING btree (landlord_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_property ON public.listings USING btree (property_id);
CREATE INDEX IF NOT EXISTS idx_listings_unit ON public.listings USING btree (unit_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings USING btree (status);

DROP TRIGGER IF EXISTS trg_listings_updated_at ON public.listings;
CREATE TRIGGER trg_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Landlords can create own listings" ON public.listings;
CREATE POLICY "Landlords can create own listings"
ON public.listings FOR INSERT
WITH CHECK (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords can view own listings" ON public.listings;
CREATE POLICY "Landlords can view own listings"
ON public.listings FOR SELECT
USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords can update own listings" ON public.listings;
CREATE POLICY "Landlords can update own listings"
ON public.listings FOR UPDATE
USING (auth.uid() = landlord_id)
WITH CHECK (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords can delete own listings" ON public.listings;
CREATE POLICY "Landlords can delete own listings"
ON public.listings FOR DELETE
USING (auth.uid() = landlord_id);

GRANT ALL ON TABLE public.listings TO anon;
GRANT ALL ON TABLE public.listings TO authenticated;
GRANT ALL ON TABLE public.listings TO service_role;
