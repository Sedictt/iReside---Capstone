# Landlord Dashboard Mobile Responsiveness — Implementation Plan

> **Spec:** `docs/superpowers/specs/2026-05-19-landlord-dashboard-mobile-design.md`
> **Target:** `http://localhost:3000/landlord/dashboard`

---

## File Map

| File | Responsibility |
|------|----------------|
| `src/components/landlord/dashboard/MobileMessagesSheet.tsx` | **NEW** FAB button + slide-up drawer for mobile message access |
| `src/components/landlord/dashboard/DashboardBanner.tsx` | Reduce heights, stack layout on mobile |
| `src/components/landlord/dashboard/DashboardMainContent.tsx` | Smaller text, icon-only action buttons on mobile |
| `src/components/landlord/dashboard/CommandCenter.tsx` | Scrollable stats row, smaller ops grid, stack insights |
| `src/components/landlord/dashboard/ActionRequired.tsx` | Full-width CTA on mobile |
| `src/app/landlord/dashboard/page.tsx` | Import + embed `MobileMessagesSheet`; fix payment grid breakpoints |

---

## Task 1: Create MobileMessagesSheet Component
**File:** `src/components/landlord/dashboard/MobileMessagesSheet.tsx`

This is the most complex new component. It needs:
- A FAB (Floating Action Button) visible only on mobile (`hidden md:block`)
- A slide-up sheet/drawer when FAB is tapped
- Tabs for "Messages" and "Contacts" (reuse conversation data logic from ContactsSidebar)
- A "View All Messages" button linking to `/landlord/messages`
- Framer Motion for the slide-up animation

Since the actual messaging logic lives in `ContactsSidebar.tsx`, the simplest approach is to **reuse the conversation state from ContactsSidebar** by having MobileMessagesSheet also call `fetchConversations()` directly — identical to how ContactsSidebar does it.

**Steps:**
1. Create `MobileMessagesSheet.tsx`
2. Import `fetchConversations` from `@/lib/messages/client` (same as ContactsSidebar)
3. Use same `ChatUser` type and `formatConversationTimestamp` helper pattern
4. Render a compact chat list in the sheet
5. FAB at bottom-right, sheet slides up on click
6. Hide on `md:` and above (ContactsSidebar handles desktop)

**Key Tailwind classes:**
- FAB: `fixed bottom-6 right-6 z-50 size-14 rounded-full bg-primary text-primary-foreground shadow-lg`
- Sheet: `fixed inset-x-4 bottom-4 z-[60] max-h-[70vh] rounded-[2rem] bg-card border border-white/10 shadow-2xl`
- Drag handle: `mx-auto mt-2 h-1 w-12 rounded-full bg-muted`

---

## Task 2: Modify DashboardBanner
**File:** `src/components/landlord/dashboard/DashboardBanner.tsx`

**Changes:**
- Container: `min-h-[260px] sm:min-h-[300px] md:min-h-[380px]` (was `380/420/480`)
- Flex direction: `flex-col lg:flex-row` (was just flex with row)
- Padding: `px-4 py-8 sm:px-6 sm:py-10 md:px-10 md:py-12` (was `px-6 py-16 sm:px-8 md:px-14 md:py-16`)
- Inner content wrapper: `flex-col lg:flex-row items-center justify-between gap-6` (stack on mobile)
- Clock: moves below main content on mobile (`mt-4 lg:mt-0`)

---

## Task 3: Modify DashboardMainContent
**File:** `src/components/landlord/dashboard/DashboardMainContent.tsx`

**Changes:**
- Title: `text-2xl sm:text-3xl md:text-5xl` (was `text-3xl sm:text-4xl md:text-6xl`)
- Badge: `text-[9px] sm:text-[10px]`
- Action buttons container: `flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4`
- Icon buttons (QR, Wrench, Map): `h-12 w-12 sm:h-14 sm:w-14` with `shrink-0`
- "New Application" button: full width on mobile (`w-full sm:w-auto`)

---

## Task 4: Modify CommandCenter
**File:** `src/components/landlord/dashboard/CommandCenter.tsx`

**Changes:**
- Stats pills row: `flex gap-2 overflow-x-auto pb-1 pr-1` (was `flex-wrap gap-3`)
- Each pill: `shrink-0 w-auto rounded-2xl` (remove `min-w-[calc(50%-8px)]`)
- Operations grid: `grid-cols-3 gap-2 sm:gap-3` (was `grid-cols-2 sm:grid-cols-2 md:grid-cols-3`)
- Operation cards: `p-2 sm:p-2.5 flex-col items-center text-center gap-1.5` (always column, centered)
- Icons: `size-8 sm:size-9` (was `size-10`)
- Labels: `text-[10px] sm:text-xs` font-black
- Insights hub: `lg:grid-cols-[1fr_380px]` → `grid-cols-1 lg:grid-cols-[1fr_380px]` (stack on mobile)

---

## Task 5: Modify ActionRequired
**File:** `src/components/landlord/dashboard/ActionRequired.tsx`

**Changes:**
- Card layout (inside `ActionItemCard`): Keep `flex-col sm:flex-row` but make CTA full-width on mobile
- Button: `w-full sm:w-auto self-stretch sm:self-center`
- Button padding: `px-4 py-2.5 sm:px-6 sm:py-3`
- Card padding: `p-4 sm:p-5`
- Summary bar: `overflow-x-auto pb-1 sm:justify-end` (allow scroll on mobile)

---

## Task 6: Modify Dashboard Page
**File:** `src/app/landlord/dashboard/page.tsx`

**Changes:**
1. Import `MobileMessagesSheet`
2. Add `<MobileMessagesSheet />` inside the root `<>` fragment, outside the main scrollable div
3. Payment grid: `grid-cols-1 sm:grid-cols-3` (was `grid-cols-1 md:grid-cols-3`) — 3 cols on tablet+
4. Payment card: `max-w-[100px] sm:max-w-none` for unit name truncation

---

## Suggested Implementation Order

1. **Task 1** (MobileMessagesSheet) — the biggest new piece, do first
2. **Task 6** (page.tsx) — import and place the new component
3. **Task 2** (DashboardBanner) — affects hero section
4. **Task 3** (DashboardMainContent) — affects hero content
5. **Task 4** (CommandCenter) — largest section
6. **Task 5** (ActionRequired) — last section

Steps 2-6 can be done in any order after step 1 is complete.

---

## Verification

After all changes:
1. Run `npm run build` — must pass
2. Run `npm run lint` — must pass
3. Manually test at `http://localhost:3000/landlord/dashboard`:
   - Resize browser to mobile width (375px, 414px, 768px)
   - Check all sections render without horizontal scroll at any width
   - FAB appears at mobile widths, disappears at tablet+
   - Tapping FAB opens the messages sheet
   - Stats pills scroll horizontally
   - Operations grid has 3 columns on tablet+
   - ActionRequired CTA buttons are full-width on mobile