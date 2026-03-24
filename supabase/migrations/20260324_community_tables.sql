-- community_posts
create table community_posts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  author_id uuid not null references profiles(id),
  author_role user_role not null,
  type post_type_enum not null,
  title text not null,
  content text,
  metadata jsonb,
  is_pinned boolean default false,
  is_moderated boolean default false,
  is_approved boolean default false,
  status post_status_enum default 'published',
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_community_posts_property_created on community_posts(property_id, created_at desc);
create index idx_community_posts_property_approved on community_posts(property_id, is_approved, created_at desc);
create index idx_community_posts_approved on community_posts(is_approved, status, created_at desc);

-- community_comments
create table community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  author_id uuid not null references profiles(id),
  content text not null,
  parent_comment_id uuid references community_comments(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_community_comments_post on community_comments(post_id, created_at asc);

-- community_reactions
create table community_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id),
  reaction_type reaction_type_enum not null,
  created_at timestamptz default now(),
  unique(post_id, user_id, reaction_type)
);

create index idx_community_reactions_post_user on community_reactions(post_id, user_id);

-- community_poll_votes
create table community_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id),
  option_index integer not null check (option_index >= 0),
  created_at timestamptz default now(),
  unique(poll_id, user_id)
);

create index idx_community_poll_votes_poll on community_poll_votes(poll_id);

-- content_reports (reuse or create new)
create table content_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  reporter_id uuid not null references profiles(id),
  reason text not null,
  status report_status_enum default 'pending',
  moderator_notes text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create index idx_content_reports_post on content_reports(post_id);
create index idx_content_reports_reporter on content_reports(reporter_id);

-- community_albums
create table community_albums (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references community_posts(id) on delete cascade,
  property_id uuid not null references properties(id),
  cover_photo_url text,
  photo_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- community_photos
create table community_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references community_albums(id) on delete cascade,
  url text not null,
  caption text,
  display_order integer not null default 0,
  uploaded_by uuid not null references profiles(id),
  created_at timestamptz default now()
);

create index idx_community_photos_album on community_photos(album_id, display_order asc);

-- post_views
create table post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid references profiles(id),
  session_id text,
  viewed_at timestamptz default now()
);

create index idx_post_views_post on post_views(post_id);
create index idx_post_views_user_session on post_views(post_id, user_id, session_id);

-- Partial unique index for daily deduplication: one view per user/session per day per post
CREATE UNIQUE INDEX idx_post_views_daily_unique ON post_views (post_id, COALESCE(user_id::text, session_id), DATE(viewed_at))
WHERE viewed_at >= NOW() - INTERVAL '24 hours';

-- Function to increment view count atomically
create or replace function increment_post_view(p_post_id uuid, p_user_id uuid, p_session_id text)
returns void as $$
begin
  insert into post_views (post_id, user_id, session_id, viewed_at)
  values (p_post_id, p_user_id, p_session_id, now())
  on conflict do nothing;

  update community_posts
  set view_count = view_count + 1
  where id = p_post_id;
end;
$$ language plpgsql;
