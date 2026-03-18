"use client";

import {
    Calendar,
    CreditCard,
    FileText,
    Bell,
    CheckCircle,
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
    ArrowRight
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import LeaseModal from "@/components/tenant/LeaseModal";
import { TenantContactsSidebar } from "@/components/tenant/TenantContactsSidebar";
import MoveOutRequest from "@/components/tenant/MoveOutRequest";

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

const formatRelativeTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Just now";
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
    if (diffHours < 48) return "Yesterday";
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
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
    const [showBanner, setShowBanner] = useState(true);
    const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [dashboardError, setDashboardError] = useState<string | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);

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
    const recentActivity = dashboardData?.recentActivity ?? [];
    const lease = dashboardData?.lease ?? null;

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

    const activityStyles = {
        payment: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        lease: { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
        maintenance: { icon: Wrench, color: "text-orange-500", bg: "bg-orange-500/10" },
        message: { icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
        announcement: { icon: Megaphone, color: "text-primary", bg: "bg-primary/10" },
        application: { icon: FileText, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    } as const;

    return (
        <div className="relative md:pr-[88px]">
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

            <div className="space-y-6 relative z-10 text-foreground">

                {/* Hero Banner */}
                <div className="relative w-full h-[280px] rounded-3xl overflow-hidden group border border-border/50 shadow-2xl">
                    <Image
                        src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"
                        alt="Property"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-6 w-full md:w-auto">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                    <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                                        {isInitialLoading ? "Loading..." : nextPayment ? "Next Payment" : "No Upcoming Payments"}
                                    </span>
                                </div>
                                <h2 className={cn("text-4xl md:text-5xl font-bold tracking-tight text-white mb-2 shadow-sm", isInitialLoading && "animate-pulse")}>
                                    {"\u20B1"}{displayPaymentParts.whole}
                                    <span className="text-2xl text-white/60">.{displayPaymentParts.decimal}</span>
                                </h2>
                                <p className={cn("text-white/80 font-medium flex items-center gap-2", isInitialLoading && "animate-pulse")}>
                                    <Calendar className="w-4 h-4" />
                                    {isInitialLoading ? "Loading payment..." : nextPayment?.dueDate ? `Due ${formatDueDate(nextPayment.dueDate)}` : "No upcoming payments"}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {nextPayment && (
                                    <Link
                                        href="/tenant/payments/checkout"
                                        className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        Pay Rent Now
                                    </Link>
                                )}
                                <Link
                                    href="/tenant/payments"
                                    className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-3 rounded-xl font-medium text-sm transition-colors backdrop-blur-md"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>

                        <div className={cn("bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center min-w-[200px]", isInitialLoading && "animate-pulse")}>
                            <p className="text-sm font-medium text-white/70 mb-2">Time Remaining</p>
                            <div className="flex items-start gap-4 text-white">
                                <div className="text-center">
                                    <span className="text-3xl font-bold block">{isInitialLoading ? "--" : String(timeRemaining.days).padStart(2, "0")}</span>
                                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Days</span>
                                </div>
                                <span className="text-2xl text-white/30 font-light animate-blink mt-1">:</span>
                                <div className="text-center">
                                    <span className="text-3xl font-bold block">{isInitialLoading ? "--" : String(timeRemaining.hours).padStart(2, "0")}</span>
                                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Hrs</span>
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

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { icon: Wrench, label: "Request Repair", href: "/tenant/maintenance/new", color: "text-orange-500", bg: "bg-orange-500/10" },
                                    { icon: MessageSquare, label: "Messages", href: "/tenant/messages", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                    { icon: FileText, label: "Your Lease", href: "/tenant/lease/123", color: "text-purple-500", bg: "bg-purple-500/10" },
                                    { icon: FileText, label: "Applications", href: "/tenant/applications", color: "text-blue-500", bg: "bg-blue-500/10" },
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    {/* Right Column: Recent Activity */}
                    <div className="lg:col-span-1">
                        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                                </div>
                                <Link href="/tenant/activity" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">View All</Link>
                            </div>

                            <div className="space-y-4 flex-1">
                                {dashboardLoading ? (
                                    <div className="space-y-3">
                                        {[0, 1, 2].map((row) => (
                                            <div key={row} className="flex items-center gap-4 p-3 rounded-xl border border-transparent animate-pulse">
                                                <div className="h-10 w-10 rounded-full bg-muted/50" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 w-32 bg-muted/50 rounded" />
                                                    <div className="h-3 w-48 bg-muted/40 rounded" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : recentActivity.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No recent activity yet.</p>
                                ) : (
                                    recentActivity.map((item) => {
                                        const style = activityStyles[item.type] ?? {
                                            icon: Bell,
                                            color: "text-muted-foreground",
                                            bg: "bg-muted/40",
                                        };
                                        const Icon = style.icon;

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    if (item.type === "lease" && lease) {
                                                        setIsLeaseModalOpen(true);
                                                    }
                                                }}
                                                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all cursor-pointer"
                                            >
                                                <div className={cn(
                                                    "h-10 w-10 rounded-full flex items-center justify-center border border-white/5 shadow-sm transition-transform group-hover:scale-105",
                                                    style.bg, style.color
                                                )}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <h4 className="text-sm font-medium text-foreground truncate">{item.title}</h4>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{formatRelativeTime(item.createdAt)}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">{item.message}</p>
                                                </div>
                                                {!item.read && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })
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







