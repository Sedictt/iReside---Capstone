# Community Hub Design Specification

**Date:** 2026-03-24
**Feature:** Tenant Community Hub (replaces public landing page at `/`)
**Status:** Approved for Implementation

---

## 1. Problem Statement

The current `src/app/page.tsx` serves as a public marketing landing page. This needs to be replaced with a **tenant-exclusive Community Hub** that becomes the new "Home" experience for logged-in tenants. The existing `/tenant/dashboard` page (which shows payments, lease info, utilities) will remain unchanged and accessible via the sidebar.

### Goals
- Create a centralized feed where tenants can view building announcements, events, polls, and community discussions
- Enable landlord/management to post official content (announcements, polls, photo albums)
- Allow tenants to create discussion posts (requires moderation/approval)
- Foster community engagement through reactions, comments, and voting
- Ensure content isolation: tenants only see posts from their specific building/complex

---

## 2. Solution Overview

### Approach: Feed-Based Social Layout (like Facebook/Instagram)

The Community Hub presents a **chronological feed** of mixed content types, with featured/pinned posts at the top. Each post is a card with consistent interaction patterns (like, comment, share, report). This creates an engaging, familiar experience that encourages residents to stay updated and participate.

### Key Features
- **Feed Posts**: Four types – Announcements, Polls, Photo Albums, Discussions
- **Interactions**: Like/react, comment, share, report, bookmark
- **Real-time**: Poll results update live as residents vote
- **Moderation**: Resident discussion posts require landlord approval before visibility
- **Gallery**: Photo albums open in a modal lightbox for browsing
- **Notifications** (Stretch):
  - Triggered on: new management announcement, comment on user's post, poll ending
  - Delivered via in-app toast + optional email/SMS (configurable)
  - Not in MVP; implement Phase 5

### Bookmark Feature
- Included in Phase 4: Bookmark button on ReactionBar
- Saved posts accessible via `/tenant/bookmarks` page (future)
- Stored in `bookmarks` table: `(user_id, post_id, created_at)`

### Content Isolation
All posts are tagged with `property_id`. The API automatically filters to show only posts from the tenant's property (derived from their active lease). This ensures privacy across multiple properties in the system.

---

## 3. User Roles & Permissions

| Action | Landlord/Admin | Tenant |
|--------|---------------|--------|
| Create any post type | ✅ | ❌ (discussions only) |
| Create discussion post | ✅ | ✅ (requires approval) |
| Edit/delete own post | ✅ | ✅ (own only) |
- Approve resident posts | ✅ | ❌ |
| Vote on polls | ✅ | ✅ |
- Comment on posts | ✅ | ✅ |
- Like/react | ✅ | ✅ |
| Report content | ✅ | ✅ |

---

## 4. Database Schema

### Tables

#### `community_posts`
```sql
create table community_posts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  author_id uuid not null references profiles(id),
  author_role user_role not null,  -- Uses existing user_role enum (tenant|landlord|admin)
  type post_type_enum not null,
  title text not null,
  content text,
  metadata jsonb,  -- Poll options, album settings, etc.
  is_pinned boolean default false,
  is_moderated boolean default false,
  is_approved boolean default false,
  status post_status_enum default 'published',
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_community_posts_property_created on community_posts(property_id, created_at desc);
create index idx_community_posts_approved on community_posts(is_approved, status, created_at desc);
```

#### `community_comments`
```sql
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
```

