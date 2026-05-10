# React Doctor Fix Strategy — Implementation Plan

> **Context:** 4,178 issues across 365/480 files. Not all equal. This plan organizes fixes into 5 batches by severity, with each batch further broken into sub-batches by file locality (single file → multiple files → systemic patterns).

---

## Quick Reference

| Batch | Category | Count | Risk | Strategy |
|-------|----------|-------|------|----------|
| **1** | Critical errors | 38 | High | Fix manually, one at a time |
| **2** | Correctness (hydration, keys, unknown props) | ~248 | Medium | Pattern-replace with care |
| **3** | Performance (refactor state, combine loops) | ~266 | Medium | Structural changes per file |
| **4** | Architecture (Tailwind, fonts, compiler) | ~2,195 | Low | Bulk find-replace |
| **5** | State management (useReducer consolidation) | ~146 | Medium | Manual per component |

---

## Batch 1 — Critical Errors (38 issues)

**Goal:** Eliminate memory leaks and security vulnerabilities.

### 1a — Effect Cleanup Leaks (×5)

Fix the `useEffect` subscribes that never return cleanup.

**File:** `src/components/landlord/dashboard/ContactsSidebar.tsx:503`
```
Current: useEffect(() => { subscribe(...); }, [dep])
Fix:     useEffect(() => {
  const sub = subscribe(...)
  return () => sub.unsubscribe() // or target.removeEventListener(...)
}, [dep])
```
> **Pattern:** For each subscribe call, the matching unsubscribe must be returned. If `subscribe()` returns an unsubscribe function, return it directly. If it attaches an event listener, return the remove call.

---

### 1b — Server Auth Checks Missing (×2)

**File:** `src/lib/supabase/auth.ts:12`
```
Current: export async function auth(...) { /* logic without auth check */ }
Fix:     export async function auth(...) {
  const session = await auth() // or getSession()
  if (!session) throw new Error('Unauthorized') // or redirect
  /* ... rest of logic */
}
```
> **Pattern:** Every server action must check auth before data access. Add `const session = await auth()` at the top.

---

### 1c — Sequential Independent Awaits (×39) — Security/Perf

These are in server routes. Each pair of sequential awaits that don't depend on each other should race via `Promise.all`.

**Example pattern (src/app/api/landlord/invoices/[id]/route.ts:14):**
```typescript
// BEFORE (sequential waterfall):
const user = await getUser(id)         // 100ms
const org = await getOrg(user.orgId)   // 100ms — waits for above
const result = { user, org }

// AFTER (parallel race):
const [user, org] = await Promise.all([  // 100ms total
  getUser(id),
  getOrg(id)  // adjust as needed
])
```
> **Action:** List all 39 affected files, then run bulk `Promise.all` replacements.

---

## Batch 2 — Correctness (~248 issues)

### 2a — Hydration Mismatch from `new Date()` (×155)

**Problem:** `new Date()` or `Math.random()` in JSX renders differently server vs client.

**Pattern (per affected file):**
```typescript
// BEFORE:
const MyComponent = () => <span>{new Date().toLocaleTimeString()}</span>

// AFTER:
const MyComponent = () => {
  const [time, setTime] = useState(null)
  useEffect(() => {
    setTime(new Date().toLocaleTimeString())
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(interval)
  }, [])
  if (!time) return <span suppressHydrationWarning>...</span>
  return <span>{time}</span>
}
```
> **Alternative (simpler):** If the time display is not critical, wrap the dynamic element with `suppressHydrationWarning` on the parent.

**Key files from output:**
- `src/components/landlord/BillingOperationsPanel.tsx:948`
- Any component rendering `new Date()` in JSX — list all files first

---

### 2b — Array Index as Key (×79)

**Problem:** `items.map((item, i) => ... key={i})` breaks on reorder/filter.

```typescript
// BEFORE:
items.map((item, i) => <div key={i}>...</div>)

// AFTER:
items.map((item) => <div key={item.id}>...</div>)
// or if no id: items.map((item, i) => <div key={item.uniqueSlug || i}>...</div>)
// But prefer stable id — add one if missing
```

**Key file from output:** `src/app/landlord/onboarding/[token]/page.tsx:542`

---

### 2c — Unknown Property (×14)

