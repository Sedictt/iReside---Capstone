"use client";

import { CreditCard } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function PaymentsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Payments</h1>
                <p className="text-slate-400">Manage rent, utilities, and payment history.</p>
            </div>

            <div className="rounded-2xl bg-card/50 border border-border/50 p-8">
                <EmptyState
                    icon={CreditCard}
                    title="No payment history yet"
                    description="Your rent payments and balance information will appear here once your landlord sets up your lease."
                />
            </div>
        </div>
    );
}