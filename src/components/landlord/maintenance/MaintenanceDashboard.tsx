"use client";

import { Wrench } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function MaintenanceDashboard() {
    return (
        <div className="rounded-2xl bg-neutral-900 border border-white/5 p-8">
            <EmptyState
                icon={Wrench}
                title="No maintenance requests"
                description="Maintenance requests from tenants will appear here once you have active tenants."
                action={{ label: "View Properties", href: "/landlord/properties" }}
            />
        </div>
    );
}