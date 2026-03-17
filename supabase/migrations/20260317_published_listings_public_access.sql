DROP POLICY IF EXISTS "Published listings are viewable by everyone" ON public.listings;
CREATE POLICY "Published listings are viewable by everyone"
ON public.listings FOR SELECT
USING (status = 'published'::public.listing_status);
