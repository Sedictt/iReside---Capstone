"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { DashboardBanner } from "@/components/landlord/dashboard/DashboardBanner";
import {
    CreditCard,
    AlertTriangle,
    QrCode,
    X,
    ExternalLink as LinkIcon
} from "lucide-react";
import Link from "next/link";
import { PaymentModal } from "@/components/landlord/dashboard/PaymentModal";
import { ActionRequired } from "@/components/landlord/dashboard/ActionRequired";
import { WalkInApplicationModal } from "@/components/landlord/applications/WalkInApplicationModal";
import { TenantInviteManager } from "@/components/landlord/applications/TenantInviteManager";

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

    if (!mounted) return null;

    return (
        <>
            <div className="custom-scrollbar flex h-full w-full flex-col space-y-8 overflow-y-auto bg-background p-6 text-foreground animate-in fade-in duration-700 md:p-8">
                <DashboardBanner
                    onNewWalkIn={() => setIsWalkInModalOpen(true)}
                    onCreateInvite={() => setIsInviteModalOpen(true)}
                />

            {/* Payment Overview */}
            <div className="space-y-4 rounded-3xl border border-border bg-card p-6 pt-6 shadow-sm">
                <div className="flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold text-foreground">Payment Overview</h2>
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
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{key}</h3>
                                    </div>
                                    <button onClick={() => setOpenPaymentModal(key)} className="text-xs font-bold text-muted-foreground transition-colors hover:text-foreground">See All</button>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {paymentsLoading ? (
                                        <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-border bg-muted/40 p-4 animate-pulse">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-muted" />
                                                <div className="space-y-2">
                                                    <div className="h-4 w-24 rounded bg-muted" />
                                                    <div className="h-3 w-16 rounded bg-muted" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end justify-center gap-2">
                                                <div className="h-4 w-16 rounded bg-muted" />
                                                <div className="flex gap-1.5 mt-1">
                                                    <div className="h-4 w-12 rounded-full bg-muted" />
                                                    <div className="h-4 w-10 rounded bg-muted" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : paymentsError ? (
                                        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                                            <p className="text-xs text-red-600 dark:text-red-300">{paymentsError}</p>
                                        </div>
                                    ) : topItem ? (
                                        <PaymentCard
                                            payment={topItem}
                                            fallbackAvatar={FALLBACK_AVATAR}
                                        />
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4">
                                            <p className="text-sm text-foreground">No {key.toLowerCase()} payments.</p>
                                            <p className="mt-1 text-xs text-muted-foreground">New records will appear here once available.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {systemAdvisory && (
                <div className="group relative flex min-h-[140px] flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-amber-500/20 bg-amber-50 p-6 sm:flex-row sm:items-center sm:p-8 dark:bg-amber-500/10">
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="rounded-2xl bg-amber-500/20 p-4">
                            <AlertTriangle className="h-8 w-8 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-amber-950 sm:text-xl dark:text-white">{systemAdvisory.title}</h3>
                            <p className="mt-1 text-sm font-medium text-amber-900/80 sm:text-base dark:text-neutral-300">{systemAdvisory.message}</p>
                        </div>
                    </div>
                    <div className="relative z-10 w-full shrink-0 rounded-xl bg-amber-500 px-6 py-3 text-center text-sm font-bold text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.2)] sm:w-auto sm:text-base">
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

                <div className="pt-2 w-full">
                    <ActionRequired />
                </div>
            </div>

            <WalkInApplicationModal 
                isOpen={isWalkInModalOpen}
                onClose={() => setIsWalkInModalOpen(false)}
                units={availableUnits}
                onSuccess={() => {
                    // Could trigger a toast or refresh here if needed
                }}
            />

            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close invite modal"
                        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
                        onClick={() => setIsInviteModalOpen(false)}
                    />
                    <div className="relative z-10 max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-border bg-background shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-6 py-5 backdrop-blur">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <QrCode className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-foreground">Create private tenant invite</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Generate a shareable link or QR code without leaving the dashboard.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsInviteModalOpen(false)}
                                className="rounded-xl border border-border bg-background p-2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-6">
                            <TenantInviteManager
                                availableUnits={availableUnits}
                                invites={tenantInvites}
                                onRefresh={async () => {
                                    try {
                                        const response = await fetch("/api/landlord/invites");
                                        if (!response.ok) {
                                            return;
                                        }

                                        const payload = (await response.json()) as {
                                            invites?: typeof tenantInvites;
                                        };

                                        setTenantInvites(Array.isArray(payload.invites) ? payload.invites : []);
                                    } catch {
                                        // Silently fail
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
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
        <div className="group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl border border-transparent bg-muted/20 p-4 transition-all hover:border-border hover:bg-muted/50 dark:bg-white/[0.02] dark:hover:border-white/5 dark:hover:bg-white/[0.04]">
            <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                    <img src={avatar || fallbackAvatar} alt={tenant} className="h-12 w-12 rounded-full border-2 border-background object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className={cn(
                        "absolute -bottom-0 -right-0 h-3.5 w-3.5 rounded-full border-2 border-background",
                        isConfirmed || isPaid ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : isNearDue ? "bg-amber-500" : "bg-red-500"
                    )} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">{tenant}</h4>
                    <p className="text-xs font-medium text-muted-foreground">{unit}</p>
                </div>
            </div>

            <div className="text-right relative z-10 flex flex-col items-end">
                <h4 className="mb-0.5 text-sm font-bold text-foreground transition-opacity group-hover:opacity-0">₱{amount.toLocaleString()}</h4>
                <div className="flex items-center justify-end gap-1.5 mt-1 group-hover:opacity-0 transition-opacity">
                    <span className={cn(
                        "text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border",
                        isConfirmed || isPaid ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                            isNearDue ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                                "text-red-400 bg-red-500/10 border-red-500/20"
                    )}>
                        {isConfirmed ? "Paid" : status}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground">{date}</span>
                </div>

                {/* Hover Confirm Button */}
                {!isPaid && !isConfirmed && (
                    <button
                        onClick={handleConfirm}
                        className="absolute inset-y-0 right-0 flex translate-x-4 items-center gap-2 rounded-xl bg-primary px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter text-primary-foreground opacity-0 transition-all whitespace-nowrap group-hover:translate-x-0 group-hover:opacity-100 active:scale-95"
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