**Constraint:** Max nesting depth = 2 (original comment + one reply). Enforced in application logic (check `parent_comment_id`'s parent is null).

#### `community_reactions`
```sql
create table community_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id),
  reaction_type reaction_type_enum not null,
  created_at timestamptz default now(),
  unique(post_id, user_id, reaction_type)
);

create index idx_community_reactions_post_user on community_reactions(post_id, user_id);
```

#### `community_poll_votes`
```sql
create table community_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id),
  option_index integer not null check (option_index >= 0),
  created_at timestamptz default now(),
  unique(poll_id, user_id)
);

create index idx_community_poll_votes_poll on community_poll_votes(poll_id);
```

#### `content_reports`
```sql
create table content_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  reporter_id uuid not null references profiles(id),
  reason text not null,  -- e.g., "spam", "inappropriate", "harassment"
  status report_status_enum default 'pending',
  moderator_notes text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create index idx_content_reports_post on content_reports(post_id);
create index idx_content_reports_reporter on content_reports(reporter_id);
```

#### `community_albums` & `community_photos`
```sql
create table community_albums (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references community_posts(id) on delete cascade,
  property_id uuid not null references properties(id),
  cover_photo_url text,
  photo_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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
```

### Enums
```sql
create type post_type_enum as enum ('announcement', 'poll', 'photo_album', 'discussion');
create type post_status_enum as enum ('draft', 'published', 'archived');
create type reaction_type_enum as enum ('like', 'heart', 'thumbs_up', 'clap', 'celebration');
create type report_status_enum as enum ('pending', 'reviewed', 'dismissed', 'escalated');
```

### Post Views Tracking
```sql
create table post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid references profiles(id),  -- null for anonymous viewers (if tracked)
  session_id text,                       -- fallback identifier for non-auth
  viewed_at timestamptz default now(),
  unique(post_id, user_id, session_id, date)  -- daily deduplication
);
create index idx_post_views_post on post_views(post_id);
```

**Increment Logic:**
- When a tenant opens a post detail (modal or dedicated page), call Server Action `trackPostView(postId)`
- Inserts into `post_views` with current `user_id` and session ID
- `community_posts.view_count` is denormalized; incremented via trigger on `post_views` insert (or periodic aggregation job)
- For MVP: simple increment on each call (may overcount slightly, acceptable)

### Migration Strategy
- Use Supabase migration files (`supabase/migrations/xxxxxxxx_*.sql`) for version control
- Each migration is additive (CREATE TABLE) and backward-compatible (no destructive changes without deprecation period)
- Deploy to staging, run integration tests, then promote to production
- Zero-downtime: create new tables first, backfill if needed, then deploy code referencing them
- Document migration steps in PR description

### Rollback Plan
If severe issues: revert code, then optionally drop tables via `DROP TABLE IF EXISTS ...` (only if no data loss acceptable; otherwise keep data)

---

## 5. API Design (Server Actions)

All mutations use Server Actions in the App Router pattern.

### Property Resolution
The tenant's `property_id` is derived via:
1. Get user's active lease from `leases` where `tenant_id = userId` and `status = 'active'`
2. Join to `units` then `properties` to obtain `property_id`
3. This property_id filters all community posts

This is computed server-side in each Server Action and cached in the user's session.

### Tenant-Facing

#### `getPosts(propertyId: string, limit?: number, offset?: number)`
Fetches approved posts for a property, ordered by `is_pinned DESC, created_at DESC`. Includes:
- Post data (type, title, content, metadata)
- Author info (name, avatar, role)
- Reaction counts (grouped by type)
- Current user's reactions (if logged in)
- Comment counts
- For polls: current vote counts, whether user has voted
- For albums: photo count, cover photo

#### `createDiscussionPost(data: {title, content})`
Creates a discussion post with `is_moderated=true`, `is_approved=false`. Tenant-only.

#### `votePoll(pollId: string, optionIndex: number)`
Records or updates a poll vote. Anonymous to other users. Revalidates path for live results.

#### `addReaction(postId: string, reactionType: ReactionType)`
Toggles reaction (add if not exists, remove if exists). Returns new count.

#### `addComment(postId: string, content: string, parentCommentId?: string)`
Adds a comment or nested reply.

#### `reportPost(postId: string, reason: string)`
Flags content for moderation. Creates record in separate `content_reports` table (or reuse existing).

#### `getAlbumPhotos(albumId: string)`
Returns ordered photos for gallery modal.

### Landlord-Facing (separate landlord page: `/landlord/community`)

#### `getAllPosts(propertyId?: string, filters?: {...})`
Admin view with filters: type, approval status, date range.

#### `createPost(data: {propertyId, type, title, content, metadata, isPinned})`
Creates any post type directly published.

#### `updatePost(postId: string, data: partial<Post>)`
Edits post, including approval toggles and pinning.

#### `approvePost(postId: string)`
Approves a resident discussion post, making it visible.

#### `deletePost(postId: string)`
Soft delete via status change or hard delete.

---

## 6. Component Architecture

```
src/app/page.tsx
└── CommunityHub (client component)
    ├── AuthGuard (redirects non-tenants to login)
    ├── PropertyContext (get tenant's property_id)
    ├── FeedFilters (optional: filter by type)
    ├── CommunityFeed (infinite scroll)
    │   ├── PostCard (type='announcement')
    │   ├── PostCard (type='poll')
    │   ├── PostCard (type='photo_album')
    │   └── PostCard (type='discussion')
    ├── CreatePostButton / Modal (tenant only)
    ├── CommentSection (modal overlay)
    ├── GalleryModal (photo lightbox)
    └── PollResultsModal (detailed breakdown)

src/components/community/
├── PostCard/
│   ├── PostCard.tsx (main)
│   ├── PostHeader.tsx (author, timestamp, pinned)
│   ├── PostContent.tsx (title, body, poll options, album preview)
│   ├── ReactionBar.tsx (like/react/share/report)
│   └── CommentPreview.tsx (show last few comments)
├── PollCard.tsx (extends PostCard, adds voting UI)
├── PhotoAlbumCard.tsx (extends PostCard, shows photo grid)
├── DiscussionCard.tsx (extends PostCard, shows preview)
├── AnnouncementCard.tsx (extends PostCard, special styling)
├── CommentSection/
│   ├── CommentItem.tsx
│   └── CommentForm.tsx
├── GalleryModal.tsx
├── PollResultsModal.tsx
└── CreatePostModal.tsx
```

**Reusable UI:**
- `UserAvatar` (from existing components)
- `Button`, `Card`, `Badge` (shadcn/ui)
- `useOptimisticUpdate` hook for instant feedback

---

## 7. UI/UX Specs

### Post Card Layout (All Types)
```
[Avatar] Author Name • Role • Time
      [Pinned icon if pinned]
      Title (h3)
      [Content preview: text excerpt OR poll options OR photo grid]
      [Reaction Bar] ❤️ 5  💬 3  Share  Report
```

### Poll Card Specifics
- Show question as title
- Options as radio buttons (multi-select if configured)
- "Vote" button
- After voting OR if already voted: show results bar chart (progress bars with percentages)
- Results update live via useEffect hook:
  ```tsx
  useEffect(() => {
    if (!hasVoted) return;
    const interval = setInterval(fetchPollResults, 5000);
    return () => clearInterval(interval);
  }, [pollId, hasVoted]);
  ```
- Server Action `getPollResults(pollId)` returns `{ options: [{text, count, percentage}] }`

### Photo Album Card
- Grid of up to 4 photos (2x2), remaining count overlay on last (e.g., "+12 more")
- Click opens `GalleryModal` with full album
- Album title + photo count badge

### Discussion Card
- Title + first 120 chars of content
- "View discussion" CTA if long content
- Shows comment count

### Create Post Modal (Tenant)
- Radio buttons: "Discussion" (only allowed option)
- Title input (required)
- Content textarea (required)
- Submit → creates with `is_moderated=true` → UI shows "Pending approval"

### Responsive Breakpoints
Tailwind breakpoints applied:
- `sm` (640px): feed switches from 1 → 2 columns (if side-by-side cards enabled)
- `md` (768px): navbar visible; feed full-width; cards show full metadata
- `lg` (1024px): gallery modal shows up to 6 photos per row
- `xl` (1280px): feed max-width container 1280px centered

Cards use flex/grid layouts that adapt:
- Mobile: single column, full-bleed images, larger tap targets (min 44x44)
- Tablet: images constrained to 50% width on some card types
- Desktop: 2-column feed option (optional), more whitespace

---

## 8. Error Handling

### Data Fetching
- Empty state: friendly message with illustration/icon
- Loading: skeleton cards matching actual layout
- Errors: toast + "Retry" button, logs to error tracking

### Validation
- Empty title/content → field-level error with inline message
- Duplicate reaction → handled gracefully (no-op, ignore)
- Poll option selection required → show error if submit without selection

### Rate Limiting
- Tenant posts: max 5 per 24h rolling window
- Poll votes: max 1 per poll per tenant (unique constraint)
- Enforcement: Server Action checks count before proceeding, using atomic query
- Headers: Return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` for client display
- Backoff: If limit exceeded, respond with `429 Too Many Requests` and retry-after suggestion

### Permission Errors
- Unauthorized write → toast "You don't have permission" + redirect to login if session expired
- 403 responses caught and show appropriate message

### File Uploads (Albums)
Landlord-only feature. Uses Supabase Storage bucket `community-albums`.
- Upload flow: Server Action receives `FormData`, validates size/type, uploads via Supabase client
- Storage policies: authenticated users can upload; public read access for images
- Images optimized: Next.js Image uses `/image/upload` transformations for thumbnails
- Max size: 10MB per image; types: JPEG, PNG, WebP, AVIF
- Progress: Use `useUploadThing` or custom progress hook with `XMLHttpRequest`
- Fallback: if upload fails, show toast with "Retry" button preserving selected files

---

## 9. Performance Considerations

### Feed Pagination
- Cursor-based: pass `lastCreatedAt` + `lastId` to `getPosts` to fetch next page
- Offset fallback only for small datasets (<1000 posts)
- IntersectionObserver on sentinel element triggers load more
- Deduplication: ensure same post not rendered twice if race condition

### Images
- Use Next.js Image with `width`, `height`, and `blurDataURL` for instant placeholder
- Lazy loading: default `loading="lazy"` for feed images, `eager` for above-the-fold
- Responsive sizes: `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"`

### Poll Refreshes
- When a poll card is visible (IntersectionObserver), start a debounced setInterval (5s)
- Server Action `getPollResults(pollId)` returns current vote counts
- Update local state; stop interval when poll leaves viewport

### Memoization
- `PostCard` wrapped in `React.memo` with custom equality (`post.id` comparison)
- `GalleryModal` images array memoized to prevent re-creation on modal reopen
- `useCallback` for event handlers passed to children

### Database
- Existing indexes plus: `idx_community_posts_property_approved` composite on `(property_id, is_approved, created_at DESC)`
- Partitioning not needed; expected volume < 10k posts per property
- `view_count` updates: batch increment via async Server Action to avoid hot write row

---

## 10. Accessibility

- All cards keyboard-navigable (tab order logical)
- Poll options: radio groups with proper labeling
- Modals: focus trap, ESC closes, returns focus to trigger
- Screen reader: live regions for poll result updates (`aria-live="polite"`)
- Color contrast: 4.5:1 minimum for text, icons have text labels or `aria-label`
- Skip links for main feed

---

## 11. Content Moderation & Post Lifecycle

### Post Status Flow
1. **Tenant creates discussion** → `status = 'published'` (false), `is_moderated = true`, `is_approved = false`
   - Not visible in public feed
   - Tenant sees "Pending approval" badge on their post
2. **Landlord reviews** via `/landlord/community` queue
   - Approve: `is_approved = true`, `is_moderated = false`
   - Deny: `status = 'archived'` (or delete)
   - Optionally edit content before approval
3. **Published posts** appear in feed sorted by `is_pinned DESC, created_at DESC`
4. **Updates**:
   - Tenant can edit own post **only while** `is_moderated = true` and `is_approved = false`
   - Landlord can edit any post at any time (including changing `is_pinned`, `status`)
   - Deletion: Landlord hard deletes; tenant "deletes" by setting `status = 'archived'`

### Moderation Dashboard (Landlord)
- Filter by: pending, approved, reported, archived
- Bulk actions: approve selected, delete selected
- View reported posts with reason and reporter info
- Take action: dismiss, warn user, remove post

### Comment Moderation
- Comments are not pre-moderated; appear immediately
- Reportable via `/api/community/comments/:id/report` (reuses `content_reports` with polymorphic reference or separate table)
- Landlord can delete any comment

### Appeal Process (Optional)
Tenants can appeal removed posts via support ticket (out of scope for MVP).

---

## 12. Testing Strategy

### Unit Tests
- Target: 80%+ coverage for Server Actions and utility functions
- Framework: Vitest + Testing Library
- Key functions: `votePoll`, `addReaction`, `getPosts` filtering, `normalizeMetaData`
- Mock Supabase client with `jest.fn()` or `msw` for database interactions

### Integration Tests
- Critical paths:
  1. Tenant views feed → posts load filtered by property
  2. Tenant creates discussion → appears after approval (simulated landlord approval)
  3. Poll voting → results update, prevents double vote
  4. Comment thread → nested replies work
  5. Gallery modal → photos load, navigation works
- Tool: Playwright or Cypress for E2E
- Test against local Supabase instance or use `msw` to mock API

### Accessibility Testing
- Automated: axe-core integration in CI
- Manual: keyboard navigation audit, screen reader (VoiceOver/NVDA) check
- Color contrast: Lighthouse CI

### Performance Testing
- Photo lazy loading: Lighthouse audit
- Feed pagination: ensure no jank during infinite scroll
- Bundle size: analyze and keep initial JS < 200KB

---

## 12. Implementation Phases

**Phase 1: Database & Backend** (Week 1)
- Migration files for new tables + enums
- Server Actions: `getPosts`, `createDiscussionPost`, `votePoll`, `addReaction`, `addComment`
- Tenant property lookup utility
- Approval flow for resident posts (landlord-only endpoints)

**Phase 2: Core Feed UI** (Week 2)
- `CommunityHub` container + `CommunityFeed`
- `PostCard` component + all 4 variants
- `ReactionBar` with like functionality
- Loading states + error boundaries
- Basic pagination (load more button)

**Phase 3: Advanced Interactions** (Week 3)
- Comment modal + nested replies
- Poll voting + results display
- `GalleryModal` for album photos
- `CreatePostModal` (discussions only)
- Moderation UI (landlord page)

**Phase 4: Polish & Launch** (Week 4)
- Infinite scroll integration
- Real-time poll updates (smart polling)
- Bookmark/report features
- Accessibility audit (completion of WCAG AA)
- Performance optimization (image lazy loading, memoization)
- Testing suite finalization (coverage >= 80%)

---

## 14. Success Criteria

- Tenants can view feed of building-specific content
- Landlord can post announcements/polls/albums visible to all tenants
- Tenants can create discussion posts (visible after approval)
- Polls show live results as residents vote
- All interactions (like, comment, vote) are smooth and responsive
- No cross-property data leakage
- Mobile-responsive UI
- Meets WCAG AA accessibility

---

## 15. Out of Scope (Future Phases)

- Push notifications for new posts/comments
- Residents uploading photos directly (only landlord for now)
- Event calendar with RSVP
- Resident-to-resident messaging
- Advanced content search
- Trending posts algorithm
- Integration with `/tenant/dashboard` to show recent community activity

---

## 16. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Moderation queue gets ignored | Residents' posts invisible → frustration | Landlord onboarding to use tools; tenant notifications when approved |
| Spam/abuse from resident posts | Community quality suffers | Pre-moderation, rate limits, reporting feature |
| Poll manipulation | Unfair results | Anonymous votes, one vote per tenant, IP checks (optional) |
| Slow loading with many images | Poor UX | Lazy loading, blur placeholders, CDN, max 4 per card |
| Infinite scroll bugs | Duplicate posts / missed posts | Cursor-based pagination, deduplication |

---

## 17. Open Questions (Answered in Design)

- **Q:** Should residents see posts from other properties?
  **A:** No, property isolation enforced by API filter.

- **Q:** Photo albums – separate or integrated?
  **A:** Separate gallery modal (B), albums are management-curated.

- **Q:** Engagement features?
  **A:** Yes to like/react, share, report, bookmark.

- **Q:** Poll settings?
  **A:** Anonymous, multiple choice, no "other", real-time results.

- **Q:** Server Actions or REST?
  **A:** Server Actions for all mutations.

---

## 18. Related Work

- Existing `notifications` table shows announcements in dashboard → new `community_posts` table is more general, rich
- Tenant dashboard structure stays intact at `/tenant/dashboard`
- Sidebar navigation unchanged; "Home" now points to `/` (Community Hub for tenants, landing page for guests redirects to login)

---

**Next Step:** Implementation plan to be created via `superpowers:writing-plans` skill after spec approval.
