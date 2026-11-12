/**
 * Mobile view cache — stale-while-revalidate snapshots for the mobile portal.
 *
 * Every mobile tab is its own route, so switching tabs unmounts the previous
 * view and throws its fetched data away. Coming back used to mean a skeleton
 * plus a full network round-trip every time.
 *
 * Views now save a snapshot of their loaded data here (keyed by view + params)
 * and initialise from it on mount. When a snapshot exists the view renders it
 * immediately and refreshes in the background, so tab switches feel instant
 * while the data still converges to the server's truth on every visit.
 *
 * Reliability guarantees:
 * - Snapshots live in memory only (never persisted), so a full reload or
 *   logout always starts clean.
 * - The cache is scoped to the signed-in user: `setViewCacheOwner` wipes it
 *   whenever the user id changes, so one account never sees another's data.
 * - Snapshots are never treated as fresh: views always revalidate on mount.
 * - `fetchJsonDeduped` only shares *in-flight* GET requests (no TTL), so two
 *   views asking for the same endpoint at once trigger one request, but a
 *   reload after a mutation always hits the network.
 */

type Entry = { value: unknown; updatedAt: number }

const snapshots = new Map<string, Entry>()
const inflight = new Map<string, Promise<unknown>>()
let ownerId: string | null = null

/** Hard cap so a long session cannot grow memory unbounded. */
const MAX_ENTRIES = 60

/** Scope the cache to a user. Clears everything when the user changes. */
export function setViewCacheOwner(userId: string | null | undefined) {
    const next = userId ?? null
    if (next === ownerId) return
    snapshots.clear()
    inflight.clear()
    ownerId = next
}

export function readViewCache<T>(key: string | null | undefined): T | undefined {
    if (!key || !ownerId) return undefined
    return snapshots.get(key)?.value as T | undefined
}

export function hasViewCache(key: string | null | undefined): boolean {
    return !!key && !!ownerId && snapshots.has(key)
}

export function writeViewCache<T>(key: string | null | undefined, value: T) {
    if (!key || !ownerId) return
    snapshots.delete(key) // re-insert to keep LRU order
    snapshots.set(key, { value, updatedAt: Date.now() })
    if (snapshots.size > MAX_ENTRIES) {
        const oldest = snapshots.keys().next().value
        if (oldest !== undefined) snapshots.delete(oldest)
    }
}

/**
 * Merge a partial update into an existing object snapshot. Useful for views
 * that keep several independent pieces of state.
 */
export function patchViewCache<T extends object>(key: string | null | undefined, patch: Partial<T>) {
    if (!key || !ownerId) return
    const current = (snapshots.get(key)?.value as T | undefined) ?? ({} as T)
    writeViewCache<T>(key, { ...current, ...patch })
}

/** Drop snapshots whose key starts with `prefix` (or all when omitted). */
export function invalidateViewCache(prefix?: string) {
    if (!prefix) {
        snapshots.clear()
        return
    }
    for (const key of Array.from(snapshots.keys())) {
        if (key.startsWith(prefix)) snapshots.delete(key)
    }
}

/**
 * GET JSON with in-flight de-duplication. Concurrent callers for the same URL
 * share one request; once it settles the next call goes to the network again.
 * Rejects with the Response when the status is not OK (matches the existing
 * `r.ok ? r.json() : Promise.reject(r)` pattern used across mobile views).
 */
export function fetchJsonDeduped<T = any>(url: string, init?: RequestInit): Promise<T> {
    const method = (init?.method ?? 'GET').toUpperCase()
    if (method !== 'GET') {
        return fetch(url, init).then((r) => (r.ok ? r.json() : Promise.reject(r)))
    }
    const existing = inflight.get(url)
    if (existing) return existing as Promise<T>

    const request = fetch(url, { cache: 'no-store', ...init })
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .finally(() => {
            if (inflight.get(url) === request) inflight.delete(url)
        })
    inflight.set(url, request)
    return request as Promise<T>
}
