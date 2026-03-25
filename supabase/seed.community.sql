-- Community Hub seed data
-- Run after base seed.sql, e.g.:
--   supabase db reset
--   supabase db query -f supabase/seed.community.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Community posts (announcements, polls, albums, discussions)
-- ---------------------------------------------------------------------------
INSERT INTO public.community_posts (
  id,
  property_id,
  author_id,
  author_role,
  type,
  title,
  content,
  metadata,
  is_pinned,
  is_moderated,
  is_approved,
  status,
  view_count,
  created_at,
  updated_at
) VALUES
  (
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c101',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '11111111-1111-1111-1111-111111111111',
    'landlord',
    'announcement',
    'Water Interruption Notice - Maple Grove',
    'Please store enough water. Building maintenance will run line cleaning tomorrow from 10:00 AM to 1:00 PM.',
    '{"priority":"high","category":"utilities"}'::jsonb,
    true,
    false,
    true,
    'published',
    42,
    now() - INTERVAL '4 days',
    now() - INTERVAL '4 days'
  ),
  (
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c102',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '11111111-1111-1111-1111-111111111111',
    'landlord',
    'poll',
    'Choose the weekend cleanup schedule',
    'Vote for your preferred time so we can coordinate building-wide deep cleaning.',
    '{"poll_options":["Saturday 9:00 AM","Saturday 2:00 PM","Sunday 10:00 AM"],"poll_closes_at":"2026-04-15T10:00:00Z"}'::jsonb,
    false,
    false,
    true,
    'published',
    35,
    now() - INTERVAL '3 days',
    now() - INTERVAL '3 days'
  ),
  (
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c103',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    '22222222-2222-2222-2222-222222222222',
    'landlord',
    'photo_album',
    'Townhome 1 common area refresh',
    'New lighting and seating were installed in the shared lobby this week.',
    '{"album_theme":"lobby refresh"}'::jsonb,
    false,
    false,
    true,
    'published',
    27,
    now() - INTERVAL '2 days',
    now() - INTERVAL '2 days'
  ),
  (
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c104',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
    '33333333-3333-3333-3333-333333333336',
    'tenant',
    'discussion',
    'Recommended nearby laundry service?',
    'Anyone have a reliable laundry pickup service around Marulas with same-day return?',
    '{"tags":["recommendations","services"]}'::jsonb,
    false,
    true,
    true,
    'published',
    19,
    now() - INTERVAL '36 hours',
    now() - INTERVAL '36 hours'
  ),
  (
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c105',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '33333333-3333-3333-3333-333333333333',
    'tenant',
    'discussion',
    'Can we allow bikes in the elevator?',
    'Requesting a policy update for carrying foldable bikes to upper floors during off-peak hours.',
    '{"tags":["policy","transport"]}'::jsonb,
    false,
    true,
    false,
    'published',
    8,
    now() - INTERVAL '18 hours',
    now() - INTERVAL '18 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  property_id = EXCLUDED.property_id,
  author_id = EXCLUDED.author_id,
  author_role = EXCLUDED.author_role,
  type = EXCLUDED.type,
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  is_pinned = EXCLUDED.is_pinned,
  is_moderated = EXCLUDED.is_moderated,
  is_approved = EXCLUDED.is_approved,
  status = EXCLUDED.status,
  view_count = EXCLUDED.view_count,
  created_at = EXCLUDED.created_at,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 2) Community comments
-- ---------------------------------------------------------------------------
INSERT INTO public.community_comments (
  id,
  post_id,
  author_id,
  content,
  parent_comment_id,
  created_at,
  updated_at
) VALUES
  (
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c201',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c101',
    '33333333-3333-3333-3333-333333333333',
    'Thanks for the heads up. I will prepare extra containers tonight.',
    NULL,
    now() - INTERVAL '3 days 20 hours',
    now() - INTERVAL '3 days 20 hours'
  ),
  (
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c202',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c102',
    '44444444-4444-4444-4444-444444444444',
    'Saturday morning works best for our unit.',
    NULL,
    now() - INTERVAL '2 days 22 hours',
    now() - INTERVAL '2 days 22 hours'
  ),
  (
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c203',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c104',
    '33333333-3333-3333-3333-333333333335',
    'Try FreshSpin near Maysan Road. They have pickup until 8 PM.',
    NULL,
    now() - INTERVAL '30 hours',
    now() - INTERVAL '30 hours'
  ),
  (
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c204',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c104',
    '33333333-3333-3333-3333-333333333336',
    'Great, thank you! I will check them out this weekend.',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c203',
    now() - INTERVAL '28 hours',
    now() - INTERVAL '28 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  post_id = EXCLUDED.post_id,
  author_id = EXCLUDED.author_id,
  content = EXCLUDED.content,
  parent_comment_id = EXCLUDED.parent_comment_id,
  created_at = EXCLUDED.created_at,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 3) Reactions and poll votes
