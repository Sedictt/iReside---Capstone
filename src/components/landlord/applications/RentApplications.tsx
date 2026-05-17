"use client";

import { FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function RentApplications() {
    return (
        <div className="rounded-2xl bg-neutral-900 border border-white/5 p-8">
            <EmptyState
                icon={FileText}
                title="No applications yet"
                description="Rental applications from prospective tenants will appear here."
                action={{ label: "View Properties", href: "/landlord/properties" }}
            />
        </div>
    );
}