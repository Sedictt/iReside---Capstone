# Community Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace public landing page with a tenant-exclusive Community Hub featuring feed-based social layout with announcements, polls, photo albums, and discussions.

**Architecture:** Feed-based social layout (Facebook-style) with property-isolated posts, real-time poll updates, and moderation workflow. Uses Next.js Server Actions, Supabase, and shadcn/ui components. The root route (`/`) becomes conditional: authenticated tenants see Community Hub, unauthenticated users see login redirect.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (PostgreSQL), shadcn/ui, Framer Motion, Tailwind CSS, Vitest + Testing Library, Playwright

---

## File Structure

```
Database Changes (Supabase Migrations):
- supabase/migrations/YYYYMMDD_community_enums.sql (post_type_enum, post_status_enum, reaction_type_enum, report_status_enum)
- supabase/migrations/YYYYMMDD_community_tables.sql (community_posts, community_comments, community_reactions, community_poll_votes, content_reports, community_albums, community_photos, post_views)

Type System:
- src/types/database.ts (Update: add Community* types, extend Enums, add Tables interface)

Server Actions (Data Layer):
- src/lib/community/actions.ts (all server actions: getPosts, createDiscussionPost, votePoll, addReaction, addComment, reportPost, getAlbumPhotos, landlord management actions)

Query Utilities:
- src/lib/community/queries.ts (helper functions: getTenantPropertyId, etc.)

Client Components (UI):
- src/components/community/
  ├── CommunityHub.tsx (main container with AuthGuard, PropertyContext, feed)
  ├── CommunityFeed.tsx (infinite scroll list)
  ├── PostCard/
  │   ├── PostCard.tsx (generic wrapper)
  │   ├── PostHeader.tsx (author, timestamp, pinned badge)
  │   ├── PostContent.tsx (dynamic content based on type)
  │   ├── ReactionBar.tsx (like/react/share/report buttons)
  │   └── CommentPreview.tsx (last 2 comments)
  ├── PollCard.tsx (extends PostCard, voting UI + results bars)
  ├── PhotoAlbumCard.tsx (extends PostCard, 2x2 photo grid)
  ├── DiscussionCard.tsx (extends PostCard, content preview)
  ├── AnnouncementCard.tsx (extends PostCard, special styling)
  ├── CommentSection/
  │   ├── CommentSection.tsx (modal overlay)
  │   ├── CommentItem.tsx (single comment with reply)
  │   └── CommentForm.tsx (textarea + submit)
  ├── GalleryModal.tsx (lightbox for album photos)
  ├── PollResultsModal.tsx (detailed poll breakdown)
  ├── CreatePostModal/
  │   ├── index.tsx (tenant discussion only)
  │   └── LandlordPostModal.tsx (all types for landlord)
  └── Moderation/
      ├── ModerationQueue.tsx (landlord page content)
      └── ModerationDashboard.tsx (filter + bulk actions)

Landlord Page:
- src/app/landlord/community/page.tsx (moderation dashboard + create post)

Root Route (Modified):
- src/app/page.tsx (conditional: CommunityHub for tenants, login redirect for guests)

Tests:
- src/lib/community/__tests__/actions.test.ts
- src/components/community/__tests__/PostCard.test.tsx
- src/components/community/__tests__/PollCard.test.tsx
- src/components/community/__tests__/CommentSection.test.tsx
- e2e/community-hub.spec.ts (Playwright)
```

---

## Phase 1: Database Schema & Type System

### Task 1.1: Create Community Enums Migration

**Files:**
- Create: `supabase/migrations/YYYYMMDD_community_enums.sql`
- Test: Manual verification via Supabase SQL editor

**Step 1: Write the migration file**

```sql
-- community enums
create type post_type_enum as enum ('announcement', 'poll', 'photo_album', 'discussion');
create type post_status_enum as enum ('draft', 'published', 'archived');
create type reaction_type_enum as enum ('like', 'heart', 'thumbs_up', 'clap', 'celebration');
create type report_status_enum as enum ('pending', 'reviewed', 'dismissed', 'escalated');
```

**Step 2: Run migration locally**

```bash
# Execute SQL in Supabase local instance or staging
# Verify: \d+ post_type_enum (should list enum values)
```

**Step 3: Commit**

```bash
git add supabase/migrations/YYYYMMDD_community_enums.sql
git commit -m "feat: add community post enums"
```

---

### Task 1.2: Create Community Tables Migration

**Files:**
- Create: `supabase/migrations/YYYYMMDD_community_tables.sql`
- Test: Manual verification + check indexes

**Step 1: Write the migration file**

```sql
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
```

**Step 2: Add helper function for view tracking (optional)**

```sql
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
```

**Step 3: Run migration + verify**

```bash
# Execute in Supabase
# Verify all tables exist with correct columns and indexes
```

**Step 4: Commit**

```bash
git add supabase/migrations/YYYYMMDD_community_tables.sql
git commit -m "feat: add community hub tables"
```

---

### Task 1.3: Enable RLS and Create Access Policies

**Files:**
- Modify: `supabase/migrations/YYYYMMDD_community_tables.sql` (append RLS policies)
- Create: `supabase/migrations/YYYYMMDD_community_rls.sql` (separate RLS policies)

**Step 1: Enable Row Level Security**

```sql
-- Enable RLS on all community tables
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
```

**Step 2: Create RLS Policies**

```sql
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
```

**Step 3: Verify policies**

```bash
# In Supabase SQL editor, test RLS:
-- Try as tenant: should only see posts for own property
-- Try as landlord: should see posts for owned properties only
```

**Step 4: Commit**

```bash
git add supabase/migrations/YYYYMMDD_community_rls.sql
git commit -m "feat: add RLS policies for community hub"
```

**Files:**
- Modify: `src/types/database.ts`
- Test: `npx tsc --noEmit` should pass

**Step 1: Add new enums to Database['public']['Enums']**

Add after line 21 (before convenience types):
```typescript
export type PostType = 'announcement' | 'poll' | 'photo_album' | 'discussion';
export type PostStatus = 'draft' | 'published' | 'archived';
export type ReactionType = 'like' | 'heart' | 'thumbs_up' | 'clap' | 'celebration';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'escalated';
```

Update `Enums` interface:
```typescript
Enums: {
    user_role: UserRole
    property_type: PropertyType
    unit_status: UnitStatus
    lease_status: LeaseStatus
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    application_status: ApplicationStatus
    maintenance_status: MaintenanceStatus
    maintenance_priority: MaintenancePriority
    move_out_status: MoveOutStatus
    message_type: MessageType
    notification_type: NotificationType
    // ADD:
    post_type: PostType
    post_status: PostStatus
    reaction_type: ReactionType
    report_status: ReportStatus
}
```

**Step 2: Add table interfaces in Tables**

