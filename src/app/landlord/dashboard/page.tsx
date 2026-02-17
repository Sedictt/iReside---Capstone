"use client";

import { Search, ArrowUpRight, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { KpiCard } from "@/components/landlord/dashboard/KpiCard";
import { FinancialPerformanceChart } from "@/components/landlord/dashboard/FinancialPerformanceChart";
import { QuickActions } from "@/components/landlord/dashboard/QuickActions";

export default function LandlordDashboard() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-white overflow-hidden p-6 md:p-8 space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Executive Dashboard</h1>
                    <p className="text-sm text-neutral-400">📅 Today is October 24, 2023</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search properties, tenants..."
                            className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg bg-neutral-800/50 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-neutral-500"
                        />
                    </div>

                    <button className="relative ml-2 p-2 rounded-full hover:bg-neutral-800 transition-colors">
                        <Bell className="h-5 w-5 text-neutral-400 hover:text-white" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0a0a0a]"></span>
                    </button>
                </div>
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-8">

                {/* Chart Section */}
                <div className="lg:col-span-3 h-[400px]">
                    <FinancialPerformanceChart />
                </div>
            </div>

            {/* Recent Inquiries List */}
            <div className="rounded-xl border border-white/5 bg-[#171717]/30 overflow-hidden backdrop-blur-sm">
                <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Recent Inquiries</h3>
                    <button className="text-xs font-medium text-primary hover:text-primary-200 hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-neutral-400">
                        <thead className="bg-neutral-800/50 text-xs uppercase text-neutral-500">
                            <tr>
                                <th className="px-6 py-3 font-semibold tracking-wider">Lead Name</th>
                                <th className="px-6 py-3 font-semibold tracking-wider">Property Interest</th>
                                <th className="px-6 py-3 font-semibold tracking-wider">Date</th>
                                <th className="px-6 py-3 font-semibold tracking-wider">Status</th>
                                <th className="px-6 py-3 font-semibold tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <tr className="hover:bg-neutral-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-xs border border-orange-500/20">
                                            MS
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">Maria Santos</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-neutral-300">Makati Skyline, Unit 402</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-neutral-300">Oct 24, 2023</span>
                                        <span className="text-xs text-neutral-500">10:30 AM</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
                                        New Lead
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="rounded-lg p-1 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors">
                                        <ArrowUpRight className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                            {/* Additional mock row */}
                            <tr className="hover:bg-neutral-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                                            JD
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">John Doe</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-neutral-300">Azure Urban Resort, Unit 1215</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-neutral-300">Oct 23, 2023</span>
                                        <span className="text-xs text-neutral-500">2:45 PM</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                                        Follow Up
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="rounded-lg p-1 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors">
                                        <ArrowUpRight className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <QuickActions />
        </div>
    );
}
