# Maintenance List/Grid Toggle — Implementation Plan

> **Spec:** `docs/superpowers/specs/2026-05-16-maintenance-list-grid-toggle-design.md`
> **Goal:** Add list/grid toggle to tenant and landlord maintenance pages with persisted preference.

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/hooks/useViewMode.ts` | New — localStorage-backed hook returning `[view, setView]` |
| `src/components/shared/ViewToggle.tsx` | New — pill-style toggle with List/LayoutGrid icons |
| `src/app/tenant/maintenance/page.tsx` | Modify — integrate toggle, grid CSS class, mobile guard |
| `src/components/landlord/maintenance/MaintenanceDashboard.tsx` | Modify — integrate toggle, grid CSS class, mobile guard |

No existing files need refactoring. Both pages already render card-based layouts — only the container CSS changes.

---

## Tasks

### Task 1 — `src/hooks/useViewMode.ts` (new)

**Action:** Create the hook file.

```ts
// src/hooks/useViewMode.ts
import { useState, useEffect } from "react";

export function useViewMode(key: string): ["list" | "grid", (v: "list" | "grid") => void] {
  const [view, setView] = useState<"list" | "grid">("list");

  // Read from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(key);
    if (stored === "list" || stored === "grid") {
      setView(stored);
    }
  }, [key]);

  // Write to localStorage on change
  const handleSetView = (v: "list" | "grid") => {
    setView(v);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, v);
    }
  };

  return [view, handleSetView];
}
```

---

### Task 2 — `src/components/shared/ViewToggle.tsx` (new)

**Action:** Create the shared toggle component.

**Imports:** `List`, `LayoutGrid` from `lucide-react`, `cn` from `@/lib/utils`.

**Props:**
```ts
interface ViewToggleProps {
  view: "list" | "grid";
  onChange: (v: "list" | "grid") => void;
}
```

**UI:** A `<div>` with two icon buttons (List / LayoutGrid). Active button gets `bg-primary/10 text-primary`. Inactive gets `text-muted-foreground hover:bg-muted`. Buttons are joined in a pill container.

**Placement note:** The parent container's header bar (where filter tabs already live) is where this toggle goes. Do not create a new header — inject it into the existing JSX structure of each page.

---

### Task 3 — `src/app/tenant/maintenance/page.tsx` (modify)

**Existing structure to preserve:** The page has a `useEffect` that fetches requests, a `statusTabs` filter bar, and renders a `.maintenance-content` area with card elements.

**Changes:**

1. **Import** `ViewToggle` and `useViewMode`:
   ```ts
   import { ViewToggle } from "@/components/shared/ViewToggle";
   import { useViewMode } from "@/hooks/useViewMode";
   ```

2. **Add hook call** in the component (after existing state):
   ```ts
   const [view, setView] = useViewMode("ireside:maintenance-view");
   ```

3. **Add mobile guard** — detect mobile and force list view:
   ```ts
   const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
   const effectiveView = isMobile ? "list" : view;
   ```
   (Consider using a `useEffect` + resize listener to update `isMobile` state for proper reactivity.)

4. **Wrap the requests container:** Find the `map` that renders cards. The container div (likely `.maintenance-content` or the div around the map) gets:
   ```tsx
   <div className={cn(
     "grid grid-cols-1 gap-3",
     effectiveView === "grid" && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
   )}>
   ```
   Remove the old `.maintenance-content` flex/grid class and use conditional Tailwind.

5. **Add toggle** — place `ViewToggle` in the header bar next to the filter tabs (or after the status tabs row). Pass `view` and `setView`.

6. **Hide toggle on mobile:** Add `className={isMobile ? "hidden" : ""}` to the toggle container.

---

### Task 4 — `src/components/landlord/maintenance/MaintenanceDashboard.tsx` (modify)

**Changes:** Same pattern as Task 3.

1. **Import** `ViewToggle` and `useViewMode`
2. **Add hook** — same call, same key `"ireside:maintenance-view"`
3. **Mobile guard** — same pattern with resize listener
4. **Grid container** — find where the request cards are rendered. The container likely uses `flex flex-col`. Replace with conditional Tailwind grid class. The cards themselves are the `.maintenance-card` divs inside the `map`.
5. **Add toggle** — find the header area in `MaintenanceDashboard` (there may be a header section with search/filter controls) and add `ViewToggle` alongside existing controls.

---

## Testing Notes

- Open `/tenant/maintenance` — verify toggle appears (top-right of header)
- Switch to grid — cards rearrange in 3-col grid
- Switch back to list — single column
- Refresh — preference persists
- Resize to < 640px — list view forced, toggle hidden
- Repeat for `/landlord/maintenance`

---

## Files Summary

```
src/
  hooks/
    useViewMode.ts                          [NEW]
  components/
    shared/
      ViewToggle.tsx                        [NEW]
  app/
    tenant/maintenance/page.tsx             [MODIFY]
  components/landlord/maintenance/
    MaintenanceDashboard.tsx               [MODIFY]
```

---

## Commit Strategy

Commit after each file is complete and working:
1. `hooks/useViewMode.ts` — minimal hook
2. `components/shared/ViewToggle.tsx` — toggle UI
3. `tenant/maintenance/page.tsx` — integration
4. `landlord/maintenance/MaintenanceDashboard.tsx` — integration

Message format: `feat(maintenance): add list/grid toggle — <component>`