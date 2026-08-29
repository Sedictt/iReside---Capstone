"use client";

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";

// Global in-memory cache shared across the entire client session
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const pendingFetches = new Map<string, Promise<any>>();
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
 * High-performance Stale-While-Revalidate (SWR) hook powered by useSyncExternalStore
 * to guarantee 0ms instant tab transitions without React hydration mismatches (Error #418).
 */
export function useInstantData<T>({
    key,
    fetcher,
    initialData,
    staleTimeMs = 30_000,
    persistSession = true,
    enabled = true,
}: UseInstantDataOptions<T>): UseInstantDataResult<T> {
    const getClientSnapshot = useCallback((): T | undefined => {
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
                    memoryCache.set(key, { data: parsed, timestamp: Date.now() });
                    return parsed as T;
                }
            } catch {
                // Ignore parse errors
            }
        }

        return initialData;
    }, [key, initialData, persistSession]);

    const getServerSnapshot = useCallback((): T | undefined => {
        return initialData;
    }, [initialData]);

    // useSyncExternalStore guarantees zero hydration mismatch between server and client
    const cachedData = useSyncExternalStore(subscribeToCache, getClientSnapshot, getServerSnapshot);

    const [error, setError] = useState<Error | null>(null);
    const [isRevalidating, setIsRevalidating] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(!cachedData && enabled && Boolean(key));

    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const performFetch = useCallback(
        async (signal?: AbortSignal, force = false) => {
            if (!key || !enabled) return;

            const existing = memoryCache.get(key);
            const isFresh = existing && Date.now() - existing.timestamp < staleTimeMs;

            if (isFresh && !force && existing.data !== undefined) {
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
                        notifyCacheChange();
                        return result;
                    } finally {
                        pendingFetches.delete(key);
                    }
                })();
                pendingFetches.set(key, fetchPromise);
            }

            try {
                await fetchPromise;
                if (!signal?.aborted) {
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
                const currentData = memoryCache.get(key)?.data ?? cachedData;
                const resolved = typeof newData === "function" ? (newData as any)(currentData) : newData;
                memoryCache.set(key, { data: resolved, timestamp: Date.now() });
                if (persistSession && typeof window !== "undefined") {
                    try {
                        window.sessionStorage.setItem(`ireside_cache_${key}`, JSON.stringify(resolved));
                    } catch {}
                }
                notifyCacheChange();
            }

            if (shouldRevalidate) {
                await performFetch(undefined, true);
            }
        },
        [key, cachedData, persistSession, performFetch]
    );

    const refetch = useCallback(async () => {
        await performFetch(undefined, true);
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
    notifyCacheChange();
}
