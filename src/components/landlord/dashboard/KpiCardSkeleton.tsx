"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { KpiCard } from "./KpiCard";

export function KpiCardSkeleton({ className }: { className?: string }) {
    const fixtureData = {
        title: "Total Revenue",
        value: "$24,500",
        change: "+12.5%",
        changeType: "positive" as const,
        data: [10, 20, 15, 30, 25, 40, 35, 50],
        trendlineProperties: { colors: ["#3b82f6", "#06b6d4"] as [string, string] }
    };

    return (
        <Skeleton 
            name="kpi-card" 
            loading={true} 
            fixture={<KpiCard {...fixtureData} className={className} />}
        >
            <KpiCard {...fixtureData} className={className} />
        </Skeleton>
    );
}
