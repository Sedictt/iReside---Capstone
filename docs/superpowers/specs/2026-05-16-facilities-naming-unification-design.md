# Facilities Naming Unification

## Summary
Unify the label "Building Amenities" (tenant) → "Facilities" to match the landlord side, since both reference the same entity (`amenities` table / facility booking system).

## Changes

| File | Current | New |
|------|---------|-----|
| `src/components/tenant/TenantNavbar.tsx` | `"Building Amenities"` | `"Facilities"` |
| `src/app/tenant/utilities/page.tsx` (h1) | `"Building <span>Amenities</span>"` | `"<span>Facilities</span>"` |

## Scope
- **Tenant sidebar label** only (1 string change)
- **Tenant page h1** only (1 string change)
- No API route changes (`/api/tenant/amenities` stays)
- No landlord changes needed
- No DB schema changes
- No route changes

## Rationale
- "Facilities" is shorter for sidebar labels
- Tenant page hero badge already says "Facilities" (aligning badge with h1)
- Landlord page already uses "Property Facilities" consistently
- Same `LayoutGrid` icon on both sides

## Verification
- `npm run build` must pass
- Tenant sidebar renders "Facilities"
- Tenant utilities page h1 shows "Facilities"
- Landlord sidebar/page are untouched
