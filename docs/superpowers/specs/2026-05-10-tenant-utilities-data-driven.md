# Tenant Utilities Page - Data-Driven Design

**Date:** 2026-05-10
**Status:** Approved
**Author:** Sisyphus

---

## 1. Overview

Replace hardcoded mock data in `/tenant/utilities` page with live data from Supabase. The page displays building amenities (facilities) and tenant booking history, sourced from the `amenities` and `amenity_bookings` tables.

---

## 2. Database Schema

### 2.1 Tables

**`amenities`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `property_id` | uuid | FK to properties |
| `landlord_id` | uuid | FK to profiles |
| `name` | text | e.g., "Grand Function Hall" |
| `type` | text | e.g., "Events", "Leisure", "Creative", "Sports" |
| `image_url` | text | nullable |
| `description` | text | nullable |
| `price_per_unit` | numeric | 0 for free amenities |
| `unit_type` | text | e.g., "hour", "day", "free" |
| `status` | text | "active" or "inactive" |
| `capacity` | integer | nullable |
| `icon_name` | text | nullable - lucide icon name |
| `location_details` | text | e.g., "Tower A, Level 4" |
| `tags` | text[] | optional categorization |

**`amenity_bookings`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `amenity_id` | uuid | FK to amenities |
| `tenant_id` | uuid | FK to profiles |
| `landlord_id` | uuid | FK to profiles |
| `booking_date` | date | |
| `start_time` | time | |
| `end_time` | time | |
| `total_price` | numeric | calculated at booking time |
| `status` | text | "pending", "confirmed", "cancelled" |
| `notes` | text | nullable |
| `created_at` | timestamp | |

---

## 3. API Routes

### 3.1 GET `/api/tenant/amenities`

**Purpose:** Fetch available amenities for tenant's property

**Auth:** Requires authenticated tenant session

**Logic:**
1. Get tenant profile from `requireUser()`
2. Query `leases` table to find tenant's `property_id` (active lease)
3. Query `amenities` WHERE `property_id = ? AND status = 'active'`
4. Extract distinct `type` values for category filter

**Response:**
```json
{
  "amenities": [
    {
      "id": "uuid",
      "name": "Grand Function Hall",
      "type": "Events",
      "description": "Elegant space...",
      "price_per_unit": 500,
      "unit_type": "hour",
      "capacity": 100,
      "image_url": "/amenities/function_room.png",
      "icon_name": "Users",
      "location_details": "Tower A, Level 4",
      "property": { "name": "Sunrise Towers" }
    }
  ],
  "categories": ["All", "Events", "Leisure", "Creative", "Sports"]
}
```

**Error Codes:**
- 401: Not authenticated
- 500: Server error

---

### 3.2 GET `/api/tenant/amenities/bookings`

**Purpose:** Fetch tenant's booking history

**Auth:** Requires authenticated tenant session

**Logic:**
1. Get tenant profile from `requireUser()`
2. Query `amenity_bookings` WHERE `tenant_id = ?`
3. JOIN `amenities` for amenity details
4. Order by `created_at` DESC

**Response:**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "amenity_id": "uuid",
      "booking_date": "2026-05-12",
      "start_time": "16:00:00",
      "end_time": "18:00:00",
      "total_price": 0,
      "status": "confirmed",
      "notes": null,
      "amenity": {
        "name": "Infinity Rooftop Pool",
        "type": "Leisure",
        "icon_name": "Waves",
        "property_id": "uuid"
      }
    }
  ]
}
```

---

### 3.3 POST `/api/tenant/amenities/bookings`

**Purpose:** Create a new amenity booking

**Auth:** Requires authenticated tenant session

**Request Body:**
```json
{
  "amenity_id": "uuid",
  "booking_date": "2026-05-15",
  "start_time": "14:00:00",
  "end_time": "18:00:00",
  "notes": "Birthday party"
}
```

**Logic:**
1. Validate all required fields present
2. Verify amenity exists and is active
3. Get amenity details (price, landlord_id)
4. Calculate `total_price` = `price_per_unit` * duration
5. INSERT into `amenity_bookings`
6. Return created booking with amenity details

**Response:** Created booking object (same shape as GET)

**Error Codes:**
- 400: Missing required fields
- 404: Amenity not found
- 500: Server error

---

### 3.4 DELETE `/api/tenant/amenities/bookings/[id]`

**Purpose:** Cancel a booking

**Auth:** Requires authenticated tenant session (must be booking owner)

**Logic:**
1. Get tenant profile from `requireUser()`
2. Verify booking belongs to tenant
3. UPDATE `amenity_bookings` SET `status = 'cancelled'`

**Response:**
```json
{ "success": true }
```

**Error Codes:**
- 403: Not authorized (not booking owner)
- 404: Booking not found
- 500: Server error

---

## 4. UI Changes

### 4.1 State Management

**Replacing:**
```ts
// OLD - hardcoded
const AMENITIES = [{ id: "1", name: "...", ... }]
const MY_BOOKINGS = [{ id: "b1", name: "...", ... }]
```

**With:**
```ts
const [amenities, setAmenities] = useState<AmenityWithProperty[]>([])
const [bookings, setBookings] = useState<AmenityBookingWithDetails[]>([])
const [categories, setCategories] = useState<string[]>(["All"])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

