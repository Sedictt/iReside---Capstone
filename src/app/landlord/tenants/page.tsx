"use client";

import { Users } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function TenantsPage() {
    return (
        <div className="flex flex-col w-full bg-[#0a0a0a] text-white p-6 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Tenants</h1>
                <p className="text-neutral-400 text-sm font-medium mt-1">Manage your tenants and leases.</p>
            </div>
            <div className="rounded-2xl bg-neutral-900 border border-white/5 p-8">
                <EmptyState
                    icon={Users}
                    title="No tenants yet"
                    description="Tenants will appear here once you add properties and sign leases."
                    action={{ label: "Add Property", href: "/landlord/properties" }}
                />
            </div>
        </div>
    );
}