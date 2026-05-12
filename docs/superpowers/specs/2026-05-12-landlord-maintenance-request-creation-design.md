# Landlord Maintenance Request Creation — Design

**Date**: 2026-05-12
**Status**: Approved for implementation

---

## 1. Overview

Add functionality to the "New Work Order" button on `/landlord/maintenance` so it opens a modal form for landlords to create new maintenance requests. Also rename the button to **"Report an Issue"** for clarity.

---

## 2. Button Change

**File**: `src/components/landlord/maintenance/MaintenanceDashboard.tsx` (line 278)

- Rename label from `"New Work Order"` → `"Report an Issue"`
- Add `onClick` handler to open the creation modal: `onClick={() => setIsCreateModalOpen(true)}`

---

## 3. New State Variable

**File**: `src/components/landlord/maintenance/MaintenanceDashboard.tsx`

Add to existing state declarations:

```ts
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
```

---

## 4. Extend MaintenanceRequestModal for "Create Mode"

**File**: `src/components/landlord/maintenance/MaintenanceRequestModal.tsx`

Add `mode?: "view" | "create"` prop. When `mode === "create"`:

- Modal renders with an **empty form** (no pre-filled data from an existing request)
- Form fields required:
  - **Unit** (dropdown — units associated with the selected property from PropertyContext)
  - **Title** (text input — short description of the issue)
  - **Description** (textarea — detailed description)
  - **Priority** (select: Critical / High / Medium / Low, default: Medium)
  - **Photo** upload (optional, 1 photo)
- On submit → POST to `/api/landlord/maintenance` with form data
- On success → close modal, add new request to top of list
- On error → show inline error message

**Existing "view" mode** (for viewing/editing existing requests) remains unchanged.

---

## 5. API Endpoint (New)

**File**: `src/app/api/landlord/maintenance/route.ts`

Add `POST` handler to create a new maintenance request:

```
POST /api/landlord/maintenance
Body: { propertyId, unitId, title, description, priority, photo? }
Response: { request: MaintenanceRequest }
```

---

## 6. Files to Modify

| File | Change |
|------|--------|
| `src/components/landlord/maintenance/MaintenanceDashboard.tsx` | Rename button, add `isCreateModalOpen` state, render modal in create mode |
| `src/components/landlord/maintenance/MaintenanceRequestModal.tsx` | Add `mode` prop + create form UI |
| `src/app/api/landlord/maintenance/route.ts` | Add POST handler |

---

## 7. Out of Scope

- Photo upload to cloud storage (store as URL placeholder or skip for v1)
- Notification to tenant
- Assigning an assignee (can be added later)