-- ---------------------------------------------------------------------------
INSERT INTO public.community_reactions (
  id,
  post_id,
  user_id,
  reaction_type,
  created_at
) VALUES
  (
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c301',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c101',
    '33333333-3333-3333-3333-333333333333',
    'thumbs_up',
    now() - INTERVAL '3 days 18 hours'
  ),
  (
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c302',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c101',
    '44444444-4444-4444-4444-444444444444',
    'like',
    now() - INTERVAL '3 days 16 hours'
  ),
  (
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c303',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c104',
    '33333333-3333-3333-3333-333333333335',
    'heart',
    now() - INTERVAL '29 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  post_id = EXCLUDED.post_id,
  user_id = EXCLUDED.user_id,
  reaction_type = EXCLUDED.reaction_type,
  created_at = EXCLUDED.created_at;

INSERT INTO public.community_poll_votes (
  id,
  poll_id,
  user_id,
  option_index,
  created_at
) VALUES
  (
    'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c401',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c102',
    '33333333-3333-3333-3333-333333333333',
    0,
    now() - INTERVAL '2 days 20 hours'
  ),
  (
    'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c402',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c102',
    '44444444-4444-4444-4444-444444444444',
    2,
    now() - INTERVAL '2 days 19 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  poll_id = EXCLUDED.poll_id,
  user_id = EXCLUDED.user_id,
  option_index = EXCLUDED.option_index,
  created_at = EXCLUDED.created_at;

-- ---------------------------------------------------------------------------
-- 4) Photo album and photos
-- ---------------------------------------------------------------------------
INSERT INTO public.community_albums (
  id,
  post_id,
  property_id,
  cover_photo_url,
  photo_count,
  created_at,
  updated_at
) VALUES
  (
    'c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c501',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c103',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    '/unit-seeds/sample-unit-01/649846674_34693053806952308_1196412596089010147_n.jpg',
    3,
    now() - INTERVAL '2 days',
    now() - INTERVAL '2 days'
  )
ON CONFLICT (id) DO UPDATE SET
  post_id = EXCLUDED.post_id,
  property_id = EXCLUDED.property_id,
  cover_photo_url = EXCLUDED.cover_photo_url,
  photo_count = EXCLUDED.photo_count,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.community_photos (
  id,
  album_id,
  url,
  caption,
  display_order,
  uploaded_by,
  created_at
) VALUES
  (
    'c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c601',
    'c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c501',
    '/unit-seeds/sample-unit-01/649846674_34693053806952308_1196412596089010147_n.jpg',
    'Refreshed lobby seating and warm lighting.',
    0,
    '22222222-2222-2222-2222-222222222222',
    now() - INTERVAL '2 days'
  ),
  (
    'c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c602',
    'c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c501',
    '/unit-seeds/sample-unit-01/650043769_34693053833618972_3658353281902435325_n.jpg',
    'New hallway paint and lighting fixtures.',
    1,
    '22222222-2222-2222-2222-222222222222',
    now() - INTERVAL '47 hours'
  ),
  (
    'c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c603',
    'c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c501',
    '/unit-seeds/sample-unit-01/650160479_34693054520285570_8056417761762817380_n.jpg',
    'Shared waiting area after cleanup.',
    2,
    '22222222-2222-2222-2222-222222222222',
    now() - INTERVAL '46 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  album_id = EXCLUDED.album_id,
  url = EXCLUDED.url,
  caption = EXCLUDED.caption,
  display_order = EXCLUDED.display_order,
  uploaded_by = EXCLUDED.uploaded_by,
  created_at = EXCLUDED.created_at;

-- ---------------------------------------------------------------------------
-- 5) Reports and historical views
-- ---------------------------------------------------------------------------
INSERT INTO public.content_reports (
  id,
  post_id,
  reporter_id,
  reason,
  status,
  moderator_notes,
  reviewed_by,
  reviewed_at,
  created_at
) VALUES
  (
    'c7c7c7c7-c7c7-c7c7-c7c7-c7c7c7c7c701',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c105',
    '44444444-4444-4444-4444-444444444444',
    'Potential policy request that needs landlord review first.',
    'reviewed',
    'Kept visible only to moderators until policy draft is finalized.',
    '11111111-1111-1111-1111-111111111111',
    now() - INTERVAL '12 hours',
    now() - INTERVAL '14 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  post_id = EXCLUDED.post_id,
  reporter_id = EXCLUDED.reporter_id,
  reason = EXCLUDED.reason,
  status = EXCLUDED.status,
  moderator_notes = EXCLUDED.moderator_notes,
  reviewed_by = EXCLUDED.reviewed_by,
  reviewed_at = EXCLUDED.reviewed_at,
  created_at = EXCLUDED.created_at;

INSERT INTO public.post_views (
  id,
  post_id,
  user_id,
  session_id,
  viewed_at
) VALUES
  (
    'c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c801',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c101',
    '33333333-3333-3333-3333-333333333333',
    NULL,
    now() - INTERVAL '3 days'
  ),
  (
    'c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c802',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c102',
    NULL,
    'seed-session-tenant-feed-01',
    now() - INTERVAL '3 days'
  ),
  (
    'c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c803',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c104',
    '33333333-3333-3333-3333-333333333335',
    NULL,
    now() - INTERVAL '2 days'
  )
ON CONFLICT (id) DO UPDATE SET
  post_id = EXCLUDED.post_id,
  user_id = EXCLUDED.user_id,
  session_id = EXCLUDED.session_id,
  viewed_at = EXCLUDED.viewed_at;

COMMIT;
