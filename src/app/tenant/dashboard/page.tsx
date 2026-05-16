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
import { DashboardTour } from "@/components/tenant/DashboardTour";
import LeaseRenewalReminder from "@/components/tenant/LeaseRenewalReminder";
import { ClientOnlyDate } from "@/components/ui/client-only-date";

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
};

// Fallback quick actions — render immediately, never blank.
// API can override these once it loads, but the grid is always visible.
const DEFAULT_QUICK_ACTIONS = [
    { id: "request-repair", iconName: "Wrench", label: "Request Repair", href: "/tenant/maintenance/new", colorClass: "text-orange-500", bgClass: "bg-orange-500/10" },
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
                href: `/tenant/payments/${overduePayments[0]?.id}/checkout`,
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
                href: `/tenant/payments/${nextPayment.id}/checkout`,
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
        <div className="relative md:pr-[104px] lg:pr-[112px]">
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

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2" data-tour-id="tour-dashboard-overview">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                            Welcome back, {userName}
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            {lease ? `Everything is looking good at ${lease.propertyName}.` : "Welcome to your iReside dashboard."}
                        </p>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/50 p-8 shadow-xl backdrop-blur-md dark:bg-white/[0.02]">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                        <Home className="size-48" />
                    </div>
                    
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        <div className="md:col-span-2 space-y-6">
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm">
                                <span className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(109,152,56,0.6)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                    {isInitialLoading ? "Loading status..." : nextPayment ? "Payment Due • Active Standing" : "Account Up to Date • Excellent"}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h2 className={cn("text-5xl font-black tracking-tight text-foreground", isInitialLoading && "animate-pulse")}>
                                    {"\u20B1"}{displayPaymentParts.whole}
                                    <span className="text-2xl text-muted-foreground font-medium">.{displayPaymentParts.decimal}</span>
                                </h2>
                                <p className="text-muted-foreground flex items-center gap-2 font-medium">
                                    <Calendar className="size-4" />
                                    {isInitialLoading ? "Calculating..." : nextPayment?.dueDate ? `Due ${formatDueDate(nextPayment.dueDate)}` : "No upcoming payments"}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-2">
                                {nextPayment && (
                                    <Link
                                        href={`/tenant/payments/${nextPayment.id}/checkout`}
                                        className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <CreditCard className="size-4" />
                                        Pay Rent Now
                                    </Link>
                                )}
                                <Link
                                    href="/tenant/payments"
                                    className="bg-secondary/50 hover:bg-secondary text-secondary-foreground px-8 py-4 rounded-2xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] border border-border/50"
                                >
                                    Billing Details
                                </Link>
                            </div>
                        </div>

                        <div className="bg-muted/30 rounded-3xl p-6 border border-border/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Lease Progress</p>
                                <span className="text-xs font-black text-primary">{leaseProgress.progressPercent}%</span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${leaseProgress.progressPercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" 
                                />
                            </div>
                            <div className="flex justify-between items-end pt-2">
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Remaining</p>
                                    <p className="text-sm font-black text-foreground">
                                        {leaseProgress.monthsLeft !== null ? `${leaseProgress.monthsLeft} months` : "--"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Expires</p>
                                    <p className="text-sm font-black text-foreground">{leaseProgress.endLabel}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {upcomingMonths.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                        {upcomingMonths.map((monthForecast) => (
                            <div 
                                key={monthForecast.month}
                                className={cn(
                                    "rounded-2xl p-4 border",
                                    monthForecast.isForecast 
                                        ? "bg-muted/30 border-border/50" 
                                        : "bg-primary/5 border-primary/20"
                                )}
                            >
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                    {monthForecast.monthLabel}
                                </p>
                                <p className="text-lg font-black text-foreground mt-1">
                                    ₱{formatCurrency(monthForecast.amount)}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    {monthForecast.isForecast ? (
                                        <span className="text-[9px] font-medium text-muted-foreground">Estimated</span>
                                    ) : (
                                        <span className="text-[9px] font-medium text-primary">Ready to Pay</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {dashboardError && (
                    <div className="w-full bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
                        {dashboardError}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {announcement && showBanner && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-primary text-white">
                                    <Megaphone className="size-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">Announcement</p>
                                    <h3 className="font-black text-sm text-foreground">{announcement.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">{announcement.message}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowBanner(false)}
                                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                            >
                                Dismiss
                            </button>
                        </motion.div>
                    )}

                    {overduePayments.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-red-500 text-white">
                                    <AlertCircle className="size-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-0.5">Payment Required</p>
                                    <h3 className="font-black text-sm text-foreground">You have {overduePayments.length} overdue bills</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">Totaling ₱{formatCurrency(overdueTotal, 2)} • Please settle your balance.</p>
                                </div>
                            </div>
                            <Link
                                href={`/tenant/payments/${overduePayments[0]?.id}/checkout`}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all"
                            >
                                Pay Now
                            </Link>
                        </motion.div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div data-tour-id="tour-quick-actions">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Quick Services</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {quickActions.map((quickActionItem) => {
                                    const IconComponent = ICON_MAP[quickActionItem.iconName];
                                    return (
                                        <Link
                                            key={quickActionItem.id}
                                            href={quickActionItem.href}
                                            className="bg-card/50 border border-border hover:border-primary/40 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 group backdrop-blur-sm"
                                        >
                                            <div className={cn("size-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", quickActionItem.bgClass, quickActionItem.colorClass)}>
                                                {IconComponent && <IconComponent className="size-7" />}
                                            </div>
                                            <span className="text-xs font-black text-center group-hover:text-primary transition-colors uppercase tracking-widest">{quickActionItem.label}</span>
                                        </Link>
                                    );
                                })}
                                <MoveOutRequest variant="quickAction" />
                            </div>
                        </div>

                        <div className="bg-card/50 border border-border rounded-[2rem] p-8 shadow-sm backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-foreground tracking-tight">Recent Activity</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Your latest updates and transactions</p>
                                </div>
                                <Link href="/tenant/payments" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors">
                                    Full History
                                </Link>
                            </div>

                            {paymentHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {paymentHistory.slice(0, 4).map((paymentRecord) => {
                                        const isAdvanceRent = paymentRecord.description?.toLowerCase().includes('advance rent');
                                        const isSecurityDeposit = paymentRecord.category?.toLowerCase() === 'security_deposit';
                                        
                                        return (
                                            <div key={paymentRecord.id} className="group flex items-center justify-between p-4 rounded-2xl border border-border/40 hover:border-primary/20 hover:bg-primary/[0.02] transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "size-10 rounded-xl flex items-center justify-center shrink-0",
                                                        paymentRecord.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                                    )}>
                                                        {paymentRecord.status === 'completed' ? <CheckCircle2 className="size-5" /> : <Clock className="size-5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-black text-sm text-foreground truncate">
                                                                {paymentRecord.description ?? "Payment"}
                                                            </p>
                                                            {(isAdvanceRent || isSecurityDeposit) && (
                                                                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                                    {isAdvanceRent ? "Advance" : "Deposit"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-black tracking-wider">
                                                            {paymentRecord.paidAt ? <>Settled <ClientOnlyDate date={paymentRecord.paidAt} /></> : <>Due <ClientOnlyDate date={paymentRecord.dueDate} /></>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="font-black text-sm text-foreground tracking-tight">₱{formatCurrency(paymentRecord.amount, 2)}</p>
                                                    <p className={cn(
                                                        "text-[8px] font-black uppercase tracking-[0.2em] mt-0.5",
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
                                <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-muted/20">
                                    <p className="text-sm text-muted-foreground">No recent activity to show.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-card/90 border border-border/60 rounded-[2rem] p-8 shadow-sm backdrop-blur-xl relative overflow-hidden" data-tour-id="tour-lease-details">
                            <div className="absolute top-0 right-0 size-32 bg-primary/5 blur-3xl -mr-8 -mt-8" />
                            <div className="relative z-10 space-y-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Your Home</p>
                                    <h3 className="text-2xl font-black text-foreground tracking-tight leading-tight">
                                        {lease?.propertyName ?? "Property"}<br/>
                                        <span className="text-muted-foreground text-lg">{lease?.unitName ?? "Unit"}</span>
                                    </h3>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border/50">
                                        <div className="p-2.5 rounded-xl bg-background border border-border">
                                            <Zap className="size-5 text-amber-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Electricity</p>
                                            <p className="font-black text-sm text-foreground">₱{formatCurrency(electricityAmount ?? 0)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border/50">
                                        <div className="p-2.5 rounded-xl bg-background border border-border">
                                            <Droplets className="size-5 text-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Water</p>
                                            <p className="font-black text-sm text-foreground">₱{formatCurrency(waterAmount ?? 0)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Lease Details</p>
                                        <button 
                                            onClick={() => setIsLeaseModalOpen(true)}
                                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                        >
                                            View Contract
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Monthly Rent</p>
                                            <p className="text-sm font-black text-foreground">₱{formatCurrency(lease?.monthlyRent ?? 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Deposit</p>
                                            <p className="text-sm font-black text-foreground">₱{formatCurrency(lease?.securityDeposit ?? 0)}</p>
                                        </div>
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
