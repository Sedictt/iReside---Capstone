-- Consolidate community_posts policies into one policy per command and wrap auth
-- calls so Supabase can evaluate them once per statement.

DROP POLICY IF EXISTS "Management can approve resident posts" ON public.community_posts;
DROP POLICY IF EXISTS "Management can create community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Management can view published community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Management can view resident moderation queue" ON public.community_posts;
DROP POLICY IF EXISTS "Tenants can create discussion posts for active lease property" ON public.community_posts;
DROP POLICY IF EXISTS "Tenants can create posts for their property" ON public.community_posts;
DROP POLICY IF EXISTS "Tenants can delete own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Tenants can update own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Tenants can view approved posts for their property" ON public.community_posts;
DROP POLICY IF EXISTS "Tenants can view own pending posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete own community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can update own community posts" ON public.community_posts;

CREATE POLICY "Community post stakeholders can view posts"
ON public.community_posts
FOR SELECT
TO authenticated
USING (
    (
        is_approved = true
        AND status = 'published'::public.post_status_enum
        AND (
            (((select auth.jwt()) -> 'user_metadata'::text) ->> 'role'::text) = 'admin'
            OR EXISTS (
                SELECT 1
                FROM public.properties
                WHERE properties.id = community_posts.property_id
                  AND properties.landlord_id = (select auth.uid())
            )
            OR EXISTS (
                SELECT 1
                FROM public.leases
                JOIN public.units ON units.id = leases.unit_id
                WHERE units.property_id = community_posts.property_id
                  AND leases.tenant_id = (select auth.uid())
                  AND leases.status = 'active'::public.lease_status
            )
        )
    )
    OR (
        author_role = 'tenant'::public.user_role
        AND is_approved = false
        AND (
            author_id = (select auth.uid())
            OR (((select auth.jwt()) -> 'user_metadata'::text) ->> 'role'::text) = 'admin'
            OR EXISTS (
                SELECT 1
                FROM public.properties
                WHERE properties.id = community_posts.property_id
                  AND properties.landlord_id = (select auth.uid())
            )
        )
    )
);

CREATE POLICY "Community members can create posts"
ON public.community_posts
FOR INSERT
TO authenticated
WITH CHECK (
    (select auth.role()) = 'authenticated'
    AND author_id = (select auth.uid())
    AND (
        (
            author_role = 'landlord'::public.user_role
            AND is_approved = true
            AND type = ANY (
                ARRAY[
                    'announcement'::public.post_type_enum,
                    'discussion'::public.post_type_enum,
                    'poll'::public.post_type_enum,
                    'photo_album'::public.post_type_enum
                ]
            )
            AND (
                (((select auth.jwt()) -> 'user_metadata'::text) ->> 'role'::text) = 'admin'
                OR EXISTS (
                    SELECT 1
                    FROM public.properties
                    WHERE properties.id = community_posts.property_id
                      AND properties.landlord_id = (select auth.uid())
                )
            )
        )
        OR (
            author_role = 'tenant'::public.user_role
            AND type = 'discussion'::public.post_type_enum
            AND EXISTS (
                SELECT 1
                FROM public.leases
                JOIN public.units ON units.id = leases.unit_id
                WHERE units.property_id = community_posts.property_id
                  AND leases.tenant_id = (select auth.uid())
                  AND leases.status = 'active'::public.lease_status
            )
        )
    )
);

CREATE POLICY "Community post stakeholders can update posts"
ON public.community_posts
FOR UPDATE
TO authenticated
USING (
    author_id = (select auth.uid())
    OR (
        author_role = 'tenant'::public.user_role
        AND (
            (((select auth.jwt()) -> 'user_metadata'::text) ->> 'role'::text) = 'admin'
            OR EXISTS (
                SELECT 1
                FROM public.properties
                WHERE properties.id = community_posts.property_id
                  AND properties.landlord_id = (select auth.uid())
            )
        )
    )
)
WITH CHECK (
    (
        author_id = (select auth.uid())
        AND (
            (author_role <> 'landlord'::public.user_role OR is_approved = true)
            AND (author_role <> 'tenant'::public.user_role OR is_approved = false)
        )
    )
    OR (
        author_role = 'tenant'::public.user_role
        AND (
            (((select auth.jwt()) -> 'user_metadata'::text) ->> 'role'::text) = 'admin'
            OR EXISTS (
                SELECT 1
                FROM public.properties
                WHERE properties.id = community_posts.property_id
                  AND properties.landlord_id = (select auth.uid())
            )
        )
    )
);

CREATE POLICY "Community post authors can delete posts"
ON public.community_posts
FOR DELETE
TO authenticated
USING (author_id = (select auth.uid()));
