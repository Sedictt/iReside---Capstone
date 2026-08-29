"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Global in-memory cache shared across the entire client session
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const pendingFetches = new Map<string, Promise<any>>();

export interface UseInstantDataOptions<T> {
    /** Cache key uniquely identifying this query (e.g. `landlord-tenants-prop123`) */
    key: string | null;
    /** Async fetcher function */
    fetcher: (signal?: AbortSignal) => Promise<T>;
    /** Initial fallback data if no cache exists */
    initialData?: T;
    /** Time in milliseconds before cached data is considered stale (default: 30 seconds) */
    staleTimeMs?: number;
    /** Persist in sessionStorage for surviving page reloads (default: true) */
    persistSession?: boolean;
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
 * High-performance Stale-While-Revalidate (SWR) hook designed for instant (0ms)
 * tab transitions without jarring skeleton flashes.
 */
export function useInstantData<T>({
    key,
    fetcher,
    initialData,
    staleTimeMs = 30_000,
    persistSession = true,
    enabled = true,
}: UseInstantDataOptions<T>): UseInstantDataResult<T> {
    // 1. Synchronously read from memory cache or sessionStorage on initial mount (0ms)
    const getCachedData = useCallback((): T | undefined => {
        if (!key || typeof window === "undefined") return initialData;

        // Check memory cache first
        const inMem = memoryCache.get(key);
        if (inMem) return inMem.data as T;

        // Check sessionStorage second
        if (persistSession) {
            try {
                const raw = window.sessionStorage.getItem(`ireside_cache_${key}`);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    // Hydrate memory cache
                    memoryCache.set(key, { data: parsed, timestamp: Date.now() });
                    return parsed as T;
                }
            } catch {
                // Ignore parse errors
            }
        }

        return initialData;
    }, [key, initialData, persistSession]);

    const cachedSnapshot = getCachedData();
    const [data, setData] = useState<T | undefined>(cachedSnapshot);
    const [error, setError] = useState<Error | null>(null);
    const [isRevalidating, setIsRevalidating] = useState(false);
    // Only show loading if we have NO data (neither memory nor initialData)
    const [isLoading, setIsLoading] = useState<boolean>(!cachedSnapshot && enabled && Boolean(key));

    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const performFetch = useCallback(
        async (signal?: AbortSignal, force = false) => {
            if (!key || !enabled) return;

            const existing = memoryCache.get(key);
            const isFresh = existing && Date.now() - existing.timestamp < staleTimeMs;

            if (isFresh && !force && existing.data !== undefined) {
                setData(existing.data as T);
                setIsLoading(false);
                setIsRevalidating(false);
                return;
            }

            // Deduplicate in-flight fetches for the same key
            let fetchPromise = pendingFetches.get(key);
            if (!fetchPromise) {
                setIsRevalidating(true);
                fetchPromise = (async () => {
                    try {
                        const result = await fetcherRef.current(signal);
                        // Store in memory
                        memoryCache.set(key, { data: result, timestamp: Date.now() });
                        // Store in sessionStorage
                        if (persistSession && typeof window !== "undefined") {
                            try {
                                window.sessionStorage.setItem(`ireside_cache_${key}`, JSON.stringify(result));
                            } catch {
                                // Ignore storage quota exceptions
                            }
                        }
                        return result;
                    } finally {
                        pendingFetches.delete(key);
                    }
                })();
                pendingFetches.set(key, fetchPromise);
            }

            try {
                const freshResult = await fetchPromise;
                if (!signal?.aborted) {
                    setData(freshResult);
                    setError(null);
                }
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                if (!signal?.aborted) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                }
            } finally {
                if (!signal?.aborted) {
                    setIsLoading(false);
                    setIsRevalidating(false);
                }
            }
        },
        [key, enabled, staleTimeMs, persistSession]
    );

    useEffect(() => {
        if (!key || !enabled) return;

        // Synchronously sync state with cache if key changed
        const snap = getCachedData();
        if (snap !== undefined) {
            setData(snap);
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }

        const controller = new AbortController();
        void performFetch(controller.signal);

        return () => {
            controller.abort();
        };
    }, [key, enabled, getCachedData, performFetch]);

    const mutate = useCallback(
        async (newData?: T | ((prev?: T) => T), shouldRevalidate = true) => {
            if (!key) return;

            if (newData !== undefined) {
                const resolved = typeof newData === "function" ? (newData as any)(data) : newData;
                setData(resolved);
                memoryCache.set(key, { data: resolved, timestamp: Date.now() });
                if (persistSession && typeof window !== "undefined") {
                    try {
                        window.sessionStorage.setItem(`ireside_cache_${key}`, JSON.stringify(resolved));
                    } catch {}
                }
            }

            if (shouldRevalidate) {
                await performFetch(undefined, true);
            }
        },
        [key, data, persistSession, performFetch]
    );

    const refetch = useCallback(async () => {
        await performFetch(undefined, true);
    }, [performFetch]);

    return {
        data,
        isLoading,
        isRevalidating,
        error,
        mutate,
        refetch,
    };
}

/** Global helper to invalidate or update any cache key from anywhere */
export function invalidateInstantCache(keyPrefix: string) {
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
