-- saved_posts table for persisting user's saved community posts
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references community_posts(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

-- Index for faster lookups
CREATE INDEX idx_saved_posts_user ON saved_posts(user_id);
CREATE INDEX idx_saved_posts_post ON saved_posts(post_id);

-- Enable RLS
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can save posts
CREATE POLICY "Users can save posts" ON saved_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can unsave posts
CREATE POLICY "Users can unsave posts" ON saved_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: Users can view their own saved posts
CREATE POLICY "Users can view own saved posts" ON saved_posts
  FOR SELECT USING (auth.uid() = user_id);

-- Comments table: Add updated_at trigger for edits
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_community_comments_updated_at
  BEFORE UPDATE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();