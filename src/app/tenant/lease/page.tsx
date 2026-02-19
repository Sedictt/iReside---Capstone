import {
    FileText,
    Download,
    Calendar,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    Home
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LeasesPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Lease Documents</h1>
                    <p className="text-slate-400">View and manage your rental agreements.</p>
                </div>
            </div>

            {/* Active Lease */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

                <div className="bg-slate-900/50 rounded-xl p-6 sm:p-8 backdrop-blur-sm relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                        <div className="space-y-6 flex-1">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 uppercase tracking-wide flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Lease
                                </span>
                                <span className="text-sm text-slate-400 font-mono">#LSE-2024-8832</span>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Home className="w-6 h-6 text-indigo-400" />
                                    The Grand, Unit 304
                                </h2>
                                <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-2xl">
                                    Standard Residential Lease Agreement for the property located at 123 Main St, Springfield, IL.
                                    Includes parking space #42 and storage unit B-12.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-800/50">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Start Date</p>
                                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        Jan 01, 2024
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">End Date</p>
                                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        Dec 31, 2024
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Monthly Rent</p>
                                    <p className="text-sm font-semibold text-white">₱18,500.00</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[200px]">
                            <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20">
                                <Download className="w-4 h-4" />
                                Download PDF
                            </button>
                            <Link
                                href="/tenant/lease/123"
                                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-colors border border-slate-700"
                            >
                                <FileText className="w-4 h-4" />
                                View Details
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-semibold text-white">Document History</h3>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden backdrop-blur-sm">
                        <div className="divide-y divide-slate-800">
                            {[
                                { title: "Lease Renewal Offer", date: "Sep 15, 2024", type: "Offer", status: "Pending" },
                                { title: "Pet Addendum", date: "Mar 10, 2024", type: "Addendum", status: "Signed" },
                                { title: "Move-in Inspection Report", date: "Jan 01, 2024", type: "Report", status: "Completed" }
                            ].map((doc, i) => (
                                <div key={i} className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-slate-700 transition-colors">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{doc.title}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{doc.date} • {doc.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                            doc.status === "Signed" || doc.status === "Completed"
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                        )}>
                                            {doc.status === "Signed" || doc.status === "Completed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {doc.status}
                                        </div>
                                        <button className="p-2 text-slate-400 hover:text-white transition-colors">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-white mb-4">Need Help?</h3>
                        <p className="text-sm text-slate-400 leading-relaxed mb-6">
                            If you have questions about your lease terms or need to request a modification, please contact property management.
                        </p>
                        <button className="w-full py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors border border-slate-700 flex items-center justify-center gap-2">
                            Contact Management
                        </button>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-white mb-4">Renewal Status</h3>

                        <div className="relative pt-2">
                            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
                                <span>Day 265</span>
                                <span>Day 366</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[72%] rounded-full relative">
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-indigo-400 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-3 text-center">
                                Your lease expires in <span className="text-white font-bold">101 days</span>.
                            </p>
                            <p className="text-xs text-indigo-400 mt-1 text-center font-medium cursor-pointer hover:underline">
                                View renewal options
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
