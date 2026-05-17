"use client";

import { FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function ApplicationsPage() {
    return (
        <div className="flex flex-col w-full bg-[#0a0a0a] text-white p-6 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Applications</h1>
                <p className="text-neutral-400 text-sm font-medium mt-1">Review rental applications from prospective tenants.</p>
            </div>
            <div className="rounded-2xl bg-neutral-900 border border-white/5 p-8">
                <EmptyState
                    icon={FileText}
                    title="No applications yet"
                    description="Rental applications from prospective tenants will appear here."
                    action={{ label: "View Properties", href: "/landlord/properties" }}
                />
            </div>
        </div>
    );
}
