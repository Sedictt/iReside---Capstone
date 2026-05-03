-- Tenants can insert posts for their properties
CREATE POLICY "Tenants can create posts for their property"
ON community_posts FOR INSERT
WITH CHECK (
    author_id = auth.uid()
    AND property_id IN (
        SELECT units.property_id
        FROM leases
        JOIN units ON units.id = leases.unit_id
        WHERE leases.tenant_id = auth.uid()
          AND leases.status = 'active'
    )
);

-- Tenants can update their own posts
CREATE POLICY "Tenants can update own posts"
ON community_posts FOR UPDATE
USING (author_id = auth.uid());

-- Tenants can delete their own posts
CREATE POLICY "Tenants can delete own posts"
ON community_posts FOR DELETE
USING (author_id = auth.uid());

-- Landlords can manage albums for their properties
CREATE POLICY "Landlords can manage albums"
ON community_albums FOR ALL
USING (
    property_id IN (
        SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
);

-- Tenants can manage albums for their own posts
CREATE POLICY "Tenants can manage own albums"
ON community_albums FOR ALL
USING (
    post_id IN (
        SELECT id FROM community_posts WHERE author_id = auth.uid()
    )
)
WITH CHECK (
    post_id IN (
        SELECT id FROM community_posts WHERE author_id = auth.uid()
    )
);

-- Landlords can manage photos for their properties
CREATE POLICY "Landlords can manage photos"
ON community_photos FOR ALL
USING (
    album_id IN (
        SELECT id FROM community_albums WHERE property_id IN (
            SELECT id FROM properties WHERE landlord_id = auth.uid()
        )
    )
);

-- Tenants can manage their own photos
CREATE POLICY "Tenants can manage own photos"
ON community_photos FOR ALL
USING ( uploaded_by = auth.uid() )
WITH CHECK ( uploaded_by = auth.uid() );
