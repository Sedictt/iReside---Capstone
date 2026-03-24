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
- **Notifications**: (Stretch) New post/comments trigger toast notifications

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
  author_role user_role not null,
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
```

---

## 5. API Design (Server Actions)

All mutations use Server Actions in the App Router pattern.

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
- Results update live (poll every 5s while on screen)

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

---

## 8. Error Handling

### Data Fetching
- Empty state: friendly message with illustration/icon
- Loading: skeleton cards matching actual layout
- Errors: toast + "Retry" button, logs to error tracking

### Validation
- Empty title/content → field-level error
- Rate limiting: max 5 posts/day for tenants, enforced server-side
- Duplicate reaction → handled gracefully (no-op)

### Permission Errors
- Unauthorized write → toast "You don't have permission" + redirect to login if session expired
- 403 responses caught and show appropriate message

### File Uploads (Albums)
- Upload progress indicator
- Max size (10MB) exceeded → error before upload
- Invalid type (non-image) → reject
- Failed upload → retry button

---

## 9. Performance Considerations

- **Images**: Use Next.js Image with proper sizing, lazy loading
- **Feed Pagination**: Infinite scroll with cursor-based pagination (offset ok for <1000 posts)
- **Poll Refreshes**: Debounced polling (5s max) when poll results visible
- **Memoization**: `PostCard` memoized by post.id to prevent re-renders
- **Database**: Indexes on `property_id`, `created_at`, `is_approved`, `status`

---

## 10. Accessibility

- All cards keyboard-navigable (tab order logical)
- Poll options: radio groups with proper labeling
- Modals: focus trap, ESC closes, returns focus to trigger
- Screen reader: live regions for poll result updates (`aria-live="polite"`)
- Color contrast: 4.5:1 minimum for text, icons have text labels or `aria-label`
- Skip links for main feed

---

## 11. Implementation Phases

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
- Accessibility audit
- Performance optimization
- Testing suite (unit + integration)

---

## 12. Success Criteria

- Tenants can view feed of building-specific content
- Landlord can post announcements/polls/albums visible to all tenants
- Tenants can create discussion posts (visible after approval)
- Polls show live results as residents vote
- All interactions (like, comment, vote) are smooth and responsive
- No cross-property data leakage
- Mobile-responsive UI
- Meets WCAG AA accessibility

---

## 13. Out of Scope (Future Phases)

- Push notifications for new posts/comments
- Residents uploading photos directly (only landlord for now)
- Event calendar with RSVP
- Resident-to-resident messaging
- Advanced content search
- Trending posts algorithm
- Integration with `/tenant/dashboard` to show recent community activity

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Moderation queue gets ignored | Residents' posts invisible → frustration | Landlord onboarding to use tools; tenant notifications when approved |
| Spam/abuse from resident posts | Community quality suffers | Pre-moderation, rate limits, reporting feature |
| Poll manipulation | Unfair results | Anonymous votes, one vote per tenant, IP checks (optional) |
| Slow loading with many images | Poor UX | Lazy loading, blur placeholders, CDN, max 4 per card |
| Infinite scroll bugs | Duplicate posts / missed posts | Cursor-based pagination, deduplication |

---

## 15. Open Questions (Answered in Design)

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

## 16. Related Work

- Existing `notifications` table shows announcements in dashboard → new `community_posts` table is more general, rich
- Tenant dashboard structure stays intact at `/tenant/dashboard`
- Sidebar navigation unchanged; "Home" now points to `/` (Community Hub for tenants, landing page for guests redirects to login)

---

**Next Step:** Implementation plan to be created via `superpowers:writing-plans` skill after spec approval.
