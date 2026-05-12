# Landlord "Log a Repair" — Design Spec

## Context

The landlord maintenance dashboard (`/landlord/maintenance`) has a "New Work Order" button that:
1. Uses non-user-friendly terminology ("Work Order" is back-office jargon)
2. Is non-functional — no `onClick` handler, does nothing

This spec covers the fix: rename the button, wire it up, and create a functional creation flow.

---

## Design Decisions

### 1. Button Label

**Label:** `Log a Repair`
**Icon:** `Plus` (existing, from lucide-react)

Rationale: Landlord POV, action-oriented, clear intent. "Log" = record an item for tracking, "Repair" = the thing being tracked. Short, scannable, fits the pill-button style.

### 2. Data Model

**Same model as tenant-created requests.** No new table.

| Field | Type | Source/Notes |
|---|---|---|
| `created_by` | `"landlord" \| "tenant"` | New field on insert. Distinguishes origin in queries. |
| `title` | string | Required, max 100 chars |
| `description` | string | Required, multiline |
| `category` | string | Enum: `plumbing \| electrical \| hvac \| appliances \| structural \| pest \| other` |
| `priority` | `Low \| Medium \| High \| Critical` | Default: `Medium` |
| `property` | string | Resolved from selected property context |
| `unit` | string | Resolved from property + unit selection |
| `status` | `Pending` | Always `Pending` on create |
| `images` | string[] | Optional, up to 5 |
| `assignee` | null | Not set on create |
| `reported_at` | ISO date string | `new Date().toISOString()` |

IRIS triage runs server-side after insert (same as tenant flow).

### 3. API Changes

**File:** `src/app/api/landlord/maintenance/route.ts`

Add a `POST` handler alongside the existing `GET`. The POST:
1. Authenticates via `requireUser()`
2. Validates required fields (title, description, category, priority, property, unit)
3. Uploads images to Supabase storage (same pattern as tenant `/api/tenant/maintenance/media`)
4. Inserts into `maintenance_requests` table with `landlord_id` (from auth) and `created_by = "landlord"`
5. Returns the created object in the same shape as the GET response
6. Runs IRIS triage asynchronously (same as tenant POST)

**Request body:**
```json
{
  "title": "Leaking faucet in kitchen",
  "description": "Kitchen sink faucet has a slow drip...",
  "category": "plumbing",
  "priority": "Medium",
  "propertyId": "uuid",
  "unitId": "uuid",
  "images": ["https://storage.url/image1.jpg"]
}
```

**Response:** `201 Created` with the full `MaintenanceRequestItem` object.

### 4. New Component: `CreateMaintenanceModal`

**File:** `src/components/landlord/maintenance/CreateMaintenanceModal.tsx`

A creation-focused modal (separate from `MaintenanceRequestModal` which is view/edit-only).

**Props:**
```typescript
interface CreateMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (request: MaintenanceRequest) => void;
}
```

**Form structure:**
```
Property [dropdown]    Unit [dropdown]
Category [selector - 7 options with icons]
Priority [segmented control - Low/Medium/High/Critical]
Title [text input, required]
Description [textarea, required]
Photos [drag-drop upload, max 5, optional]
```

**Behavior:**
- Property/unit dropdowns populated from `PropertyContext` (or fetched if needed)
- If only one property, pre-select it
- If only one unit in that property, pre-select it
- Submit calls `POST /api/landlord/maintenance`
- On success: call `onCreated(request)`, close modal, show success feedback
- On error: display inline error, keep modal open
- Close: confirm if form is dirty ("Discard changes?")

**React clean code standards:**
- Each form section as a separate small component (e.g., `CategorySelector`, `PrioritySelector`)
- No prop drilling — use local state for form fields
- Clear named handlers: `handleFileChange`, `handleRemoveFile`, `handleSubmit`
- Type-safe props interface
- Accessible: proper `<label>` associations, `aria-invalid`, `aria-describedby` for errors

### 5. Dashboard Changes

**File:** `src/components/landlord/maintenance/MaintenanceDashboard.tsx`

- Line 278: Change `onClick={undefined}` → `onClick={() => setIsCreateModalOpen(true)}`
- Line 280: Change text `New Work Order` → `Log a Repair`
- Add `const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)`
- Add `<CreateMaintenanceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreated={(req) => { setRequests(prev => [req, ...prev]); setIsCreateModalOpen(false); }} />`

### 6. Shared Categories (reused from tenant)

The `tenant/maintenance/new/page.tsx` defines `CATEGORIES`. Move to shared location:
**File:** `src/lib/constants/maintenance-categories.ts`

```typescript
export const MAINTENANCE_CATEGORIES = [
  { id: "plumbing", label: "Plumbing", icon: "Droplets", color: "text-blue-500" },
  { id: "electrical", label: "Electrical", icon: "Zap", color: "text-yellow-500" },
  { id: "hvac", label: "HVAC / Cooling", icon: "Thermometer", color: "text-orange-500" },
  { id: "appliances", label: "Appliances", icon: "LayoutGrid", color: "text-purple-500" },
  { id: "structural", label: "Structural", icon: "Hammer", color: "text-neutral-500" },
  { id: "pest", label: "Pest Control", icon: "Bug", color: "text-emerald-500" },
  { id: "other", label: "Other / General", icon: "Wrench", color: "text-cyan-500" },
] as const;
```

Both tenant `NewMaintenanceRequest` and new `CreateMaintenanceModal` import from here.

---

## Out of Scope

- Notification to tenant (landlords log items silently for now)
- Scheduling/appointment booking (future feature)
- Assigning to trade person on create (done post-creation in detail modal)

---

## Files to Change

| File | Change |
|---|---|
| `src/components/landlord/maintenance/MaintenanceDashboard.tsx` | Wire button, rename label |
| `src/components/landlord/maintenance/CreateMaintenanceModal.tsx` | **New** — creation modal |
| `src/components/landlord/maintenance/CategorySelector.tsx` | **New** — category picker sub-component |
| `src/components/landlord/maintenance/PrioritySelector.tsx` | **New** — priority segmented control |
| `src/app/api/landlord/maintenance/route.ts` | Add POST handler |
| `src/lib/constants/maintenance-categories.ts` | **New** — shared category constants |
| `src/app/tenant/maintenance/new/page.tsx` | Update to import shared categories |

---

## Success Criteria

1. Button displays "Log a Repair" in the correct pill-button style
2. Clicking opens the creation modal with all fields
3. Form validates required fields before submit
4. POST to `/api/landlord/maintenance` creates a record in the database
5. New item appears at top of the maintenance list immediately after creation
6. Inline error shown if API call fails
7. No TypeScript errors, no ESLint errors
8. React clean code: no massive components, clear naming, single responsibility