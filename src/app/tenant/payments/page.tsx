"use client";

import { useState, useEffect } from "react";
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
    RefreshCw,
    Loader2,
    Zap,
    XCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type PaymentItem = {
    id: string;
    label: string;
    amount: number;
    category: string;
};

type PaymentData = {
    id: string;
    amount: number;
    status: string;
    method: string | null;
    description: string | null;
    due_date: string;
    paid_at?: string;
    reference_number?: string;
    payment_items?: PaymentItem[];
    lease?: {
        unit?: {
            name: string;
        }
    };
};

export default function PaymentsPage() {
    const [nextPayment, setNextPayment] = useState<PaymentData | null>(null);
    const [history, setHistory] = useState<PaymentData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchPayments = async () => {
            try {
                const res = await fetch("/api/tenant/payments", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load payments");
                const payload = await res.json();
                if (isMounted) {
                    setNextPayment(payload.nextPayment);
                    setHistory(payload.history);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchPayments();
        return () => { isMounted = false; };
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case "failed": return <XCircle className="w-5 h-5 text-red-500" />;
            case "refunded": return <RefreshCw className="w-5 h-5 text-purple-500" />;
            default: return <AlertCircle className="w-5 h-5 text-amber-500" />;
        }
    };

    const isOverdue = nextPayment ? new Date(nextPayment.due_date).getTime() < Date.now() : false;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] opacity-50 space-y-4 text-white">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <span className="text-sm font-bold uppercase tracking-widest text-white/50">Fetching Financial Data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl md:text-5xl font-display text-white mb-3 mt-4">Financials Base</h1>
                    <p className="text-white/60 text-sm md:text-base max-w-2xl">
                        Manage your upcoming rent, review comprehensive utility breakdowns, and access your payment history dashboard.
                    </p>
                </div>
                <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors border border-white/10">
                    <Download className="w-4 h-4" />
                    Export Ledger
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content (Left) */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    
                    {/* Current Balance Card */}
                    <div className="rounded-[2.5rem] border border-primary/20 bg-[#0d0d0d] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/20 blur-[100px] pointer-events-none" />

                        <div className="relative z-10">
                            {nextPayment ? (
                                <>
                                    <div className="flex items-start justify-between mb-8">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest mb-4">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                Next Invoice
                                            </div>
                                            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">
                                                {formatCurrency(nextPayment.amount)}
                                            </h2>
                                            <p className={cn(
                                                "text-sm font-bold mt-4 flex items-center gap-2 tracking-wide",
                                                isOverdue ? "text-red-400" : "text-white/60"
                                            )}>
                                                <Calendar className="w-4 h-4" />
                                                {isOverdue ? "Overdue Since" : "Due By"} {formatDate(nextPayment.due_date)}
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md shadow-2xl",
                                            isOverdue ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                        )}>
                                            <AlertCircle className="w-4 h-4" />
                                            {isOverdue ? "Past Due" : "Payment Pending"}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 mt-10">
                                        <Link href={`/tenant/payments/${nextPayment.id}/checkout`} className="flex-1 max-w-sm bg-primary hover:bg-white text-black font-black uppercase tracking-widest text-xs py-4 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center gap-3">
                                            <CreditCard className="w-4 h-4" />
                                            Settle Balance
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-3xl font-black text-white tracking-tight">All Caught Up!</h2>
                                    <p className="text-white/50 font-medium mt-2 max-w-sm mx-auto">
                                        You have no pending payments at the moment. Your account is in excellent standing.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Breakdown */}
                    {nextPayment && nextPayment.payment_items && nextPayment.payment_items.length > 0 && (
                        <div className="rounded-[2.5rem] border border-white/5 bg-[#111111]/80 p-8 backdrop-blur-3xl shadow-xl">
                            <h3 className="text-xl font-display text-white mb-8 flex items-center gap-3">
                                <FileText className="w-5 h-5 text-primary" /> 
                                Invoice Breakdown
                            </h3>
                            <div className="space-y-4">
                                {nextPayment.payment_items.map((item, idx) => (
                                    <div key={item.id || idx} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-white/60 border border-white/5">
                                                {item.category.toLowerCase().includes("water") || item.label.toLowerCase().includes("water") ? (
                                                    <Droplets className="w-5 h-5 text-blue-400" />
                                                ) : item.category.toLowerCase().includes("electric") || item.label.toLowerCase().includes("electric") ? (
                                                    <Zap className="w-5 h-5 text-yellow-400" />
                                                ) : (
                                                    <Home className="w-5 h-5 text-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{item.label}</p>
                                                <p className="text-[10px] font-black tracking-widest uppercase text-white/40 mt-1">{item.category}</p>
                                            </div>
                                        </div>
                                        <span className="font-black text-lg text-white tabular-nums tracking-tight">
                                            {formatCurrency(item.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-white/40">Total Amount</span>
                                <span className="text-2xl font-black text-white tabular-nums drop-shadow-md">
                                    {formatCurrency(nextPayment.amount)}
                                </span>
                            </div>
                        </div>
                    )}

                </div>

                {/* Sidebar (Right) */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Payment History */}
                    <div className="rounded-[2.5rem] border border-white/5 bg-[#111111]/80 backdrop-blur-3xl shadow-xl overflow-hidden p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-display text-white flex items-center gap-2">
                                <History className="w-4 h-4 text-primary" />
                                Ledger
                            </h3>
                            <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
                                View All
                            </button>
                        </div>

                        <div className="space-y-6">
                            {history.length === 0 ? (
                                <p className="text-xs font-bold uppercase tracking-widest text-white/30 text-center py-6">No previous transactions</p>
                            ) : (
                                history.map((item) => (
                                    <div key={item.id} className="group relative flex gap-4 cursor-pointer">
                                        <div className="h-10 w-10 shrink-0 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform shadow-sm">
                                            {getStatusIcon(item.status)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-bold text-sm text-white group-hover:text-primary transition-colors truncate pr-2">
                                                    {item.description || "Payment"}
                                                </p>
                                                <span className="font-black text-sm text-white tabular-nums tracking-tight">
                                                    {formatCurrency(item.amount)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
                                                {formatDate(item.paid_at || item.due_date)} • {item.method || "Cash"}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Auto-Pay Status */}
                    <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 to-primary/50" />
                        <div className="flex items-start gap-5">
                            <div className="p-3.5 rounded-2xl bg-white/10 text-white/60 group-hover:text-white transition-colors border border-white/10">
                                <RefreshCw className="w-5 h-5 pointer-events-none" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-sm text-white tracking-tight">Auto-Pay Disconnected</h3>
                                <p className="text-xs text-white/50 font-medium mt-1.5 leading-relaxed">
                                    Securely link a payment method to automatically handle incoming invoices.
                                </p>
                                <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-white border border-white/20 hover:bg-white hover:text-black py-2 px-4 rounded-xl transition-all">
                                    Configure Connection
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
