# Landlord "Log a Repair" — Implementation Plan

> **Spec:** `docs/superpowers/specs/2026-05-12-landlord-log-repair-design.md`
> **Goal:** Make the "New Work Order" button functional and rename it to "Log a Repair"

---

## What This Does

Adds a working "Log a Repair" button to the landlord maintenance dashboard. Clicking it opens a modal form. Submitting creates a maintenance request in the database and adds it to the list.

---

## File Map

```
src/
  components/landlord/maintenance/
    CreateMaintenanceModal.tsx      [NEW] creation modal
    CategorySelector.tsx            [NEW] category grid sub-component
    PrioritySelector.tsx           [NEW] priority segmented control
  lib/constants/
    maintenance-categories.ts      [NEW] shared category constants
  app/
    api/landlord/maintenance/route.ts  [MODIFY] add POST handler
  components/landlord/maintenance/
    MaintenanceDashboard.tsx          [MODIFY] wire button + rename label
  app/tenant/maintenance/new/
    page.tsx                          [MODIFY] import shared categories
```

---

## Task List

### Phase 1: Shared constants

**T1 — Create `src/lib/constants/maintenance-categories.ts`**

Move the `CATEGORIES` array from `src/app/tenant/maintenance/new/page.tsx` to a shared file. Export as `MAINTENANCE_CATEGORIES`.

```typescript
// src/lib/constants/maintenance-categories.ts
import {
  Droplets, Zap, Thermometer, LayoutGrid, Hammer, Bug, Wrench
} from "lucide-react";

export const MAINTENANCE_CATEGORIES = [
  { id: "plumbing",     label: "Plumbing",       icon: Droplets,    color: "text-blue-500",   bg: "bg-blue-500/10"   },
  { id: "electrical",  label: "Electrical",     icon: Zap,         color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { id: "hvac",        label: "HVAC / Cooling", icon: Thermometer, color: "text-orange-500", bg: "bg-orange-500/10" },
  { id: "appliances",  label: "Appliances",     icon: LayoutGrid,  color: "text-purple-500",bg: "bg-purple-500/10" },
  { id: "structural",  label: "Structural",     icon: Hammer,      color: "text-neutral-500",bg: "bg-neutral-500/10"},
  { id: "pest",        label: "Pest Control",    icon: Bug,         color: "text-emerald-500",bg: "bg-emerald-500/10"},
  { id: "other",       label: "Other / General", icon: Wrench,     color: "text-cyan-500",  bg: "bg-cyan-500/10"  },
] as const;

export type MaintenanceCategoryId = typeof MAINTENANCE_CATEGORIES[number]["id"];
```

**T2 — Update `src/app/tenant/maintenance/new/page.tsx`**

Remove the inline `CATEGORIES` array. Import `MAINTENANCE_CATEGORIES` from the new shared file instead.

---

### Phase 2: API — add POST to landlord maintenance route

**T3 — Add POST handler to `src/app/api/landlord/maintenance/route.ts`**

Add an `export async function POST` handler. Read the existing GET handler to match the response shape.

**Logic:**
1. Authenticate via `requireUser()` → get `user.id` (landlord_id)
2. Parse body: `{ title, description, category, priority, unitId, images }`
3. Validate required fields — return `400` if missing
4. Upload images to Supabase storage (reuse pattern from `/api/tenant/maintenance/media`) — or skip if no images
5. Get `unit_id` from the `units` table using the provided `unitId` + verify it belongs to this landlord
6. Insert into `maintenance_requests` with:
   - `landlord_id = user.id`
   - `unit_id = unitId`
   - `status = "open"` (database enum value → maps to `Pending` in response)
   - `priority = toDbPriority(priority)` (maps `Low→low`, `Medium→medium`, `High→high`, `Critical→urgent`)
   - `category`, `title`, `description`, `images`
   - `created_by = "landlord"` (new column, nullable, defaults to "tenant")
7. Run IRIS triage asynchronously (same pattern as tenant POST — fire-and-forget `computeMaintenanceTriage`)
8. Return `201` with the created row transformed to `MaintenanceRequestItem` shape

**Error handling:** Return appropriate status codes — `400` for validation, `401` for auth, `500` for DB errors.

---

### Phase 3: New components

**T4 — Create `src/components/landlord/maintenance/CategorySelector.tsx`**

A 7-option grid (matching the tenant form style). Each option is a clickable card showing icon + label.

```typescript
interface CategorySelectorProps {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}
```

**Rendering:** 2-3 column responsive grid of cards. Selected card has primary color border/background. Unselected has muted border.

