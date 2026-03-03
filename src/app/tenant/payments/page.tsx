import {
    CreditCard,
    History,
    ArrowUpRight,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Download,
    Home,
    Droplets,
    Plus,
    RefreshCw
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PaymentsPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Payments</h1>
                    <p className="text-slate-400">Manage rent, utilities, and payment history.</p>
                </div>
                <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-900 text-neutral-300 hover:text-white rounded-lg text-sm font-medium transition-colors border border-white/10">
                    <Download className="w-4 h-4" />
                    Download Statement
                </button>
            </div>

            {/* Balance & Payment Actions */}
            <div className="w-full space-y-6">
                {/* Current Balance Card */}
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl opacity-50" />

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <p className="text-neutral-400 font-medium mb-1">Total Balance Due</p>
                                <h2 className="text-5xl font-bold text-white tracking-tight">₱18,500<span className="text-2xl text-neutral-500 font-normal">.00</span></h2>
                                <p className="text-sm text-neutral-400 mt-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Due October 1st, 2026
                                </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold border border-primary/20 uppercase tracking-wide">
                                <AlertCircle className="w-3 h-3" />
                                Payment Pending
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/tenant/payments/checkout" className="flex-1 max-w-sm bg-primary hover:bg-primary/90 text-black font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Pay Now
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Payment Breakdown */}
                <div className="rounded-2xl border border-white/5 bg-neutral-900/40 p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-6">Payment Breakdown</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Home className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">October Rent</p>
                                    <p className="text-xs text-neutral-400">Unit 304 • Base Rent</p>
                                </div>
                            </div>
                            <span className="font-semibold text-white">₱18,000.00</span>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <Droplets className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Water Bill</p>
                                    <p className="text-xs text-neutral-400">Usage: 12 m³</p>
                                </div>
                            </div>
                            <span className="font-semibold text-white">₱500.00</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                        <span className="text-neutral-400">Total Amount</span>
                        <span className="text-xl font-bold text-white">₱18,500.00</span>
                    </div>
                </div>

                {/* Payment History */}
                <div className="rounded-2xl border border-white/5 bg-neutral-900/40 overflow-hidden backdrop-blur-sm">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-neutral-400" />
                            Recent Transactions
                        </h3>
                        <Link href="#" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">View All</Link>
                    </div>

                    <div className="divide-y divide-white/5">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Rent Payment - September</p>
                                        <p className="text-xs text-neutral-400">Sep 01, 2026 • via Credit Card ending in 4242</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-medium text-white">₱18,500.00</span>
                                    <div className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Auto-Pay Status */}
                <div className="rounded-2xl border border-white/5 bg-neutral-900/40 p-6 backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-white/5 text-neutral-400">
                            <RefreshCw className="w-6 h-6" /> {/* Need to import RefreshCw */}
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Auto-Pay is Off</h3>
                            <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
                                Set up automatic payments to avoid late fees and never miss a due date.
                            </p>
                            <button className="mt-4 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                                Enable Auto-Pay &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
