"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo, useReducer } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { DashboardBanner } from "@/components/landlord/dashboard/DashboardBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProperty } from "@/context/PropertyContext";
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
    RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { PaymentModal } from "@/components/landlord/dashboard/PaymentModal";
import { ActionRequired } from "@/components/landlord/dashboard/ActionRequired";
import { WalkInApplicationModal } from "@/components/landlord/applications/WalkInApplicationModal";
import { TenantInviteManager } from "@/components/landlord/applications/TenantInviteManager";
import { CommandCenter } from "@/components/landlord/dashboard/CommandCenter";
import { LandlordWelcomeLightbox } from "@/components/landlord/dashboard/LandlordWelcomeLightbox";
import { MobileMessagesSheet } from "@/components/landlord/dashboard/MobileMessagesSheet";

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

// --- Payments Loading Reducer ---
type PaymentsState = {
    paymentsByCategory: Record<PaymentCategory, PaymentListItem[]>;
    loading: boolean;
    error: string | null;
};

type PaymentsAction =
    | { type: "LOAD_START" }
    | { type: "LOAD_SUCCESS"; payload: Record<PaymentCategory, PaymentListItem[]> }
    | { type: "LOAD_ERROR"; error: string }
    | { type: "RESET" };

function paymentsReducer(state: PaymentsState, action: PaymentsAction): PaymentsState {
    switch (action.type) {
        case "LOAD_START":
            return { ...state, loading: true, error: null };
        case "LOAD_SUCCESS":
            return { ...state, loading: false, error: null, paymentsByCategory: action.payload };
        case "LOAD_ERROR":
            return { ...state, loading: false, error: action.error };
        case "RESET":
            return { ...state, paymentsByCategory: { Overdue: [], "Near Due": [], Paid: [] }, loading: false, error: null };
        default:
            return state;
    }
}

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
    const [paymentsState, dispatchPayments] = useReducer(paymentsReducer, {
        paymentsByCategory: { Overdue: [], "Near Due": [], Paid: [] },
        loading: true,
        error: null,
    });

    const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [loadingUnits, setLoadingUnits] = useState(true);
    const [loadingInvites, setLoadingInvites] = useState(true);
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

    const overdueCount = paymentsState.paymentsByCategory.Overdue.length;
    const nearDueCount = paymentsState.paymentsByCategory["Near Due"].length;
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

    // Operational Power Tool Keyboard Accelerators
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedActionPayment(null);
                setIsConfirmingAction(false);
                setOpenPaymentModal(null);
                setIsWalkInModalOpen(false);
                setIsInviteModalOpen(false);
            }
            // Ctrl+K/Cmd+K triggers Walk-in Application modal instantly
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setIsWalkInModalOpen(prev => !prev);
            }
            // Ctrl+I/Cmd+I triggers Tenant Referral Link manager modal
            if ((e.ctrlKey || e.metaKey) && e.key === "i") {
                e.preventDefault();
                setIsInviteModalOpen(prev => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadPayments = async () => {
            dispatchPayments({ type: "LOAD_START" });

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

                dispatchPayments({
                    type: "LOAD_SUCCESS",
                    payload: {
                        Overdue: payload.payments?.Overdue ?? [],
                        "Near Due": payload.payments?.["Near Due"] ?? [],
                        Paid: payload.payments?.Paid ?? [],
                    },
                });
            } catch (error) {
                if ((error as Error).name === "AbortError") {
                    return;
                }

                dispatchPayments({ type: "LOAD_ERROR", error: "Unable to load payments right now." });
            }
        };

        void loadPayments();

        return () => {
            controller.abort();
        };
    }, [selectedPropertyId]);


    const [systemAdvisory, setSystemAdvisory] = useState<SystemAdvisory | null>(null);

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
            setLoadingUnits(true);
            try {
                const res = await fetch("/api/landlord/property-units");
                if (!res.ok) return;

                const data = (await res.json()) as {
                    properties?: Array<{
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

                const options = Array.isArray(data.properties) ? data.properties : [];
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
            } catch { /* fail silently */ } finally {
                setLoadingUnits(false);
            }
        };
        void loadUnits();
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadInvites = async () => {
            setLoadingInvites(true);
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
            } finally {
                setLoadingInvites(false);
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
            <MobileMessagesSheet />
            <div className="custom-scrollbar-premium flex h-full w-full flex-col gap-10 overflow-y-auto bg-background p-4 sm:p-6 text-foreground animate-in fade-in slide-in-from-bottom-4 duration-1000 md:p-10">
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
                                <div className="flex size-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/12 text-amber-400">
                                    <AlertTriangle className="size-7" />
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
                            <AlertTriangle className="size-40" />
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
                        loadingPayments={paymentsState.loading}
                        loadingUnits={loadingUnits}
                        loadingInvites={loadingInvites}
                    />
                </div>

                {/* Payments Section */}
                <section className="relative z-0 h-auto w-full rounded-[2.5rem] p-4 sm:p-6 md:p-8 neumorphic-panel focus-within:ring-2 focus-within:ring-primary/20 transition-all outline-none" tabIndex={-1} aria-labelledby="cash-flow-heading">
                    <div className="mb-10 flex flex-wrap items-center justify-between gap-4 px-2">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex size-14 items-center justify-center rounded-[1.25rem] neumorphic-inset-card text-primary shrink-0 transition-transform hover:scale-105">
                                <CreditCard className="size-6" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 id="cash-flow-heading" className="text-2xl font-black tracking-tight text-foreground">Cash Flow Ledger</h2>
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground/80 mt-1">Track what is overdue, due this week, and already paid.</p>
                            </div>
                        </div>
                        <Link 
                            href="/landlord/invoices" 
                            className="group shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold neumorphic-extruded active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all text-muted-foreground hover:text-primary"
                            aria-label="View all invoices in the financial hub"
                        >
                            View Invoices
                            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 relative z-10" role="list" aria-label="Payment categories">
                        {PAYMENT_CATEGORIES.map(({ key, label, hint, emptyState, dot, tone }) => {
                            const items = paymentsState.paymentsByCategory[key] ?? [];
                            const topItem = items[0] ?? null;

                            return (
                                <div key={key} className="flex flex-col gap-4" role="listitem">
                                    <div className="flex items-center justify-between px-2 sm:px-4">
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <div className={cn("size-2 rounded-full mt-1.5 sm:mt-1 shadow-inner", dot)} aria-hidden="true" />
                                            <div className="space-y-0.5">
                                                <h3 className={cn("text-xs sm:text-sm font-bold tracking-wide", tone)}>{label}</h3>
                                                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">{hint}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setOpenPaymentModal(key)} 
                                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-primary neumorphic-extruded active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                                            aria-label={`See more details for ${label}`}
                                        >
                                            See more
                                        </button>
                                    </div>
                                    
                                    <div className="flex min-h-[130px] sm:min-h-[140px] flex-1 flex-col justify-center rounded-[1.75rem] p-3 sm:p-4 neumorphic-inset transition-colors duration-300 focus-within:bg-background/40">
                                        {paymentsState.loading ? (
                                            <div className="space-y-4 animate-pulse px-2" aria-busy="true" aria-label="Loading latest payments">
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <div className="size-10 sm:size-12 rounded-full neumorphic-inset" />
                                                    <div className="flex-1 space-y-3">
                                                        <div className="h-3 sm:h-4 w-3/4 rounded-lg neumorphic-inset" />
                                                        <div className="h-2 sm:h-3 w-1/2 rounded-lg neumorphic-inset" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : paymentsState.error ? (
                                            <div className="p-3 sm:p-4 text-center rounded-2xl border border-red-500/20 bg-red-500/5">
                                                <AlertTriangle className="size-5 mx-auto mb-2 text-red-500/70" aria-hidden="true" />
                                                <p className="text-[10px] sm:text-xs text-red-500/80 font-black" role="alert">{paymentsState.error}</p>
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
                                            <div className="flex flex-col items-center justify-center py-5 sm:py-6 text-muted-foreground/50 transition-transform hover:scale-105 duration-300">
                                                <CheckCircle2 className="size-5 sm:size-6 mb-2 opacity-50" aria-hidden="true" />
                                                <p className="text-xs font-semibold tracking-wide text-muted-foreground">{emptyState}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Lease Renewals Section */}
                <section className="relative z-0 h-auto w-full rounded-[2.5rem] p-4 sm:p-6 md:p-8 neumorphic-panel outline-none focus-within:ring-2 focus-within:ring-primary/20 transition-all" tabIndex={-1} aria-labelledby="renewals-heading">
                    <div className="flex flex-wrap items-center justify-between gap-4 px-2">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex size-14 items-center justify-center rounded-[1.25rem] neumorphic-inset-card text-primary shrink-0 transition-transform hover:scale-105">
                                <RefreshCw className="size-6" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 id="renewals-heading" className="text-2xl font-black tracking-tight text-foreground">Lease Renewals</h2>
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground/80 mt-1">Review and manage tenant renewal requests.</p>
                            </div>
                        </div>
                        <Link 
                            href="/landlord/tenants?tab=renewals" 
                            className="group shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold neumorphic-extruded active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all text-muted-foreground hover:text-primary"
                            aria-label="View all lease renewals"
                        >
                            View All
                            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                        </Link>
                    </div>
                </section>

                {/* Task Operations Queue */}
                <div className="w-full relative z-0 pt-6">
                    <ActionRequired />
                </div>
            </div>

            {/* Welcome Lightbox on First Visit */}
            <LandlordWelcomeLightbox />

            {/* Modals & Overlays */}
            <PaymentModal
                isOpen={openPaymentModal !== null}
                onClose={() => setOpenPaymentModal(null)}
                category={openPaymentModal}
                paymentsByCategory={paymentsState.paymentsByCategory}
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
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <QrCode className="size-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground">Private Referral Link</h2>
                                    <p className="text-sm font-medium text-muted-foreground/80">Generate exclusive invitation tokens for new residents.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsInviteModalOpen(false)}
                                className="group flex size-10 items-center justify-center rounded-xl border border-white/10 bg-card/70 text-muted-foreground transition-all hover:bg-card hover:text-foreground hover:rotate-90 active:scale-95"
                            >
                                <X className="size-5" />
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
                                                    className="relative size-20 shrink-0 rounded-full flex items-center justify-center overflow-hidden shadow-sm"
                                                    style={{ backgroundColor: (selectedActionPayment as any).avatarBgColor || '#8B5CF6' }}
                                                >
                                                    {selectedActionPayment.avatar ? (
                                                        <Image
                                                            src={selectedActionPayment.avatar}
                                                            alt={selectedActionPayment.tenant}
                                                            fill
                                                            sizes="80px"
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl font-black text-white/90">{selectedActionPayment.tenant.charAt(0)}</span>
                                                    )}
                                                    <div className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full border-4 border-card bg-emerald-500 shadow-lg" />
                                                </div>

                                                <div className="min-w-0">
                                                    <h2 className="text-2xl font-normal tracking-tight text-foreground truncate mb-0.5">
                                                        {selectedActionPayment.tenant}
                                                    </h2>
                                                    <p className="text-base text-muted-foreground truncate uppercase tracking-widest font-black">
                                                        {selectedActionPayment.unit}
                                                    </p>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => setSelectedActionPayment(null)}
                                                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
                                            >
                                                <X className="size-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* iReside Info Section */}
                                    <div className="px-8 pb-4 space-y-3">
                                        <div className="rounded-2xl bg-muted/30 p-4 border border-border/50">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Settlement Due</p>
                                                <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">Overdue</span>
                                            </div>
                                            <h4 className="text-3xl font-black text-foreground">PHP {selectedActionPayment.amount.toLocaleString()}</h4>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-2xl bg-muted/20 p-4 border border-border/30">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Lease Ends</p>
                                                <p className="text-xs font-black text-foreground">Oct 2026</p>
                                            </div>
                                            <div className="rounded-2xl bg-muted/20 p-4 border border-border/30">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Tenant Status</p>
                                                <p className="text-xs font-black text-emerald-500">Good Standing</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div className="px-8 pb-6 flex items-center gap-3">
                                        <Link 
                                            href="/landlord/messages"
                                            className="flex-1 flex items-center justify-center gap-3 rounded-full bg-[#D7EFFF] dark:bg-blue-500/20 py-4 px-6 text-base font-medium text-[#001D35] dark:text-blue-100 transition-all hover:bg-[#c3e6ff] active:scale-[0.98]"
                                        >
                                            <MessageSquare className="size-5" />
                                            Message
                                        </Link>
                                        
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setIsConfirmingAction(true)}
                                                className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 transition-all hover:bg-emerald-500/10 active:scale-[0.92]"
                                                title="Acknowledge Payment"
                                            >
                                                <CheckCircle2 className="size-6" />
                                            </button>
                                            <button className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.92]">
                                                <FolderOpen className="size-5" />
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
                                            <ArrowUpRight className="size-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 text-center animate-in slide-in-from-right-4 duration-300">
                                    <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                                        <AlertTriangle className="size-10" />
                                    </div>
                                    <h3 className="text-xl font-black text-foreground">Confirm Settlement</h3>
                                    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                                        <p className="text-xs font-black leading-relaxed text-primary/80">
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
                                            Complete Settlement
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
        <button 
            type="button"
            onClick={onClick}
            aria-label={`View payment details for ${tenant}, Unit ${unit}. Amount: PHP ${amount}.`}
            className="group relative flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-2xl p-4 neumorphic-extruded active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all text-left"
        >
            <div className="flex items-center gap-4 relative z-10 w-full">
                <div className="relative shrink-0">
                    <div
                        className="relative size-12 rounded-full border-2 border-background/50 overflow-hidden transition-all duration-500 group-hover:scale-110 shadow-sm"
                        style={{ backgroundColor: (payment as any).avatarBgColor || '#171717' }}
                    >
                        <Image src={avatar || fallbackAvatar} alt="" fill sizes="48px" className="object-cover" aria-hidden="true" />
                    </div>
                    <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-background",
                        isPaid ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : isNearDue ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    )} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-black text-foreground group-hover:text-primary transition-colors">{tenant}</h4>
                    <p className="text-xs font-semibold text-muted-foreground">Unit {unit}</p>
                </div>
            </div>

            <div className="text-right relative z-10 flex flex-col items-end shrink-0 pl-4">
                <h4 className="mb-0.5 text-sm font-black text-foreground">PHP {amount.toLocaleString()}</h4>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                    <span className="text-xs font-semibold text-muted-foreground">{date}</span>
                </div>
            </div>

            {/* Clickable indicator overlay */}
            <div className="absolute inset-0 bg-primary/0 transition-colors group-hover:bg-primary/[0.03] group-focus-visible:bg-primary/[0.03] pointer-events-none" aria-hidden="true" />
        </button>
    );
}
