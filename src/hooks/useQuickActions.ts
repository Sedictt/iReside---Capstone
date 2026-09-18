"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import {
    DEFAULT_QUICK_ACTIONS,
    getInitialQuickActionsConfig,
    resolveDisplayedActions,
    resolveHiddenActions,
    sanitizeQuickActionsConfig,
    type QuickActionId,
    type QuickActionItem,
    type QuickActionSortMode,
    type QuickActionsConfig,
} from "@/lib/landlord/quick-actions";

const LOCAL_STORAGE_KEY = "ireside_landlord_quick_actions";

export function useQuickActions(catalog: QuickActionItem[] = DEFAULT_QUICK_ACTIONS) {
    const [config, setConfig] = useState<QuickActionsConfig>(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (stored) {
                    return sanitizeQuickActionsConfig(JSON.parse(stored), catalog);
                }
            } catch {
                // Ignore storage errors on initial parse
            }
        }
        return getInitialQuickActionsConfig();
    });

    const [isCustomizing, setIsCustomizing] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const latestConfigRef = useRef(config);
    latestConfigRef.current = config;

    // Persist to backend with debouncing
    const persistToBackend = useCallback((nextConfig: QuickActionsConfig) => {
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }

        syncTimeoutRef.current = setTimeout(async () => {
            try {
                setIsSyncing(true);
                const res = await fetch("/api/landlord/quick-actions", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        order: nextConfig.order,
                        hidden: nextConfig.hidden,
                        sortMode: nextConfig.sortMode,
                        usageCounts: nextConfig.usageCounts,
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.config) {
                        const verified = sanitizeQuickActionsConfig(data.config, catalog);
                        setConfig(verified);
                        if (typeof window !== "undefined") {
                            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(verified));
                        }
                    }
                }
            } catch (err) {
                console.warn("[useQuickActions] Failed to sync quick actions with server:", err);
            } finally {
                setIsSyncing(false);
            }
        }, 600);
    }, [catalog]);

    // Initial load: fetch from backend to sync cross-device updates
    useEffect(() => {
        let isMounted = true;

        async function fetchRemoteConfig() {
            try {
                const res = await fetch("/api/landlord/quick-actions");
                if (res.ok && isMounted) {
                    const data = await res.json();
                    if (data.config) {
                        const remoteConfig = sanitizeQuickActionsConfig(data.config, catalog);
                        // Reconcile: If local is older than remote, or local was defaults
                        const localRaw = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
                        if (!localRaw) {
                            setConfig(remoteConfig);
                            if (typeof window !== "undefined") {
                                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteConfig));
                            }
                        } else {
                            const localParsed = sanitizeQuickActionsConfig(JSON.parse(localRaw), catalog);
                            const localTime = new Date(localParsed.lastUpdated || 0).getTime();
                            const remoteTime = new Date(remoteConfig.lastUpdated || 0).getTime();

                            if (remoteTime > localTime) {
                                setConfig(remoteConfig);
                                if (typeof window !== "undefined") {
                                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteConfig));
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                // Offline or unauthenticated fallback is fine
            }
        }

        fetchRemoteConfig();

        return () => {
            isMounted = false;
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, [catalog]);

    // Update config locally and trigger remote sync
    const updateConfig = useCallback((updater: (prev: QuickActionsConfig) => QuickActionsConfig) => {
        setConfig((prev) => {
            const next = updater(prev);
            const sanitized = sanitizeQuickActionsConfig(next, catalog);
            if (typeof window !== "undefined") {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
            }
            persistToBackend(sanitized);
            return sanitized;
        });
    }, [catalog, persistToBackend]);

    // Reorder two actions
    const reorderActions = useCallback((activeId: QuickActionId, overId: QuickActionId) => {
        if (activeId === overId) return;

        updateConfig((prev) => {
            const oldIndex = prev.order.indexOf(activeId);
            const newIndex = prev.order.indexOf(overId);
            if (oldIndex === -1 || newIndex === -1) return prev;

            const newOrder = arrayMove(prev.order, oldIndex, newIndex);
            return {
                ...prev,
                order: newOrder,
                // If user reorders while in frequently_used mode, switch them to custom
                sortMode: "custom",
                lastUpdated: new Date().toISOString(),
            };
        });
    }, [updateConfig]);

    // Toggle visibility (hide or unhide)
    const toggleVisibility = useCallback((id: QuickActionId) => {
        const item = catalog.find((a) => a.id === id);
        const actionLabel = item?.label || id;

        updateConfig((prev) => {
            const isCurrentlyHidden = prev.hidden.includes(id);

            if (isCurrentlyHidden) {
                // Unhide
                toast.success(`Restored "${actionLabel}" to grid`);
                return {
                    ...prev,
                    order: prev.order.includes(id) ? prev.order : [...prev.order, id],
                    hidden: prev.hidden.filter((h) => h !== id),
                    lastUpdated: new Date().toISOString(),
                };
            }

            // Hide: check minimum visible constraint
            const currentVisibleCount = prev.order.filter((a) => !prev.hidden.includes(a)).length;
            if (currentVisibleCount <= 1) {
                toast.error("At least one action must remain visible in the grid");
                return prev;
            }

            toast.info(`Hidden "${actionLabel}"`);
            return {
                ...prev,
                hidden: [...prev.hidden, id],
                lastUpdated: new Date().toISOString(),
            };
        });
    }, [catalog, updateConfig]);

    // Restore all hidden actions
    const restoreAll = useCallback(() => {
        updateConfig((prev) => {
            if (prev.hidden.length === 0) return prev;
            toast.success("All actions restored to grid");
            return {
                ...prev,
                hidden: [],
                lastUpdated: new Date().toISOString(),
            };
        });
    }, [updateConfig]);

    // Set sorting strategy
    const setSortMode = useCallback((mode: QuickActionSortMode) => {
        updateConfig((prev) => ({
            ...prev,
            sortMode: mode,
            lastUpdated: new Date().toISOString(),
        }));
    }, [updateConfig]);

    // Track usage count when action is clicked
    const trackActionUsage = useCallback((id: QuickActionId) => {
        updateConfig((prev) => ({
            ...prev,
            usageCounts: {
                ...prev.usageCounts,
                [id]: (prev.usageCounts[id] || 0) + 1,
            },
            lastUpdated: new Date().toISOString(),
        }));
    }, [updateConfig]);

    // Reset to default layout
    const resetToDefaults = useCallback(() => {
        const defaults = getInitialQuickActionsConfig();
        setConfig(defaults);
        if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaults));
        }
        persistToBackend(defaults);
        toast.info("Quick actions reset to default layout");
    }, [persistToBackend]);

    // Start / finish inline customizing
    const startCustomizing = useCallback(() => {
        setIsCustomizing(true);
    }, []);

    const finishCustomizing = useCallback(() => {
        setIsCustomizing(false);
        // Force flush sync immediately
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }
        try {
            fetch("/api/landlord/quick-actions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order: latestConfigRef.current.order,
                    hidden: latestConfigRef.current.hidden,
                    sortMode: latestConfigRef.current.sortMode,
                    usageCounts: latestConfigRef.current.usageCounts,
                }),
            }).catch(() => {});
        } catch {
            // Ignore background flush error
        }
        toast.success("Quick actions layout saved");
    }, []);

    const displayedActions = useMemo(
        () => resolveDisplayedActions(config, catalog),
        [config, catalog]
    );

    const hiddenActions = useMemo(
        () => resolveHiddenActions(config, catalog),
        [config, catalog]
    );

    return {
        config,
        displayedActions,
        hiddenActions,
        isCustomizing,
        isSyncing,
        startCustomizing,
        finishCustomizing,
        reorderActions,
        toggleVisibility,
        restoreAll,
        setSortMode,
        trackActionUsage,
        resetToDefaults,
    };
}
