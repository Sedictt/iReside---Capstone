"use client";

import VisualBuilder from "@/components/landlord/visual-planner/VisualBuilder";
import { TenantMapNotReady } from "@/components/tenant/TenantMapNotReady";
import { useState, useEffect, useCallback } from "react";

interface TenantUnitMapData {
    property: { id: string; name: string; address: string };
    leaseId: string;
    landlordId: string;
    tenantId: string;
    currentUnitId: string;
    currentUnitName: string;
    units: Array<{
        id: string;
        name: string;
        floor: number;
        status: string;
        beds: number;
        baths: number;
        sqft: number | null;
        rent_amount: number;
    }>;
    isSetupComplete?: boolean;
    isFullyPlaced?: boolean;
    isCurrentUnitPlaced?: boolean;
    placedCount?: number;
    totalUnits?: number;
}

export default function TenantUnitMapPage() {
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [unitMapData, setUnitMapData] = useState<TenantUnitMapData | null>(null);

    const fetchUnitMap = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setIsRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const res = await fetch("/api/tenant/unit-map", {
                cache: "no-store",
            });
            const status = res.status;
            const data = await res.json();
            console.log("Tenant unit-map API:", status, data);

            if (!res.ok) {
                setError(data.error || "Failed to load unit map");
                return;
            }

            // If we get data but no property, it means no active lease found
            if (!data.property) {
                setError("No active lease found for this account");
                return;
            }

            setUnitMapData(data);
        } catch (err) {
            console.error("Unit map load error:", err);
            setError(err instanceof Error ? err.message : "An error occurred while loading the unit map.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchUnitMap();
    }, [fetchUnitMap]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background dark:bg-background-dark min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">Loading your unit map...</p>
                </div>
            </div>
        );
    }

    if (error || !unitMapData) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background dark:bg-background-dark min-h-[60vh] p-6">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <p className="text-neutral-800 dark:text-neutral-200 font-bold">{error || "No unit map found"}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        You need an active lease to view your unit map.
                    </p>
                </div>
            </div>
        );
    }

    // The unit map is ready for tenants ONLY when the landlord has fully placed all units
    // and the tenant's own assigned unit is placed on the canvas
    const isMapSetup = Boolean(
        unitMapData &&
        unitMapData.isSetupComplete &&
        unitMapData.isFullyPlaced &&
        unitMapData.placedCount &&
        unitMapData.placedCount > 0
    );

    if (!isMapSetup) {
        return (
            <TenantMapNotReady
                propertyName={unitMapData.property.name}
                propertyAddress={unitMapData.property.address}
                currentUnitName={unitMapData.currentUnitName}
                onRefresh={() => fetchUnitMap(true)}
                isRefreshing={isRefreshing}
            />
        );
    }

    return (
        <VisualBuilder
            readOnly
            propertyId={unitMapData.property.id}
            propertyName={unitMapData.property.name}
            propertyAddress={unitMapData.property.address}
            currentUnitId={unitMapData.currentUnitId}
            showBackButton
        />
    );
}