import { ArrowUpRight, PhilippinePeso, Users, Home as HomeIcon } from "lucide-react";
import RevenueChart from "@/components/RevenueChart";
import { T } from "@/context/LanguageContext";

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black tracking-tight text-white"><T>Dashboard</T></h1>
                <div className="flex items-center gap-2">
                    <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                        <T>Add Property</T>
                    </button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-400"><T>Total Revenue</T></h3>
                        <PhilippinePeso className="size-4 text-zinc-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">₱45,231.89</span>
                        <span className="flex items-center text-xs font-medium text-emerald-500">
                            +20.1%
                            <ArrowUpRight className="size-3" />
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-400"><T>Active Tenants</T></h3>
                        <Users className="size-5" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">+2350</span>
                        <span className="flex items-center text-xs font-medium text-emerald-500">
                            +180.1%
                            <ArrowUpRight className="size-3" />
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-400"><T>Properties</T></h3>
                        <HomeIcon className="size-4 text-zinc-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">12</span>
                        <span className="flex items-center text-xs font-medium text-emerald-500">
                            +19%
                            <ArrowUpRight className="size-3" />
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl">
                    <h3 className="mb-4 text-lg font-black text-white"><T>Overview</T></h3>
                    <div className="h-[300px] w-full rounded-lg bg-zinc-800/50 p-2">
                        <RevenueChart />
                    </div>
                </div>

                <div className="col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl">
                    <h3 className="mb-4 text-lg font-black text-white"><T>Recent Activity</T></h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={`feature-${i}`} className="flex items-center gap-4">
                                <div className="size-2 rounded-full bg-blue-500" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium text-white"><T>New lease signed</T></p>
                                    <p className="text-xs text-zinc-400"><T>2 hours ago</T></p>
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

