"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    DEFAULT_PROPERTY_RULES,
    normalizeRuleText,
    isRuleDuplicate,
    mergeRules,
} from "@/lib/constants/rules";

const STORAGE_PREFIX = "ireside_custom_rules_";

function getStorageKey(landlordId?: string | null): string {
    return landlordId ? `${STORAGE_PREFIX}${landlordId}` : `${STORAGE_PREFIX}default`;
}

function readStoredCustomRules(key: string): string[] {
    if (typeof window === "undefined") return [];
    try {
        const item = window.localStorage.getItem(key);
        if (!item) return [];
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
            return parsed
                .map(normalizeRuleText)
                .filter((text) => text && !isRuleDuplicate(text, DEFAULT_PROPERTY_RULES));
        }
    } catch {
        // Ignore parse errors
    }
    return [];
}

function writeStoredCustomRules(key: string, list: string[]): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(list));
    } catch {
        // Ignore storage errors (quota, incognito)
    }
}

export interface UseCustomRulesOptions {
    landlordId?: string | null;
    initialCustomRules?: string[];
}

export function useCustomRules({ landlordId, initialCustomRules = [] }: UseCustomRulesOptions = {}) {
    const storageKey = useMemo(() => getStorageKey(landlordId), [landlordId]);

    const [customRules, setCustomRules] = useState<string[]>(() => {
        const stored = readStoredCustomRules(storageKey);
        const combined = mergeRules([], [...stored, ...initialCustomRules]);
        return combined.filter((r) => !isRuleDuplicate(r, DEFAULT_PROPERTY_RULES));
    });

    const customRulesRef = useRef<string[]>(customRules);
    customRulesRef.current = customRules;

    const [isLoading, setIsLoading] = useState(false);

    // Sync with remote server API to gather custom rules across all landlord's properties
    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchCustomRules = async () => {
            setIsLoading(true);
            try {
                const res = await fetch("/api/landlord/rules/custom", {
                    signal: controller.signal,
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!isMounted) return;

                if (Array.isArray(data.customRules)) {
                    const local = readStoredCustomRules(storageKey);
                    const merged = mergeRules([], [...local, ...customRulesRef.current, ...data.customRules]);
                    const finalCustoms = merged.filter((r) => !isRuleDuplicate(r, DEFAULT_PROPERTY_RULES));
                    customRulesRef.current = finalCustoms;
                    writeStoredCustomRules(storageKey, finalCustoms);
                    setCustomRules(finalCustoms);
                }
            } catch {
                // Ignore network errors/aborts
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void fetchCustomRules();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [storageKey]);

    // Add a custom rule
    const addCustomRule = useCallback(
        (rawText: string): { success: boolean; error?: string; name?: string } => {
            const normalized = normalizeRuleText(rawText);

            if (!normalized || normalized.length < 3) {
                return { success: false, error: "Rule text must be at least 3 characters." };
            }

            if (isRuleDuplicate(normalized, DEFAULT_PROPERTY_RULES)) {
                return {
                    success: false,
                    error: `"${normalized}" is already included in standard rules.`,
                };
            }

            if (isRuleDuplicate(normalized, customRulesRef.current)) {
                return {
                    success: false,
                    error: `"${normalized}" is already in your saved rules list.`,
                };
            }

            const updated = [...customRulesRef.current, normalized];
            customRulesRef.current = updated;
            writeStoredCustomRules(storageKey, updated);
            setCustomRules(updated);

            return { success: true, name: normalized };
        },
        [storageKey]
    );

    // Remove a custom rule choice from saved choices
    const removeCustomRule = useCallback(
        (rawText: string) => {
            const normalized = rawText.trim().toLowerCase();
            const updated = customRulesRef.current.filter(
                (item) => item.trim().toLowerCase() !== normalized
            );
            customRulesRef.current = updated;
            writeStoredCustomRules(storageKey, updated);
            setCustomRules(updated);
        },
        [storageKey]
    );

    const allChoices = useMemo(
        () => mergeRules(DEFAULT_PROPERTY_RULES, customRules),
        [customRules]
    );

    return {
        defaultRules: DEFAULT_PROPERTY_RULES,
        customRules,
        allChoices,
        addCustomRule,
        removeCustomRule,
        isLoading,
    };
}
