"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    DEFAULT_PROPERTY_AMENITIES,
    normalizeAmenityName,
    isAmenityDuplicate,
    mergeAmenities,
} from "@/lib/constants/amenities";

const STORAGE_PREFIX = "ireside_custom_amenities_";

function getStorageKey(landlordId?: string | null): string {
    return landlordId ? `${STORAGE_PREFIX}${landlordId}` : `${STORAGE_PREFIX}default`;
}

function readStoredCustomAmenities(key: string): string[] {
    if (typeof window === "undefined") return [];
    try {
        const item = window.localStorage.getItem(key);
        if (!item) return [];
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
            return parsed
                .map(normalizeAmenityName)
                .filter((name) => name && !isAmenityDuplicate(name, DEFAULT_PROPERTY_AMENITIES));
        }
    } catch {
        // Ignore parse errors
    }
    return [];
}

function writeStoredCustomAmenities(key: string, list: string[]): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(list));
    } catch {
        // Ignore storage errors (quota, incognito)
    }
}

export interface UseCustomAmenitiesOptions {
    landlordId?: string | null;
    initialCustomAmenities?: string[];
}

export function useCustomAmenities({ landlordId, initialCustomAmenities = [] }: UseCustomAmenitiesOptions = {}) {
    const storageKey = useMemo(() => getStorageKey(landlordId), [landlordId]);

    const [customAmenities, setCustomAmenities] = useState<string[]>(() => {
        const stored = readStoredCustomAmenities(storageKey);
        const combined = mergeAmenities([], [...stored, ...initialCustomAmenities]);
        return combined.filter((a) => !isAmenityDuplicate(a, DEFAULT_PROPERTY_AMENITIES));
    });

    const customAmenitiesRef = useRef<string[]>(customAmenities);
    customAmenitiesRef.current = customAmenities;

    const [isLoading, setIsLoading] = useState(false);

    // Sync with remote server API to gather custom amenities across all properties
    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchCustomAmenities = async () => {
            setIsLoading(true);
            try {
                const res = await fetch("/api/landlord/amenities/custom", {
                    signal: controller.signal,
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!isMounted) return;

                if (Array.isArray(data.customAmenities)) {
                    const local = readStoredCustomAmenities(storageKey);
                    const merged = mergeAmenities([], [...local, ...customAmenitiesRef.current, ...data.customAmenities]);
                    const finalCustoms = merged.filter((a) => !isAmenityDuplicate(a, DEFAULT_PROPERTY_AMENITIES));
                    customAmenitiesRef.current = finalCustoms;
                    writeStoredCustomAmenities(storageKey, finalCustoms);
                    setCustomAmenities(finalCustoms);
                }
            } catch {
                // Ignore network errors/aborts
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void fetchCustomAmenities();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [storageKey]);

    // Add a custom amenity
    const addCustomAmenity = useCallback(
        (rawName: string): { success: boolean; error?: string; name?: string } => {
            const normalized = normalizeAmenityName(rawName);

            if (!normalized || normalized.length < 2) {
                return { success: false, error: "Amenity name must be at least 2 characters." };
            }

            if (isAmenityDuplicate(normalized, DEFAULT_PROPERTY_AMENITIES)) {
                return {
                    success: false,
                    error: `"${normalized}" is already included in standard amenities.`,
                };
            }

            if (isAmenityDuplicate(normalized, customAmenitiesRef.current)) {
                return {
                    success: false,
                    error: `"${normalized}" is already in your custom amenities list.`,
                };
            }

            const updated = [...customAmenitiesRef.current, normalized];
            customAmenitiesRef.current = updated;
            writeStoredCustomAmenities(storageKey, updated);
            setCustomAmenities(updated);

            return { success: true, name: normalized };
        },
        [storageKey]
    );

    // Remove a custom amenity from future choice options
    const removeCustomAmenity = useCallback(
        (rawName: string) => {
            const normalized = rawName.trim().toLowerCase();
            const updated = customAmenitiesRef.current.filter(
                (item) => item.trim().toLowerCase() !== normalized
            );
            customAmenitiesRef.current = updated;
            writeStoredCustomAmenities(storageKey, updated);
            setCustomAmenities(updated);
        },
        [storageKey]
    );

    const allChoices = useMemo(
        () => mergeAmenities(DEFAULT_PROPERTY_AMENITIES, customAmenities),
        [customAmenities]
    );

    return {
        defaultAmenities: DEFAULT_PROPERTY_AMENITIES,
        customAmenities,
        allChoices,
        addCustomAmenity,
        removeCustomAmenity,
        isLoading,
    };
}
