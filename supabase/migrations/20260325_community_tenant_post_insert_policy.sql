-- Allow tenants to create community posts only within their active lease property
-- while preserving moderation and role boundaries.

DROP POLICY IF EXISTS "Tenants can create community posts for active lease property" ON community_posts;
CREATE POLICY "Tenants can create community posts for active lease property"
ON community_posts FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND author_id = auth.uid()
  AND author_role = 'tenant'
  AND type IN ('discussion', 'poll', 'photo_album')
  AND property_id IN (
    SELECT units.property_id
    FROM leases
    JOIN units ON units.id = leases.unit_id
    WHERE leases.tenant_id = auth.uid()
      AND leases.status = 'active'
  )
);

-- Allow tenants to view their own pending/unapproved posts for moderation tracking.
DROP POLICY IF EXISTS "Tenants can view own pending posts" ON community_posts;
CREATE POLICY "Tenants can view own pending posts"
ON community_posts FOR SELECT
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

-- Allow authenticated users to submit reports as themselves.
DROP POLICY IF EXISTS "Authenticated users can create reports" ON content_reports;
CREATE POLICY "Authenticated users can create reports"
ON content_reports FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND reporter_id = auth.uid()
);
