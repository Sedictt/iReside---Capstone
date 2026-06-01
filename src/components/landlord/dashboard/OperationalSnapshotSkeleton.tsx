"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { OperationalSnapshotCard } from "./OperationalSnapshotCard";

export function OperationalSnapshotSkeleton({ className }: { className?: string }) {
    const fixtureData = {
        status: "Performing" as const,
        headline: "Portfolio is highly stable and profitable",
        summary: "Excellent occupancy rates and active collections across all units this month.",
        metrics: [
            { label: "Occupancy Rate", value: "94.5%", detail: "All units active", tone: "positive" as const },
            { label: "Maintenance Requests", value: "3 Pending", detail: "Triage active", tone: "warning" as const },
            { label: "Pending Signups", value: "12 Total", detail: "Screening", tone: "default" as const },
            { label: "Rent Collected", value: "₱1.2M", detail: "92% complete", tone: "positive" as const }
        ]
    };

    return (
        <Skeleton 
            name="operational-snapshot" 
            loading={true} 
            fixture={<OperationalSnapshotCard {...fixtureData} className={className} />}
        >
            <OperationalSnapshotCard {...fixtureData} className={className} />
        </Skeleton>
    );
}
