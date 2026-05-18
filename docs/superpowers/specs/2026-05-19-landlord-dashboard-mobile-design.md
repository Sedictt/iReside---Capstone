# Landlord Dashboard Mobile Responsiveness — Design Spec
**Date:** 2026-05-19
**Status:** Approved for Implementation

---

## Overview

Make the landlord dashboard (`/landlord/dashboard`) fully responsive with mobile-first layouts, a mobile messages FAB, and better touch targets.

---

## 1. Mobile Messages FAB

**Problem:** ContactsSidebar is `md:flex` only — mobile users have no access to messages.

**Solution:** Floating Action Button on mobile that opens a slide-up drawer.

### Layout
```
┌──────────────────────────────┐
│  [☰]    iReside    [◯] [👤]  │  ← sticky header (already exists)
│                              │
│      [Dashboard Content]     │
│                              │
│                              │
│                       [💬]    │  ← FAB bottom-right
└──────────────────────────────┘

When FAB tapped:
┌──────────────────────────────┐
│  ──────────────────────────  │  ← drag handle
│  Messages                    │
│  [tabs: Messages | Contacts] │
│  ──────────────────────────  │
│  [Chat list / Contact list]  │
│  ──────────────────────────  │
│  [View All Messages]         │
└──────────────────────────────┘
```
Slide-up sheet from bottom, ~70vh height, rounded top corners.

### Implementation
- New component: `src/components/landlord/dashboard/MobileMessagesSheet.tsx`
- Import/use in `landlord/dashboard/page.tsx`
- Use framer-motion `AnimatePresence` + `layout` for slide-up
- Hide FAB on `md:` and above

---

## 2. DashboardBanner

| Before | After |
|--------|-------|
| `min-h-[380px] sm:min-h-[420px] md:min-h-[480px]` | `min-h-[260px] sm:min-h-[300px] md:min-h-[380px]` |
| Flex row always | `flex-col lg:flex-row` on mobile |
| `px-6 py-16` | `px-4 py-8 sm:px-6 sm:py-10 md:px-10 md:py-12` |
| Font: `text-3xl sm:text-4xl md:text-6xl` | `text-2xl sm:text-3xl md:text-5xl` |
| Clock visible inline with text | Clock stacks below content on mobile |

**Actions (New Application, QR, etc.):**
- On mobile: 2-column mini grid, icons only with tooltips
- `h-12 sm:h-14`, icons `size-4 sm:size-5`

---

## 3. CommandCenter

### Stats Pills Row
| Before | After |
|--------|-------|
| `flex-wrap gap-2 sm:gap-3` | `flex gap-2 overflow-x-auto pb-1 pr-1` (horizontal scroll) |
| `min-w-[calc(50%-8px)] sm:flex-initial` | `shrink-0 w-auto` |

Scrollable on mobile, shows all 4 without wrapping.

### Operations Grid
| Before | After |
|--------|-------|
| `grid-cols-2 sm:grid-cols-2 md:grid-cols-3` | `grid-cols-3 sm:grid-cols-3 md:grid-cols-3` |
| `flex-col sm:flex-row` (label under icon) | Always column (icon top, label bottom) |
| `text-center sm:text-left` | `text-center` always |
| Icon `size-10` | `size-9 sm:size-10` |
| Padding `p-3 sm:p-3.5` | `p-2 sm:p-3` |

### Insights Hub
- Stack below Operations on mobile (`lg:grid-cols-[1fr_380px]` → single column)
- Full width cards on mobile

---

## 4. Cash Flow Ledger (Payments Section)

### Grid
| Before | After |
|--------|-------|
| `grid-cols-1 md:grid-cols-3` | `grid-cols-1 sm:grid-cols-3` (3 cols on tablet+) |

### Payment Cards
| Before | After |
|--------|-------|
| Truncate unit name at `max-w-[120px] sm:max-w-[160px]` | Always `max-w-[100px] sm:max-w-none` |
| `text-sm` tenant name | `text-xs sm:text-sm` |

---

## 5. ActionRequired Cards

### Card Layout
| Before | After |
|--------|-------|
| `flex-col sm:flex-row` always | `flex-col sm:flex-row` — button below content on mobile |
| Button: `self-stretch sm:self-center sm:w-auto` | Button: full-width on mobile, `sm:w-auto` on tablet+ |
| Button text: `px-6 py-3` | `px-4 py-2.5 sm:px-6 sm:py-3` |

---

## 6. Lease Renewals Card

Identical fix to Cash Flow — `sm:grid-cols-3` on tablet+.

---

## 7. Touch Targets & Spacing

| Element | Min Size | Adjustment |
|---------|----------|------------|
| All buttons | 44×44px | Ensure `h-11` or larger for icon-only buttons |
| CommandCenter action cards | `p-2 sm:p-3` | Already ≥44px |
| FAB | `size-14` | Large enough |
| Mobile header icons | Already `size-6` | OK at 24px |
| Payment card click area | Full card | Already hoverable |
| Stats pills | `px-3 sm:px-4 py-2 sm:py-2.5` | OK |

---

## 8. General Breakpoints

```
xs: 0-479px   (small phones)
sm: 480-767px (large phones / small tablets)
md: 768-1023px (tablets / small laptops)
lg: 1024px+   (desktop)
```

All components use Tailwind's default breakpoints.

---

## Component Changes Summary

| File | Change |
|------|--------|
| `DashboardBanner.tsx` | Reduce heights, stack layout mobile |
| `DashboardMainContent.tsx` | Smaller text, icon-only action buttons on mobile |
| `CommandCenter.tsx` | Scrollable stats row, smaller ops grid |
| `page.tsx` (dashboard) | Add `MobileMessagesSheet`, fix payment/lease grid |
| `ActionRequired.tsx` | Full-width CTA on mobile |
| **NEW** `MobileMessagesSheet.tsx` | FAB + slide-up drawer for mobile messages |

---

## Files to Modify
1. `src/components/landlord/dashboard/DashboardBanner.tsx`
2. `src/components/landlord/dashboard/DashboardMainContent.tsx`
3. `src/components/landlord/dashboard/CommandCenter.tsx`
4. `src/app/landlord/dashboard/page.tsx`
5. `src/components/landlord/dashboard/ActionRequired.tsx`
6. **NEW** `src/components/landlord/dashboard/MobileMessagesSheet.tsx`