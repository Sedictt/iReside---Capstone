-- Consolidate community media policies and wrap auth calls for RLS performance.

DROP POLICY IF EXISTS "Albums visible with published posts" ON public.community_albums;
DROP POLICY IF EXISTS "Landlords can manage albums" ON public.community_albums;
DROP POLICY IF EXISTS "Tenants can manage own albums" ON public.community_albums;
DROP POLICY IF EXISTS "Landlords can manage photos" ON public.community_photos;
DROP POLICY IF EXISTS "Photos visible with album" ON public.community_photos;
DROP POLICY IF EXISTS "Tenants can manage own photos" ON public.community_photos;

CREATE POLICY "Community album stakeholders can access albums"
ON public.community_albums
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.community_posts
        WHERE community_posts.id = community_albums.post_id
          AND community_posts.is_approved = true
          AND community_posts.status = 'published'::public.post_status_enum
    )
    OR EXISTS (
        SELECT 1
        FROM public.properties
        WHERE properties.id = community_albums.property_id
          AND properties.landlord_id = (select auth.uid())
    )
    OR EXISTS (
        SELECT 1
        FROM public.community_posts
        WHERE community_posts.id = community_albums.post_id
          AND community_posts.author_id = (select auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.properties
        WHERE properties.id = community_albums.property_id
          AND properties.landlord_id = (select auth.uid())
    )
    OR EXISTS (
        SELECT 1
        FROM public.community_posts
        WHERE community_posts.id = community_albums.post_id
          AND community_posts.author_id = (select auth.uid())
    )
);

CREATE POLICY "Community photo stakeholders can access photos"
ON public.community_photos
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.community_albums
        JOIN public.community_posts ON community_posts.id = community_albums.post_id
        WHERE community_albums.id = community_photos.album_id
          AND community_posts.is_approved = true
          AND community_posts.status = 'published'::public.post_status_enum
    )
    OR EXISTS (
        SELECT 1
        FROM public.community_albums
        JOIN public.properties ON properties.id = community_albums.property_id
        WHERE community_albums.id = community_photos.album_id
          AND properties.landlord_id = (select auth.uid())
    )
    OR uploaded_by = (select auth.uid())
)
WITH CHECK (
    uploaded_by = (select auth.uid())
    OR EXISTS (
        SELECT 1
        FROM public.community_albums
        JOIN public.properties ON properties.id = community_albums.property_id
        WHERE community_albums.id = community_photos.album_id
          AND properties.landlord_id = (select auth.uid())
    )
);
