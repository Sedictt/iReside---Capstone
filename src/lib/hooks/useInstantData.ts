"use client";

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";

// In-memory cache shared across the client session
const memoryCache = new Map<string, any>();
const cacheListeners = new Set<() => void>();

function notifyCacheChange() {
    cacheListeners.forEach((l) => l());
}

function subscribeToCache(callback: () => void) {
    cacheListeners.add(callback);
    return () => {
        cacheListeners.delete(callback);
    };
}

export interface UseInstantDataOptions<T> {
    /** Cache key uniquely identifying this query (e.g. `landlord_tenants_prop123`) */
    key: string | null;
    /** Async fetcher function */
    fetcher: (signal?: AbortSignal) => Promise<T>;
    /** Initial fallback data if no cache exists */
    initialData?: T;
    /** Enable / disable execution */
    enabled?: boolean;
}

export interface UseInstantDataResult<T> {
    data: T | undefined;
    isLoading: boolean;
    isRevalidating: boolean;
    error: Error | null;
    mutate: (newData?: T | ((prev?: T) => T), shouldRevalidate?: boolean) => Promise<void>;
    refetch: () => Promise<void>;
}

/**
 * High-performance Stale-While-Revalidate (SWR) hook:
 * - Shows cached data instantly (0ms)
 * - ALWAYS triggers background fetch on mount to sync with the database
 * - Shows loading state if no cached data exists
 */
export function useInstantData<T>({
    key,
    fetcher,
    initialData,
    enabled = true,
}: UseInstantDataOptions<T>): UseInstantDataResult<T> {
    const getClientSnapshot = useCallback((): T | undefined => {
        if (!key || typeof window === "undefined") return initialData;

        if (memoryCache.has(key)) {
            return memoryCache.get(key) as T;
        }

        try {
            const raw = window.sessionStorage.getItem(`ireside_cache_${key}`);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed !== undefined) {
                    memoryCache.set(key, parsed);
                    return parsed as T;
                }
            }
        } catch {}

        return initialData;
    }, [key, initialData]);

    const getServerSnapshot = useCallback((): T | undefined => {
        return initialData;
    }, [initialData]);

    const cachedData = useSyncExternalStore(subscribeToCache, getClientSnapshot, getServerSnapshot);

    const [error, setError] = useState<Error | null>(null);
    const [isRevalidating, setIsRevalidating] = useState(false);

    // Has data check: true if cache exists and has content
    const hasData = cachedData !== undefined && (Array.isArray(cachedData) ? cachedData.length > 0 : true);
    const [isLoading, setIsLoading] = useState<boolean>(!hasData && enabled && Boolean(key));

    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const performFetch = useCallback(
        async (signal?: AbortSignal) => {
            if (!key || !enabled) return;

            setIsRevalidating(true);
            try {
                const result = await fetcherRef.current(signal);
                memoryCache.set(key, result);
                if (typeof window !== "undefined") {
                    try {
                        window.sessionStorage.setItem(`ireside_cache_${key}`, JSON.stringify(result));
                    } catch {}
                }
                notifyCacheChange();
                setError(null);
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                console.error(`[useInstantData] Error fetching ${key}:`, err);
                setError(err instanceof Error ? err : new Error(String(err)));
            } finally {
                setIsLoading(false);
                setIsRevalidating(false);
            }
        },
        [key, enabled]
    );

    useEffect(() => {
        if (!key || !enabled) return;

        const controller = new AbortController();
        void performFetch(controller.signal);

        return () => {
            controller.abort();
        };
    }, [key, enabled, performFetch]);

    const mutate = useCallback(
        async (newData?: T | ((prev?: T) => T), shouldRevalidate = true) => {
            if (!key) return;

            if (newData !== undefined) {
                const currentData = memoryCache.get(key) ?? cachedData;
                const resolved = typeof newData === "function" ? (newData as any)(currentData) : newData;
                memoryCache.set(key, resolved);
                if (typeof window !== "undefined") {
                    try {
                        window.sessionStorage.setItem(`ireside_cache_${key}`, JSON.stringify(resolved));
                    } catch {}
                }
                notifyCacheChange();
            }

            if (shouldRevalidate) {
                await performFetch();
            }
        },
        [key, cachedData, performFetch]
    );

    const refetch = useCallback(async () => {
        await performFetch();
    }, [performFetch]);

    return {
        data: cachedData,
        isLoading,
        isRevalidating,
        error,
        mutate,
        refetch,
    };
}

/** Global helper to invalidate or update any cache key from anywhere */
export function invalidateInstantCache(keyPrefix?: string) {
    if (!keyPrefix) {
        memoryCache.clear();
        if (typeof window !== "undefined") {
            try {
                Object.keys(window.sessionStorage)
                    .filter((k) => k.startsWith("ireside_cache_"))
                    .forEach((k) => window.sessionStorage.removeItem(k));
            } catch {}
        }
    } else {
        for (const k of memoryCache.keys()) {
            if (k.startsWith(keyPrefix)) {
                memoryCache.delete(k);
                if (typeof window !== "undefined") {
                    try {
                        window.sessionStorage.removeItem(`ireside_cache_${k}`);
                    } catch {}
                }
            }
        }
    }
    notifyCacheChange();
}
