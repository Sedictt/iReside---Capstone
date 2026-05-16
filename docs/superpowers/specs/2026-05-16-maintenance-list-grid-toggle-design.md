# Maintenance List/Grid Toggle — Design Spec

## Context

Both the Tenant maintenance page (`/tenant/maintenance`) and the Landlord maintenance dashboard (`/components/landlord/maintenance/MaintenanceDashboard.tsx`) display maintenance request cards in a single-column list layout. Users should be able to switch between list and grid views, with their preference persisted.

## Goals

- Add a view mode toggle (list ↔ grid) to both maintenance pages
- Persist the user's view preference in localStorage
- Reuse a single shared toggle component across both pages
- Keep the same card design in both views — only the layout changes

## Non-Goals

- Custom card designs per view (grid uses identical card as list)
- Separate preferences per role (shared `ireside:maintenance-view` key)

---

## Design

### Component: `ViewToggle`

A pill-style icon-group toggle with two states:

| State | Icon | Appearance |
|-------|------|------------|
| List active | `List` (Lucide) | Filled/highlighted background |
| Grid active | `LayoutGrid` (Lucide) | Filled/highlighted background |

**Placement**: Top-right of the maintenance container header, aligned with existing filter controls.

**Sizing**: Icon-only buttons, ~36px touch target, 8px gap between icons.

### Hook: `useViewMode`

```ts
function useViewMode(key: string): ["list" | "grid", (v: "list" | "grid") => void]
```

- Reads/writes to localStorage
- Returns `[view, setView]`
- Defaults to `"list"` if no value stored
- SSR-safe (guards `typeof window !== "undefined"`)

### localStorage Key

**`ireside:maintenance-view`** — shared between tenant and landlord, single preference.

### CSS — Grid Layout

On `.maintenance-content` container when `view === "grid"`:

```css
.maintenance-content.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
```

On mobile (<640px): force list view regardless of saved preference.

---

## Layout Comparison

### List View (current)
- Single column, full-width cards
- `flex-direction: column`, gap: 12px

### Grid View
- Responsive grid, cards wrap
- Each card is the **exact same component** used in list view
- Cards stretch to fill columns evenly

---

## Component Inventory

### `ViewToggle`
- Props: `view: "list" | "grid"`, `onChange: (v: "list" | "grid") => void`
- States: list-active, grid-active, hover (subtle background)
- Icons: `List`, `LayoutGrid` from `lucide-react`
- Style: small icon buttons, connected/joined pill style

### `useViewMode` hook
- Input: `localStorage` key string
- Output: `[view, setView]` tuple
- Handles SSR guard and default fallback

---

## Files

### New Files
| File | Purpose |
|------|---------|
| `src/components/shared/ViewToggle.tsx` | Shared toggle UI component |
| `src/hooks/useViewMode.ts` | localStorage-backed view mode hook |

### Modified Files
| File | Change |
|------|--------|
| `src/app/tenant/maintenance/page.tsx` | Add `ViewToggle`, `useViewMode`, grid CSS class, mobile guard |
| `src/components/landlord/maintenance/MaintenanceDashboard.tsx` | Add `ViewToggle`, `useViewMode`, grid CSS class, mobile guard |

---

## Mobile Behavior

- Breakpoint: 640px
- Below 640px: always render list view, toggle is hidden or disabled
- Above 640px: toggle visible, respects saved preference

---

## Implementation Notes

- The card component itself is **not modified** — it works in both list and grid via the parent container's CSS
- The toggle is purely a CSS class switch on the `.maintenance-content` container
- No API changes needed
- No database changes needed

---

## Dependencies

- `lucide-react` — already in project (provides `List`, `LayoutGrid` icons)
- No new packages required