# Unconventional Variable Naming Report

## Summary

| Category | Count |
|----------|-------|
| Greek letters in variables | 0 |
| Problematic alphanumeric patterns (`k`, `a22`-style) | 2 |
| Non-descriptive single-letter variables | 10+ |
| Total files affected | 9 |

---

## Problematic Alphanumeric Patterns

### 1. Non-descriptive constant `k`

Used as a magic number base in logarithm calculations.

| File | Line | Variable | Code |
|------|------|----------|------|
| `src/app/landlord/messages/page.tsx` | 322 | `k` | `const k = 1024;` |
| `src/app/tenant/messages/page.tsx` | 259 | `k` | `const k = 1024;` |

**Issue**: `k` is a non-descriptive name for a constant representing bytes-per-kilobyte.

**Suggestion**: Rename to `BYTES_PER_KB` or `KILOBYTE`.

---

## Problematic Single-Letter Variables

### 1. `d` for Date objects

| File | Line | Variable | Code |
|------|------|----------|------|
| `src/components/landlord/utility/UtilityBillingDashboard.tsx` | 177 | `d` | `const d = new Date();` |
| `src/components/landlord/utility/UtilityBillingDashboard.tsx` | 559 | `d` | `const d = new Date();` |
| `src/components/landlord/applications/TenantInviteManager.tsx` | 148 | `d` | `const d = new Date();` |
| `src/components/landlord/applications/TenantInviteManager.tsx` | 604 | `d` | `const d = new Date();` |

**Issue**: `d` is meaningless for a date object. Should be `currentDate` or `date`.

---

### 2. `c` for config

| File | Line | Variable | Code |
|------|------|----------|------|
| `src/components/landlord/invoices/InvoiceModal.tsx` | 141 | `c` | `const c = config[action];` |

**Issue**: `c` is too short for "config". Should be `actionConfig` or just expand the name.

---

### 3. `n` for normalized values

| File | Line | Variable | Code |
|------|------|----------|------|
| `src/components/landlord/applications/ToolAccessBar.tsx` | 204 | `n` | `const n = name.toLowerCase();` |
| `src/app/api/landlord/applications/tenant-application/route.ts` | 298 | `n` | `const n = normalizeString(applicant_name);` |
| `src/app/api/landlord/applications/tenant-application/route.ts` | 304 | `e` | `const e = normalizeString(applicant_email);` |

**Issue**: Single letters `n` and `e` are meaningless. Should be `normalizedName`, `normalizedEmail`.

---

### 4. `p` for progress

| File | Line | Variable | Code |
|------|------|----------|------|
| `src/app/page.tsx` | 267 | `p` | `const p = self.progress * segments;` |

**Issue**: `p` for "progress" lacks context. Should be `progressValue` or `scaledProgress`.

---

### 5. `q` for query

| File | Line | Variable | Code |
|------|------|----------|------|
| `src/app/api/landlord/search/route.ts` | 18 | `q` | `const q = query.toLowerCase();` |

**Issue**: `q` is a common shorthand but could be clearer as `queryLower` or `searchQuery`.

---

### 6. `u` for unit (borderline)

| File | Line | Variable | Code |
|------|------|----------|------|
| `src/components/landlord/visual-planner/VisualBuilder.tsx` | 2856 | `u` | `const u = createUnitFromPool(...)` |
| `src/components/landlord/visual-planner/VisualBuilder.tsx` | 2861 | `u` | `const u = createUnitFromPool(...)` |

**Issue**: `u` is borderline acceptable (short for "unit") but `unit` would be more descriptive.

---

## Accepted Patterns (Not Flagged)

The following single-letter variables are acceptable because they follow well-established conventions:

- **Loop counters**: `i`, `j`, `k` in `for` loops
- **Coordinate calculations**: `x`, `y`, `x1`, `y1`, `x2`, `y2` (geometry/graphics)
- **RGBA color channels**: `r`, `g`, `b`, `a` in image processing
- **Array callback parameters**: `map(a => ...)` where scope is immediately obvious
- **Mathematical elements**: `e` for error in try-catch, `v` for value in unions

---

## Recommendations

1. **Date objects**: Use `currentDate`, `today`, or `date` instead of `d`
2. **Config lookups**: Use `actionConfig` or `selectedConfig` instead of `c`
3. **Normalized values**: Use `normalizedName`, `normalizedEmail` instead of `n`, `e`
4. **Constants**: Use `BYTES_PER_KB` instead of `k = 1024`
5. **Progress calculations**: Use `progressValue` or `scaledProgress` instead of `p`
6. **Query variables**: Use `queryLower` or `searchQuery` instead of `q`