**File:** `src/components/tenant/LeaseRenewalRequest.tsx:338`
- Remove unknown property (likely `charset`, `loading`, `decoding` on `<img>` that React doesn't recognize)
- Check: https://oxc.rs/docs/guide/usage/linter/rules/react/no-unknown-property.html

---

## Batch 3 — Performance (~266 issues)

### 3a — useRef over useState for unread values (×95)

**Pattern:**
```typescript
// BEFORE:
const [prevPathname, setPrevPathname] = useState(router.pathname)
useEffect(() => { setPrevPathname(router.pathname) }, [router.pathname])

// AFTER:
const prevPathnameRef = useRef(router.pathname)
useEffect(() => { prevPathnameRef.current = router.pathname }, [router.pathname])
// Read via prevPathnameRef.current — no re-render on mutation
```

**Key file from output:** `src/components/docs/DocsLayout.tsx:15`

---

### 3b — Combine filter+map into single loop (×70)

```typescript
// BEFORE:
const active = items.filter(x => x.active).map(x => x.name)

// AFTER:
const active = items.reduce((acc, x) => {
  if (x.active) acc.push(x.name)
  return acc
}, [])
```

**Key file from output:** `src/components/landlord/BillingOperationsPanel.tsx:552`

---

### 3c — Functional setState (×35)

```typescript
// BEFORE:
setAmenities([...amenities, newAmenity])

// AFTER:
setAmenities(prev => [...prev, newAmenity])
```

**Key file from output:** `src/app/landlord/onboarding/[token]/page.tsx:828`

---

### 3d — Cascading setState (×78) — 8 calls in one useEffect

Batch into `useReducer`:
```typescript
// BEFORE (BillingOperationsPanel.tsx:97 — 8 setState calls in one effect):
useEffect(() => {
  setField1(...)
  setField2(...)
  setField3(...)
  // ... 8 calls
}, [dep])

// AFTER:
const reducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_ALL':
      return { ...state, ...action.payload }
    default: return state
  }
}
const [state, dispatch] = useReducer(reducer, initialState)
useEffect(() => {
  dispatch({ type: 'UPDATE_ALL', payload: { field1: ..., field2: ... } })
}, [dep])
```

---

## Batch 4 — Architecture (~2,195 issues)

### 4a — Tailwind redundant size axes (×1,722)

**Pattern:**
```typescript
// BEFORE:
w-6 h-6, w-8 h-8, w-10 h-10, etc.

// AFTER (Tailwind v3.4+):
size-6, size-8, size-10, etc.
```

> **Bulk action:** Find all `w-N h-N` where N matches, replace with `size-N`. This is mechanical and safe for bulk replacement.

**Key file from output:** `src/components/docs/DocsLayout.tsx:63`

---

### 4b — No bold headings (×381)

**Pattern:**
```typescript
// BEFORE:
<h1 className="font-black">Title</h1>

// AFTER:
<h1 className="font-semibold">Title</h1>
```

**Key file from output:** `src/app/landlord/profile/page.tsx:291`

---

### 4c — React Compiler destructure (×92)

**Pattern:**
```typescript
// BEFORE:
useSearchParams().get('q')
useRouter().push('/path')

// AFTER:
const { get } = useSearchParams()
const { push } = useRouter()
get('q')
push('/path')
```

**Key file from output:** `src/app/landlord/onboarding/[token]/page.tsx:61`

---

## Batch 5 — State Management (~146 issues)

### 5a — useReducer for related state clusters (×68+78)

**Strategy:** Group 14 useState calls in `BillingOperationsPanel.tsx:82` into ~3-4 reducers based on related state fields.

**Pattern per component:**
1. Identify which useState calls are related (same form, same submit action)
2. Replace with one `useReducer` per group
3. Keep unrelated isolated state as `useState`

---

## Execution Order

```
Phase 1: Batch 1 (Critical)   — 1 session, manual, high focus
Phase 2: Batch 2 (Correctness) — 2-3 sessions, pattern-replace
Phase 3: Batch 3 (Perf)      — 2-3 sessions, structural
Phase 4: Batch 5 (State)     — 2-3 sessions, refactor per component
Phase 5: Batch 4 (Arch)      — 1-2 sessions, bulk find-replace
```

---

## Pre-Execution Checklist

- [ ] Run `npx react-doctor@latest . --verbose` to get full file:line inventory for all batches
- [ ] Verify git status before starting each batch
- [ ] Run `npx react-doctor` after each batch to confirm fixes
- [ ] Commit after each batch with message: `fix(react-doctor): batch N — <description>`
- [ ] For Batch 1 critical fixes: run full test suite after
- [ ] For Batch 4 bulk Tailwind replacements: do a sample of 5 files first, verify no visual regression

---

## Files Needing Immediate Attention (from React Doctor output)

| File | Issue | Line |
|------|-------|------|
| `src/components/landlord/dashboard/ContactsSidebar.tsx` | Effect cleanup leak | 503 |
| `src/lib/supabase/auth.ts` | Missing auth check | 12 |
| `src/app/api/landlord/invoices/[id]/route.ts` | Sequential awaits | 14 |
| `src/components/landlord/BillingOperationsPanel.tsx` | 8 setState in one effect | 97 |
| `src/components/landlord/BillingOperationsPanel.tsx` | 14 useState → useReducer | 82 |
| `src/app/landlord/onboarding/[token]/page.tsx` | Array index key | 542 |
| `src/app/landlord/onboarding/[token]/page.tsx` | Functional setState | 828 |
| `src/components/docs/DocsLayout.tsx` | useRef not useState | 15 |
| `src/components/docs/DocsLayout.tsx` | Redundant w/h | 63 |
| `src/components/landlord/BillingOperationsPanel.tsx` | new Date() hydration | 948 |
| `src/app/landlord/profile/page.tsx` | font-black on h1 | 291 |
| `src/components/tenant/LeaseRenewalRequest.tsx` | Unknown property | 338 |

---

*Plan generated from `react-doctor@latest` output. Full verbose report at: `C:\Users\JV\AppData\Local\Temp\react-doctor-a186a674-fb48-43aa-9f7f-13df84d17160`*