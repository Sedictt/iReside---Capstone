# Unit Map — Feature Plan

## Current State (What We Have)
The `VisualBuilder` component is a fully functional drag-and-drop blueprint editor, but it is **entirely disconnected from the database**:

- **Units** are hardcoded mock data (`INITIAL_UNITS` — Unit 101, 102, 103, etc.)
- **Floors** are hardcoded in `DEFAULT_FLOOR_LAYOUTS` (Ground, Floor 1, Floor 2)
- **Layout persistence** is per-browser `localStorage` only, scoped to `propertyId`
- **Status** (vacant/occupied/maintenance) is managed in local state only, never synced

---

## The Core Problem: Two Disconnected Worlds

The database already has the **truth** about a property:

| DB `units` table | VisualBuilder |
|---|---|
| `id` (UUID) | Local mock ID (e.g., "101") |
| `name` (e.g., "Unit A") | "Unit 101" |
| `floor` (integer) | Floor layer key (e.g., "floor1") |
| `status` (vacant / occupied / maintenance) | Local state only |
| `beds`, `baths`, `rent_amount`, `sqft` | Not present |

The Unit Map needs to become a **visual representation of these real units**, not a freeform drawing tool.

---

## Your Ideas — Validated & Expanded

### ✅ Idea 1: Unit Count is dictated by the property
**Confirmed correct.** The `units` table already holds all units for a property. The number of unit blocks that can be placed on the map should be exactly equal to the number of units in the DB for that property. You **cannot** drag more units than exist, and **cannot** have fewer placed (a unit must eventually be placed somewhere).

### ✅ Idea 2: Number of floors is dictated by the property
**Confirmed correct, but needs a DB source.** Currently, the `units` table has a `floor` (INT) column. The max floor number across all units in a property naturally defines the floor count. For example, if units have `floor` values of 1, 1, 2, 2, 3, then the property has 3 floors + optionally a ground floor.

---

## Missing Operations You Likely Missed

### 1. **The Initial Setup Flow ("First Launch" State)**
When a landlord opens the Unit Map for a property for the first time, there is no layout. We need a clear **setup wizard or guided state** that says "You have X units across Y floors — place them on the map."

**States a Unit Map can be in:**
```
[No Layout Saved]  →  [Partial Layout]  →  [Fully Placed]
    (setup)             (in-progress)         (operational)
```

### 2. **Unit Identity Binding**
When a landlord drags a unit block onto the canvas, they aren't creating a new unit — they are **placing** an existing DB unit. Each block on the canvas must be permanently bound to a real `unit.id`. This is critical because:
- Status changes on the canvas (mark occupied/vacant) must write back to `units.status`
- Clicking a unit on the tenant map must link to the unit's real lease and tenant

### 3. **Layout Persistence in the Database**
`localStorage` is per-browser. If the landlord switches devices, the map is gone. The X/Y/W/H positions of each unit block (the visual layout) must be saved in the database.

**Proposed new table: `unit_map_positions`**
```sql
CREATE TABLE unit_map_positions (
    unit_id     UUID PRIMARY KEY REFERENCES units(id) ON DELETE CASCADE,
    floor_key   TEXT NOT NULL,       -- e.g. "floor1", "ground"
    x           INT NOT NULL,
    y           INT NOT NULL,
    w           INT NOT NULL,
    h           INT NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4. **Floor Configuration**
The `floor` integer on the `units` table is the source of truth for what floor a unit is on. However, the Visual Planner also supports:
- Custom floor names (e.g., renaming "Floor 1" to "Lobby Level")
- A "ground" floor (floor 0 in DB terms)

**Proposed new table: `property_floor_configs`**
```sql
CREATE TABLE property_floor_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    floor_number    INT NOT NULL,       -- 0 = ground, 1 = floor 1, etc.
    floor_key       TEXT NOT NULL,      -- "ground", "floor1", etc.
    display_name    TEXT,               -- custom name, nullable
    UNIQUE(property_id, floor_number)
);
```

### 5. **Unplaced Units Panel (The "Inventory")**
Once the map is live and backed by real units, there needs to be a visual list of **unplaced units** — units that exist in the DB but haven't been positioned on the canvas yet. This replaces the current sidebar's generic block types (Studio, 1BR, etc.) with real unit cards.

### 6. **Status Sync (Bidirectional)**
The Unit Map shows `status` (occupied/vacant/maintenance). This status already exists in `units.status`. We need:
- **Read**: On map load, pull live status from DB
- **Write**: Quick actions (mark occupied, mark vacant, start maintenance) must call the API and update `units.status` in real time

> [!NOTE]
> Status is currently **already driven by leases** via a DB trigger. If a lease becomes active, the unit auto-sets to `occupied`. The Unit Map's quick-action buttons should just be shortcuts, not the authoritative source.

### 7. **Corridors and Structures are Decoration**
Unlike units, corridors and hallways are **not DB entities** — they are pure visual layout aids. They should still be persisted, but in a separate layout blob (JSONB) on the property:

**Option A:** Add a `map_layout_meta JSONB` column to `properties`  
**Option B:** Create a `property_map_decorations` table with rows per floor  

Recommendation: **Option A** — simple, single write, not relational.

### 8. **Read-Only View for Tenants**
The Unit Map already has a `readOnly` prop. The tenant-facing view should:
- Show all placed units with live status colors
- Let tenants tap a vacant unit to **request a transfer**
- Not show unplaced units or the sidebar

---

## Proposed Flow: Initial Setup

```
Landlord opens Unit Map for a new property
        ↓
 [Setup Screen]
 "Your property has X units across Y floors.
  Drag each unit to position it on the map."
        ↓
 Sidebar shows REAL units (from DB), grouped by floor
        ↓
 Landlord drags Unit A → Floor 1 canvas
        ↓
 Position saved to `unit_map_positions` table
        ↓
 Repeat until all units are placed
        ↓
 [Map Complete Banner] → transitions to Operational view
