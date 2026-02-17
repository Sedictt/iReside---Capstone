import { ArrowUpRight, PhilippinePeso, Users, Home as HomeIcon } from "lucide-react";
import RevenueChart from "@/components/RevenueChart";

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                        Add Property
                    </button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-slate-400">Total Revenue</h3>
                        <PhilippinePeso className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">₱45,231.89</span>
                        <span className="flex items-center text-xs font-medium text-emerald-500">
                            +20.1%
                            <ArrowUpRight className="h-3 w-3" />
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-slate-400">Active Tenants</h3>
                        <Users className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">+2350</span>
                        <span className="flex items-center text-xs font-medium text-emerald-500">
                            +180.1%
                            <ArrowUpRight className="h-3 w-3" />
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-slate-400">Properties</h3>
                        <HomeIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">12</span>
                        <span className="flex items-center text-xs font-medium text-emerald-500">
                            +19%
                            <ArrowUpRight className="h-3 w-3" />
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
                    <h3 className="mb-4 text-lg font-semibold text-white">Overview</h3>
                    <div className="h-[300px] w-full rounded-lg bg-slate-800/50 p-2">
                        <RevenueChart />
                    </div>
                </div>

                <div className="col-span-3 rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
                    <h3 className="mb-4 text-lg font-semibold text-white">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium text-white">New lease signed</p>
                                    <p className="text-xs text-slate-400">2 hours ago</p>
                                </div>
                                <div className="text-sm font-medium text-white">₱1,200.00</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
