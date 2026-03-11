"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { DashboardBanner } from "@/components/landlord/dashboard/DashboardBanner";
import { QuickActions } from "@/components/landlord/dashboard/QuickActions";
import {
    Building2,
    CreditCard,
    ExternalLink as LinkIcon
} from "lucide-react";
import Link from "next/link";
import { PaymentModal } from "@/components/landlord/dashboard/PaymentModal";
import { ContactsSidebar } from "@/components/landlord/dashboard/ContactsSidebar";
import { RecentInquiries } from "@/components/landlord/dashboard/RecentInquiries";

export default function LandlordDashboard() {
    const [mounted, setMounted] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState<"Overdue" | "Near Due" | "Paid" | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex flex-col w-full bg-[#0a0a0a] text-white p-6 md:p-8 md:pr-24 space-y-8 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar">
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
                    {/* Overdue */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Overdue</h3>
                            </div>
                            <button onClick={() => setOpenPaymentModal("Overdue")} className="text-xs font-bold text-neutral-500 hover:text-white transition-colors">See All</button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <PaymentCard
                                tenant="Marcus Johnson"
                                unit="Unit 102"
                                amount={13000}
                                status="Overdue"
                                date="Feb 20, 2026"
                                avatar="https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=150&q=80"
                            />
                        </div>
                    </div>

                    {/* Near Due */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Near Due</h3>
                            </div>
                            <button onClick={() => setOpenPaymentModal("Near Due")} className="text-xs font-bold text-neutral-500 hover:text-white transition-colors">See All</button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <PaymentCard
                                tenant="Alex Reyes"
                                unit="Unit 201"
                                amount={15000}
                                status="Near Due"
                                date="Mar 5, 2026"
                                avatar="https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=150&q=80"
                            />
                        </div>
                    </div>

                    {/* Paid */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Paid</h3>
                            </div>
                            <button onClick={() => setOpenPaymentModal("Paid")} className="text-xs font-bold text-neutral-500 hover:text-white transition-colors">See All</button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <PaymentCard
                                tenant="Sarah Wilson"
                                unit="Studio A"
                                amount={12500}
                                status="Paid"
                                date="Feb 28, 2026"
                                avatar="https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=150&q=80"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Announcement Card */}
            <div className="p-6 rounded-3xl bg-neutral-800/50 border border-white/5 relative overflow-hidden group flex flex-col justify-between">
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-amber-500" />
                        <h3 className="font-bold text-white text-lg">System Advisory</h3>
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed font-medium">Maintenance scheduled for March 15th at 2:00 AM. Expect brief downtime.</p>
                    <button className="px-4 py-2 mt-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors border border-white/10">Read Details</button>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
                    <Building2 className="h-32 w-32" />
                </div>
            </div>

            <PaymentModal
                isOpen={openPaymentModal !== null}
                onClose={() => setOpenPaymentModal(null)}
                category={openPaymentModal}
            />
            <ContactsSidebar />
            <QuickActions />

            <div className="pt-2 w-full">
                <RecentInquiries />
            </div>
        </div>
    );
}



function PaymentCard({ tenant, unit, amount, status, date, avatar }: any) {
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
                    <img src={avatar} alt={tenant} className="w-12 h-12 rounded-full object-cover border-2 border-[#0a0a0a] group-hover:scale-105 transition-transform duration-300" />
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
