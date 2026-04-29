"use client";

import { UtilityBillingDashboard } from "@/components/landlord/utility/UtilityBillingDashboard";

export default function UtilityBillingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <div className="mx-auto max-w-7xl">
                    <UtilityBillingDashboard />
                </div>
            </div>
        </div>
    );
}
