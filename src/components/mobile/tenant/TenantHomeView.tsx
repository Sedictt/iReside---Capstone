'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
    Building2, 
    CreditCard, 
    Wrench, 
    MessageSquare, 
    FileText, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    ChevronRight, 
    ArrowUpRight,
    Megaphone,
    Calendar,
    Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';

interface LeaseInfo {
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
}

interface PaymentItem {
    id: string;
    amount: number;
    dueDate: string;
    description: string | null;
}

interface Announcement {
    id: string;
    title: string;
    message: string;
    createdAt: string;
}

interface DashboardData {
    lease?: LeaseInfo | null;
    nextPayment?: PaymentItem | null;
    overduePayments?: PaymentItem[];
    announcements?: Announcement[];
}

export function TenantHomeView() {
    const { profile } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = async () => {
        try {
            const res = await fetch('/api/tenant/dashboard');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('[TenantHome] Failed to load dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const lease = data?.lease;
    const nextPayment = data?.nextPayment;
    const overduePayments = data?.overduePayments || [];
    const announcements = data?.announcements || [];
    const hasOverdue = overduePayments.length > 0;

    const formatCurrency = (amt: number) => `₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

    return (
        <PullToRefresh onRefresh={fetchDashboard}>
            <div className="flex flex-col gap-3 pb-3">
                {/* Hero / Property & Unit Banner */}
                <div className="mx-4 rounded-2xl p-3.5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 shadow-xs relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider mb-0.5">
                                <Building2 className="size-3.5" />
                                <span>{lease?.propertyName || 'My Residence'}</span>
                            </div>
                            <h2 className="text-base font-black tracking-tight text-foreground">
                                Welcome, {profile?.first_name || 'Resident'}
                            </h2>
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                <span className="font-semibold text-foreground">
                                    {lease?.unitName ? `Unit ${lease.unitName}` : 'Assigned Unit'}
                                </span>
                                {lease?.propertyAddress ? `• ${lease.propertyAddress}` : ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Primary Payment Due / Status Card */}
                <div className="px-4">
                    <div className={cn(
                        "rounded-2xl p-3.5 border shadow-xs transition-all",
                        hasOverdue 
                            ? "bg-red-500/10 border-red-500/30" 
                            : "bg-white dark:bg-card/80 border-slate-300 dark:border-white/15"
                    )}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                {hasOverdue ? (
                                    <AlertTriangle className="size-4 text-red-500" />
                                ) : (
                                    <Clock className="size-4 text-primary" />
                                )}
                                <span className={cn(
                                    "text-xs font-bold uppercase tracking-wider",
                                    hasOverdue ? "text-red-500" : "text-muted-foreground"
                                )}>
                                    {hasOverdue ? 'Overdue Payment Required' : 'Next Rent Payment'}
                                </span>
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                hasOverdue 
                                    ? "bg-red-500/20 text-red-500" 
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            )}>
                                {hasOverdue ? 'Overdue' : 'Due Soon'}
                            </span>
                        </div>

                        <div className="mt-2 flex items-baseline justify-between">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight text-foreground">
                                    {hasOverdue 
                                        ? formatCurrency(overduePayments[0].amount)
                                        : nextPayment 
                                            ? formatCurrency(nextPayment.amount)
                                            : lease?.monthlyRent 
                                                ? formatCurrency(lease.monthlyRent)
                                                : '₱0.00'}
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {hasOverdue 
                                        ? `Due date was ${new Date(overduePayments[0].dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
                                        : nextPayment?.dueDate 
                                            ? `Due on ${new Date(nextPayment.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
                                            : 'No active upcoming invoice'}
                                </p>
                            </div>
                        </div>

                        {/* Direct Pay Action */}
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2">
                            <Link
                                href="/mobile/tenant/pay"
                                className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs hover:brightness-105 active:scale-[0.98] transition-all"
                            >
                                <CreditCard className="size-3.5" />
                                <span>Pay Rent / Upload Proof</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Action Shortcuts Grid */}
                <div className="px-4">
                    <div className="grid grid-cols-3 gap-2">
                        <Link
                            href="/mobile/tenant/maintenance"
                            className="p-3 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col items-center text-center gap-1.5 active:scale-[0.97] transition-all hover:border-primary/40"
                        >
                            <div className="size-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                                <Wrench className="size-4" />
                            </div>
                            <span className="text-[11px] font-bold text-foreground leading-tight">
                                Request Repair
                            </span>
                        </Link>

                        <Link
                            href="/mobile/tenant/messages"
                            className="p-3 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col items-center text-center gap-1.5 active:scale-[0.97] transition-all hover:border-primary/40"
                        >
                            <div className="size-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
                                <MessageSquare className="size-4" />
                            </div>
                            <span className="text-[11px] font-bold text-foreground leading-tight">
                                Message Landlord
                            </span>
                        </Link>

                        <Link
                            href="/mobile/tenant/profile"
                            className="p-3 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col items-center text-center gap-1.5 active:scale-[0.97] transition-all hover:border-primary/40"
                        >
                            <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                                <FileText className="size-4" />
                            </div>
                            <span className="text-[11px] font-bold text-foreground leading-tight">
                                View Lease
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Landlord Contact Quick Card */}
                {lease?.landlordName && (
                    <div className="px-4">
                        <div className="rounded-2xl p-3 bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex items-center justify-between">
                            <div className="min-w-0">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Property Manager
                                </span>
                                <h4 className="text-xs font-bold text-foreground truncate">
                                    {lease.landlordName}
                                </h4>
                                <p className="text-[10px] text-muted-foreground truncate">
                                    {lease.landlordPhone || lease.landlordEmail || 'Tap to message'}
                                </p>
                            </div>
                            <Link
                                href="/mobile/tenant/messages"
                                className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center gap-1 active:scale-95 transition-all hover:bg-primary/20 shrink-0"
                            >
                                <MessageSquare className="size-3.5" />
                                <span>Chat</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Announcements / Building Notices Section */}
                <div className="px-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                            <Megaphone className="size-3.5 text-primary" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                Building Notices
                            </h3>
                        </div>
                        <span className="text-[10px] text-muted-foreground">Community</span>
                    </div>

                    {announcements.length === 0 ? (
                        <div className="rounded-2xl p-4 bg-white dark:bg-card/60 border border-slate-300 dark:border-white/15 text-center shadow-xs">
                            <p className="text-xs text-muted-foreground">No new announcements at this time.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {announcements.slice(0, 3).map((notice) => (
                                <div
                                    key={notice.id}
                                    className="p-3 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col gap-1"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-xs font-bold text-foreground truncate">{notice.title}</h4>
                                        <span className="text-[9px] text-muted-foreground shrink-0">
                                            {new Date(notice.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                        {notice.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PullToRefresh>
    );
}
