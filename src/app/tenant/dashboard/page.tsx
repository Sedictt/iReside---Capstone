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
import { getSafeAvatarBgColor } from "@/lib/constants";
import { useLanguageContext } from "@/context/LanguageContext";
import {
    formatLeaseDate,
    formatTenure,
    leaseEndState,
    leaseProgressPercent,
    leaseTermDescription,
    leaseTermLabel,
    tenureSinceLabel,
    termLengthMonths,
    toIsoDate,
    type LeaseTermLike,
} from "@/lib/lease-term";
import { addDaysIso } from "@/lib/validation/schemas/tenant-lifecycle.schema";
import { tr } from "@/hooks/useLanguage";

type DashboardData = {
    userName: string;
    lease: {
        id: string;
        status: string;
        startDate: string;
        endDate: string | null;
        termType?: "open_ended" | "fixed" | string | null;
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

const formatDueDate = (value?: string | null, locale?: string) => {
    if (!value) return "No due date";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No due date";
    if (locale && locale.startsWith("fil")) {
        return date.toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" });
    }
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

/** Month heading for a "YYYY-MM" key; English keeps the server label, other locales are formatted client-side. */
const formatMonthKey = (monthKey: string, fallbackLabel: string, locale: string) => {
    if (!locale.startsWith("fil")) return fallbackLabel;
    const [year, month] = monthKey.split("-").map(Number);
    if (!year || !month) return fallbackLabel;
    return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
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
    const { t, locale, language } = useLanguageContext();
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
                    setDashboardError(tr(errorMessage));
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
    const userName = dashboardData?.userName ?? t("Resident");
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

    // Shared shape for the lease-term helpers (open-ended is the default; an end date only
    // exists for fixed terms or once a move-out has been agreed).
    const leaseTerm = useMemo<LeaseTermLike | null>(() => {
        if (!lease) return null;
        return {
            start_date: lease.startDate,
            end_date: lease.endDate ?? null,
            term_type: lease.termType ?? null,
            status: lease.status,
        };
    }, [lease]);

    const leaseEnd = useMemo(() => leaseEndState(leaseTerm), [leaseTerm]);

    const leaseProgress = useMemo(() => {
        if (!leaseTerm || !lease?.startDate) {
            return { monthsLeft: null as number | null, progressPercent: 0, endLabel: "No active lease" };
        }
        if (leaseEnd.kind === "open_ended") {
            return { monthsLeft: null, progressPercent: 0, endLabel: "Open-ended" };
        }
        const progressPercent = leaseProgressPercent(leaseTerm) ?? 0;
        const monthsLeft = leaseEnd.daysLeft > 0 ? (termLengthMonths(toIsoDate(new Date()), leaseEnd.endDate) ?? 0) : 0;
        return { monthsLeft, progressPercent, endLabel: formatLeaseDate(leaseEnd.endDate, undefined, language) };
    }, [lease?.startDate, leaseTerm, leaseEnd, language]);

    // `?preview_days=N` lets QA preview the renewal reminder as if a fixed term ended in N days.
    const reminderLease = useMemo<LeaseTermLike | null>(() => {
        const preview = previewDays ? parseInt(previewDays, 10) : NaN;
        if (leaseTerm && Number.isFinite(preview)) {
            return { ...leaseTerm, term_type: "fixed", end_date: addDaysIso(toIsoDate(new Date()), preview) };
        }
        return leaseTerm;
    }, [leaseTerm, previewDays]);

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
                description: leaseEnd.kind === "open_ended"
                    ? `${lease.propertyName ?? "Your lease"} is on an open-ended, month-to-month term. Review terms, dates, and deposit details.`
                    : `${lease.propertyName ?? "Your lease"} · ${leaseTermLabel(leaseTerm)}. Review terms, dates, and deposit details.`,
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
    }, [lease, leaseTerm, leaseEnd.kind, nextPayment, overduePayments.length, overdueTotal]);

    return (
        <div className="w-full relative md:pr-[104px] lg:pr-[112px]">
            <LeaseRenewalReminder lease={reminderLease} leaseId={lease?.id} />

            <div className="space-y-5 relative z-10 text-foreground">
                <AnimatePresence>
                    {showMaintenanceSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -16, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -16, height: 0 }}
                            className="bg-emerald-600 text-white rounded-2xl p-4 flex items-center justify-between gap-4 overflow-hidden shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/15 rounded-xl shrink-0">
                                    <CheckCircle2 className="size-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{t("Request Submitted!")}</p>
                                    <p className="text-xs text-white/90">{t("We've notified your landlord and will keep you updated on the progress.")}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowMaintenanceSuccess(false)}
                                aria-label={t("Dismiss")}
                                className="p-1.5 hover:bg-white/15 rounded-full transition-colors shrink-0"
                            >
                                <X className="size-4 text-white" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-tour-id="tour-dashboard-overview">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                            {t("Welcome back, {name}", { name: userName })}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {lease ? t("Everything is looking good at {property}.", { property: lease.propertyName ?? "" }) : t("Welcome to your iReside dashboard.")}
                        </p>
                    </div>

                    <div className="hidden sm:flex shrink-0">
                        <TenantDigitalClock />
                    </div>
                </div>

                {dashboardError && (
                    <div className="w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-medium text-rose-700 dark:text-rose-300">
                        {t(dashboardError)}
                    </div>
                )}

                {/* Priority Asymmetric Grid: Left 60% Primary Payment Focal Card + Right 40% Home, Utilities & Lease */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    {/* PRIMARY FOCAL CARD (Left ~60%) */}
                    <div
                        className={cn(
                            "relative lg:col-span-7 rounded-2xl p-6 overflow-hidden flex flex-col justify-between border shadow-sm",
                            overduePayments.length > 0
                                ? "bg-rose-700 dark:bg-rose-900 text-white border-rose-800"
                                : nextPayment
                                    ? "bg-primary text-primary-foreground border-primary/30"
                                    : "bg-emerald-700 dark:bg-emerald-900 text-white border-emerald-800"
                        )}
                    >
                        <div
                            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/22 via-transparent to-white/12"
                            aria-hidden="true"
                        />

                        <div className="relative z-10 space-y-5">
                            {/* Status Pill */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold text-white">
                                    {overduePayments.length > 0 ? (
                                        <AlertCircle className="size-3.5 shrink-0" />
                                    ) : nextPayment ? (
                                        <Clock className="size-3.5 shrink-0" />
                                    ) : (
                                        <CheckCircle2 className="size-3.5 shrink-0" />
                                    )}
                                    <span>
                                        {isInitialLoading
                                            ? t("Loading status...")
                                            : overduePayments.length > 0
                                                ? t("You have {count} overdue bills", { count: overduePayments.length })
                                                : nextPayment
                                                    ? t("Payment Due • Active Standing")
                                                    : t("Account Up to Date • Excellent")}
                                    </span>
                                </span>

                                <span className="text-xs font-semibold text-white/85 flex items-center gap-1.5">
                                    <Calendar className="size-3.5 shrink-0" />
                                    {isInitialLoading
                                        ? t("Calculating...")
                                        : nextPayment?.dueDate
                                            ? t("Due {date}", { date: t(formatDueDate(nextPayment.dueDate, locale)) })
                                            : upcomingMonths[0]?.dueDate
                                                ? t("Due {date}", { date: t(formatDueDate(upcomingMonths[0].dueDate, locale)) })
                                                : t("No upcoming payments")}
                                </span>
                            </div>

                            {/* Big Clear Amount + Primary Action */}
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-white/80 mb-1">
                                        {overduePayments.length > 0
                                            ? t("Total Overdue Balance")
                                            : nextPayment
                                                ? t("Amount Due Now")
                                                : t("Current Balance")}
                                    </p>
                                    <h2 className={cn("text-4xl sm:text-5xl font-black tracking-tight tabular-nums text-white", isInitialLoading && "animate-pulse")}>
                                        {"\u20B1"}{overduePayments.length > 0 ? formatCurrency(overdueTotal, 2) : `${displayPaymentParts.whole}.${displayPaymentParts.decimal}`}
                                    </h2>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5">
                                    {(overduePayments.length > 0 || nextPayment) && (
                                        <Link
                                            href={
                                                overduePayments[0]?.id
                                                    ? `/tenant/payments/${overduePayments[0].id}/checkout`
                                                    : nextPayment?.id
                                                        ? `/tenant/payments/${nextPayment.id}/checkout`
                                                        : "/tenant/payments"
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100 min-h-[48px]"
                                        >
                                            <CreditCard className="size-4 shrink-0" />
                                            {t("Pay Rent Now")}
                                        </Link>
                                    )}
                                    <Link
                                        href="/tenant/payments"
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/15 border border-white/25 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/25 min-h-[48px]"
                                    >
                                        {t("Billing Details")}
                                        <ArrowRight className="size-4 shrink-0" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Integrated 3-Month Outlook Strip */}
                        {upcomingMonths.length > 0 && (
                            <div className="relative z-10 mt-6 pt-4 border-t border-white/20 grid grid-cols-3 gap-2.5">
                                {upcomingMonths.map((monthForecast) => (
                                    <div
                                        key={monthForecast.month}
                                        className="rounded-xl bg-black/15 border border-white/15 px-3 py-2.5"
                                    >
                                        <p className="text-[11px] font-bold text-white/80 truncate">
                                            {formatMonthKey(monthForecast.month, monthForecast.monthLabel, locale)}
                                        </p>
                                        <p className="text-base font-black tabular-nums text-white mt-0.5">
                                            {"\u20B1"}{formatCurrency(monthForecast.amount)}
                                        </p>
                                        <p className="text-[11px] font-medium text-white/80 mt-0.5 truncate">
                                            {monthForecast.isForecast ? t("Estimated") : t("Ready to Pay")}
                                            {monthForecast.dueDate ? ` · ${new Date(monthForecast.dueDate).toLocaleDateString(locale, { month: "short", day: "numeric" })}` : ""}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECONDARY FOCAL CARD (Right ~40%): Your Home, Utilities & Lease */}
                    <div
                        className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-5 shadow-sm flex flex-col justify-between gap-4"
                        data-tour-id="tour-lease-details"
                    >
                        {/* Property & Unit Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-0.5">{t("Your Home")}</p>
                                <h3 className="text-lg font-black text-foreground leading-snug truncate">
                                    {lease?.propertyName ?? t("Property")}
                                </h3>
                                <p className="text-sm font-semibold text-muted-foreground">
                                    {lease?.unitName ?? t("Unit")}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsLeaseModalOpen(true)}
                                className="shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-muted/50 px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors min-h-[36px]"
                            >
                                {t("View Contract")}
                            </button>
                        </div>

                        {/* Utilities (Electricity & Water) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-muted/40 p-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                    <Zap className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-muted-foreground">{t("Electricity")}</p>
                                    <p className="text-sm font-black tabular-nums text-foreground">{"\u20B1"}{formatCurrency(electricityAmount ?? 0)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-muted/40 p-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                    <Droplets className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-muted-foreground">{t("Water")}</p>
                                    <p className="text-sm font-black tabular-nums text-foreground">{"\u20B1"}{formatCurrency(waterAmount ?? 0)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Lease Tenure / Progress + Rent & Deposit */}
                        <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                            {lease && leaseEnd.kind === "open_ended" ? (
                                <div className="flex items-center justify-between gap-2" data-testid="lease-tenure-widget">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-muted-foreground">{t("Your Tenure")}</p>
                                        <p className="text-sm font-black text-foreground">{tenureSinceLabel(lease.startDate, language)}</p>
                                        <p className="text-xs font-bold text-primary">{formatTenure(lease.startDate, undefined, language)} · {t("month-to-month")}</p>
                                    </div>
                                    <span className="inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-primary bg-primary/10 border border-primary/20 whitespace-nowrap">
                                        {t("Open-ended")}
                                    </span>
                                </div>
                            ) : lease && leaseEnd.kind === "moving_out" ? (
                                <div className="flex items-center justify-between gap-2" data-testid="lease-moving-out-widget">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-muted-foreground">{t("Move-out Scheduled")}</p>
                                        <p className="text-sm font-black text-foreground">{t("Moving out")} {formatLeaseDate(leaseEnd.endDate, undefined, language)}</p>
                                    </div>
                                    <span className="text-xs font-bold text-primary shrink-0">
                                        {leaseEnd.daysLeft === 0 ? t("Today") : t("{count} days", { count: leaseEnd.daysLeft })}
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-muted-foreground">{t("Lease Progress")}</span>
                                        <span className="font-bold text-primary tabular-nums">{leaseProgress.progressPercent}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            style={{ width: `${leaseProgress.progressPercent}%` }}
                                            className="h-full bg-primary rounded-full transition-all duration-500"
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>
                                            {leaseProgress.monthsLeft === null
                                                ? "--"
                                                : leaseProgress.monthsLeft > 0
                                                    ? t("{count} months", { count: leaseProgress.monthsLeft })
                                                    : leaseEnd.kind === "fixed"
                                                        ? t("{count} days", { count: leaseEnd.daysLeft })
                                                        : t("Term ended")}
                                        </span>
                                        <span>{leaseEnd.kind === "ended" ? t("Ended") : t("Expires")}: {t(leaseProgress.endLabel)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">{t("Monthly Rent")}</p>
                                    <p className="text-sm font-black tabular-nums text-foreground">{"\u20B1"}{formatCurrency(lease?.monthlyRent ?? 0)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">{t("Deposit")}</p>
                                    <p className="text-sm font-black tabular-nums text-foreground">{"\u20B1"}{formatCurrency(lease?.securityDeposit ?? 0)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Services (Horizontal Un-truncated Tiles) */}
                <section data-tour-id="tour-quick-actions" aria-label={t("Quick Services")}>
                    <h2 className="text-base font-bold text-foreground mb-3">{t("Quick Services")}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {quickActions.map((quickActionItem) => {
                            const IconComponent = ICON_MAP[quickActionItem.iconName];
                            return (
                                <Link
                                    key={quickActionItem.id}
                                    href={quickActionItem.href}
                                    className="group flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card px-4 py-3.5 shadow-xs transition-all hover:border-primary/50 hover:bg-muted/40 min-h-[56px]"
                                >
                                    <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105", quickActionItem.bgClass, quickActionItem.colorClass)}>
                                        {IconComponent && <IconComponent className="size-5" />}
                                    </div>
                                    <span className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                                        {t(quickActionItem.label)}
                                    </span>
                                </Link>
                            );
                        })}
                        <MoveOutRequest variant="quickAction" leaseEndDate={lease?.endDate ?? null} />
                    </div>
                </section>

                {/* Bottom Row: Recent Activity + Announcements */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    <section className={cn(
                        "rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-5 shadow-sm",
                        announcement && showBanner ? "lg:col-span-7" : "lg:col-span-12"
                    )}>
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <div>
                                <h2 className="text-base font-bold text-foreground">{t("Recent Activity")}</h2>
                                <p className="text-xs text-muted-foreground">{t("Your latest updates and transactions")}</p>
                            </div>
                            <Link href="/tenant/payments" className="text-xs font-bold text-primary hover:underline">
                                {t("Full History")}
                            </Link>
                        </div>

                        {paymentHistory.length > 0 ? (
                            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {paymentHistory.slice(0, 4).map((paymentRecord) => {
                                    const isAdvanceRent = paymentRecord.description?.toLowerCase().includes("advance rent");
                                    const isSecurityDeposit = paymentRecord.category?.toLowerCase() === "security_deposit";
                                    const isCompleted = paymentRecord.status === "completed";

                                    return (
                                        <div key={paymentRecord.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn(
                                                    "size-9 rounded-xl flex items-center justify-center shrink-0",
                                                    isCompleted ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                )}>
                                                    {isCompleted ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm text-foreground truncate">
                                                            {paymentRecord.description ?? t("Payment")}
                                                        </p>
                                                        {(isAdvanceRent || isSecurityDeposit) && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                                {isAdvanceRent ? t("Advance") : t("Deposit")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {paymentRecord.paidAt ? <>{t("Settled")} <ClientOnlyDate date={paymentRecord.paidAt} /></> : <>{t("Due")} <ClientOnlyDate date={paymentRecord.dueDate} /></>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-black text-sm tabular-nums text-foreground">{"\u20B1"}{formatCurrency(paymentRecord.amount, 2)}</p>
                                                <p className={cn(
                                                    "text-xs font-bold",
                                                    isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                                )}>
                                                    {t(paymentRecord.status.charAt(0).toUpperCase() + paymentRecord.status.slice(1))}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-muted/30">
                                <p className="text-sm text-muted-foreground">{t("No recent activity to show.")}</p>
                            </div>
                        )}
                    </section>

                    {announcement && showBanner && (
                        <section className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shrink-0">
                                        <Megaphone className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-primary mb-0.5">{t("Announcement")}</p>
                                        <h3 className="font-bold text-sm text-foreground">{announcement.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{announcement.message}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowBanner(false)}
                                    className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 shrink-0"
                                >
                                    {t("Dismiss")}
                                </button>
                            </div>
                        </section>
                    )}
                </div>
            {dashboardData?.lease && (
                <LeaseModal
                    open={isLeaseModalOpen}
                    onOpenChange={setIsLeaseModalOpen}
                        leaseData={{
                            id: dashboardData.lease.id,
                            start_date: dashboardData.lease.startDate,
                            end_date: dashboardData.lease.endDate ?? null,
                            term_type: dashboardData.lease.termType ?? null,
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
                                avatar_bg_color: getSafeAvatarBgColor(dashboardData.lease.landlordAvatarBgColor),
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
