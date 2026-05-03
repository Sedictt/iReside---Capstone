-- Enable RLS on all community tables
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

-- Posts: tenants can read posts for their property only
CREATE POLICY "Tenants can view approved posts for their property"
ON community_posts FOR SELECT
USING (
    is_approved = true
    AND status = 'published'
    AND property_id IN (
        SELECT units.property_id
        FROM leases
        JOIN units ON units.id = leases.unit_id
        WHERE leases.tenant_id = auth.uid()
          AND leases.status = 'active'
    )
);

-- Landlords can read/write posts for their properties
CREATE POLICY "Landlords can manage posts for their properties"
ON community_posts FOR ALL
USING (
    property_id IN (
        SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
);

-- Comments: read same visibility as parent post
CREATE POLICY "Comments visible with post"
ON community_comments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM community_posts
        WHERE community_posts.id = community_comments.post_id
          AND community_posts.is_approved = true
          AND community_posts.status = 'published'
    )
);

-- Anyone authenticated can comment (subject to post visibility)
CREATE POLICY "Authenticated users can comment"
ON community_comments FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Reactions: same visibility as post
CREATE POLICY "Reactions visible with post"
ON community_reactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM community_posts
        WHERE community_posts.id = community_reactions.post_id
          AND community_posts.is_approved = true
          AND community_posts.status = 'published'
    )
);

CREATE POLICY "Users can manage own reactions"
ON community_reactions FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Poll votes: same as reactions
CREATE POLICY "Poll votes visible with post"
ON community_poll_votes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM community_posts
        WHERE community_posts.id = community_poll_votes.poll_id
          AND community_posts.is_approved = true
          AND community_posts.status = 'published'
    )
);

CREATE POLICY "Users can manage own poll votes"
ON community_poll_votes FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Content reports: reporter and landlord can view
CREATE POLICY "Reporter and property landlord can view reports"
ON content_reports FOR SELECT
USING (
    reporter_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM community_posts
        JOIN properties ON properties.id = community_posts.property_id
        WHERE community_posts.id = content_reports.post_id
          AND properties.landlord_id = auth.uid()
    )
);

CREATE POLICY "Landlord can update reports"
ON content_reports FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM community_posts
        JOIN properties ON properties.id = community_posts.property_id
        WHERE community_posts.id = content_reports.post_id
          AND properties.landlord_id = auth.uid()
    )
);

-- Albums and photos: same as posts
CREATE POLICY "Albums visible with published posts"
ON community_albums FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM community_posts
        WHERE community_posts.id = community_albums.post_id
          AND community_posts.is_approved = true
          AND community_posts.status = 'published'
    )
);

CREATE POLICY "Photos visible with album"
ON community_photos FOR SELECT
USING (
    album_id IN (
        SELECT id FROM community_albums
        WHERE EXISTS (
            SELECT 1 FROM community_posts
            WHERE community_posts.id = community_albums.post_id
              AND community_posts.is_approved = true
              AND community_posts.status = 'published'
        )
    )
);

-- Post views: authors can view, system can insert
CREATE POLICY "Post views insert allowed"
ON post_views FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors can view post stats"
ON post_views FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM community_posts
        WHERE community_posts.id = post_views.post_id
          AND community_posts.author_id = auth.uid()
    )
);
