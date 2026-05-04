-- Align Community Hub permissions with role matrix.

-- Replace overly broad landlord policy with explicit create/approve/edit/delete controls.
DROP POLICY IF EXISTS "Landlords can manage posts for their properties" ON community_posts;

-- Tenants can only create discussion posts in their active lease property, pending moderation.
DROP POLICY IF EXISTS "Tenants can create community posts for active lease property" ON community_posts;
DROP POLICY IF EXISTS "Tenants can create discussion posts for active lease property" ON community_posts;
CREATE POLICY "Tenants can create discussion posts for active lease property"
ON community_posts FOR INSERT
TO authenticated
WITH CHECK (
  auth.role() = 'authenticated'
  AND author_id = auth.uid()
  AND author_role = 'tenant'
  AND type = 'discussion'
  AND is_approved = false
  AND is_moderated = true
  AND property_id IN (
    SELECT units.property_id
    FROM leases
    JOIN units ON units.id = leases.unit_id
    WHERE leases.tenant_id = auth.uid()
      AND leases.status = 'active'
  )
);

-- Landlords and admins can create any community post type.
DROP POLICY IF EXISTS "Management can create community posts" ON community_posts;
CREATE POLICY "Management can create community posts"
ON community_posts FOR INSERT
TO authenticated
WITH CHECK (
  auth.role() = 'authenticated'
  AND author_id = auth.uid()
  AND author_role = 'landlord'
  AND is_approved = true
  AND type IN ('announcement', 'discussion', 'poll', 'photo_album')
  AND (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
);

-- Landlords and admins can view published posts across their managed communities.
DROP POLICY IF EXISTS "Management can view published community posts" ON community_posts;
CREATE POLICY "Management can view published community posts"
ON community_posts FOR SELECT
TO authenticated
USING (
  is_approved = true
  AND status = 'published'
  AND (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
);

-- Landlords and admins can view pending resident posts for moderation.
DROP POLICY IF EXISTS "Management can view resident moderation queue" ON community_posts;
CREATE POLICY "Management can view resident moderation queue"
ON community_posts FOR SELECT
TO authenticated
USING (
  author_role = 'tenant'
  AND is_approved = false
  AND (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
);

-- Users can edit their own posts only.
DROP POLICY IF EXISTS "Users can update own community posts" ON community_posts;
CREATE POLICY "Users can update own community posts"
ON community_posts FOR UPDATE
TO authenticated
USING (
  author_id = auth.uid()
)
WITH CHECK (
  author_id = auth.uid()
  AND (
    author_role <> 'landlord'
    OR is_approved = true
  )
  AND (
    author_role <> 'tenant'
    OR is_approved = false
  )
);

-- Users can delete their own posts only.
DROP POLICY IF EXISTS "Users can delete own community posts" ON community_posts;
CREATE POLICY "Users can delete own community posts"
ON community_posts FOR DELETE
TO authenticated
USING (
  author_id = auth.uid()
);

-- Landlords and admins can approve resident posts for moderation workflow.
DROP POLICY IF EXISTS "Management can approve resident posts" ON community_posts;
CREATE POLICY "Management can approve resident posts"
ON community_posts FOR UPDATE
TO authenticated
USING (
  author_role = 'tenant'
  AND (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
)
WITH CHECK (
  author_role = 'tenant'
  AND (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
);

-- Keep tenant pending visibility policy name in sync.
DROP POLICY IF EXISTS "Tenants can view own pending posts" ON community_posts;
CREATE POLICY "Tenants can view own pending posts"
ON community_posts FOR SELECT
TO authenticated
USING (
  author_id = auth.uid()
  AND author_role = 'tenant'
  AND is_approved = false
  AND property_id IN (
    SELECT units.property_id
    FROM leases
    JOIN units ON units.id = leases.unit_id
    WHERE leases.tenant_id = auth.uid()
      AND leases.status = 'active'
  )
);
