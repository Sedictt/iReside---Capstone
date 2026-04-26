"use client";

import {
    Calendar,
    CreditCard,
    FileText,
    ArrowUpRight,
    Megaphone,
    Clock,
    Wrench,
    MessageSquare,
    MoreHorizontal,
    X,
    ChevronRight,
    Mail,
    Home,
    Zap,
    Droplets,
    Sparkles,
    AlertCircle,
    ArrowRight,
    Phone,
    CheckCircle2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LeaseModal from "@/components/tenant/LeaseModal";
import { TenantContactsSidebar } from "@/components/tenant/TenantContactsSidebar";
import MoveOutRequest from "@/components/tenant/MoveOutRequest";
import { DashboardTour } from "@/components/tenant/DashboardTour";

type DashboardData = {
    lease: {
        id: string;
        status: string;
        startDate: string;
        endDate: string;
        monthlyRent: number;
        securityDeposit: number;
        unitName: string | null;
        propertyName: string | null;
        propertyAddress: string | null;
        propertyCity: string | null;
        landlordName: string | null;
        landlordEmail: string | null;
        landlordPhone: string | null;
        landlordAvatarUrl: string | null;
        landlordAvatarBgColor: string | null;
    } | null;
    nextPayment: {
        id: string;
        amount: number;
        dueDate: string;
        description: string | null;
    } | null;
    overduePayments: Array<{
        id: string;
        amount: number;
        dueDate: string;
        description: string | null;
        reference: string | null;
    }>;
    utilities: Array<{
        label: string;
        amount: number;
    }>;
    announcement: {
        id: string;
        title: string;
        message: string;
        createdAt: string;
    } | null;
    recentActivity: Array<{
        id: string;
        type: "payment" | "lease" | "maintenance" | "announcement" | "message" | "application";
        title: string;
        message: string;
        createdAt: string;
        read: boolean;
    }>;
    paymentHistory: Array<{
        id: string;
        amount: number;
        dueDate: string;
        paidAt: string | null;
        status: string;
        description: string | null;
        category: string | null;
    }>;
};

const formatCurrency = (value: number, decimals = 0) => {
    if (!Number.isFinite(value)) return "0";
    return new Intl.NumberFormat("en-PH", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};

const formatCurrencyParts = (value: number) => {
    const formatted = new Intl.NumberFormat("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
    const [whole, decimal = "00"] = formatted.split(".");
    return { whole, decimal };
};

const formatDueDate = (value?: string | null) => {
    if (!value) return "No due date";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No due date";
    const day = date.getDate();
    const suffix = day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
            ? "nd"
            : day % 10 === 3 && day !== 13
                ? "rd"
                : "th";
    const month = date.toLocaleDateString("en-US", { month: "long" });
    return `${month} ${day}${suffix}, ${date.getFullYear()}`;
};

const buildInvoiceLabel = (payment: DashboardData["overduePayments"][number]) => {
    if (payment.reference) {
        return `#${payment.reference}`;
    }
    const shortId = payment.id.replace(/-/g, "").slice(0, 6).toUpperCase();
    return `#INV-${shortId}`;
};

const buildOverdueLabel = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Due date unavailable";
    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Due today";
    return `Due ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

export default function TenantDashboard() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [showBanner, setShowBanner] = useState(true);
    const [showMaintenanceSuccess, setShowMaintenanceSuccess] = useState(false);
    const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [dashboardError, setDashboardError] = useState<string | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);

    useEffect(() => {
        if (searchParams.get("maintenance") === "success") {
            setShowMaintenanceSuccess(true);
            const timer = setTimeout(() => {
                setShowMaintenanceSuccess(false);
                const newParams = new URLSearchParams(searchParams.toString());
                newParams.delete("maintenance");
                router.replace(`/tenant/dashboard?${newParams.toString()}`);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, router]);

    useEffect(() => {
        let isMounted = true;

        const loadDashboard = async () => {
            setDashboardLoading(true);
            setDashboardError(null);

            try {
                const response = await fetch("/api/tenant/dashboard", { cache: "no-store" });
                const payload = (await response.json()) as DashboardData & { error?: string };

                if (!response.ok) {
                    throw new Error(payload?.error ?? "Failed to load dashboard data.");
                }

                if (isMounted) {
                    setDashboardData(payload);
                }
            } catch (error) {
                if (isMounted) {
                    const message = error instanceof Error ? error.message : "Failed to load dashboard data.";
                    setDashboardError(message);
                }
            } finally {
                if (isMounted) {
                    setDashboardLoading(false);
                }
            }
        };

        void loadDashboard();

        return () => {
            isMounted = false;
        };
    }, []);

    const nextPayment = dashboardData?.nextPayment ?? null;
    const overduePayments = dashboardData?.overduePayments ?? [];
    const announcement = dashboardData?.announcement ?? null;
    const lease = dashboardData?.lease ?? null;
    const paymentHistory = dashboardData?.paymentHistory ?? [];

    const isInitialLoading = dashboardLoading && !dashboardData;
    const nextPaymentAmount = nextPayment?.amount ?? 0;
    const nextPaymentParts = useMemo(() => formatCurrencyParts(nextPaymentAmount), [nextPaymentAmount]);

    const displayPaymentParts = isInitialLoading
        ? { whole: "--", decimal: "--" }
        : nextPaymentParts;

    const timeRemaining = useMemo(() => {

        if (!nextPayment?.dueDate) {
            return { days: 0, hours: 0, isOverdue: false };
        }
        const due = new Date(nextPayment.dueDate);
        if (Number.isNaN(due.getTime())) {
            return { days: 0, hours: 0, isOverdue: false };
        }
        const diffMs = due.getTime() - Date.now();
        if (diffMs <= 0) {
            return { days: 0, hours: 0, isOverdue: true };
        }
        const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;
        return { days, hours, isOverdue: false };
    }, [nextPayment?.dueDate]);

    const overdueTotal = useMemo(
        () => overduePayments.reduce((sum, payment) => sum + (Number(payment.amount ?? 0) || 0), 0),
        [overduePayments]
    );

    const leaseProgress = useMemo(() => {
        if (!lease?.startDate || !lease?.endDate) {
            return { monthsLeft: null, progressPercent: 0, endLabel: "No active lease" };
        }
        const start = new Date(lease.startDate);
        const end = new Date(lease.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return { monthsLeft: null, progressPercent: 0, endLabel: "No active lease" };
        }
        const totalMs = end.getTime() - start.getTime();
        const elapsedMs = Math.min(Math.max(Date.now() - start.getTime(), 0), totalMs);
        const progressPercent = totalMs > 0 ? Math.round((elapsedMs / totalMs) * 100) : 0;
        const monthsLeft = Math.max(
            0,
            (end.getFullYear() - new Date().getFullYear()) * 12 + (end.getMonth() - new Date().getMonth())
        );
        const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        return { monthsLeft, progressPercent, endLabel };
    }, [lease?.startDate, lease?.endDate]);

    const utilitiesByLabel = useMemo(() => {
        const map = new Map<string, number>();
        (dashboardData?.utilities ?? []).forEach((item) => {
            map.set(item.label.toLowerCase(), item.amount);
        });
        return map;
    }, [dashboardData?.utilities]);

    const electricityAmount = utilitiesByLabel.get("electricity") ?? null;
    const waterAmount = utilitiesByLabel.get("water") ?? null;

    const supportActions = useMemo(() => {
        const items = [];

        if (overduePayments.length > 0) {
            items.push({
                id: "overdue-payments",
                title: `Billing support needed`,
                description: `You have ${overduePayments.length} overdue bill${overduePayments.length === 1 ? "" : "s"} totaling ₱${formatCurrency(overdueTotal, 2)}.`,
                href: "/tenant/payments/checkout",
                cta: "Review billing",
                icon: AlertCircle,
                iconClass: "text-red-600",
                iconBg: "bg-red-500/10",
            });
        } else if (nextPayment) {
            items.push({
                id: "next-payment",
                title: "Upcoming payment",
                description: `${nextPayment.description ?? "Your next payment"} is due ${formatDueDate(nextPayment.dueDate)}.`,
                href: "/tenant/payments/checkout",
                cta: "View bill",
                icon: CreditCard,
                iconClass: "text-emerald-600",
                iconBg: "bg-emerald-500/10",
            });
        }

        if (lease) {
            items.push({
                id: "lease-review",
                title: "Lease questions",
                description: `${lease.propertyName ?? "Your lease"} ends ${leaseProgress.endLabel}. Review terms, dates, and deposit details.`,
                cta: "Open lease",
                action: () => setIsLeaseModalOpen(true),
                icon: FileText,
                iconClass: "text-blue-600",
                iconBg: "bg-blue-500/10",
            });
        }

        items.push({
            id: "message-landlord",
            title: "Message landlord or support",
            description: "Open your inbox to contact your landlord or continue a conversation with iRis.",
            href: "/tenant/messages",
            cta: "Open inbox",
            icon: MessageSquare,
            iconClass: "text-purple-600",
            iconBg: "bg-purple-500/10",
        });

        return items.slice(0, 3);
    }, [lease, leaseProgress.endLabel, nextPayment, overduePayments.length, overdueTotal]);

    return (
        <div className="relative md:pr-[104px] lg:pr-[112px]">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <Image
                    src="https://images.unsplash.com/photo-1481277542470-605612bd2d61?q=80&w=2600&auto=format&fit=crop"
                    alt="Background"
                    fill
                    className="object-cover opacity-[0.03]"
                    priority
                />
            </div>

            <DashboardTour />

            <div className="space-y-6 relative z-10 text-foreground">
                <AnimatePresence>
                    {showMaintenanceSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 overflow-hidden"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-emerald-600 dark:text-emerald-400">Request Submitted!</p>
                                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">We've notified your landlord and will keep you updated on the progress.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowMaintenanceSuccess(false)}
                                className="p-1 hover:bg-emerald-500/10 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-emerald-600" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hero Banner */}
                <div 
                    className="relative w-full h-[280px] rounded-3xl overflow-hidden group border border-border/50 shadow-lg shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/40"
                    data-tour-id="tour-dashboard-overview"
                >
                    <Image
                        src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"
                        alt="Property"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/25 to-black/5 dark:from-black/60 dark:via-black/35 dark:to-black/10" />

                    <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-6 w-full md:w-auto">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/85 dark:drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                                        {isInitialLoading ? "Loading..." : nextPayment ? "Next Payment" : "No Upcoming Payments"}
                                    </span>
                                </div>
                                <h2 className={cn("mb-2 text-4xl font-bold tracking-tight text-white dark:drop-shadow-[0_8px_28px_rgba(0,0,0,0.65)] md:text-5xl", isInitialLoading && "animate-pulse")}>
                                    {"\u20B1"}{displayPaymentParts.whole}
                                    <span className="text-2xl text-white/70">.{displayPaymentParts.decimal}</span>
                                </h2>
                                <p className={cn("flex items-center gap-2 font-medium text-white/85 dark:drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]", isInitialLoading && "animate-pulse")}>
                                    <Calendar className="w-4 h-4" />
                                    {isInitialLoading ? "Loading payment..." : nextPayment?.dueDate ? `Due ${formatDueDate(nextPayment.dueDate)}` : "No upcoming payments"}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {nextPayment && (
                                    <Link
                                        href="/tenant/payments/checkout"
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        Pay Rent Now
                                    </Link>
                                )}
                                <Link
                                    href="/tenant/payments"
                                    className="rounded-xl border border-white/20 bg-black/45 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black/55 dark:border-white/15 dark:bg-black/35 dark:text-white/90 dark:hover:bg-black/45"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>

                        <div className={cn("flex min-w-[200px] flex-col items-center justify-center rounded-xl border border-white/20 bg-black/45 p-6 shadow-md shadow-black/20 dark:border-white/15 dark:bg-black/35 dark:shadow-lg dark:shadow-black/30", isInitialLoading && "animate-pulse")}>
                            <p className="mb-2 text-sm font-medium text-white/85 dark:text-white/75">Time Remaining</p>
                            <div className="flex items-start gap-4 text-white">
                                <div className="text-center">
                                    <span className="text-3xl font-bold block">{isInitialLoading ? "--" : String(timeRemaining.days).padStart(2, "0")}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 dark:text-white/60">Days</span>
                                </div>
                                <span className="mt-1 animate-blink text-2xl font-light text-white/55 dark:text-white/35">:</span>
                                <div className="text-center">
                                    <span className="text-3xl font-bold block">{isInitialLoading ? "--" : String(timeRemaining.hours).padStart(2, "0")}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 dark:text-white/60">Hrs</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {dashboardError && (
                    <div className="w-full bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
                        {dashboardError}
                    </div>
                )}

                {/* Community Announcement Banner */}
                {isInitialLoading && (
                    <div className="w-full bg-card border border-border rounded-xl p-4 flex items-start md:items-center justify-between gap-4 shadow-lg shadow-black/5 animate-pulse">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-full bg-muted/50" />
                            <div className="space-y-2">
                                <div className="h-4 w-40 bg-muted/50 rounded" />
                                <div className="h-3 w-64 bg-muted/40 rounded" />
                            </div>
                        </div>
                        <div className="h-7 w-20 bg-muted/40 rounded-lg" />
                    </div>
                )}
                {announcement && showBanner && (
                    <div className="w-full bg-card border border-border rounded-xl p-4 flex items-start md:items-center justify-between gap-4 shadow-lg shadow-black/5 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm md:text-base">{announcement.title}</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">{announcement.message}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowBanner(false)}
                            className="text-xs font-medium bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Payments & Quick Actions */}
                    <div className="lg:col-span-2 space-y-6">

                        <div data-tour-id="tour-quick-actions">
                            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { icon: Wrench, label: "Request Repair", href: "/tenant/maintenance/new", color: "text-orange-500", bg: "bg-orange-500/10" },
                                    { icon: MessageSquare, label: "Messages", href: "/tenant/messages", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                    { icon: FileText, label: "Your Lease", href: "/tenant/lease/123", color: "text-purple-500", bg: "bg-purple-500/10" },
                                ].map((action, i) => {
                                    const isLease = action.label === "Your Lease";
                                    const isLeaseDisabled = isLease && !lease;
                                    const content = (
                                        <>
                                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", action.bg, action.color)}>
                                                <action.icon className="w-6 h-6" />
                                            </div>
                                            <span className="text-sm font-medium text-center group-hover:text-primary transition-colors">{action.label}</span>
                                        </>
                                    );

                                    if (isLease) {
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    if (!isLeaseDisabled) {
                                                        setIsLeaseModalOpen(true);
                                                    }
                                                }}
                                                disabled={isLeaseDisabled}
                                                className={cn(
                                                    "bg-card border border-border hover:border-primary/30 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 group text-left",
                                                    isLeaseDisabled && "opacity-50 cursor-not-allowed hover:shadow-none hover:-translate-y-0"
                                                )}
                                            >
                                                {content}
                                            </button>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={i}
                                            href={action.href}
                                            className="bg-card border border-border hover:border-primary/30 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 group"
                                        >
                                            {content}
                                        </Link>
                                    );
                                })}
                                <MoveOutRequest variant="quickAction" />
                            </div>
                        </div>

                        {/* Pending Bills Section */}
                        {isInitialLoading ? (
                            <div className="bg-card border border-red-500/20 rounded-2xl p-0 overflow-hidden shadow-lg shadow-red-500/5 animate-pulse">
                                <div className="p-6 border-b border-border/50 bg-red-500/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-500/10" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-48 bg-muted/50 rounded" />
                                            <div className="h-3 w-64 bg-muted/40 rounded" />
                                        </div>
                                    </div>
                                    <div className="h-6 w-20 bg-muted/40 rounded" />
                                </div>
                                <div className="divide-y divide-border/50">
                                    {[0, 1].map((row) => (
                                        <div key={row} className="p-4 sm:p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-muted/40" />
                                                <div className="space-y-2">
                                                    <div className="h-3 w-40 bg-muted/50 rounded" />
                                                    <div className="h-3 w-56 bg-muted/40 rounded" />
                                                </div>
                                            </div>
                                            <div className="h-8 w-24 bg-muted/40 rounded" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : overduePayments.length > 0 ? (
                            <div className="bg-card border border-red-500/20 rounded-2xl p-0 overflow-hidden shadow-lg shadow-red-500/5 hover:border-red-500/40 transition-colors">
                                <div className="p-6 border-b border-border/50 bg-red-500/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground">Action Required: Unpaid Bills</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">Please settle your balances to maintain your Trust Score.</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">Total Due</p>
                                        <p className="text-xl font-bold text-red-500">{"\u20B1"}{formatCurrency(overdueTotal, 2)}</p>
                                    </div>
                                </div>

                                <div className="divide-y divide-border/50">
                                    {overduePayments.map((payment) => {
                                        const desc = payment.description ?? "Payment";
                                        const normalized = desc.toLowerCase();
                                        const Icon = normalized.includes("electric")
                                            ? Zap
                                            : normalized.includes("water")
                                                ? Droplets
                                                : AlertCircle;
                                        const iconClass = normalized.includes("electric")
                                            ? "bg-yellow-500/10 text-yellow-500"
                                            : normalized.includes("water")
                                                ? "bg-blue-500/10 text-blue-500"
                                                : "bg-red-500/10 text-red-500";

                                        return (
                                            <div key={payment.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-start gap-4">
                                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1", iconClass)}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-sm">{desc}</h4>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Invoice <span className="font-mono text-muted-foreground/80">{buildInvoiceLabel(payment)}</span> -{" "}
                                                            <span className="text-red-400 font-medium">{buildOverdueLabel(payment.dueDate)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full">
                                                    <span className="font-bold text-foreground">{"\u20B1"}{formatCurrency(payment.amount, 2)}</span>
                                                    <Link href="/tenant/payments/checkout" className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5">
                                                        Pay <span className="hidden sm:inline">Now</span> <ArrowRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}

                        {/* Unit & Utilities Overview */}
                        {isInitialLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between animate-pulse">
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-muted/50 rounded" />
                                        <div className="h-3 w-40 bg-muted/40 rounded" />
                                    </div>
                                    <div className="mt-8 space-y-3">
                                        <div className="h-2 w-full bg-muted/40 rounded" />
                                        <div className="h-3 w-28 bg-muted/40 rounded" />
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-2xl p-6 space-y-4 animate-pulse">
                                    <div className="h-4 w-24 bg-muted/50 rounded" />
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="h-3 w-24 bg-muted/40 rounded" />
                                            <div className="h-3 w-16 bg-muted/40 rounded" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="h-3 w-20 bg-muted/40 rounded" />
                                            <div className="h-3 w-12 bg-muted/40 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-tour-id="tour-lease-details">
                                {/* Lease Status Card */}
                                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-primary/30 transition-colors">
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                        <Home className="w-24 h-24" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">My Unit</h3>
                                        <p className="text-muted-foreground text-sm">
                                            {lease
                                                ? `${lease.propertyName ?? "Property"}${lease.unitName ? `, ${lease.unitName}` : ""}`
                                                : "No active lease"}
                                        </p>
                                    </div>
                                    <div className="mt-8">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">Lease Progress</span>
                                            <span className="font-medium text-primary">
                                                {leaseProgress.monthsLeft !== null ? `${leaseProgress.monthsLeft} months left` : "-"}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full" style={{ width: `${leaseProgress.progressPercent}%` }} />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {lease ? `Ends ${leaseProgress.endLabel}` : "No lease end date"}
                                        </p>
                                    </div>
                                </div>

                                {/* Utilities Card */}
                                <div className="bg-card border border-border rounded-2xl p-6 space-y-6 hover:border-primary/30 transition-colors">
                                    <h3 className="text-lg font-semibold">Utilities</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                                                    <Zap className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Electricity</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {electricityAmount !== null ? "Latest bill" : "No recent bill"}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold">
                                                {electricityAmount !== null ? `\u20B1${formatCurrency(electricityAmount)}` : "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                                    <Droplets className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Water</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {waterAmount !== null ? "Latest bill" : "No recent bill"}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold">
                                                {waterAmount !== null ? `\u20B1${formatCurrency(waterAmount)}` : "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Lease Details Section */}
                        {lease ? (
                            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Lease Details</h3>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                                        lease.status === "active" ? "bg-green-500/10 text-green-500" :
                                        lease.status === "pending_signature" ? "bg-yellow-500/10 text-yellow-500" :
                                        "bg-muted text-muted-foreground"
                                    )}>
                                        {lease.status.replace('_', ' ')}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Property</p>
                                            <p className="font-semibold">{lease.propertyName ?? "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Unit</p>
                                            <p className="font-semibold">{lease.unitName ?? "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Lease Period</p>
                                            <p className="font-semibold">
                                                {new Date(lease.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                {' - '}
                                                {new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Monthly Rent</p>
                                            <p className="font-semibold text-lg">₱{formatCurrency(lease.monthlyRent, 2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Security Deposit</p>
                                            <p className="font-semibold text-lg">₱{formatCurrency(lease.securityDeposit, 2)}</p>
                                        </div>
                                        {lease.landlordName && (
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Landlord Contact</p>
                                                <p className="font-semibold">{lease.landlordName}</p>
                                                {lease.landlordEmail && (
                                                    <p className="text-sm text-muted-foreground">{lease.landlordEmail}</p>
                                                )}
                                                {lease.landlordPhone && (
                                                    <p className="text-sm text-muted-foreground">{lease.landlordPhone}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-2xl p-6 text-center">
                                <p className="text-muted-foreground">No active lease found</p>
                            </div>
                        )}

                        {/* Payment History Section */}
                        {paymentHistory.length > 0 && (
                            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Payment History</h3>
                                    <Link href="/tenant/payments" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wide">
                                        View All
                                    </Link>
                                </div>
                                
                                <div className="space-y-3">
                                    {paymentHistory.slice(0, 5).map((payment) => {
                                        const isAdvanceRent = payment.description?.toLowerCase().includes('advance rent');
                                        const isSecurityDeposit = payment.category?.toLowerCase() === 'security_deposit' || 
                                                                 payment.description?.toLowerCase().includes('security deposit');
                                        
                                        const statusColors = {
                                            completed: "bg-green-500/10 text-green-500",
                                            pending: "bg-yellow-500/10 text-yellow-500",
                                            processing: "bg-blue-500/10 text-blue-500",
                                            failed: "bg-red-500/10 text-red-500",
                                            refunded: "bg-purple-500/10 text-purple-500",
                                        };
                                        
                                        return (
                                            <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-semibold text-sm">
                                                            {payment.description ?? "Payment"}
                                                        </p>
                                                        {(isAdvanceRent || isSecurityDeposit) && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary">
                                                                {isAdvanceRent ? "Advance" : "Deposit"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span>Due: {new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        {payment.paidAt && (
                                                            <span>Paid: {new Date(payment.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-bold">₱{formatCurrency(payment.amount, 2)}</span>
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide",
                                                        statusColors[payment.status as keyof typeof statusColors] ?? "bg-muted text-muted-foreground"
                                                    )}>
                                                        {payment.status}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                        {/* Concierge Teaser */}
                        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors" />
                            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">iRis Assistant</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">Need help with something?</h3>
                                    <p className="text-muted-foreground text-sm max-w-md">Ask iRis about building rules, amenities, or local recommendations.</p>
                                </div>
                                <Link
                                    href="/tenant/messages"
                                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20 whitespace-nowrap"
                                >
                                    Chat with iRis
                                </Link>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Landlord / Support */}
                    <div className="lg:col-span-1">
                        <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.24)] backdrop-blur-xl h-full flex flex-col">
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,rgba(173,200,125,0.2),transparent_55%)]" />
                            <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-3xl" />

                            <div className="relative z-10 space-y-4 flex-1">
                                <div className="space-y-4" data-tour-id="tour-landlord-support">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                Tenant support
                                            </div>
                                            <h3 className="text-xl font-display text-foreground">Landlord / Support</h3>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Online
                                        </div>
                                    </div>

                                    {dashboardLoading ? (
                                    <div className="space-y-3">
                                        {[0, 1, 2].map((row) => (
                                            <div key={row} className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-background/60 animate-pulse">
                                                <div className="h-12 w-12 rounded-2xl bg-muted/60" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 w-32 bg-muted/60 rounded" />
                                                    <div className="h-3 w-48 bg-muted/40 rounded" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : lease ? (
                                        <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.96),rgba(10,10,10,0.98))] dark:shadow-[0_18px_40px_-30px_rgba(0,0,0,0.6)]">
                                            <div className="flex items-start gap-4">
                                                <div 
                                                    className={cn(
                                                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-primary/10 overflow-hidden relative",
                                                        !lease.landlordAvatarBgColor && "bg-primary/12"
                                                    )}
                                                    style={{ 
                                                        backgroundColor: lease.landlordAvatarBgColor || undefined,
                                                        color: lease.landlordAvatarBgColor ? 'white' : undefined
                                                    }}
                                                >
                                                    {lease.landlordAvatarUrl ? (
                                                        <Image
                                                            src={lease.landlordAvatarUrl}
                                                            alt={lease.landlordName ?? "Landlord"}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <span className={cn(
                                                            "text-lg font-black uppercase",
                                                            !lease.landlordAvatarBgColor && "text-primary"
                                                        )}>
                                                            {(lease.landlordName ?? "Support team")
                                                                .split(" ")
                                                                .map((part) => part[0])
                                                                .join("")
                                                                .slice(0, 2)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Primary contact</p>
                                                    <h4 className="mt-1 text-xl font-semibold text-foreground">{lease.landlordName ?? "Support team"}</h4>
                                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                                        Fast help for billing, lease questions, unit concerns, and anything that needs landlord attention.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-5 grid gap-3">
                                                {lease.landlordEmail && (
                                                    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
                                                        <div className="mt-0.5 rounded-xl bg-blue-500/10 p-2 text-blue-600">
                                                            <Mail className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Email</p>
                                                            <p className="truncate text-sm font-semibold text-foreground">{lease.landlordEmail}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {lease.landlordPhone && (
                                                    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
                                                        <div className="mt-0.5 rounded-xl bg-emerald-500/10 p-2 text-emerald-600">
                                                            <Phone className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Phone</p>
                                                            <p className="text-sm font-semibold text-foreground">{lease.landlordPhone}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-5">
                                                <Link
                                                    href="/tenant/messages"
                                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-primary-foreground shadow-[0_16px_30px_-18px_rgba(var(--primary-rgb),0.55)] transition-all hover:bg-primary/90"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                    Message
                                                </Link>
                                            </div>
                                        </div>
                                ) : supportActions.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No support actions available yet.</p>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-border bg-background/60 p-5 text-center">
                                        <h4 className="text-sm font-semibold text-foreground">Support becomes available with an active lease</h4>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Once a landlord is assigned, this panel will show your direct contact details and support actions.
                                        </p>
                                        <Link
                                            href="/tenant/messages"
                                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Open messages
                                        </Link>
                                    </div>
                                )}
                                </div>

                                {lease && (
                                    <div className="space-y-3">
                                        {supportActions.map((item, index) => {
                                            const Icon = item.icon;
                                            const content = (
                                                <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-background/75 p-4 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.28)] transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background">
                                                    <div className="absolute inset-y-0 left-0 w-1 rounded-full bg-gradient-to-b from-primary/70 to-primary/20 opacity-70" />
                                                    <div className="flex items-start gap-4 pl-2">
                                                        <div className={cn(
                                                            "h-11 w-11 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-black/5",
                                                            item.iconBg,
                                                            item.iconClass
                                                        )}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="mb-1 flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                                        {index === 0 ? "Recommended next step" : "Support option"}
                                                                    </p>
                                                                    <h4 className="mt-1 text-sm font-semibold text-foreground">{item.title}</h4>
                                                                </div>
                                                                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                                                                    {item.cta}
                                                                    <ChevronRight className="h-3 w-3" />
                                                                </span>
                                                            </div>
                                                            <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );

                                            if (item.action) {
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={item.action}
                                                        className="w-full text-left"
                                                    >
                                                        {content}
                                                    </button>
                                                );
                                            }

                                            return (
                                                <Link key={item.id} href={item.href ?? "/tenant/dashboard"} className="block">
                                                    {content}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            <LeaseModal
                open={isLeaseModalOpen}
                onOpenChange={setIsLeaseModalOpen}
            />
            <TenantContactsSidebar />
        </div>
    </div>
);
}