### 4.2 Data Fetching

```ts
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      const [amenitiesRes, bookingsRes] = await Promise.all([
        fetch("/api/tenant/amenities"),
        fetch("/api/tenant/amenities/bookings")
      ])

      if (!amenitiesRes.ok || !bookingsRes.ok) {
        throw new Error("Failed to load data")
      }

      const amenitiesData = await amenitiesRes.json()
      const bookingsData = await bookingsRes.json()

      setAmenities(amenitiesData.amenities)
      setCategories(["All", ...amenitiesData.categories])
      setBookings(bookingsData.bookings)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  fetchData()
}, [])
```

### 4.3 Color Derivation

Since DB doesn't have `color` field, derive from `type`:

```ts
const TYPE_COLORS: Record<string, string> = {
  'Events': 'bg-blue-500',
  'Leisure': 'bg-emerald-500',
  'Creative': 'bg-purple-500',
  'Sports': 'bg-orange-500',
}

const getColorByType = (type: string): string => {
  return TYPE_COLORS[type] ?? 'bg-gray-500'
}
```

### 4.4 Booking Status Mapping

Map DB status to UI display:

```ts
const STATUS_CONFIG = {
  'pending': { label: 'Pending Approval', color: 'bg-amber-500/10 text-amber-600' },
  'confirmed': { label: 'Confirmed', color: 'bg-emerald-500/10 text-emerald-600' },
  'cancelled': { label: 'Cancelled', color: 'bg-red-500/10 text-red-600' }
}
```

### 4.5 Date/Time Formatting

```ts
const formatBookingDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const formatBookingTime = (start: string, end: string): string => {
  const formatTime = (t: string) => {
    const [hours, minutes] = t.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }
  return `${formatTime(start)} - ${formatTime(end)}`
}
```

### 4.6 Loading & Empty States

**Loading:**
```tsx
{loading ? (
  <div className="grid gap-6 sm:grid-cols-2">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-96 animate-pulse rounded-3xl bg-muted" />
    ))}
  </div>
) : null}
```

**Empty (no amenities):**
```tsx
{!loading && amenities.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-muted-foreground">No amenities available at this property.</p>
  </div>
)}
```

---

## 5. File Changes

| File | Action |
|------|--------|
| `src/app/api/tenant/amenities/route.ts` | CREATE |
| `src/app/api/tenant/amenities/bookings/route.ts` | CREATE |
| `src/app/api/tenant/amenities/bookings/[id]/route.ts` | CREATE |
| `src/app/tenant/utilities/page.tsx` | MODIFY |

---

## 6. Error Handling

- **API failures:** Show toast notification with error message
- **Empty data:** Show appropriate empty state message
- **Invalid booking:** Show validation errors inline in modal
- **Network error:** Retry button in error state

---

## 7. Testing Checklist

- [ ] Page loads with loading skeleton
- [ ] Amenities display correctly from DB
- [ ] Categories filter works
- [ ] Bookings display with correct status
- [ ] Create booking modal submits successfully
- [ ] Booking appears in list after creation
- [ ] Cancel booking removes/updates booking
- [ ] Error states display properly
- [ ] Empty states display properly