"use client";

import { Building2, ArrowUpRight, Users, Ticket, AlertCircle, TrendingUp, Bell, Search, ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
        }
    },
    scales: {
        x: {
            grid: {
                display: false,
                drawBorder: false,
            },
            ticks: {
                color: '#64748b',
            }
        },
        y: {
            grid: {
                color: '#334155',
                borderDash: [5, 5],
                drawBorder: false,
            },
            ticks: {
                color: '#64748b',
                callback: function (value: any) {
                    return value + 'k';
                }
            }
        }
    }
};

const chartData = {
    labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    datasets: [
        {
            label: 'Income',
            data: [400, 420, 380, 450, 430, 480],
            borderColor: '#3b82f6', // blue-500
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#3b82f6',
        },
        {
            label: 'Expenses',
            data: [200, 210, 190, 220, 215, 230],
            borderColor: '#64748b', // slate-500
            backgroundColor: 'rgba(100, 116, 139, 0.5)',
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#64748b',
        }
    ]
};

export default function LandlordDashboard() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex flex-col h-full w-full bg-[#0f172a] text-white overflow-hidden p-6 md:p-8 space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Executive Dashboard</h1>
                    <p className="text-sm text-slate-400">📅 Today is October 24, 2023</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search properties, tenants..."
                            className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg bg-slate-800/50 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                        />
                    </div>

                    <button className="relative ml-2 p-2 rounded-full hover:bg-slate-800 transition-colors">
                        <Bell className="h-5 w-5 text-slate-400 hover:text-white" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0f172a]"></span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Monthly Revenue */}
                <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#1e293b]/50 p-6 backdrop-blur-sm hover:border-white/10 transition-colors group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-16 w-16 text-emerald-500" />
                    </div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
                            <span className="text-xl font-bold">$</span>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                            <ArrowUpRight className="h-3 w-3" />
                            +12%
                        </span>
                    </div>
                    <p className="text-sm font-medium text-slate-400">Monthly Revenue</p>
                    <h3 className="text-2xl font-bold text-white mb-1">₱ 450,000</h3>
                    <p className="text-xs text-slate-500">AI Forecast: <span className="text-slate-300 font-medium">₱ 465k next month</span></p>
                </div>

                {/* Occupancy Rate */}
                <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#1e293b]/50 p-6 backdrop-blur-sm hover:border-white/10 transition-colors group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Building2 className="h-16 w-16 text-blue-500" />
                    </div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
                            <div className="h-5 w-5 border-2 border-current rounded-full border-t-transparent animate-spin-slow" style={{ animationDuration: '3s' }}></div>
                        </div>
                        <span className="text-xs font-medium text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-white/5">
                            Target: 95%
                        </span>
                    </div>
                    <p className="text-sm font-medium text-slate-400">Occupancy Rate</p>
                    <div className="flex items-baseline gap-2 mb-2">
                        <h3 className="text-2xl font-bold text-white">92%</h3>
                        <span className="text-xs text-emerald-500 font-medium">Healthy</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full w-[92%] rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    </div>
                </div>

                {/* Active Tenants */}
                <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#1e293b]/50 p-6 backdrop-blur-sm hover:border-white/10 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500">
                            <Users className="h-5 w-5" />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                            +4 New
                        </span>
                    </div>
                    <p className="text-sm font-medium text-slate-400">Active Tenants</p>
                    <div className="flex items-baseline gap-2 mb-1">
                        <h3 className="text-2xl font-bold text-white">142</h3>
                        <span className="text-xs text-slate-500">units occupied</span>
                    </div>
                    <p className="text-xs text-amber-500 font-medium">5 leases expiring soon</p>
                </div>

                {/* Pending Issues */}
                <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#1e293b]/50 p-6 backdrop-blur-sm hover:border-white/10 transition-colors group border-l-4 border-l-red-500/50">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle className="h-16 w-16 text-red-500" />
                    </div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="rounded-lg bg-red-500/10 p-2 text-red-500">
                            <Ticket className="h-5 w-5" />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20 animate-pulse">
                            Action Req.
                        </span>
                    </div>
                    <p className="text-sm font-medium text-slate-400">Pending Issues</p>
                    <div className="flex items-baseline gap-2 mb-1">
                        <h3 className="text-2xl font-bold text-white">3</h3>
                        <span className="text-xs text-slate-500">issues</span>
                    </div>
                    <p className="text-xs text-red-400 font-medium">1 Critical Priority</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-8">

                {/* Chart Section */}
                <div className="lg:col-span-2 rounded-xl border border-white/5 bg-[#1e293b]/30 p-6 backdrop-blur-sm flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Financial Performance</h3>
                            <p className="text-xs text-slate-400">Income vs Operational Expenses (Last 6 Months)</p>
                        </div>
                        <button className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                            Last 6 Months <ChevronDown className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="flex-1 w-full min-h-0 relative">
                        <Line options={chartOptions} data={chartData} />
                    </div>
                    <div className="mt-4 flex justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                            <span className="text-xs text-slate-400">Income</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                            <span className="text-xs text-slate-400">Expenses</span>
                        </div>
                    </div>
                </div>

                {/* Right Column Stack */}
                <div className="space-y-6">

                    {/* Quick Actions */}
                    <div className="rounded-xl border border-white/5 bg-[#1e293b]/30 p-6 backdrop-blur-sm">
                        <h3 className="text-sm font-bold text-white mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Add Property', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { label: 'Create Invoice', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                { label: 'New Lease', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                { label: 'Announce', icon: Bell, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                            ].map((action) => (
                                <button key={action.label} className="flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 p-4 transition-all group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
                                    <div className={cn("rounded-lg p-2 transition-colors group-hover:bg-opacity-20", action.bg, action.color)}>
                                        <action.icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-300 group-hover:text-white">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Alerts & Maintenance */}
                    <div className="rounded-xl border border-white/5 bg-[#1e293b]/30 p-6 backdrop-blur-sm flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-white">Alerts & Maintenance</h3>
                            </div>
                            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-red-500/20">
                                3 pending
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 hover:bg-red-500/10 transition-colors group cursor-pointer">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                                        <p className="text-sm font-bold text-red-200 group-hover:text-red-100">Water Leak Reported</p>
                                    </div>
                                    <span className="text-[10px] text-red-300/50 font-mono">1h ago</span>
                                </div>
                                <p className="text-xs text-red-300/70 mb-3 pl-4">Unit 402 - Tenant reports severe dripping in bathroom ceiling.</p>
                                <div className="flex gap-2 pl-4">
                                    <button className="rounded bg-red-500/20 hover:bg-red-500/30 px-2 py-1 text-[10px] font-medium text-red-200 border border-red-500/20 transition-colors">
                                        Contact Vendor
                                    </button>
                                    <button className="text-[10px] text-red-300/50 hover:text-red-200 hover:underline">Details</button>
                                </div>
                            </div>

                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 hover:bg-amber-500/10 transition-colors group cursor-pointer">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                        <p className="text-sm font-bold text-amber-200 group-hover:text-amber-100">Rent Overdue</p>
                                    </div>
                                    <span className="text-[10px] text-amber-300/50 font-mono">2d ago</span>
                                </div>
                                <p className="text-xs text-amber-300/70 mb-3 pl-4">Unit 105 - Payment missed for October.</p>
                                <div className="pl-4">
                                    <button className="rounded bg-amber-500/20 hover:bg-amber-500/30 px-2 py-1 text-[10px] font-medium text-amber-200 border border-amber-500/20 transition-colors">
                                        Send Reminder
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Recent Inquiries List */}
            <div className="rounded-xl border border-white/5 bg-[#1e293b]/30 overflow-hidden backdrop-blur-sm">
                <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Recent Inquiries</h3>
                    <button className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-800/50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-semibold tracking-wider">Lead Name</th>
                                <th className="px-6 py-3 font-semibold tracking-wider">Property Interest</th>
                                <th className="px-6 py-3 font-semibold tracking-wider">Date</th>
                                <th className="px-6 py-3 font-semibold tracking-wider">Status</th>
                                <th className="px-6 py-3 font-semibold tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <tr className="hover:bg-slate-800/30 transition-colors">
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
                                    <p className="text-slate-300">Makati Skyline, Unit 402</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-slate-300">Oct 24, 2023</span>
                                        <span className="text-xs text-slate-500">10:30 AM</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
                                        New Lead
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="rounded-lg p-1 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                        <ArrowUpRight className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                            {/* Additional mock row */}
                            <tr className="hover:bg-slate-800/30 transition-colors">
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
                                    <p className="text-slate-300">Azure Urban Resort, Unit 1215</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-slate-300">Oct 23, 2023</span>
                                        <span className="text-xs text-slate-500">2:45 PM</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                                        Follow Up
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="rounded-lg p-1 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                        <ArrowUpRight className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
