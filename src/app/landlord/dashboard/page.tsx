"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardBanner } from "@/components/landlord/dashboard/DashboardBanner";
import {
    CreditCard,
    AlertTriangle,
    QrCode,
    X,
    ExternalLink as LinkIcon,
    ArrowUpRight,
    CheckCircle2,
    Pencil,
    MessageSquare,
    FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { PaymentModal } from "@/components/landlord/dashboard/PaymentModal";
import { ActionRequired } from "@/components/landlord/dashboard/ActionRequired";
import { WalkInApplicationModal } from "@/components/landlord/applications/WalkInApplicationModal";
import { TenantInviteManager } from "@/components/landlord/applications/TenantInviteManager";
import { CommandCenter } from "@/components/landlord/dashboard/CommandCenter";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProperty } from "@/context/PropertyContext";

type PaymentCategory = "Overdue" | "Near Due" | "Paid";

type PaymentListItem = {
    id: string;
    tenant: string;
    unit: string;
    amount: number;
    status: PaymentCategory;
    date: string;
    avatar: string | null;
    avatarBgColor: string | null;
};

type SystemAdvisory = {
    id: string;
    title: string;
    message: string;
    createdAt: string;
};

const OPEN_UNIT_STATUSES = ["available", "vacant", "open", "listed"];
const INACTIVE_INVITE_STATUSES = ["expired", "revoked", "inactive", "disabled", "cancelled"];

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";

const PAYMENT_CATEGORIES: Array<{ key: PaymentCategory; label: string; hint: string; emptyState: string; tone: string; dot: string }> = [
    {
        key: "Overdue",
        label: "Past Due Rent",
        hint: "Unpaid after due date",
        emptyState: "No overdue rent",
        tone: "text-red-500",
        dot: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]",
    },
    {
        key: "Near Due",
        label: "Due in Next 7 Days",
        hint: "Pending invoices due soon",
        emptyState: "No rent due this week",
        tone: "text-amber-500",
        dot: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]",
    },
    {
        key: "Paid",
        label: "Recently Paid Rent",
        hint: "Latest confirmed payments",
        emptyState: "No recent payments",
        tone: "text-emerald-500",
        dot: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]",
    },
];

