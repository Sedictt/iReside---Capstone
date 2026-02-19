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
                <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors border border-slate-700">
                    <Download className="w-4 h-4" />
                    Download Statement
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Balance & Payment Actions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Current Balance Card */}
                    <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl opacity-50" />

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <p className="text-indigo-300 font-medium mb-1">Total Balance Due</p>
                                    <h2 className="text-5xl font-bold text-white tracking-tight">₱18,500<span className="text-2xl text-slate-400 font-normal">.00</span></h2>
                                    <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Due on October 1st, 2026
                                    </p>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-full text-xs font-semibold border border-indigo-500/20 uppercase tracking-wide">
                                    <AlertCircle className="w-3 h-3" />
                                    Payment Pending
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2">
                                    <CreditCard className="w-5 h-5" />
                                    Pay Now
                                </button>
                                <button className="flex-1 bg-slate-800/50 hover:bg-slate-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2">
                                    Set up Auto-Pay
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Payment Breakdown */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-white mb-6">Payment Breakdown</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                        <Home className="w-5 h-5" /> {/* Need to import Home */}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">October Rent</p>
                                        <p className="text-xs text-slate-400">Unit 304 • Base Rent</p>
                                    </div>
                                </div>
                                <span className="font-semibold text-white">₱18,000.00</span>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                        <Droplets className="w-5 h-5" /> {/* Need to import Droplets */}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Water Bill</p>
                                        <p className="text-xs text-slate-400">Usage: 12 m³</p>
                                    </div>
                                </div>
                                <span className="font-semibold text-white">₱500.00</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-slate-400">Total Amount</span>
                            <span className="text-xl font-bold text-white">₱18,500.00</span>
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <History className="w-5 h-5 text-slate-400" />
                                Recent Transactions
                            </h3>
                            <Link href="#" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">View All</Link>
                        </div>

                        <div className="divide-y divide-slate-800">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Rent Payment - September</p>
                                            <p className="text-xs text-slate-400">Sep 01, 2026 • via Credit Card ending in 4242</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium text-white">₱18,500.00</span>
                                        <div className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
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
                    {/* Payment Methods */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Payment Methods</h3>
                            <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase">Manage</button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-indigo-500/50 transition-colors">
                                <div className="h-8 w-12 bg-white rounded flex items-center justify-center">
                                    <div className="h-4 w-4 bg-orange-500 rounded-full mr-[-6px] z-10 mix-blend-multiply"></div>
                                    <div className="h-4 w-4 bg-yellow-500 rounded-full mix-blend-multiply"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">Mastercard •••• 4242</p>
                                    <p className="text-xs text-slate-500">Expires 12/28</p>
                                </div>
                                <div className="h-4 w-4 rounded-full border-2 border-indigo-500 bg-indigo-500 flex items-center justify-center">
                                    <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                                </div>
                            </div>

                            <button className="w-full py-3 rounded-xl border border-dashed border-slate-700 text-slate-400 text-sm font-medium hover:text-white hover:border-slate-500 hover:bg-slate-800/30 transition-all flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> {/* Need to import Plus */}
                                Add Payment Method
                            </button>
                        </div>
                    </div>

                    {/* Auto-Pay Status */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-slate-800 text-slate-400">
                                <RefreshCw className="w-6 h-6" /> {/* Need to import RefreshCw */}
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Auto-Pay is Off</h3>
                                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                                    Set up automatic payments to avoid late fees and never miss a due date.
                                </p>
                                <button className="mt-4 text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                                    Enable Auto-Pay &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


