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
    AlertCircle,
    ArrowRight,
    CheckCircle2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { m as motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LeaseModal from "@/components/tenant/LeaseModal";
import { TenantContactsSidebar } from "@/components/tenant/TenantContactsSidebar";
import MoveOutRequest from "@/components/tenant/MoveOutRequest";
import LeaseRenewalReminder from "@/components/tenant/LeaseRenewalReminder";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { TenantDigitalClock } from "@/components/tenant/dashboard/TenantDigitalClock";

type DashboardData = {
    userName: string;
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
    upcomingMonths: Array<{
        month: string;
        monthLabel: string;
        amount: number;
        dueDate: string;
        invoiceId: string | null;
        isForecast: boolean;
        status: string | null;
    }>;
    quickActions: Array<{
        id: string;
        iconName: string;
        label: string;
        href: string;
        colorClass: string;
        bgClass: string;
    }>;
};

// Map icon name strings from API to actual Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Wrench,
    MessageSquare,
    Home,
    Calendar,
};

// Fallback quick actions — render immediately, never blank.
// API can override these once it loads, but the grid is always visible.
const DEFAULT_QUICK_ACTIONS = [
    { id: "request-repair", iconName: "Wrench", label: "Request Repair", href: "/tenant/maintenance/new", colorClass: "text-orange-500", bgClass: "bg-orange-500/10" },
    { id: "calendar", iconName: "Calendar", label: "Schedule", href: "/tenant/calendar", colorClass: "text-purple-500", bgClass: "bg-purple-500/10" },
    { id: "messages", iconName: "MessageSquare", label: "Messages", href: "/tenant/messages", colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10" },
    { id: "unit-view", iconName: "Home", label: "Unit View", href: "/tenant/unit-map", colorClass: "text-blue-500", bgClass: "bg-blue-500/10" },
];

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
    const previewDays = searchParams.get("preview_days");
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
                const responseData = (await response.json()) as DashboardData & { error?: string };

                if (!response.ok) {
                    throw new Error(responseData?.error ?? "Failed to load dashboard data.");
                }

                if (isMounted) {
                    setDashboardData(responseData);
                }
            } catch (error) {
                if (isMounted) {
                    const errorMessage = error instanceof Error ? error.message : "Failed to load dashboard data.";
                    setDashboardError(errorMessage);
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
    const upcomingMonths = dashboardData?.upcomingMonths ?? [];
    const userName = dashboardData?.userName ?? "Resident";
    const quickActions = dashboardData?.quickActions ?? DEFAULT_QUICK_ACTIONS;

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
        const timeDifferenceMs = due.getTime() - Date.now();
        if (timeDifferenceMs <= 0) {
            return { days: 0, hours: 0, isOverdue: true };
        }
        const remainingHours = Math.floor(timeDifferenceMs / (1000 * 60 * 60));
        const days = Math.floor(remainingHours / 24);
        const hours = remainingHours % 24;
        return { days, hours, isOverdue: false };
    }, [nextPayment?.dueDate]);

    const overdueTotal = useMemo(
        () => overduePayments.reduce((totalAmount, payment) => totalAmount + (Number(payment.amount ?? 0) || 0), 0),
        [overduePayments]
    );

    const leaseProgress = useMemo(() => {
        if (!lease?.startDate || !lease?.endDate) {
            return { monthsLeft: null, progressPercent: 0, endLabel: "No active lease" };
        }
        const leaseStartDate = new Date(lease.startDate);
        const leaseEndDate = new Date(lease.endDate);
        if (Number.isNaN(leaseStartDate.getTime()) || Number.isNaN(leaseEndDate.getTime())) {
            return { monthsLeft: null, progressPercent: 0, endLabel: "No active lease" };
        }
        const totalMs = leaseEndDate.getTime() - leaseStartDate.getTime();
        const elapsedMs = Math.min(Math.max(Date.now() - leaseStartDate.getTime(), 0), totalMs);
        const progressPercent = totalMs > 0 ? Math.round((elapsedMs / totalMs) * 100) : 0;
        const monthsLeft = Math.max(
            0,
            (leaseEndDate.getFullYear() - new Date().getFullYear()) * 12 + (leaseEndDate.getMonth() - new Date().getMonth())
        );
        const endLabel = leaseEndDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        return { monthsLeft, progressPercent, endLabel };
    }, [lease?.startDate, lease?.endDate]);

    const daysRemaining = useMemo(() => {
        if (previewDays) return parseInt(previewDays);
        if (!lease?.endDate) return 0;
        const end = new Date(lease.endDate).getTime();
        const diff = end - Date.now();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }, [lease?.endDate, previewDays]);

    const utilitiesByLabel = useMemo(() => {
        const utilityAmountMap = new Map<string, number>();
        (dashboardData?.utilities ?? []).forEach((utility) => {
            utilityAmountMap.set(utility.label.toLowerCase(), utility.amount);
        });
        return utilityAmountMap;
    }, [dashboardData?.utilities]);

    const electricityAmount = utilitiesByLabel.get("electricity") ?? null;
    const waterAmount = utilitiesByLabel.get("water") ?? null;

    const supportActions = useMemo(() => {
        const actions = [];

        if (overduePayments.length > 0) {
            actions.push({
                id: "overdue-payments",
                title: `Billing support needed`,
                description: `You have ${overduePayments.length} overdue bill${overduePayments.length === 1 ? "" : "s"} totaling ₱${formatCurrency(overdueTotal, 2)}.`,
                href: overduePayments[0]?.id ? `/tenant/payments/${overduePayments[0].id}/checkout` : "/tenant/payments",
                cta: "Review billing",
                icon: AlertCircle,
                iconClass: "text-red-600",
                iconBg: "bg-red-500/10",
            });
        } else if (nextPayment) {
            actions.push({
                id: "next-payment",
                title: "Upcoming payment",
                description: `${nextPayment.description ?? "Your next payment"} is due ${formatDueDate(nextPayment.dueDate)}.`,
                href: nextPayment?.id ? `/tenant/payments/${nextPayment.id}/checkout` : "/tenant/payments",
                cta: "View bill",
                icon: CreditCard,
                iconClass: "text-emerald-600",
                iconBg: "bg-emerald-500/10",
            });
        }

        if (lease) {
            actions.push({
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

        actions.push({
            id: "message-landlord",
            title: "Message landlord or support",
            description: "Open your inbox to contact your landlord or continue a conversation with iRis.",
            href: "/tenant/messages",
            cta: "Open inbox",
            icon: MessageSquare,
            iconClass: "text-purple-600",
            iconBg: "bg-purple-500/10",
        });

        return actions.slice(0, 3);
    }, [lease, leaseProgress.endLabel, nextPayment, overduePayments.length, overdueTotal]);

    return (
        <div className="w-full relative md:pr-[104px] lg:pr-[112px]">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <Image
                    src="https://images.unsplash.com/photo-1481277542470-605612bd2d61?q=80&w=2600&auto=format&fit=crop"
                    alt="Background"
                    fill
                    className="object-cover opacity-[0.03]"
                    priority
                />
            </div>

            <LeaseRenewalReminder daysRemaining={daysRemaining} leaseId={lease?.id} />

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
                                    <CheckCircle2 className="size-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-black text-emerald-600 dark:text-emerald-400">Request Submitted!</p>
                                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">We've notified your landlord and will keep you updated on the progress.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowMaintenanceSuccess(false)}
                                className="p-1 hover:bg-emerald-500/10 rounded-full transition-colors"
                            >
                                <X className="size-4 text-emerald-600" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1" data-tour-id="tour-dashboard-overview">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            Welcome back, {userName}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {lease ? `Everything is up to date at ${lease.propertyName}.` : "Welcome to your tenant portal."}
                        </p>
                    </div>

                    <div className="hidden sm:flex shrink-0">
                        <TenantDigitalClock />
                    </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-7 relative transition-all">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center">
                        <div className="md:col-span-2 space-y-5">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border bg-muted/40 border-border/60">
                                <span className={cn(
                                    "size-2 rounded-full",
                                    isInitialLoading ? "bg-muted-foreground animate-pulse" :
                                    nextPayment ? "bg-amber-500" : "bg-emerald-500"
                                )} />
                                <span className="text-foreground">
                                    {isInitialLoading
                                        ? "Checking status..."
                                        : nextPayment
                                            ? `Payment Due · ${formatDueDate(nextPayment.dueDate)}`
                                            : "All payments up to date"}
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Current Balance Due
                                </p>
                                <div className="flex items-baseline">
                                    <h2 className={cn("text-4xl sm:text-5xl font-bold tracking-tight text-foreground tabular-nums", isInitialLoading && "animate-pulse")}>
                                        ₱{displayPaymentParts.whole}
                                        <span className="text-2xl text-muted-foreground font-normal">.{displayPaymentParts.decimal}</span>
                                    </h2>
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="size-3.5" />
                                    {isInitialLoading
                                        ? "Calculating schedule..."
                                        : nextPayment?.dueDate
                                            ? `Due on ${formatDueDate(nextPayment.dueDate)}`
                                            : upcomingMonths[0]?.dueDate
                                                ? `Next rent due on ${formatDueDate(upcomingMonths[0].dueDate)}`
                                                : "No outstanding balances due"}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                {nextPayment && (
                                    <Link
                                        href={nextPayment.id ? `/tenant/payments/${nextPayment.id}/checkout` : "/tenant/payments"}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <CreditCard className="size-4" />
                                        Pay Rent Now
                                    </Link>
                                )}
                                <Link
                                    href="/tenant/payments"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-muted/40 text-foreground px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    Billing Details
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border/50 bg-muted/20 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-foreground">Lease Progress</p>
                                <span className="text-xs font-semibold text-foreground tabular-nums">{leaseProgress.progressPercent}%</span>
                            </div>
                            <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${leaseProgress.progressPercent}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className="h-full bg-primary rounded-full" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                                <div>
                                    <p className="text-muted-foreground font-medium">Remaining</p>
                                    <p className="font-semibold text-foreground mt-0.5">
                                        {leaseProgress.monthsLeft !== null ? `${leaseProgress.monthsLeft} months` : "—"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-muted-foreground font-medium">Expires</p>
                                    <p className="font-semibold text-foreground mt-0.5">{leaseProgress.endLabel}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {upcomingMonths.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {upcomingMonths.map((monthForecast) => (
                            <div 
                                key={monthForecast.month}
                                className="rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-border"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {monthForecast.monthLabel}
                                    </p>
                                    {monthForecast.isForecast ? (
                                        <span className="text-[11px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                            Estimated
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                            Ready to Pay
                                        </span>
                                    )}
                                </div>
                                <p className="text-xl font-bold text-foreground mt-2 tabular-nums">
                                    ₱{formatCurrency(monthForecast.amount)}
                                </p>
                                {monthForecast.dueDate && (
                                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40 flex items-center justify-between">
                                        <span>Due date</span>
                                        <span className="font-medium text-foreground">
                                            {new Date(monthForecast.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {dashboardError && (
                    <div className="w-full bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
                        {dashboardError}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                    {announcement && showBanner && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-border/60 bg-muted/20 p-4 flex items-start sm:items-center justify-between gap-4"
                        >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                                    <Megaphone className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Announcement</span>
                                        <span className="text-muted-foreground/40 hidden sm:inline">•</span>
                                        <h3 className="font-semibold text-sm text-foreground truncate">{announcement.title}</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{announcement.message}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowBanner(false)}
                                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/40 shrink-0"
                            >
                                Dismiss
                            </button>
                        </motion.div>
                    )}

                    {overduePayments.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-start sm:items-center justify-between gap-4"
                        >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                                <div className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                                    <AlertCircle className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-red-500">Payment Overdue</span>
                                        <span className="text-muted-foreground/40 hidden sm:inline">•</span>
                                        <h3 className="font-semibold text-sm text-foreground">You have {overduePayments.length} overdue bill{overduePayments.length === 1 ? "" : "s"}</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">Total balance: ₱{formatCurrency(overdueTotal, 2)} • Please settle your account.</p>
                                </div>
                            </div>
                            <Link
                                href={overduePayments[0]?.id ? `/tenant/payments/${overduePayments[0].id}/checkout` : "/tenant/payments"}
                                className="shrink-0 bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            >
                                Pay Now
                            </Link>
                        </motion.div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div data-tour-id="tour-quick-actions">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Services</h3>
                            </div>
                            <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
                                {quickActions.map((quickActionItem) => {
                                    const IconComponent = ICON_MAP[quickActionItem.iconName];
                                    return (
                                        <Link
                                            key={quickActionItem.id}
                                            href={quickActionItem.href}
                                            className="rounded-xl border border-border/50 bg-card hover:bg-muted/40 hover:border-border p-3 sm:p-4 flex flex-col items-center justify-center gap-2.5 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            <div className="size-10 sm:size-11 rounded-lg bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                                                {IconComponent && <IconComponent className="size-5" />}
                                            </div>
                                            <span className="text-xs font-medium text-foreground text-center truncate max-w-full group-hover:text-primary transition-colors">
                                                {quickActionItem.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                                <MoveOutRequest variant="quickAction" />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-card p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">Your latest updates and billing history</p>
                                </div>
                                <Link href="/tenant/payments" className="text-xs font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
                                    Full History
                                    <ChevronRight className="size-3.5" />
                                </Link>
                            </div>

                            {paymentHistory.length > 0 ? (
                                <div className="divide-y divide-border/40">
                                    {paymentHistory.slice(0, 4).map((paymentRecord) => {
                                        const isAdvanceRent = paymentRecord.description?.toLowerCase().includes('advance rent');
                                        const isSecurityDeposit = paymentRecord.category?.toLowerCase() === 'security_deposit';
                                        
                                        return (
                                            <div key={paymentRecord.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 group">
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className={cn(
                                                        "size-8 rounded-lg flex items-center justify-center shrink-0",
                                                        paymentRecord.status === 'completed' 
                                                            ? "bg-emerald-500/10 text-emerald-500" 
                                                            : "bg-amber-500/10 text-amber-500"
                                                    )}>
                                                        {paymentRecord.status === 'completed' ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-sm text-foreground truncate">
                                                                {paymentRecord.description ?? "Payment"}
                                                            </p>
                                                            {(isAdvanceRent || isSecurityDeposit) && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground shrink-0">
                                                                    {isAdvanceRent ? "Advance" : "Deposit"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {paymentRecord.paidAt ? <>Settled <ClientOnlyDate date={paymentRecord.paidAt} /></> : <>Due <ClientOnlyDate date={paymentRecord.dueDate} /></>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 pl-3">
                                                    <p className="font-semibold text-sm text-foreground tabular-nums">₱{formatCurrency(paymentRecord.amount, 2)}</p>
                                                    <p className={cn(
                                                        "text-xs font-medium capitalize mt-0.5",
                                                        paymentRecord.status === 'completed' ? "text-emerald-500" : "text-amber-500"
                                                    )}>
                                                        {paymentRecord.status}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10 border border-dashed border-border/60 rounded-xl bg-muted/10">
                                    <p className="text-xs text-muted-foreground">No recent activity to show.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-border/70 bg-card p-6" data-tour-id="tour-lease-details">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Home</p>
                                <h3 className="text-lg font-bold text-foreground tracking-tight mt-1">
                                    {lease?.propertyName ?? "Property"}
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium">{lease?.unitName ?? "Unit"}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4">
                                <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                        <Zap className="size-3.5 text-muted-foreground" />
                                        <span>Electricity</span>
                                    </div>
                                    <p className="text-base font-bold text-foreground mt-1 tabular-nums">
                                        ₱{formatCurrency(electricityAmount ?? 0)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                        <Droplets className="size-3.5 text-muted-foreground" />
                                        <span>Water</span>
                                    </div>
                                    <p className="text-base font-bold text-foreground mt-1 tabular-nums">
                                        ₱{formatCurrency(waterAmount ?? 0)}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-border/50 space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-semibold text-foreground">Contract Summary</p>
                                    <button 
                                        onClick={() => setIsLeaseModalOpen(true)}
                                        className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                                    >
                                        View Contract
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-muted-foreground font-medium">Monthly Rent</p>
                                        <p className="font-semibold text-foreground mt-0.5 tabular-nums">₱{formatCurrency(lease?.monthlyRent ?? 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground font-medium">Security Deposit</p>
                                        <p className="font-semibold text-foreground mt-0.5 tabular-nums">₱{formatCurrency(lease?.securityDeposit ?? 0)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {dashboardData?.lease && (
                <LeaseModal
                    open={isLeaseModalOpen}
                    onOpenChange={setIsLeaseModalOpen}
                        leaseData={{
                            id: dashboardData.lease.id,
                            start_date: dashboardData.lease.startDate,
                            end_date: dashboardData.lease.endDate,
                            monthly_rent: dashboardData.lease.monthlyRent,
                            security_deposit: dashboardData.lease.securityDeposit,
                            signed_at: dashboardData.lease.startDate, // Fallback
                            signed_document_url: null,
                            unit: {
                                id: "", // Placeholder
                                name: dashboardData.lease.unitName || "",
                                floor: 0, // Not in summary
                                sqft: null,
                                beds: 0,
                                baths: 0,
                                property: {
                                    id: "", // Placeholder
                                    name: dashboardData.lease.propertyName || "",
                                    address: dashboardData.lease.propertyAddress || "",
                                    city: dashboardData.lease.propertyCity || "",
                                    images: [],
                                    house_rules: [],
                                    amenities: []
                                }
                            },
                            landlord: {
                                id: "", // Placeholder
                                full_name: dashboardData.lease.landlordName || "",
                                avatar_url: dashboardData.lease.landlordAvatarUrl || "",
                                avatar_bg_color: dashboardData.lease.landlordAvatarBgColor || "#171717",
                                phone: dashboardData.lease.landlordPhone || ""
                            },
                            tenant: {
                                full_name: "" // Placeholder
                            }
                        }}
                />
            )}
            <TenantContactsSidebar />
            </div>
        </div>
    );
}