export default function LandlordDashboard() {
    const { selectedPropertyId } = useProperty();
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
    const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [availableUnits, setAvailableUnits] = useState<{
        id: string;
        name: string;
        rent_amount: number;
        property_id: string;
        property_name: string;
        status?: string;
    }[]>([]);
    const [tenantInvites, setTenantInvites] = useState<Array<{
        id: string;
        mode: "property" | "unit";
        applicationType: "online" | "face_to_face";
        requiredRequirements: string[];
        status: string;
        propertyId: string;
        propertyName: string;
        unitId: string | null;
        unitName: string | null;
        expiresAt: string | null;
        useCount: number;
        maxUses: number;
        lastUsedAt: string | null;
        createdAt: string;
        shareUrl: string;
        qrUrl: string;
    }>>([]);

    const filteredUnits = useMemo(() => {
        if (selectedPropertyId === "all") return availableUnits;
        return availableUnits.filter(u => u.property_id === selectedPropertyId);
    }, [availableUnits, selectedPropertyId]);

    const filteredInvites = useMemo(() => {
        if (selectedPropertyId === "all") return tenantInvites;
        return tenantInvites.filter(i => i.propertyId === selectedPropertyId);
    }, [tenantInvites, selectedPropertyId]);

    const overdueCount = paymentsByCategory.Overdue.length;
    const nearDueCount = paymentsByCategory["Near Due"].length;
    const openUnitsCount = filteredUnits.filter((unit) => {
        const normalizedStatus = (unit.status ?? "").toLowerCase();
        if (!normalizedStatus) return true;
        return OPEN_UNIT_STATUSES.some((status) => normalizedStatus.includes(status));
    }).length;
    const activeInviteCount = filteredInvites.filter((invite) => {
        const normalizedStatus = invite.status.toLowerCase();
        return !INACTIVE_INVITE_STATUSES.includes(normalizedStatus);
    }).length;

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadPayments = async () => {
            setPaymentsLoading(true);
            setPaymentsError(null);

            try {
                const response = await fetch(`/api/landlord/payments/overview?propertyId=${selectedPropertyId}`, {
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
    }, [selectedPropertyId]);

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
  
    useEffect(() => {
        const loadUnits = async () => {
            try {
                const res = await fetch("/api/landlord/listings");
                if (!res.ok) return;

                const data = (await res.json()) as {
                    options?: Array<{
                        id: string;
                        name: string;
                        units?: Array<{
                            id: string;
                            name: string;
                            status?: string;
                            rentAmount?: number;
                        }>;
                    }>;
                };

                const options = Array.isArray(data.options) ? data.options : [];
                const unitsList: typeof availableUnits = options.flatMap((property) => {
                    const units = Array.isArray(property.units) ? property.units : [];
                    return units.map((unit) => ({
                        id: unit.id,
                        name: unit.name,
                        rent_amount: Number(unit.rentAmount ?? 0),
                        property_id: property.id,
                        property_name: property.name,
                        status: unit.status,
                    }));
                });

                setAvailableUnits(unitsList);
            } catch { /* fail silently */ }
        };
        void loadUnits();
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadInvites = async () => {
            try {
                const response = await fetch("/api/landlord/invites", {
                    method: "GET",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    return;
                }

                const payload = (await response.json()) as {
                    invites?: typeof tenantInvites;
                };

                setTenantInvites(Array.isArray(payload.invites) ? payload.invites : []);
            } catch (error) {
                if ((error as Error).name === "AbortError") {
                    return;
                }

                setTenantInvites([]);
            }
        };

        void loadInvites();

        return () => {
            controller.abort();
        };
    }, []);

    const [selectedActionPayment, setSelectedActionPayment] = useState<PaymentListItem | null>(null);
    const [popoutPosition, setPopoutPosition] = useState<{ x: number; y: number } | null>(null);
    const [isConfirmingAction, setIsConfirmingAction] = useState(false);

    const popoutStyles = useMemo(() => {
        if (!popoutPosition) return { top: 0, left: 0 };
        const width = 400;
        const height = 500;
        const GAP = 15;
        let top = popoutPosition.y + GAP;
        let left = popoutPosition.x - (width / 2);

        if (typeof window !== 'undefined') {
            if (left + width > window.innerWidth) left = window.innerWidth - width - 20;
            if (left < 20) left = 20;
            if (top + height > window.innerHeight) top = popoutPosition.y - height - GAP;
            if (top < 20) top = 20;
        }
        return { top, left, width };
    }, [popoutPosition]);

    if (!mounted) return null;

    return (
        <>
            <div className="custom-scrollbar-premium flex h-full w-full flex-col gap-10 overflow-y-auto bg-background p-6 text-foreground animate-in fade-in slide-in-from-bottom-4 duration-1000 md:p-10">
                {/* Hero Section */}
                <DashboardBanner
                    onNewWalkIn={() => setIsWalkInModalOpen(true)}
                    onCreateInvite={() => setIsInviteModalOpen(true)}
                />

                {/* System Advisory - Premium Styling */}
                {systemAdvisory && (
                    <div className="group relative overflow-hidden rounded-[2rem] border border-amber-500/25 bg-amber-500/10 p-6 backdrop-blur-sm animate-in zoom-in-95 duration-500">
                        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-5">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/12 text-amber-400">
                                    <AlertTriangle className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-amber-300">{systemAdvisory.title}</h3>
                                    <p className="text-sm font-medium text-muted-foreground/80">{systemAdvisory.message}</p>
                                </div>
                            </div>
                            <div className="rounded-xl border border-amber-500/25 bg-amber-500/12 px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-300">
                                Global Alert
                            </div>
                        </div>
                        <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-[0.03] transition-transform duration-700 group-hover:scale-125">
                            <AlertTriangle className="h-40 w-40" />
                        </div>
                    </div>
                )}

                {/* Primary Hub */}
                <div className="relative">
                    <CommandCenter
                        overdueCount={overdueCount}
                        nearDueCount={nearDueCount}
                        vacantUnitsCount={openUnitsCount}
                        activeInviteCount={activeInviteCount}
                    />
                </div>

                {/* Payments Section */}
                <section className="relative z-0 h-auto w-full rounded-[2.5rem] border border-white/10 bg-card/60 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
                    <div className="mb-10 flex flex-wrap items-center justify-between gap-4 px-2">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-indigo-500/20 bg-indigo-500/12 text-indigo-300">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-foreground">Cash Flow Ledger</h2>
                                <p className="text-sm font-medium text-muted-foreground/80">Track what is overdue, due this week, and already paid.</p>
                            </div>
                        </div>
                        <Link href="/landlord/invoices" className="group shrink-0 flex items-center gap-2 rounded-xl border border-white/10 bg-card/70 px-4 py-2 text-xs font-black uppercase tracking-widest transition-all hover:bg-card">
                            View Invoices
                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                        {PAYMENT_CATEGORIES.map(({ key, label, hint, emptyState, dot, tone }) => {
                            const items = paymentsByCategory[key] ?? [];
                            const topItem = items[0] ?? null;

                            return (
                                <div key={key} className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between px-4">
                                        <div className="flex items-start gap-3">
                                            <div className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                                            <div className="space-y-1">
                                                <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", tone)}>{label}</h3>
                                                <p className="text-[10px] font-semibold text-muted-foreground/60">{hint}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setOpenPaymentModal(key)} 
                                            className="text-[10px] font-black text-muted-foreground/60 transition-colors hover:text-primary uppercase tracking-tighter"
                                        >
                                            See more
                                        </button>
                                    </div>
                                    
                                    <div className="flex min-h-[140px] flex-1 flex-col justify-center rounded-[1.75rem] border border-white/10 bg-card/70 p-4 transition-all hover:bg-card">
                                        {paymentsLoading ? (
                                            <div className="space-y-4 animate-pulse px-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-full bg-muted/40" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 w-3/4 rounded bg-muted/40" />
                                                        <div className="h-3 w-1/2 rounded bg-muted/40" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : paymentsError ? (
                                            <div className="p-4 text-center">
                                                <p className="text-xs text-red-500/80 font-bold">{paymentsError}</p>
                                            </div>
                                        ) : topItem ? (
                                            <PaymentCard
                                                payment={topItem}
                                                fallbackAvatar={FALLBACK_AVATAR}
                                                onClick={(e: React.MouseEvent) => {
                                                    setSelectedActionPayment(topItem);
                                                    setPopoutPosition({ x: e.clientX, y: e.clientY });
                                                }}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/40">
                                                <CheckCircle2 className="h-6 w-6 mb-2" />
                                                <p className="text-[9px] font-black uppercase tracking-widest">{emptyState}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Task Operations Queue */}
                <div className="w-full relative z-0 pt-6">
                    <ActionRequired />
                </div>
            </div>

            {/* Modals & Overlays */}
            <PaymentModal
                isOpen={openPaymentModal !== null}
                onClose={() => setOpenPaymentModal(null)}
                category={openPaymentModal}
                paymentsByCategory={paymentsByCategory}
            />

            <WalkInApplicationModal 
                isOpen={isWalkInModalOpen}
                onClose={() => setIsWalkInModalOpen(false)}
                units={filteredUnits}
                onSuccess={() => {}}
            />

            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close invite modal"
                        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                        onClick={() => setIsInviteModalOpen(false)}
                    />
                    <div className="relative z-10 max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-card shadow-[0_30px_60px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-card/95 px-8 py-6 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <QrCode className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground">Private Referral Link</h2>
                                    <p className="text-sm font-medium text-muted-foreground/80">Generate exclusive invitation tokens for new residents.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsInviteModalOpen(false)}
                                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-card/70 text-muted-foreground transition-all hover:bg-card hover:text-foreground hover:rotate-90 active:scale-95"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-8 max-h-[calc(90vh-120px)] overflow-y-auto custom-scrollbar-premium">
                            <TenantInviteManager
                                availableUnits={filteredUnits}
                                invites={filteredInvites}
                                onRefresh={async () => {
                                    try {
                                        const response = await fetch("/api/landlord/invites");
                                        if (!response.ok) return;
                                        const payload = (await response.json()) as { invites?: typeof tenantInvites };
                                        setTenantInvites(Array.isArray(payload.invites) ? payload.invites : []);
                                    } catch {}
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {selectedActionPayment && (
                    <div className="fixed inset-0 z-[150] pointer-events-none">
                        <button 
                            className="absolute inset-0 pointer-events-auto"
                            onClick={() => {
                                setSelectedActionPayment(null);
                                setIsConfirmingAction(false);
                            }}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            style={popoutStyles}
                            className={cn(
                                "pointer-events-auto absolute z-10 w-full max-w-[400px] overflow-hidden rounded-[2.5rem] border border-border bg-card/80 backdrop-blur-2xl transition-all duration-300",
                                "shadow-[0_8px_30px_rgb(0,0,0,0.04),0_20px_80px_rgba(0,0,0,0.08)]",
                                "dark:bg-neutral-900/90 dark:border-white/10 dark:shadow-[0_20px_50px_rgba(109,152,56,0.15)]"
                            )}
                        >
                            {!isConfirmingAction ? (
                                <>
                                    {/* Header Section */}
                                    <div className="p-8 pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-6">
                                                {/* Avatar with status indicator */}
                                                <div 
                                                    className="relative h-20 w-20 shrink-0 rounded-full flex items-center justify-center overflow-hidden shadow-sm"
                                                    style={{ backgroundColor: (selectedActionPayment as any).avatarBgColor || '#10b981' }}
                                                >
                                                    {selectedActionPayment.avatar ? (
                                                        <img 
                                                            src={selectedActionPayment.avatar} 
                                                            alt={selectedActionPayment.tenant} 
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl font-black text-white/90">{selectedActionPayment.tenant.charAt(0)}</span>
                                                    )}
                                                    <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-4 border-card bg-emerald-500 shadow-lg" />
                                                </div>

                                                <div className="min-w-0">
                                                    <h2 className="text-2xl font-normal tracking-tight text-foreground truncate mb-0.5">
                                                        {selectedActionPayment.tenant}
                                                    </h2>
                                                    <p className="text-base text-muted-foreground truncate uppercase tracking-widest font-bold">
                                                        {selectedActionPayment.unit}
                                                    </p>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => setSelectedActionPayment(null)}
                                                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* iReside Info Section */}
                                    <div className="px-8 pb-4 space-y-3">
                                        <div className="rounded-2xl bg-muted/30 p-4 border border-border/50">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Settlement Due</p>
                                                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">Overdue</span>
                                            </div>
                                            <h4 className="text-3xl font-black text-foreground">PHP {selectedActionPayment.amount.toLocaleString()}</h4>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-2xl bg-muted/20 p-4 border border-border/30">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Lease Ends</p>
                                                <p className="text-xs font-bold text-foreground">Oct 2026</p>
                                            </div>
                                            <div className="rounded-2xl bg-muted/20 p-4 border border-border/30">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Tenant Status</p>
                                                <p className="text-xs font-bold text-emerald-500">Good Standing</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div className="px-8 pb-6 flex items-center gap-3">
                                        <Link 
                                            href="/landlord/messages"
                                            className="flex-1 flex items-center justify-center gap-3 rounded-full bg-[#D7EFFF] dark:bg-blue-500/20 py-4 px-6 text-base font-medium text-[#001D35] dark:text-blue-100 transition-all hover:bg-[#c3e6ff] active:scale-[0.98]"
                                        >
                                            <MessageSquare className="h-5 w-5" />
                                            Message
                                        </Link>
                                        
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setIsConfirmingAction(true)}
                                                className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 transition-all hover:bg-emerald-500/10 active:scale-[0.92]"
                                                title="Acknowledge Payment"
                                            >
                                                <CheckCircle2 className="h-6 w-6" />
                                            </button>
                                            <button className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.92]">
                                                <FolderOpen className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Footer Button */}
                                    <div className="px-6 pb-6">
                                        <button 
                                            onClick={() => setSelectedActionPayment(null)}
                                            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#f0f4f9] dark:bg-neutral-800 px-6 py-4 text-base font-medium text-blue-700 dark:text-blue-400 transition-all hover:bg-[#e1e9f1] dark:hover:bg-neutral-700 group"
                                        >
                                            Open Full Profile
                                            <ArrowUpRight className="h-5 w-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 text-center animate-in slide-in-from-right-4 duration-300">
                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                                        <AlertTriangle className="h-10 w-10" />
                                    </div>
                                    <h3 className="text-xl font-black text-foreground">Confirm Settlement</h3>
                                    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                                        <p className="text-xs font-bold leading-relaxed text-primary/80">
                                            Make sure that the tenant has already paid their rent. Seek proof of payment for GCash payments.
                                        </p>
                                    </div>

                                    <div className="mt-8 flex flex-col gap-3">
                                        <button 
                                            onClick={() => {
                                                setSelectedActionPayment(null);
                                                setIsConfirmingAction(false);
                                            }}
                                            className="w-full rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                                        >
                                            I Confirm Payment
                                        </button>
                                        <button 
                                            onClick={() => setIsConfirmingAction(false)}
                                            className="w-full rounded-2xl border border-white/10 bg-card/70 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 transition-all hover:bg-card hover:text-foreground"
                                        >
                                            Go Back
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

function PaymentCard({ payment, fallbackAvatar, onClick }: { payment: PaymentListItem; fallbackAvatar: string; onClick?: (e: React.MouseEvent) => void }) {
    const { tenant, unit, amount, status, date, avatar } = payment;
    const isPaid = status === 'Paid';
    const isNearDue = status === 'Near Due';

    return (
        <div 
            onClick={onClick}
            className="group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-4 transition-all hover:bg-card hover:ring-1 hover:ring-primary/20 active:scale-[0.98]"
        >
            <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                    <div 
                        className="h-12 w-12 rounded-full border-2 border-background overflow-hidden grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-110"
                        style={{ backgroundColor: (payment as any).avatarBgColor || '#171717' }}
                    >
                        <img src={avatar || fallbackAvatar} alt={tenant} className="h-full w-full object-cover" />
                    </div>
                    <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background",
                        isPaid ? "bg-emerald-500" : isNearDue ? "bg-amber-500" : "bg-red-500"
                    )} />
                </div>
                <div className="min-w-0 max-w-[120px] sm:max-w-[160px]">
                    <h4 className="truncate text-sm font-black text-foreground group-hover:text-primary transition-colors">{tenant}</h4>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">{unit}</p>
                </div>
            </div>

            <div className="text-right relative z-10 flex flex-col items-end">
                <h4 className="mb-0.5 text-sm font-black text-foreground">PHP {amount.toLocaleString()}</h4>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{date}</span>
                </div>
            </div>

            {/* Clickable indicator overlay */}
            <div className="absolute inset-0 bg-primary/0 transition-colors group-hover:bg-primary/[0.02] pointer-events-none" />
        </div>
    );
}
