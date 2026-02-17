"use client";

import { Search, ArrowUpRight, Bell, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { KpiCard } from "@/components/landlord/dashboard/KpiCard";
import { FinancialPerformanceChart } from "@/components/landlord/dashboard/FinancialPerformanceChart";
import { QuickActions } from "@/components/landlord/dashboard/QuickActions";


import { FeaturedPropertyCard } from "@/components/landlord/dashboard/FeaturedPropertyCard";
import { DashboardBanner } from "@/components/landlord/dashboard/DashboardBanner";
import { RecentInquiries } from "@/components/landlord/dashboard/RecentInquiries";

export default function LandlordDashboard() {
    const [mounted, setMounted] = useState(false);
    const [showMoreKpis, setShowMoreKpis] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex flex-col min-h-screen w-full bg-[#0a0a0a] text-white overflow-y-auto p-6 md:p-8 space-y-6">

            {/* Main Dashboard Banner */}
            <DashboardBanner />

            {/* Performance Overview Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white tracking-tight">Performance Overview</h2>
                <button
                    onClick={() => setShowMoreKpis(!showMoreKpis)}
                    className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5"
                >
                    {showMoreKpis ? "Show Less" : "See More"}
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", showMoreKpis && "rotate-180")} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <KpiCard
                    title="Estimated Earnings"
                    value="₱1,345.78"
                    change="+672.89 (+100.00%)"
                    changeType="positive"
                    iconColor="bg-blue-500"
                    trendlineProperties={{ colors: ["#22d3ee", "#3b82f6"] }} // Cyan to Blue
                    data={[800, 950, 1100, 1050, 1250, 1150, 1345]}
                />

                <KpiCard
                    title="Active Tenants"
                    value="142"
                    change="+4 New this month"
                    changeType="positive"
                    iconColor="bg-purple-500"
                    trendlineProperties={{ colors: ["#fb923c", "#ef4444"] }} // Orange to Red
                    data={[130, 132, 135, 138, 140, 141, 142]}
                />

                <KpiCard
                    title="Occupancy Rate"
                    value="92%"
                    change="-3% from last month"
                    changeType="negative"
                    iconColor="bg-emerald-500"
                    trendlineProperties={{ colors: ["#a855f7", "#ec4899"] }} // Purple to Pink
                    data={[95, 95, 94, 94, 93, 92, 92]}
                />

                <KpiCard
                    title="Pending Issues"
                    value="3"
                    change="+1 Critical Priority"
                    changeType="negative"
                    iconColor="bg-red-500"
                    trendlineProperties={{ colors: ["#ef4444", "#ec4899"] }} // Red to Pink
                    data={[1, 1, 2, 2, 3, 3, 3]}
                />

            </div>

            {/* Expandable Stats Grid */}
            {/* Expandable Stats Grid - CSS Transition */}
            <div
                className={cn(
                    "grid transition-all duration-500 ease-in-out",
                    showMoreKpis ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
                )}
            >
                <div className="overflow-hidden min-h-0">
                    <div className={cn(
                        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-transform duration-500",
                        showMoreKpis ? "translate-y-0" : "-translate-y-4"
                    )}>
                        <KpiCard
                            title="Maintenance Cost"
                            value="₱12,450"
                            change="-15% vs last month"
                            changeType="positive"
                            iconColor="bg-orange-500"
                            trendlineProperties={{ colors: ["#f97316", "#ea580c"] }}
                            data={[15000, 14200, 13800, 12450, 12450, 12000, 12450]}
                        />
                        <KpiCard
                            title="Lease Renewals"
                            value="8"
                            change="Due in next 30 days"
                            changeType="neutral"
                            iconColor="bg-indigo-500"
                            trendlineProperties={{ colors: ["#818cf8", "#6366f1"] }}
                            data={[2, 3, 5, 8, 8, 9, 8]}
                        />
                        <KpiCard
                            title="Avg. Tenant Duration"
                            value="1.8 Years"
                            change="+0.2 Years YTD"
                            changeType="positive"
                            iconColor="bg-teal-500"
                            trendlineProperties={{ colors: ["#2dd4bf", "#14b8a6"] }}
                            data={[1.5, 1.5, 1.6, 1.6, 1.7, 1.8, 1.8]}
                        />
                        <KpiCard
                            title="Portfolio Value"
                            value="₱45.2M"
                            change="+5.4% Appreciation"
                            changeType="positive"
                            iconColor="bg-yellow-500"
                            trendlineProperties={{ colors: ["#facc15", "#eab308"] }}
                            data={[42, 42.5, 43, 44, 44.5, 45, 45.2]}
                        />
                    </div>
                </div>
            </div>



            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 h-[400px]">
                    <FinancialPerformanceChart />
                </div>

                {/* Featured Property Card */}
                <div className="lg:col-span-1 h-[400px]">
                    <FeaturedPropertyCard
                        propertyName="Sunset Valley Apartments"
                        totalSales={243}
                        totalViews="20K+"
                        className="h-full shadow-2xl"
                    />
                </div>
            </div>

            {/* Recent Inquiries */}
            <div className="w-full">
                <RecentInquiries />
            </div>

            <QuickActions />
        </div >
    );
}
