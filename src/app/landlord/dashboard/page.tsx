"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { DashboardBanner } from "@/components/landlord/dashboard/DashboardBanner";
import { QuickActions } from "@/components/landlord/dashboard/QuickActions";
import {
    CreditCard,
    AlertTriangle,
    ExternalLink as LinkIcon
} from "lucide-react";
import Link from "next/link";
import { PaymentModal } from "@/components/landlord/dashboard/PaymentModal";
import { RecentInquiries } from "@/components/landlord/dashboard/RecentInquiries";

type PaymentCategory = "Overdue" | "Near Due" | "Paid";

type PaymentListItem = {
    id: string;
    tenant: string;
    unit: string;
    amount: number;
    status: PaymentCategory;
    date: string;
    avatar: string | null;
};

type SystemAdvisory = {
    id: string;
    title: string;
    message: string;
    createdAt: string;
};

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";

const PAYMENT_CATEGORIES: Array<{ key: PaymentCategory; dotClass: string }> = [
    { key: "Overdue", dotClass: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" },
    { key: "Near Due", dotClass: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" },
    { key: "Paid", dotClass: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" },
];

export default function LandlordDashboard() {
    const [mounted, setMounted] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState<"Overdue" | "Near Due" | "Paid" | null>(null);
    const [paymentsByCategory, setPaymentsByCategory] = useState<Record<PaymentCategory, PaymentListItem[]>>({
        Overdue: [],
        "Near Due": [],
        Paid: [],
    });
    const [paymentsLoading, setPaymentsLoading] = useState(true);
    const [paymentsError, setPaymentsError] = useState<string | null>(null);
    const [systemAdvisory, setSystemAdvisory] = useState<SystemAdvisory | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadPayments = async () => {
            setPaymentsLoading(true);
            setPaymentsError(null);

            try {
                const response = await fetch("/api/landlord/payments/overview", {
                    method: "GET",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to load payment overview");
                }

                const payload = (await response.json()) as {
                    payments?: Record<PaymentCategory, PaymentListItem[]>;
                };

                setPaymentsByCategory({
                    Overdue: payload.payments?.Overdue ?? [],
                    "Near Due": payload.payments?.["Near Due"] ?? [],
                    Paid: payload.payments?.Paid ?? [],
                });
            } catch (error) {
                if ((error as Error).name === "AbortError") {
                    return;
                }

                setPaymentsError("Unable to load payments right now.");
            } finally {
                setPaymentsLoading(false);
            }
        };

        void loadPayments();

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadSystemAdvisory = async () => {
            try {
                const response = await fetch("/api/landlord/system-advisory", {
                    method: "GET",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    setSystemAdvisory(null);
                    return;
                }

                const payload = (await response.json()) as { advisory?: SystemAdvisory | null };
                setSystemAdvisory(payload.advisory ?? null);
            } catch (error) {
                if ((error as Error).name === "AbortError") {
                    return;
                }

                setSystemAdvisory(null);
            }
        };

        void loadSystemAdvisory();

        return () => {
            controller.abort();
        };
    }, []);

    if (!mounted) return null;

    return (
        <>
            <div className="flex flex-col w-full bg-[#0a0a0a] text-white p-6 md:p-8 space-y-8 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar">
                <DashboardBanner />

            {/* Payment Overview */}
            <div className="p-6 rounded-3xl bg-neutral-900 border border-white/5 space-y-4 pt-6">
                <div className="flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold text-white">Payment Overview</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
                    {PAYMENT_CATEGORIES.map(({ key, dotClass }) => {
                        const items = paymentsByCategory[key] ?? [];
                        const topItem = items[0] ?? null;

                        return (
                            <div key={key} className="space-y-3">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("h-2 w-2 rounded-full", dotClass)} />
                                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">{key}</h3>
                                    </div>
                                    <button onClick={() => setOpenPaymentModal(key)} className="text-xs font-bold text-neutral-500 hover:text-white transition-colors">See All</button>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {paymentsLoading ? (
                                        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                            <p className="text-xs text-neutral-500">Loading payments...</p>
                                        </div>
                                    ) : paymentsError ? (
                                        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                                            <p className="text-xs text-red-300">{paymentsError}</p>
                                        </div>
                                    ) : topItem ? (
                                        <PaymentCard
                                            payment={topItem}
                                            fallbackAvatar={FALLBACK_AVATAR}
                                        />
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4">
                                            <p className="text-sm text-neutral-300">No {key.toLowerCase()} payments.</p>
                                            <p className="text-xs text-neutral-500 mt-1">New records will appear here once available.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {systemAdvisory && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 rounded-3xl bg-amber-500/10 border border-amber-500/20 relative overflow-hidden group gap-6 min-h-[140px]">
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="p-4 bg-amber-500/20 rounded-2xl">
                            <AlertTriangle className="h-8 w-8 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg sm:text-xl">{systemAdvisory.title}</h3>
                            <p className="text-sm sm:text-base text-neutral-300 font-medium mt-1">{systemAdvisory.message}</p>
                        </div>
                    </div>
                    <div className="relative z-10 px-6 py-3 rounded-xl bg-amber-500 text-neutral-950 font-bold text-sm sm:text-base w-full sm:w-auto text-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        Advisory Active
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none transition-transform duration-500 group-hover:scale-110">
                        <AlertTriangle className="h-48 w-48 translate-x-1/4" />
                    </div>
                </div>
            )}

                <PaymentModal
                    isOpen={openPaymentModal !== null}
                    onClose={() => setOpenPaymentModal(null)}
                    category={openPaymentModal}
                    paymentsByCategory={paymentsByCategory}
                />
                <QuickActions />

                <div className="pt-2 w-full">
                    <RecentInquiries />
                </div>
            </div>
        </>
    );
}



function PaymentCard({ payment, fallbackAvatar }: { payment: PaymentListItem; fallbackAvatar: string }) {
    const { tenant, unit, amount, status, date, avatar } = payment;
    const isPaid = status === 'Paid';
    const isNearDue = status === 'Near Due';
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleConfirm = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsConfirmed(true);
        // In a real app, this would trigger the invoice generation and chat message
        // For the demo, we'll just show the confirmed state
    };

    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-transparent hover:border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                    <img src={avatar || fallbackAvatar} alt={tenant} className="w-12 h-12 rounded-full object-cover border-2 border-[#0a0a0a] group-hover:scale-105 transition-transform duration-300" />
                    <div className={cn(
                        "absolute -bottom-0 -right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0a]",
                        isConfirmed || isPaid ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : isNearDue ? "bg-amber-500" : "bg-red-500"
                    )} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{tenant}</h4>
                    <p className="text-xs text-neutral-400 font-medium">{unit}</p>
                </div>
            </div>

            <div className="text-right relative z-10 flex flex-col items-end">
                <h4 className="text-sm font-bold text-white mb-0.5 group-hover:opacity-0 transition-opacity">₱{amount.toLocaleString()}</h4>
                <div className="flex items-center justify-end gap-1.5 mt-1 group-hover:opacity-0 transition-opacity">
                    <span className={cn(
                        "text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border",
                        isConfirmed || isPaid ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                            isNearDue ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                                "text-red-400 bg-red-500/10 border-red-500/20"
                    )}>
                        {isConfirmed ? "Paid" : status}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-medium">{date}</span>
                </div>

                {/* Hover Confirm Button */}
                {!isPaid && !isConfirmed && (
                    <button
                        onClick={handleConfirm}
                        className="absolute inset-y-0 right-0 opacity-0 group-hover:opacity-100 flex items-center gap-2 bg-primary text-black px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all translate-x-4 group-hover:translate-x-0 active:scale-95 whitespace-nowrap"
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        Confirm Payment
                    </button>
                )}

                {/* Confirmed Feedback */}
                {isConfirmed && (
                    <div className="absolute inset-y-0 right-0 flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-right-2 duration-300 pointer-events-none">
                        <Link href="/landlord/messages" className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl hover:bg-emerald-500/20 transition-colors pointer-events-auto">
                            Invoice Generated
                            <LinkIcon className="w-3 h-3" />
                        </Link>
                    </div>
                )}
            </div>

            {/* Success background flash */}
            {isConfirmed && (
                <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />
            )}
        </div>
    );
}
