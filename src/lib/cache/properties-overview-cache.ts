/**
 * Short-lived, per-landlord server memory cache for /api/landlord/properties/overview.
 * Any route that changes a property (create, edit, photo upload) must call
 * `invalidatePropertiesOverview` so the portfolio never shows stale data.
 */
interface CachedOverview {
    data: unknown;
    expiresAt: number;
}

const overviewMemoryCache = new Map<string, CachedOverview>();

export const PROPERTIES_OVERVIEW_TTL_MS = 20_000;

export function getCachedPropertiesOverview<T>(userId: string): T | null {
    const cached = overviewMemoryCache.get(userId);
    if (!cached) return null;
    if (Date.now() >= cached.expiresAt) {
        overviewMemoryCache.delete(userId);
        return null;
    }
    return cached.data as T;
}

export function setCachedPropertiesOverview(userId: string, data: unknown) {
    overviewMemoryCache.set(userId, { data, expiresAt: Date.now() + PROPERTIES_OVERVIEW_TTL_MS });
}

export function invalidatePropertiesOverview(userId: string) {
    overviewMemoryCache.delete(userId);
}