---

**T5 — Create `src/components/landlord/maintenance/PrioritySelector.tsx`**

A horizontal segmented control: `Low | Medium | High | Critical`.

```typescript
interface PrioritySelectorProps {
  value: "Low" | "Medium" | "High" | "Critical";
  onChange: (p: "Low" | "Medium" | "High" | "Critical") => void;
  error?: string;
}
```

Selected segment has primary background. Use existing color coding: Critical=red, High=orange, Medium=yellow, Low=gray.

---

**T6 — Create `src/components/landlord/maintenance/CreateMaintenanceModal.tsx`**

The main creation modal. Follows the same visual style as `MaintenanceRequestModal` (rounded-3xl, backdrop blur, etc.) but is form-focused.

```typescript
interface CreateMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (request: MaintenanceRequest) => void;
}
```

**Form state (all local, no external state library):**
```typescript
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [category, setCategory] = useState("");
const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
const [unitId, setUnitId] = useState(""); // derived from selectedProperty + unit dropdown
const [mediaFiles, setMediaFiles] = useState<File[]>([]);
const [previews, setPreviews] = useState<string[]>([]);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Property/Unit handling:**
- Read `selectedProperty` and `properties` from `PropertyContext`
- If `selectedProperty` exists and has units, pre-select the first unit
- If only one unit, skip the unit dropdown (hidden field)
- If no property selected, show a message "Please select a property first" and disable submit

**Submit flow (`handleSubmit`):**
1. Validate: title + description + category + unitId required. Show inline error if missing.
2. `setIsSubmitting(true)`, clear error
3. Upload images first (same `FormData` + `/api/tenant/maintenance/media` pattern)
4. `POST /api/landlord/maintenance` with `{ title, description, category, priority, unitId, images: imageUrls }`
5. On success: call `onCreated(transformedResponse)`, reset form, close modal
6. On error: set error message, keep modal open

**Dirty-state guard on close:**
If form has any values and `isSubmitting` is false, show a confirmation ("Discard changes?").

---

### Phase 4: Wire into dashboard

**T7 — Update `src/components/landlord/maintenance/MaintenanceDashboard.tsx`**

Changes:
1. Import `CreateMaintenanceModal`
2. Change button label: `New Work Order` → `Log a Repair`
3. Add `onClick={() => setIsCreateModalOpen(true)}` to the button
4. Add `const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)`
5. Render `<CreateMaintenanceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreated={(req) => { setRequests(prev => [req, ...prev]); setIsCreateModalOpen(false); }} />` near the modal

---

### Phase 5: Verification

**T8 — Run lint check**

`npm run lint` on the changed files. Fix any errors.

**T9 — Test the flow manually**

Start the dev server, navigate to `/landlord/maintenance`, click "Log a Repair", fill the form, submit. Verify:
- [ ] Modal opens
- [ ] Form validates required fields
- [ ] On success, new item appears at top of list
- [ ] No console errors

---

## Implementation Notes

- **Do not break existing tenant flow.** Changes to shared categories must not affect `tenant/maintenance/new/page.tsx`.
- **Image upload reuse:** Landlord can call `/api/tenant/maintenance/media` for image uploads (same Supabase bucket). No new upload endpoint needed.
- **IRIS triage:** Landlord-created requests should still go through triage (same as tenant-created). The existing `buildHeuristicMaintenanceTriage` / `computeMaintenanceTriageHash` calls in the GET handler suggest the triage is read-time. For POST, consider running it synchronously or queueing it.
- **Database column:** If `created_by` column doesn't exist in `maintenance_requests` yet, this needs a Supabase migration. Add a note in the PR description for the DBA to add the column with default `"tenant"`.
- **React clean code:** Keep each component under ~200 lines. `CreateMaintenanceModal` is the largest expected at ~250-300 lines with all handlers.

---

## Commit Strategy

Commit per phase (or group related phases):
1. `"feat(landlord): extract maintenance categories to shared constants"` (T1-T2)
2. `"feat(landlord maintenance): add POST handler to create requests"` (T3)
3. `"feat(landlord maintenance): add CategorySelector and PrioritySelector components"` (T4-T5)
4. `"feat(landlord maintenance): add CreateMaintenanceModal"` (T6)
5. `"feat(landlord maintenance): wire Log a Repair button in dashboard"` (T7)
6. `"fix(landlord maintenance): change 'New Work Order' to 'Log a Repair'"` (T7 label change)
7. `"fix: add created_by column migration"` (database migration note)