Add after `notifications` table (keep alphabetical order by table name):
```typescript
community_posts: {
    Row: {
        id: string
        property_id: string
        author_id: string
        author_role: UserRole
        type: PostType
        title: string
        content: string | null
        metadata: Json | null
        is_pinned: boolean
        is_moderated: boolean
        is_approved: boolean
        status: PostStatus
        view_count: number
        created_at: string
        updated_at: string
    }
    Insert: {/* ... derive from Row, make id optional, set defaults */ }
    Update: {/* fields with id optional */ }
    Relationships: any[]
}
// Similarly for: community_comments, community_reactions, community_poll_votes, content_reports,
// community_albums, community_photos, post_views
```

**Step 3: Add convenience types at bottom**

```typescript
export type CommunityPost = Database['public']['Tables']['community_posts']['Row']
export type CommunityComment = Database['public']['Tables']['community_comments']['Row']
export type CommunityReaction = Database['public']['Tables']['community_reactions']['Row']
export type CommunityPollVote = Database['public']['Tables']['community_poll_votes']['Row']
export type ContentReport = Database['public']['Tables']['content_reports']['Row']
export type CommunityAlbum = Database['public']['Tables']['community_albums']['Row']
export type CommunityPhoto = Database['public']['Tables']['community_photos']['Row']
export type PostView = Database['public']['Tables']['post_views']['Row']
```

**Step 4: Type check**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add community hub database types"
```

---

## Phase 2: Server Actions & Data Layer

### Task 2.1: Property Resolution Utility

**Files:**
- Create: `src/lib/community/queries.ts`
- Test: `src/lib/community/__tests__/queries.test.ts`

**Step 1: Write utility function**

```typescript
// src/lib/community/queries.ts
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

export async function getTenantPropertyId(userId: string): Promise<string | null> {
    const supabase = createClient()

    // Get user's active lease
    const { data: lease, error } = await supabase
        .from('leases')
        .select('unit_id')
        .eq('tenant_id', userId)
        .eq('status', 'active')
        .single()

    if (error || !lease) {
        return null
    }

    // Get property_id from unit
    const { data: unit } = await supabase
        .from('units')
        .select('property_id')
        .eq('id', lease.unit_id)
        .single()

    return unit?.property_id || null
}
```

**Step 2: Write test (mocked)**

```typescript
// src/lib/community/__tests__/queries.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTenantPropertyId } from '../queries'

vi.mock('@/lib/supabase/server')

describe('getTenantPropertyId', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns property_id when user has active lease', async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { unit_id: 'unit-123' },
                error: null
            })
        }

        // Chain calls correctly
        const mockUnitResult = {
            data: { property_id: 'prop-456' },
            error: null
        }

        mockSupabase.from.mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValue({ data: { unit_id: 'unit-123' }, error: null })
            })
        }).from.mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValue(mockUnitResult)
            })
        })

        const result = await getTenantPropertyId('user-123')
        expect(result).toBe('prop-456')
    })

    it('returns null when no active lease', async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnValueOnce({
                    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                })
            })
        }

        const result = await getTenantPropertyId('user-123')
        expect(result).toBeNull()
    })
})
```

**Step 3: Run test - should fail initially**

```bash
cd src/lib/community
npx vitest __tests__/queries.test.ts --run
```
Expected: FAIL (undefined function)

**Step 4: Implement the actual code** (already done in Step 1)

**Step 5: Fix mock syntax in test** (may need iterative fix)

**Step 6: Re-run until pass**

```bash
npx vitest --run
```

**Step 7: Commit**

```bash
git add src/lib/community/queries.ts src/lib/community/__tests__/queries.test.ts
git commit -m "test: add getTenantPropertyId unit tests"
```

---

### Task 2.2: getPosts Server Action

**Files:**
- Create: `src/lib/community/actions.ts`
- Test: `src/lib/community/__tests__/actions.test.ts`

**Step 1: Write failing test**

```typescript
// src/lib/community/__tests__/actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPosts } from '../actions'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/community/queries', () => ({
    getTenantPropertyId: vi.fn()
}))

describe('getPosts', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('fetches approved posts for tenant property with reactions and comments', async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: [
                        {
                            id: 'post-1',
                            type: 'announcement',
                            title: 'Test Announcement',
                            content: 'Hello',
                            is_pinned: true,
                            created_at: '2025-01-01T00:00:00Z'
                        }
                    ],
                    error: null
                })
            })
        }

        const { getTenantPropertyId } = await import('../queries')
        vi.mocked(getTenantPropertyId).mockResolvedValue('prop-123')

        const result = await getPosts('user-123')
        expect(result.posts).toHaveLength(1)
        expect(result.posts[0].title).toBe('Test Announcement')
    })
})
```

**Step 2: Run test - expect FAIL (function not defined)**

```bash
npx vitest --run
```

**Step 3: Implement Server Action stub**

```typescript
// src/lib/community/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { getTenantPropertyId } from './queries'
import { Database } from '@/types/database'

export async function getPosts(userId: string, limit = 20, cursor?: string) {
    const supabase = createClient<Database>()

    // 1. Resolve tenant's property_id
    const propertyId = await getTenantPropertyId(userId)
    if (!propertyId) {
        return { posts: [], nextCursor: null }
    }

    // 2. Build query
    let query = supabase
        .from('community_posts')
        .select(`
            *,
            profiles!author_id ( full_name, avatar_url ),
            community_reactions ( user_id, reaction_type ),
            community_comments ( id )
        `)
        .eq('property_id', propertyId)
        .eq('is_approved', true)
        .eq('status', 'published')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

    if (cursor) {
        query = query.lt('created_at', cursor) // or use proper cursor with id+timestamp
    }

    const { data, error } = await query

    if (error) {
        console.error('getPosts error:', error)
        return { posts: [], nextCursor: null }
    }

    // 3. Transform: aggregate reactions, count comments
    const posts = data?.map(post => ({
        ...post,
        reactions: post.community_reactions?.reduce((acc: any, r: any) => {
            acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1
            return acc
        }, {}) || {},
        commentCount: post.community_comments?.length || 0,
        userReactions: post.community_reactions?.filter((r: any) => r.user_id === userId) || []
    })) || []

    const nextCursor = data?.length === limit ? data[data.length - 1].created_at : null

    return { posts, nextCursor }
}
```

**Step 4: Update test to match actual implementation**

```typescript
// Update test expectations
it('fetches approved posts for tenant property', async () => {
    const mockPost = {
        id: 'post-1',
        type: 'announcement',
        title: 'Test Announcement',
        content: 'Hello',
        is_pinned: true,
        created_at: '2025-01-01T00:00:00Z',
        metadata: null,
        author_id: 'author-1',
        author_role: 'landlord' as const,
        property_id: 'prop-123',
        is_moderated: false,
        is_approved: true,
        status: 'published' as const,
        view_count: 0
    }

    const mockSupabase = {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
                data: [mockPost],
                error: null
            })
        })
    }

    // ... mock getTenantPropertyId

    const result = await getPosts('user-123')
    expect(result.posts).toHaveLength(1)
    expect(result.posts[0]).toHaveProperty('reactions', {})
    expect(result.posts[0]).toHaveProperty('commentCount', 0)
})
```

**Step 5: Re-run test, fix until pass**

```bash
npx vitest --run
```

**Step 6: Implement full action with proper typing**

```typescript
// src/lib/community/actions.ts (complete)
'use server'

