"use client";

import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function StatisticsPage() {
    return (
        <div className="flex flex-col w-full bg-[#0a0a0a] text-white p-6 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Portfolio Statistics</h1>
                <p className="text-neutral-400 text-sm font-medium mt-1">Detailed insights into your property performance.</p>
            </div>
            <div className="rounded-2xl bg-neutral-900 border border-white/5 p-8">
                <EmptyState
                    icon={BarChart3}
                    title="No data yet"
                    description="Statistics and performance charts will appear here once you have active properties and tenants."
                    action={{ label: "View Properties", href: "/landlord/properties" }}
                />
            </div>
        </div>
    );
}