import {
    ChevronLeft,
    FileText,
    Download,
    Calendar,
    CheckCircle2,
    Users,
    MapPin,
    ArrowUpRight
} from "lucide-react";
import Link from "next/link";

export default async function LeaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // In a real app, fetch lease details using id

    return (
        <div className="space-y-8">
            <Link href="/tenant/lease" className="flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
                <ChevronLeft className="size-4 mr-1" />
                Back to Leases
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Lease #LSE-2024-8832</h1>
                    <p className="text-zinc-400">Fixed Term Residential Lease â€¢ Active</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 text-sm">
                        <Download className="size-4" />
                        Download PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Lease Terms Summary */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6">Lease Summary</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-800">
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Property</p>
                                <div className="flex items-start gap-3">
                                    <MapPin className="size-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-bold text-white">The Grand</p>
                                        <p className="text-sm text-zinc-400">Unit 304<br />123 Main St, Springfield, IL</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-800">
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Occupants</p>
                                <div className="flex items-start gap-3">
                                    <Users className="size-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-bold text-white">Sarah Chen</p>
                                        <p className="text-sm text-zinc-400">Primary Tenant</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-800">
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Term</p>
                                <div className="flex items-start gap-3">
                                    <Calendar className="size-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-bold text-white">12 Months</p>
                                        <p className="text-sm text-zinc-400">Jan 1, 2024 - Dec 31, 2024</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-800">
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Rent</p>
                                <div className="flex items-start gap-3">
                                    <div className="size-5 flex items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">$</div>
                                    <div>
                                        <p className="font-bold text-white">â‚±18,500.00 / month</p>
                                        <p className="text-sm text-zinc-400">Due on the 1st</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clauses / Key Terms */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6">Key Clauses</h3>
                        <ul className="space-y-4">
                            {[
                                "Pets Allowed with Deposit (Clause 4.2)",
                                "No Smoking (Clause 5.1)",
                                "Quiet Hours: 10PM - 7AM (Clause 6.3)",
                                "Utilities: Tenant pays Electricity & Internet (Clause 3.1)"
                            ].map((clause, i) => (
                                <li key={clause} className="flex items-center gap-3 text-zinc-300 text-sm p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                                    <CheckCircle2 className="size-4 text-emerald-500 flex-shrink-0" />
                                    {clause}
                                </li>
                            ))}
                        </ul>
                        <button className="mt-6 text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 group">
                            View Full Agreement <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </button>
                    </div>
                </div>

                {/* Sidebar - Timeline/Status */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6">Timeline</h3>
                        <div className="relative border-l-2 border-zinc-800 ml-3 space-y-8 pl-6 pb-2">
                            <div className="relative">
                                <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-primary ring-4 ring-zinc-900" />
                                <p className="text-sm font-bold text-white">Lease Active</p>
                                <p className="text-xs text-zinc-400 mt-1">Jan 01, 2024</p>
                            </div>
                            <div className="relative">
                                <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-zinc-700 ring-4 ring-zinc-900" />
                                <p className="text-sm font-medium text-zinc-300">Signed by Tenant</p>
                                <p className="text-xs text-zinc-500 mt-1">Dec 15, 2023</p>
                            </div>
                            <div className="relative">
                                <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-zinc-700 ring-4 ring-zinc-900" />
                                <p className="text-sm font-medium text-zinc-300">Sent for Signature</p>
                                <p className="text-xs text-zinc-500 mt-1">Dec 14, 2023</p>
                            </div>
                            <div className="relative">
                                <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-zinc-700 ring-4 ring-zinc-900" />
                                <p className="text-sm font-medium text-zinc-300">Draft Created</p>
                                <p className="text-xs text-zinc-500 mt-1">Dec 10, 2023</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
