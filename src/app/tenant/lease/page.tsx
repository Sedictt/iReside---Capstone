"use client";

import { FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function LeasesPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Lease Documents</h1>
                <p className="text-slate-400">View and manage your rental agreements.</p>
            </div>

            <div className="rounded-2xl bg-card/50 border border-border/50 p-8">
                <EmptyState
                    icon={FileText}
                    title="No lease yet"
                    description="Your lease agreement will appear here once your landlord sets up your account and signs the lease."
                />
            </div>
        </div>
    );
}