import { createClient } from '@/lib/supabase/server'
import { getTenantPropertyId } from './queries'
import { Database } from '@/types/database'
import { revalidatePath } from 'next/cache'

export async function getPosts(
    userId: string,
    limit = 20,
    cursor?: string
): Promise<{
    posts: Array<
        Database['public']['Tables']['community_posts']['Row'] & {
            author_name: string
            author_avatar: string | null
            reactions: Record<string, number>
            userReactions: Array<{ reaction_type: string }>
            commentCount: number
        }
    >
    nextCursor: string | null
}> {
    const supabase = createClient<Database>()

    const propertyId = await getTenantPropertyId(userId)
    if (!propertyId) {
        return { posts: [], nextCursor: null }
    }

    let query = supabase
        .from('community_posts')
        .select(`
            *,
            profiles!author_id ( full_name, avatar_url ),
            community_reactions ( reaction_type, user_id ),
            community_comments ( id )
        `)
        .eq('property_id', propertyId)
        .eq('is_approved', true)
        .eq('status', 'published')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit + 1) // fetch extra for cursor

    if (cursor) {
        query = query.lt('created_at', cursor)
    }

    const { data, error } = await query

    if (error || !data) {
        console.error('getPosts error:', error)
        return { posts: [], nextCursor: null }
    }

    const hasMore = data.length > limit
    const postsData = hasMore ? data.slice(0, limit) : data

    const posts = postsData.map(post => {
        const postAny = post as any
        const reactions = postAny.community_reactions?.reduce((acc: any, r: any) => {
            acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1
            return acc
        }, {}) || {}

        const userReactions = postAny.community_reactions?.filter((r: any) => r.user_id === userId) || []

        return {
            ...post,
            author_name: postAny.profiles?.full_name || 'Unknown',
            author_avatar: postAny.profiles?.avatar_url,
            reactions,
            userReactions: userReactions.map((r: any) => ({ reaction_type: r.reaction_type })),
            commentCount: postAny.community_comments?.length || 0
        }
    })

    const nextCursor = hasMore ? posts[posts.length - 1].created_at : null

    return { posts, nextCursor }
}
```

**Step 7: Commit**

```bash
git add src/lib/community/actions.ts src/lib/community/__tests__/actions.test.ts
git commit -m "feat: add getPosts server action"
```

---

### Task 2.3: getPollResults Server Action (for real-time updates)

**Files:**
- Modify: `src/lib/community/actions.ts`
- Modify: `src/lib/community/__tests__/actions.test.ts`

**Step 1: Write failing test**

```typescript
it('returns poll results with aggregated vote counts', async () => {
    const mockPollPost = {
        id: 'poll-1',
        type: 'poll' as const,
        metadata: { options: ['A', 'B', 'C'] }
    }

    const mockVotes = [
        { option_index: 0 },
        { option_index: 0 },
        { option_index: 1 }
    ]

    const mockSupabase = {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValue({ data: mockPollPost, error: null })
            }),
            eq: vi.fn().mockReturnValueOnce({
                count: vi.fn().mockResolvedValue({ count: 3, error: null })
            })
        })
    }

    const result = await getPollResults('user-123', 'poll-1')
    expect(result.success).toBe(true)
    expect(result.options).toEqual([
        { text: 'A', count: 2, percentage: 66.67 },
        { text: 'B', count: 1, percentage: 33.33 },
        { text: 'C', count: 0, percentage: 0 }
    ])
})
```

**Step 2: Run test (FAIL)**

**Step 3: Implement getPollResults**

```typescript
export async function getPollResults(
    pollId: string
): Promise<{
    success: boolean
    options?: Array<{ text: string; count: number; percentage: number }>
    totalVotes?: number
    error?: string
}> {
    const supabase = createClient<Database>()

    // Fetch poll with options from metadata
    const { data: poll, error: pollError } = await supabase
        .from('community_posts')
        .select('type, metadata')
        .eq('id', pollId)
        .eq('type', 'poll')
        .single()

    if (pollError || !poll) {
        return { success: false, error: 'Poll not found' }
    }

    const options = poll.metadata?.options || []
    const totalOptions = options.length

    // Get vote counts per option_index
    const { data: votes, error: countError } = await supabase
        .from('community_poll_votes')
        .select('option_index')
        .eq('poll_id', pollId)

    if (countError) {
        return { success: false, error: countError.message }
    }

    // Aggregate
    const counts = new Array(totalOptions).fill(0)
    votes?.forEach((v: any) => {
        const idx = v.option_index as number
        if (idx >= 0 && idx < totalOptions) {
            counts[idx]++
        }
    })

    const totalVotes = votes?.length || 0

    const enriched = options.map((text: string, idx: number) => ({
        text,
        count: counts[idx],
        percentage: totalVotes > 0 ? Math.round((counts[idx] / totalVotes) * 100 * 100) / 100 : 0
    }))

    return { success: true, options: enriched, totalVotes }
}
```

**Step 4: Update test mocks to handle two separate queries correctly**

**Step 5: Re-run, fix, commit**

```bash
npx vitest --run
git add src/lib/community/actions.ts
git commit -m "feat: add getPollResults server action"
```

---

### Task 2.4: getAlbumPhotos Server Action

**Files:**
- Modify: `src/lib/community/actions.ts`
- Test: add to `actions.test.ts`

**Step 1: Write failing test**

```typescript
it('returns ordered photos for album', async () => {
    const mockSupabase = {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValue({
                    data: { id: 'album-1', property_id: 'prop-123' },
                    error: null
                })
            }),
            eq: vi.fn().mockReturnValueOnce({
                order: vi.fn().mockResolvedValue({
                    data: [
                        { url: 'photo1.jpg', caption: 'A', display_order: 0 },
                        { url: 'photo2.jpg', caption: 'B', display_order: 1 }
                    ],
                    error: null
                })
            })
        })
    }

    const result = await getAlbumPhotos('user-123', 'album-1')
    expect(result.success).toBe(true)
    expect(result.photos).toHaveLength(2)
})
```

**Step 2: Implement**

```typescript
export async function getAlbumPhotos(
    userId: string,
    albumId: string
): Promise<{ success: boolean; photos?: Array<{ url: string; caption?: string }>; error?: string }> {
    const supabase = createClient<Database>()

    // Get album and verify property access
    const { data: album, error: albumError } = await supabase
        .from('community_albums')
        .select('id, property_id')
        .eq('id', albumId)
        .single()

    if (albumError || !album) {
        return { success: false, error: 'Album not found' }
    }

    const propertyId = await getTenantPropertyId(userId)
    if (propertyId !== album.property_id) {
        return { success: false, error: 'Unauthorized' }
    }

    const { data: photos, error: photosError } = await supabase
        .from('community_photos')
        .select('url, caption, display_order')
        .eq('album_id', albumId)
        .order('display_order', { ascending: true })

    if (photosError) {
        return { success: false, error: photosError.message }
    }

    return { success: true, photos: photos as any[] }
}
```

**Step 3: Commit**

```bash
git add src/lib/community/actions.ts
git commit -m "feat: add getAlbumPhotos server action"
```

---

### Task 2.5: getComments (or getPostDetail) Server Action

**Purpose:** Fetch all comments for a post with nested replies.

**Step 1: Write failing test (getComments)**

```typescript
it('fetches comments with nested replies (max depth 2)', async () => {
    const mockComments = [
        { id: 'c1', parent_comment_id: null, content: 'Parent', author_id: 'u1' },
        { id: 'c2', parent_comment_id: 'c1', content: 'Reply', author_id: 'u2' }
    ]

    const mockSupabase = {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockComments, error: null })
        })
    }

    const result = await getComments('user-123', 'post-1')
    expect(result.success).toBe(true)
    expect(result.comments).toHaveLength(2)
})
```

**Step 2: Implement getComments**

```typescript
export async function getComments(
    userId: string,
    postId: string
): Promise<{
    success: boolean
    comments?: Array<{
        id: string
        content: string
        author_id: string
        author_name: string
        parent_comment_id: string | null
        replies?: any[]
        created_at: string
    }>
    error?: string
}> {
    const supabase = createClient<Database>()

    // Verify post exists and property access
    const { data: post } = await supabase
        .from('community_posts')
        .select('property_id')
        .eq('id', postId)
        .single()

    if (!post) {
        return { success: false, error: 'Post not found' }
    }

    const propertyId = await getTenantPropertyId(userId)
    if (propertyId !== post.property_id) {
        return { success: false, error: 'Unauthorized' }
    }

    // Fetch all comments for this post with author profiles
    const { data: comments, error } = await supabase
        .from('community_comments')
        .select(`
            id,
            content,
            author_id,
            parent_comment_id,
            created_at,
            profiles!author_id ( full_name )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

    if (error) {
        return { success: false, error: error.message }
    }

    // Build tree (max depth 2)
    const commentMap = new Map()
    const roots: any[] = []

    comments?.forEach((c: any) => {
        const comment = {
            ...c,
            author_name: c.profiles?.full_name || 'Unknown',
            replies: []
        }
        commentMap.set(c.id, comment)

        if (c.parent_comment_id) {
            const parent = commentMap.get(c.parent_comment_id)
            if (parent && (!parent.parent_comment_id || parent.replies.length < 10)) {
                parent.replies?.push(comment)
            }
        } else {
            roots.push(comment)
        }
    })

    return { success: true, comments: roots }
}
```

**Step 3: Commit**

```bash
git add src/lib/community/actions.ts
git commit -m "feat: add getComments server action"
```

---

### Task 2.6: approvePost Server Action (Landlord)

**Files:**
- Modify: `src/lib/community/actions.ts`
- Test: `actions.test.ts`

**Step 1: Write failing test**

```typescript
it('allows landlord to approve resident discussion post', async () => {
    const mockSupabase = {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValue({
                    data: { id: 'post-1', property_id: 'prop-123', type: 'discussion' },
                    error: null
                })
            }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: { id: 'post-1' }, error: null })
            })
        })
    }

    const result = await approvePost('landlord-user', 'post-1')
    expect(result.success).toBe(true)
})
```

**Step 2: Implement approvePost**

```typescript
export async function approvePost(
    landlordId: string,
    postId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient<Database>()

    // Fetch post, verify it's a discussion and belongs to landlord's property
    const { data: post, error: postError } = await supabase
        .from('community_posts')
        .select('property_id, type, is_moderated')
        .eq('id', postId)
        .single()

    if (postError || !post) {
        return { success: false, error: 'Post not found' }
    }

    if (post.type !== 'discussion') {
        return { success: false, error: 'Only discussions require approval' }
    }

    // Verify landlord owns the property
    const { data: property } = await supabase
        .from('properties')
        .select('id')
        .eq('id', post.property_id)
        .eq('landlord_id', landlordId)
        .single()

    if (!property) {
        return { success: false, error: 'Unauthorized' }
    }

    // Approve: set is_approved = true, is_moderated = false
    await supabase
        .from('community_posts')
        .update({
            is_approved: true,
            is_moderated: false,
            updated_at: new Date().toISOString()
        })
        .eq('id', postId)

    revalidatePath('/', 'fetch')

    return { success: true }
}
```

**Step 3: Commit**

```bash
git add src/lib/community/actions.ts
git commit -m "feat: add approvePost server action"
```

---

### Task 2.7: updatePost & deletePost Server Actions (Landlord)

**Step 1: Test + Implement updatePost**

```typescript
it('allows landlord to update post title/content', async () => {
    const mockSupabase = {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValue({
                    data: { id: 'post-1', property_id: 'prop-123' },
                    error: null
                })
            }),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: { id: 'post-1' }, error: null })
        })
    }

    const result = await updatePost('landlord-user', 'post-1', { title: 'New title' })
    expect(result.success).toBe(true)
})
```

**Implementation:**

```typescript
export async function updatePost(
    landlordId: string,
    postId: string,
    updates: {
        title?: string
        content?: string
        metadata?: any
        is_pinned?: boolean
        status?: PostStatus
    }
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient<Database>()

    // Get post and check property ownership
    const { data: post, error: postError } = await supabase
        .from('community_posts')
        .select('property_id')
        .eq('id', postId)
        .single()

    if (postError || !post) {
        return { success: false, error: 'Post not found' }
    }

    const { data: property } = await supabase
        .from('properties')
        .select('id')
        .eq('id', post.property_id)
        .eq('landlord_id', landlordId)
        .single()

    if (!property) {
        return { success: false, error: 'Unauthorized' }
    }

    await supabase
        .from('community_posts')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', postId)

    revalidatePath('/', 'fetch')

    return { success: true }
}
```

**Step 2: Test + Implement deletePost (soft delete)**

```typescript
it('allows landlord to archive post', async () => {
    // similar pattern
})

export async function deletePost(
    landlordId: string,
    postId: string
): Promise<{ success: boolean; error?: string }> {
    // similar checks
    await supabase
        .from('community_posts')
        .update({ status: 'archived' })
        .eq('id', postId)

    revalidatePath('/', 'fetch')
    return { success: true }
}
```

**Step 3: Commit**

```bash
git add src/lib/community/actions.ts
git commit -m "feat: add updatePost and deletePost server actions"
```

---

### Task 2.8: getAllPosts Server Action (Landlord Dashboard)

**Purpose:** Fetch posts with filters (type, approval status, date range) for all properties owned by landlord.

**Step 1: Write failing test**

```typescript
it('fetches posts for landlord properties with filters', async () => {
    // mock properties query → posts query with filters
    const result = await getAllPosts('landlord-1', { status: 'pending' })
    expect(result.posts).toBeDefined()
})
```

**Step 2: Implement**

```typescript
export async function getAllPosts(
    landlordId: string,
    filters?: {
        type?: PostType
        is_approved?: boolean
        status?: PostStatus
        startDate?: string
        endDate?: string
    }
): Promise<{
    posts: Array<any
    // include property name, author name, reactions, commentCount via joins
    >
}> {
    const supabase = createClient<Database>()

    // Get landlord's property IDs
    const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('landlord_id', landlordId)

    const propertyIds = properties?.map(p => p.id) || []
    if (propertyIds.length === 0) {
        return { posts: [] }
    }

    let query = supabase
        .from('community_posts')
        .select(`
            *,
            properties!property_id ( name ),
            profiles!author_id ( full_name ),
            community_comments ( id )
        `)
        .in('property_id', propertyIds)

    if (filters?.type) query = query.eq('type', filters.type)
    if (filters?.is_approved !== undefined) query = query.eq('is_approved', filters.is_approved)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.startDate) query = query.gte('created_at', filters.startDate)
    if (filters?.endDate) query = query.lte('created_at', filters.endDate)

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
        console.error('getAllPosts error:', error)
        return { posts: [] }
    }

    const posts = (data || []).map(post => ({
        ...post,
        property_name: (post as any).properties?.name,
        author_name: (post as any).profiles?.full_name,
        commentCount: (post as any).community_comments?.length || 0
    }))

    return { posts }
}
```

**Step 3: Commit**

```bash
git add src/lib/community/actions.ts
git commit -m "feat: add getAllPosts server action for landlord"
```

---

### Task 2.9: votePoll Server Action

**Files:**
- Modify: `src/lib/community/actions.ts`
- Modify: `src/lib/community/__tests__/actions.test.ts`

**Step 1: Write failing test**

```typescript
it('allows tenant to vote on poll (upsert)', async () => {
    const mockSupabase = {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValueOnce({
                eq: vi.fn().mockResolvedValue({
                    data: { id: 'poll-1', property_id: 'prop-123', metadata: { options: ['A', 'B'] } },
                    error: null
                })
            }),
            // upsert second call
            from: vi.fn().mockReturnValue({
                upsert: vi.fn().mockResolvedValue({ error: null })
            })
        })
    }

    const result = await votePoll('user-123', 'poll-1', 0)
    expect(result.success).toBe(true)
})
```

**Step 2: Run test → FAIL** (function not defined)

```bash
npx vitest --run
```

**Step 3: Implement votePoll**

```typescript
export async function votePoll(
    userId: string,
    pollId: string,
    optionIndex: number
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient<Database>()

    const { data: poll, error: pollError } = await supabase
        .from('community_posts')
        .select('property_id, metadata')
        .eq('id', pollId)
        .eq('type', 'poll')
        .single()

    if (pollError || !poll) {
        return { success: false, error: 'Poll not found' }
    }

    const propertyId = await getTenantPropertyId(userId)
    if (propertyId !== poll.property_id) {
        return { success: false, error: 'Unauthorized' }
    }

    const options = poll.metadata?.options || []
    if (optionIndex < 0 || optionIndex >= options.length) {
        return { success: false, error: 'Invalid option' }
    }

    await supabase.from('community_poll_votes').upsert({
        poll_id: pollId,
        user_id: userId,
        option_index: optionIndex,
        created_at: new Date().toISOString()
    }, { onConflict: 'poll_id,user_id' })

    revalidatePath('/', 'fetch')

    return { success: true }
}
```

**Step 4: Update test mocks for two queries chain, re-run until pass**

**Step 5: Commit**

```bash
git add src/lib/community/actions.ts
git commit -m "feat: add votePoll server action"
```

---

### Task 2.10: addReaction Server Action

**Files:**
- Modify: `src/lib/community/actions.ts`
- Modify: `src/lib/community/__tests__/actions.test.ts`

**Step 1: Write failing test** (toggle behavior)

```typescript
it('toggles reaction on post', async () => {
    // Mock: first call no existing, second call existing
    const mockSupabase = {
        from: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col) => {
                if (col === 'user_id') return { single: vi.fn().mockResolvedValue({ data: null, error: null }) };
                return { single: vi.fn().mockResolvedValue({ data: { property_id: 'prop-123' }, error: null }) };
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn().mockResolvedValue({ error: null })
        }))
    }

    let result = await addReaction('user-123', 'post-1', 'like')
    expect(result.success).toBe(true)
    expect(result.added).toBe(true)
})

it('toggles off reaction when already exists', async () => {
    // Second call: select returns existing
    // ... similar
})
```

**Step 2: Implement addReaction**

```typescript
export async function addReaction(
    userId: string,
    postId: string,
    reactionType: ReactionType
): Promise<{ success: boolean; added: boolean }> {
    const supabase = createClient<Database>()

    const { data: post } = await supabase
        .from('community_posts')
        .select('property_id')
        .eq('id', postId)
        .single()

    if (!post) return { success: false, added: false }

    const propertyId = await getTenantPropertyId(userId)
    if (propertyId !== post.property_id) {
        return { success: false, added: false }
    }

    const { data: existing } = await supabase
        .from('community_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', reactionType)
        .single()

    if (existing) {
        await supabase
            .from('community_reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId)
            .eq('reaction_type', reactionType)
        return { success: true, added: false }
    }

    await supabase.from('community_reactions').insert({
        post_id: postId,
        user_id: userId,
        reaction_type: reactionType
    })

    revalidatePath('/', 'fetch')

    return { success: true, added: true }
}
```

**Step 3: Commit**

```bash
git add src/lib/community/actions.ts
git commit -m "feat: add addReaction server action"
```

---

### Task 2.11: addComment Server Action (Nested Replies)

**Files:**
- Modify: `src/lib/community/actions.ts`
- Modify: `src/lib/community/__tests__/actions.test.ts`

**Step 1: Write failing test**

```typescript
it('adds top-level comment', async () => {
    // Mock post exists and select returns unit
    const result = await addComment('user-123', 'post-1', 'Hello')
    expect(result.success).toBe(true)
    expect(result.comment?.content).toBe('Hello')
})

it('adds nested reply (depth 1) and rejects depth 2', async () => {
    // Mock parent with parent_comment_id already set
    // Expect error when trying to reply to a reply
})
```

**Step 2: Implement**

```typescript
export async function addComment(
    userId: string,
    postId: string,
    content: string,
    parentCommentId?: string
): Promise<{
    success: boolean
    comment?: {
        id: string
        content: string
        author_id: string
        parent_comment_id: string | null
        created_at: string
    }
    error?: string
}> {
    const supabase = createClient<Database>()

    // Verify post access
    const { data: post } = await supabase
        .from('community_posts')
        .select('property_id')
        .eq('id', postId)
        .single()

    if (!post) return { success: false, error: 'Post not found' }

    const propertyId = await getTenantPropertyId(userId)
    if (propertyId !== post.property_id) {
        return { success: false, error: 'Unauthorized' }
    }

    // Depth check
    if (parentCommentId) {
        const { data: parent } = await supabase
            .from('community_comments')
            .select('parent_comment_id')
            .eq('id', parentCommentId)
            .single()

        if (parent?.parent_comment_id) {
            return { success: false, error: 'Max reply depth exceeded' }
        }
    }

    const { data: comment, error } = await supabase
        .from('community_comments')
        .insert({
            post_id: postId,
            author_id: userId,
            content: content.trim(),
            parent_comment_id: parentCommentId || null
        })
        .select()
        .single()

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, comment }
}
```

**Step 3: Commit**

```bash
git add src/lib/community/actions.ts
git commit -m "feat: add addComment server action"
```

---

### Task 2.12: createDiscussionPost (Tenant) with Rate Limiting

**Files:**
- Modify: `src/lib/community/actions.ts`
- Modify: `src/lib/community/__tests__/actions.test.ts`

**Step 1: Write failing test for rate limit headers**

```typescript
it('enforces rate limit of 5 posts per 24h', async () => {
    const dayAgo = new Date(Date.now() - 24*60*60*1000).toISOString()
    // Mock count = 5
    const mockSupabase = {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValueOnce({
                eq: vi.fn().mockReturnValueOnce({
                    gte: vi.fn().mockReturnValueOnce({
                        count: vi.fn().mockResolvedValue({ count: 5, error: null })
                    })
                })
            })
        })
    }

    const result = await createDiscussionPost('user-123', { title: 'Spam', content: 'No' })
    expect(result.success).toBe(false)
    expect(result.status).toBe(429)
    expect(result.headers?.['X-RateLimit-Remaining']).toBe('0')
})
```

**Step 2: Implement createDiscussionPost with rate limiting**

```typescript
export async function createDiscussionPost(
    userId: string,
    data: { title: string; content: string }
): Promise<{
    success: boolean
    post?: any
    error?: string
    status?: number
    headers?: Record<string, string>
}> {
    const supabase = createClient<Database>()

    const propertyId = await getTenantPropertyId(userId)
    if (!propertyId) {
        return { success: false, error: 'No active lease found' }
    }

    // Rate limit: count posts in last 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId)
        .eq('type', 'discussion')
        .gte('created_at', dayAgo)

    if (countError) {
        return { success: false, error: countError.message }
    }

    const RATE_LIMIT = 5
    if (count !== null && count >= RATE_LIMIT) {
        const resetTime = Date.now() + 24 * 60 * 60 * 1000
        return {
            success: false,
            status: 429,
            error: 'Rate limit exceeded: max 5 posts per 24 hours',
            headers: {
                'X-RateLimit-Limit': RATE_LIMIT.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': Math.floor(resetTime / 1000).toString()
            }
        }
    }

    // Insert moderated discussion
    const { data: post, error: insertError } = await supabase
        .from('community_posts')
        .insert({
            property_id: propertyId,
            author_id: userId,
            author_role: 'tenant',
            type: 'discussion',
            title: data.title.trim(),
            content: data.content.trim(),
            is_moderated: true,
            is_approved: false,
            status: 'published'
        })
        .select()
        .single()

    if (insertError) {
        return { success: false, error: insertError.message }
    }

    revalidatePath('/', 'fetch')

    const remaining = RATE_LIMIT - (count + 1)
    return {
        success: true,
        post,
        headers: {
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': Math.floor(Date.now() + 24 * 60 * 60 * 1000).toString()
        }
    }
}
```

**Step 3: Commit**

```bash
git add src/lib/community/actions.ts
git commit -m "feat: add createDiscussionPost with rate limiting"
```

---

### Task 2.13: Landlord Post Creation (createPost)

**All types: announcement, poll, photo_album, discussion**

**Step 1: Write failing test for each type**

**Step 2: Implement**

```typescript
export async function createPost(
    landlordId: string,
    data: {
        propertyId: string
        type: PostType
        title: string
        content?: string
        metadata?: any
        isPinned?: boolean
    }
): Promise<{ success: boolean; post?: any; error?: string }> {
    const supabase = createClient<Database>()

    const { data: property } = await supabase
        .from('properties')
        .select('id')
        .eq('id', data.propertyId)
        .eq('landlord_id', landlordId)
        .single()

    if (!property) {
        return { success: false, error: 'Unauthorized' }
    }

    const { data: post, error } = await supabase
        .from('community_posts')
        .insert({
            property_id: data.propertyId,
            author_id: landlordId,
            author_role: 'landlord',
            type: data.type,
            title: data.title,
            content: data.content || null,
            metadata: data.metadata || null,
            is_pinned: data.isPinned || false,
            is_approved: true,
            is_moderated: false,
            status: 'published'
        })
        .select()
        .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/', 'fetch')

    return { success: true, post }
}
```

**Step 3: Commit**

```bash
git add src/lib/community/actions.ts
git commit -m "feat: add landlord createPost server action"
```

---

### Task 2.14: reportPost Server Action

**Files:**
- Modify: `src/lib/community/actions.ts`
- Test: `src/lib/community/__tests__/actions.test.ts`

**Step 1: Write failing test**

```typescript
it('allows tenant to report a post', async () => {
    const mockSupabase = {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValue({ data: { id: 'post-1' }, error: null })
            }),
            insert: vi.fn().mockResolvedValue({ data: { id: 'report-1' }, error: null })
        })
    }

    const result = await reportPost('user-123', 'post-1', 'spam')
    expect(result.success).toBe(true)
})
```

**Step 2: Implement reportPost**

```typescript
export async function reportPost(
    userId: string,
    postId: string,
    reason: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient<Database>()

    // Verify post exists
    const { data: post } = await supabase
        .from('community_posts')
        .select('id')
        .eq('id', postId)
        .single()

    if (!post) {
        return { success: false, error: 'Post not found' }
    }

    await supabase.from('content_reports').insert({
        post_id: postId,
        reporter_id: userId,
        reason: reason.trim(),
        status: 'pending'
    })

    return { success: true }
}
```

**Step 3: Commit**

```bash
git add src/lib/community/actions.ts
git commit -m "feat: add reportPost server action"
```

---

## Phase 3: Core UI Components

### Task 3.1: PostCard Base Component

**Files:**
- Create: `src/components/community/PostCard/PostCard.tsx`
- Create: `src/components/community/PostCard/PostHeader.tsx`
- Create: `src/components/community/PostCard/PostContent.tsx`
- Create: `src/components/community/PostCard/ReactionBar.tsx`
- Create: `src/components/community/PostCard/CommentPreview.tsx`
- Test: `src/components/community/__tests__/PostCard.test.tsx`

**Step 1: Write failing test**

```tsx
// src/components/community/__tests__/PostCard.test.tsx
import { render, screen } from '@testing-library/react'
import PostCard from '../PostCard/PostCard'

describe('PostCard', () => {
    it('renders post title and author name', () => {
        const post = {
            id: '1',
            title: 'Test Post',
            author_name: 'John Doe',
            author_role: 'tenant',
            created_at: new Date().toISOString()
        }

        render(<PostCard post={post} />)

        expect(screen.getByText('Test Post')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
})
```

**Step 2: Run test → FAIL (component missing)**

**Step 3: Implement PostCard with shadcn/ui Card**

```tsx
'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import PostHeader from './PostHeader'
import PostContent from './PostContent'
import ReactionBar from './ReactionBar'
import CommentPreview from './CommentPreview'
import { formatDistanceToNow } from 'date-fns'

interface PostCardProps {
    post: {
        id: string
        title: string
        author_name: string
        author_avatar?: string | null
        author_role: 'tenant' | 'landlord' | 'admin'
        created_at: string
        content?: string | null
        metadata?: any
        is_pinned?: boolean
        reactions?: Record<string, number>
        userReactions?: Array<{ reaction_type: string }>
        commentCount?: number
        type: 'announcement' | 'poll' | 'photo_album' | 'discussion'
    }
    onReact?: (postId: string, reaction: string) => void
    onComment?: (postId: string) => void
}

export default function PostCard({ post, onReact, onComment }: PostCardProps) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <PostHeader
                    authorName={post.author_name}
                    authorAvatar={post.author_avatar}
                    authorRole={post.author_role}
                    timestamp={post.created_at}
                    isPinned={post.is_pinned}
                />
            </CardHeader>
            <CardContent className="space-y-4">
                <PostContent
                    title={post.title}
                    content={post.content}
                    type={post.type}
                    metadata={post.metadata}
                />
                <ReactionBar
                    reactions={post.reactions || {}}
                    userReactions={post.userReactions || []}
                    onReact={() => onReact?.(post.id, 'like')}
                    onComment={() => onComment?.(post.id)}
                />
                {post.commentCount > 0 && (
                    <CommentPreview
                        commentCount={post.commentCount}
                    />
                )}
            </CardContent>
        </Card>
    )
}
```

**Step 4: Implement subcomponents incrementally with tests**

Implement PostHeader, PostContent, ReactionBar, CommentPreview each with:
- Write failing test → implement → commit

---

### Task 3.2: Specialized Card Components

**PollCard:**
- Extends PostCard
- Adds voting UI (radio buttons) when user hasn't voted
- Shows results (progress bars) after voting
- Real-time updates: useEffect with setInterval to refetch poll results

**PhotoAlbumCard:**
- 2x2 grid of first 4 photos
- "+N more" overlay on last photo if count > 4
- Click opens GalleryModal

**DiscussionCard:**
- Content preview (120 chars truncated)
- "View discussion" CTA if longer

**AnnouncementCard:**
- Distinctive styling (accent color border)
- Optional icon/badge

---

### Task 3.3: ReactionBar Component

**Features:**
- Like/Heart/Thumbs-up/Clap/Celebration buttons (pick 3-4 primary, others in dropdown)
- Active state for user's current reactions
- Comment button
- Share button (copy link to clipboard)
- Report button (opens report modal)

**Commit after each component test passes**

---

### Task 3.4: CommentSection Modal

**Files:**
- Create: `src/components/community/CommentSection/CommentSection.tsx`
- Create: `src/components/community/CommentSection/CommentItem.tsx`
- Create: `src/components/community/CommentSection/CommentForm.tsx`

**Features:**
- Modal overlay with backdrop blur
- Nested replies (max depth 2)
- Infinite scroll for comments (or load all since limited)
- Real-time: new comments appear via optimistic update

---

### Task 3.5: GalleryModal

**Uses:**
- Dialog from @radix-ui/react-dialog
- Keyboard navigation (arrow keys, ESC)
- Thumbnail strip at bottom
- Swipe support for mobile

---

### Task 3.6: PollResultsModal

**Detailed breakdown:**
- Horizontal bar chart showing percentages
- Total votes count
- Option text + vote count + percentage
- Update every 5s while visible

---

### Task 3.7: CreatePostModal (Tenant)

**Only allows:** discussion posts
- Title input (required)
- Content textarea (required)
- Shows "Pending approval" after submit

---

### Task 3.8: LandlordPostModal

**All types:**
- Select type dropdown
- Title + content
- For polls: dynamic options list (add/remove)
- For albums: photo upload (Supabase Storage)
- Pinned checkbox

---

## Phase 4: Community Hub Page & Integration

### Task 4.1: Modify Root Page to Tenant-Aware

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Replace landing page with conditional**

```tsx
import { getServerSession } from 'next-auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CommunityHub from '@/components/community/CommunityHub'

export default async function HomePage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // Unauthenticated: show login redirect (keep existing landing for now)
        redirect('/login')
        // OR replace with marketing landing if desired
    }

    // Check user role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'tenant') {
        redirect('/dashboard') // landlords/admins go to their dashboards
    }

    // Tenant: show Community Hub
    return <CommunityHub userId={user.id} />
}
```

**Note:** This changes behavior: unauthenticated users now redirect to login instead of seeing landing page. If marketing page is still needed, create separate `/landing` route.

**Step 2: Test manually** (no automated test needed for this redirect logic yet)

**Step 3: Commit**

---

### Task 4.2: CommunityHub Container Component

**Files:**
- Create: `src/components/community/CommunityHub.tsx`

**Features:**
- Client component (uses useState, useEffect)
- Fetches initial posts via Server Action (getPosts)
- Implements infinite scroll with IntersectionObserver
- Renders CommunityFeed
- Contains CreatePostButton (opens CreatePostModal)
- Note: Property resolution happens server-side in each Server Action (via getTenantPropertyId), so no PropertyContext needed. This simplifies design and keeps components pure.

```tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import CommunityFeed from './CommunityFeed'
import CreatePostModal from './CreatePostModal'
import { getPosts } from '@/lib/community/actions'

export default function CommunityHub({ userId }: { userId: string }) {
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [hasMore, setHasMore] = useState(true)
    const [cursor, setCursor] = useState<string | null>(null)
    const loaderRef = useRef<HTMLDivElement>(null)

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return
        setLoading(true)
        const result = await getPosts(userId, 20, cursor || undefined)
        setPosts(prev => [...prev, ...result.posts])
        setHasMore(!!result.nextCursor)
        setCursor(result.nextCursor)
        setLoading(false)
    }, [userId, cursor, loading, hasMore])

    useEffect(() => {
        loadMore()
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    loadMore()
                }
            },
            { threshold: 0.1 }
        )

        if (loaderRef.current) observer.observe(loaderRef.current)

        return () => observer.disconnect()
    }, [hasMore, loading, loadMore])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Community Hub</h1>
                <CreatePostModal userId={userId} />
            </div>

            <CommunityFeed posts={posts} />

            <div ref={loaderRef} className="py-4 text-center">
                {loading && <div className="animate-spin mx-auto">🌀</div>}
                {!hasMore && posts.length > 0 && (
                    <p className="text-sm text-muted-foreground">No more posts</p>
                )}
            </div>
        </div>
    )
}
```

---

### Task 4.3: CommunityFeed Component

**Simple map over posts array**, renders PostCard for each with type-based component selection:

```tsx
const typeComponents = {
    announcement: AnnouncementCard,
    poll: PollCard,
    photo_album: PhotoAlbumCard,
    discussion: DiscussionCard
}

// In render:
const CardComponent = typeComponents[post.type]
return (
    <div key={post.id}>
        <CardComponent
            post={post}
            onReact={handleReact}
            onComment={handleOpenComment}
        />
    </div>
)
```

---

### Task 4.4: Tenant Create Post Button & Modal

**Button:** Floating action button or inline at top
**Modal:**
- Radio buttons: "Discussion" only (for MVP)
- Title + content fields
- Submit call createDiscussionPost action
- On success: add to posts array optimistically (or refetch)

---

### Task 4.5: Integrate PollCard Real-time Updates

**PollCard:**
- After vote, start setInterval (5s) to fetch poll results via Server Action `getPollResults(pollId)` if component visible
- Use IntersectionObserver to pause interval when scrolled out of view

---

### Task 4.6: Photo Album Gallery Modal

**Click album photo grid → open GalleryModal**
- Pass array of photo URLs + captions
- Modal shows large image + prev/next buttons
- Keyboard navigation

---

## Phase 5: Landlord Moderation Dashboard

### Task 5.1: Landlord Community Page

**Files:**
- Create: `src/app/landlord/community/page.tsx`

**Features:**
- Filter tabs: Pending, Published, Reported, Archived
- List of posts with metadata (author, type, status)
- Approve/Dismiss/Delete bulk actions
- Click post → edit modal (approve, edit title/content, pin)
- Create Post button → LandlordPostModal

**Server Actions needed:**
- `getAllPosts(propertyId?: string, filters?: {...})` - landlord sees all properties or filtered
- `approvePost(postId)` - sets is_approved = true, is_moderated = false
- `deletePost(postId)` - soft delete (status = 'archived') or hard delete
- `updatePost(postId, data)` - edit title/content/metadata/pinning

---

### Task 5.2: Implement Approval Flow

**Tenant creates discussion** → is_approved = false → not visible in feed
**Landlord approves** → becomes visible

Test this end-to-end with Playwright.

---

## Phase 6: Testing & Accessibility

### Task 6.1: Unit Test Coverage

**Target:** 80%+ coverage for:
- All Server Actions (queries, mutations)
- Utility functions
- Component rendering (PostCard variants, Modal open/close)

Run:
```bash
npx vitest --coverage
```

---

### Task 6.2: E2E Tests with Playwright

**File:** `e2e/community-hub.spec.ts`

**Scenarios:**
1. Tenant logs in → sees Community Hub feed with recent posts
2. Tenant creates discussion post → sees "Pending approval" → landlord approves → post appears
3. Tenant votes on poll → sees results update live
4. Tenant adds reaction → count increments
5. Tenant reports post → success message
6. Landlord moderates pending post → approves → tenant sees it
7. Gallery modal opens on album click → navigate photos

Run:
```bash
npx playwright test e2e/community-hub.spec.ts
```

---

### Task 6.3: Accessibility Audit

- Run `@axe-core/playwright` in Playwright tests
- Manual keyboard navigation test (Tab through feed, open modals, escape closes)
- Screen reader: NVDA/VoiceOver check for live region updates (poll results)
- Color contrast: Lighthouse CI

Fix any violations.

---

### Task 6.4: Performance Optimization

- Lazy load images in feed (next/image with placeholder)
- Memoize PostCard with React.memo
- Debounced poll refresh (already 5s)
- Ensure initial JS bundle < 200KB (check with webpack-bundle-analyzer)

---

## Phase 7: Bookmark & Additional Features (Stretch/Phase 4)

### Task 7.1: Bookmark Feature

**Add to ReactionBar:** bookmark icon
**Server Action:** `toggleBookmark(postId)`
**Table:** `bookmarks` (user_id, post_id, created_at)
**Page:** `/tenant/bookmarks` (feed of saved posts)

---

### Task 7.2: Post View Tracking

**Server Action:** `trackPostView(postId)`
- Increment `view_count` on community_posts
- Insert into post_views table

Call when post detail modal opens.

---

## Phase 8: Final Cleanup

### Task 8.1: Remove Old Landing Page Assets

If marketing page is no longer needed:
- Delete unused images in `/public/hero-images/`
- Update any routes referencing old landing page

---

### Task 8.2: Update Navigation Indications

Ensure TenantNavbar "Home" link highlights when on `/`.

Already in TenantNavbar: `href="/"`, logic handles active state.

---

### Task 8.3: Documentation

**Update:**
- `README.md` - add Community Hub section
- `docs/functional-requirements.md` - mark feature complete

---

### Task 8.4: Final Verification

**Checklist:**
- [ ] All migrations applied to staging → production
- [ ] TypeScript compiles without errors
- [ ] All unit tests passing (≥80% coverage)
- [ ] All E2E tests passing (critical paths)
- [ ] Lighthouse score: Performance > 80, Accessibility > 90, Best Practices > 90, SEO > 80
- [ ] Manual QA: test on mobile (Chrome DevTools), tablet, desktop
- [ ] Rate limiting enforced (5 posts/24h, 1 vote/poll)
- [ ] No cross-property data leakage (tenant only sees own property posts)
- [ ] Moderation queue works (landlord approves → tenant sees)
- [ ] Images optimize (blur placeholders, lazy load)

**Deploy:**
```bash
git checkout -b feature/community-hub
git add .
git commit -m "feat: implement community hub with feed, polls, albums, discussions"
git push origin feature/community-hub
# Open PR against staging → promote to production after review
```

---

## Notes

- **Frequent commits:** Each task above is a commit. No large batches.
- **TDD:** Write test → see it fail → write minimal code → see it pass → refactor → commit.
- **DRY/YAGNI:** Avoid premature abstractions. Extract hooks only when duplication appears.
- **Error handling:** Always catch Supabase errors; show user-friendly toasts.
- **Security:** Server Actions must verify tenant property access on every mutation.
- **Moderation:** Tenant discussion posts require approval. Landlord can post directly published.
- **Real-time:** Poll results use polling (not WebSocket for MVP). Interval when visible only.
- **Bookmarks/stretch:** Phase 4 only after core features complete and verified.

---

**Total Estimated Tasks:** ~60-80 subtasks (each card component, each server action, each test file, modal, etc.)
**Estimated Time:** 4-5 days with TDD and parallelization possible via subagents.

**Plan Approval Required:** ✅ Spec approved → proceed to implementation
