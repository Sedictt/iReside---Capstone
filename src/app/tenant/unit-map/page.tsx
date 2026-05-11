"use client";

import VisualBuilder from "@/components/landlord/visual-planner/VisualBuilder";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

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
}

export default function TenantUnitMapPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unitMapData, setUnitMapData] = useState<TenantUnitMapData | null>(null);

    useEffect(() => {
        const fetchUnitMap = async () => {
            try {
                const res = await fetch("/api/tenant/unit-map");
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
            }
        };

        fetchUnitMap();
    }, []);

    return loading ? (
        <div className="flex-1 flex items-center justify-center bg-[#fafafa]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="size-8 text-primary animate-spin" />
                <p className="text-neutral-500 text-sm">Loading your unit map...</p>
            </div>
        </div>
    ) : error || !unitMapData ? (
        <div className="flex-1 flex items-center justify-center bg-[#fafafa]">
            <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-neutral-500">{error || "No unit map found"}</p>
                <p className="text-sm text-neutral-400">
                    You need an active lease to view your unit map.
                </p>
            </div>
        </div>
    ) : (
        <VisualBuilder readOnly propertyId={unitMapData.property.id} />
    );
}