```

---

## Phased Implementation Plan

### Phase 1 — Database Foundation
- [ ] Create `unit_map_positions` table + RLS policies
- [ ] Create `property_floor_configs` table + RLS policies  
- [ ] Add `map_decorations JSONB` to `properties` table (for corridors/structures)
- [ ] Create API: `GET /api/landlord/unit-map?propertyId=` → returns units + positions + floor configs
- [ ] Create API: `POST /api/landlord/unit-map/save` → upserts positions + decorations

### Phase 2 — VisualBuilder Refactoring
- [ ] On mount, fetch real units from API instead of using `INITIAL_UNITS`
- [ ] Sidebar becomes "Unplaced Units" panel (real unit cards, not block types)
- [ ] Each dragged unit block is bound to `unit.id` (UUID), not a local counter
- [ ] Floors are built from `property_floor_configs` + the `floor` values in `units`
- [ ] Save button triggers API write for positions + decorations
- [ ] Remove `localStorage` as primary persistence (keep as optimistic write cache)

### Phase 3 — Setup Wizard
- [ ] Detect "no layout saved" state on map load
- [ ] Show onboarding UI: unit count, floor count, instructions
- [ ] Auto-group unplaced units by their `units.floor` value into the correct floor tabs

### Phase 4 — Status Sync
- [ ] On map load, display live `status` from DB (not local state)
- [ ] Quick actions (mark vacant, mark occupied) → `PATCH /api/landlord/units/:id/status`
- [ ] "Start Maintenance" → pre-fills a maintenance request form

### Phase 5 — Tenant View
- [ ] Ensure `readOnly` prop hides all editing controls
- [ ] Placed vacant units show "Request Transfer" button
- [ ] Occupied unit cards show only name + status (no tenant PII leakage)

---

## Design Decisions — ✅ Locked In

| Decision | Answer |
|---|---|
| **Floor source of truth** | Explicitly defined by landlord during **property creation** |
| **Mandatory placement** | ✅ Yes — all units must be placed before the map is "complete" |
| **Corridor/structure persistence** | JSONB blob on the property record (see note below) |
| **Save behavior** | ✅ Auto-save to DB on every change |
| **Floor naming** | Default names (Floor 1, Floor 2, etc.) — landlord can rename from the Unit Map page |

> [!NOTE]
> **Corridors & Structures — why JSONB?** Corridors, elevators, and stairwells are purely visual decorations. They don't link to tenants, leases, or payments. Saving them as a single JSON chunk directly on the property record is simpler and avoids unnecessary database tables. One property = one layout blob.

---

## Property Creation Impact

Since floors are explicitly defined during property creation, we need to **add a floor count step** to the property creation wizard. Specifically:

- Landlord defines **number of floors** (e.g., 3 floors + ground)
- This generates `property_floor_configs` rows automatically on property save
- Floor keys default to `ground`, `floor1`, `floor2`, etc.
- Floor display names default to "Ground", "Floor 1", "Floor 2", etc. (editable later in Unit Map)

This also means the **`units` table's existing `floor` INT column** becomes the definitive assignment — when a unit is placed on Floor 2 in the map, `units.floor` is updated to `2`.
