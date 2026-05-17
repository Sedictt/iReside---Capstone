"use client";

import { useEffect, useState } from "react";
import { DashboardBanner } from "@/components/landlord/dashboard/DashboardBanner";
import { QuickActions } from "@/components/landlord/dashboard/QuickActions";
import { CreditCard, Building2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ContactsSidebar } from "@/components/landlord/dashboard/ContactsSidebar";

export default function LandlordDashboard() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex flex-col w-full bg-[#0a0a0a] text-white p-6 md:p-8 md:pr-24 space-y-8 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar">
            <DashboardBanner />

            {/* Payment Overview */}
            <div className="p-6 rounded-3xl bg-neutral-900 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold text-white">Payment Overview</h2>
                </div>
                <EmptyState
                    icon={CreditCard}
                    title="No payments yet"
                    description="When tenants submit payments, you'll see them organized here."
                    action={{ label: "View Properties", href: "/landlord/properties" }}
                />
            </div>

            {/* Announcement Card */}
            <div className="p-6 rounded-3xl bg-neutral-800/50 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <Building2 className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold text-white text-lg">Announcements</h3>
                </div>
                <EmptyState
                    icon={Building2}
                    title="No announcements"
                    description="System announcements and updates will appear here."
                />
            </div>

            <ContactsSidebar />
            <QuickActions />
        </div>
    );
}
