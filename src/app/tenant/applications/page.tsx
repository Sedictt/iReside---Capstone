"use client";

import { FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function ApplicationsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Applications</h1>
                <p className="text-slate-400">Track the status of your rental applications.</p>
            </div>

            <div className="rounded-2xl bg-card/50 border border-border/50 p-8">
                <EmptyState
                    icon={FileText}
                    title="No applications yet"
                    description="Applications you submit for rental properties will appear here."
                    action={{ label: "Browse Properties", href: "/search" }}
                />
            </div>
        </div>
    );
}