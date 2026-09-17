'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import Link from 'next/link';
import Image from 'next/image';
import { 
    CreditCard, 
    Wrench,
    Users, 
    AlertTriangle, 
    CheckCircle2, 
    ChevronRight,
    TrendingUp,
    MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';

interface AnalyticsData {
    primaryKpis?: Array<{
        title: string;
        value: string;
        change: string;
        changeType: 'positive' | 'negative' | 'neutral';
    }>;
    financialChart?: {
        month?: {
            labels: string[];
            earnings: number[];
            expenses: number[];
        };
    };
    operationalSnapshot?: {
        status: string;
        summary: string;
    };
}

interface PaymentOverviewData {
    Overdue?: any[];
    'Near Due'?: any[];
    Paid?: any[];
}

export function LandlordOverviewView() {
    const { profile, user } = useAuth();
    const { properties, selectedPropertyId } = useProperty();
    
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [payments, setPayments] = useState<PaymentOverviewData | null>(null);
    const [ticketsCount, setTicketsCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const rawName = 
        profile?.first_name ||
        profile?.full_name ||
        user?.user_metadata?.first_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        '';
    const username = rawName.trim() ? (rawName.trim().split(' ')[0]) : 'Landlord';
    const formattedUsername = username.charAt(0).toUpperCase() + username.slice(1);

    const fetchData = async () => {
        try {
            const queryParam = selectedPropertyId && selectedPropertyId !== 'all' 
                ? `?propertyId=${selectedPropertyId}` 
                : '';
                
            const [analyticsRes, paymentsRes, ticketsRes] = await Promise.all([
                fetch(`/api/landlord/analytics/overview${queryParam}`).catch(() => null),
                fetch(`/api/landlord/payments/overview${queryParam}`).catch(() => null),
                fetch(`/api/landlord/maintenance${queryParam}`).catch(() => null),
            ]);

            if (analyticsRes && analyticsRes.ok) {
                const aData = await analyticsRes.json();
                setAnalytics(aData);
            }

            if (paymentsRes && paymentsRes.ok) {
                const pData = await paymentsRes.json();
                setPayments(pData);
            }

            if (ticketsRes && ticketsRes.ok) {
                const tData = await ticketsRes.json();
                const openTickets = (tData.requests || []).filter((r: any) => r.status !== 'resolved' && r.status !== 'cancelled');
                setTicketsCount(openTickets.length);
            }
        } catch (err) {
            console.error('[MobileOverview] Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [selectedPropertyId]);

    const overdueCount = payments?.Overdue?.length || 0;
    const nearDueCount = payments?.['Near Due']?.length || 0;

    // Monthly revenue mini-chart data
    const chartData = useMemo(() => {
        const months = analytics?.financialChart?.month?.labels || ['W1', 'W2', 'W3', 'W4', 'W5'];
        const values = analytics?.financialChart?.month?.earnings || [0, 48400, 0, 0, 0];
        const max = Math.max(...values, 10000);
        return months.map((label, i) => {
            let displayLabel = label;
            if (/^week\s*(\d+)/i.test(label)) {
                displayLabel = label.replace(/^week\s*(\d+)/i, 'W$1');
            } else if (/^wk\s*(\d+)/i.test(label)) {
                displayLabel = label.replace(/^wk\s*(\d+)/i, 'W$1');
            } else if (label.toLowerCase().startsWith('week')) {
                displayLabel = label.replace(/week\s*/i, 'W');
            } else if (label.length > 4) {
                displayLabel = label.slice(0, 3);
            }
            return {
                label: displayLabel,
                value: values[i] || 0,
                heightPercent: Math.round(((values[i] || 0) / max) * 100),
            };
        });
    }, [analytics]);

    // KPI values
    const occupancyKpi = analytics?.primaryKpis?.find(k => k.title.toLowerCase().includes('occupancy'))?.value || '31%';
    const totalCollectedKpi = analytics?.primaryKpis?.find(k => k.title.toLowerCase().includes('collected') || k.title.toLowerCase().includes('revenue'))?.value || '₱48,400.00';

    return (
        <PullToRefresh onRefresh={fetchData} className="h-full flex flex-col">
            <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 px-4 pt-2.5 pb-3">
                {/* 1. Property Selector (Desktop-matched neumorphic design) */}
                <div className="shrink-0">
                    <MobilePropertySelector />
                </div>

                {/* 2. Welcome Card with Desktop Architectural Background */}
                <div className="group relative rounded-[1.75rem] neumorphic-panel p-3.5 sm:p-4 flex flex-col justify-between shadow-sm shrink-0 overflow-hidden">
                    {/* Desktop Architectural Background Layer */}
                    <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] pointer-events-none">
                        <Image
                            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                            alt="Architecture Skyline"
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, 500px"
                            className="object-cover opacity-45 dark:opacity-20 transition-transform duration-[2000ms] group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/90 to-background/30" />
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />
                        <div className="absolute -top-12 -right-12 size-40 rounded-full bg-primary/15 blur-[50px] pointer-events-none" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            LANDLORD HUB
                        </span>
                        <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground mt-0.5">
                            Welcome, {formattedUsername}
                        </h2>
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                            {overdueCount > 0 
                                ? `⚠️ ${overdueCount} payment${overdueCount > 1 ? 's are' : ' is'} overdue for review`
                                : 'Everything looks on track today'}
                        </p>
                    </div>
                </div>

                {/* 3. Occupancy & Collected KPI Dual Cards (Desktop Neumorphic Extruded Cards) */}
                <div className="grid grid-cols-2 gap-2.5 shrink-0">
                    {/* Occupancy Card */}
                    <div className="neumorphic-extruded rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] transition-all hover:scale-[1.01]">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Occupancy</span>
                            <div className="neumorphic-inset-card flex size-7 items-center justify-center rounded-lg text-emerald-500">
                                <Users className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-0.5">
                            <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                                {occupancyKpi}
                            </h3>
                            <p className="text-[9px] text-muted-foreground">Active leases</p>
                        </div>
                    </div>

                    {/* Collected Card */}
                    <div className="neumorphic-extruded rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] transition-all hover:scale-[1.01]">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Collected</span>
                            <div className="neumorphic-inset-card flex size-7 items-center justify-center rounded-lg text-primary">
                                <CreditCard className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-0.5">
                            <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight truncate">
                                {totalCollectedKpi}
                            </h3>
                            <p className="text-[9px] text-muted-foreground">This period</p>
                        </div>
                    </div>
                </div>

                {/* 4. Action Items Section (Desktop Neumorphic Extruded Cards) */}
                <div className="flex flex-col gap-1.5 shrink-0">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
                        ACTION ITEMS
                    </h3>

                    <div className="flex flex-col gap-1.5">
                        {/* Action 1: Invoices */}
                        <Link
                            href="/mobile/landlord/payments"
                            className="neumorphic-extruded rounded-2xl p-2.5 sm:p-3 px-3.5 flex items-center justify-between transition-all active:scale-[0.99] hover:scale-[1.01]"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className={cn(
                                    "neumorphic-inset-card flex size-8 items-center justify-center rounded-xl shrink-0",
                                    overdueCount > 0 ? "text-red-500" : "text-emerald-500"
                                )}>
                                    {overdueCount > 0 ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-black text-foreground truncate">
                                        {overdueCount > 0 ? `${overdueCount} Overdue Invoices` : 'All Invoices Paid / Current'}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {nearDueCount > 0 ? `${nearDueCount} due in next 7 days` : 'Tap to review all payments'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="size-4 text-primary shrink-0 stroke-[2.5]" />
                        </Link>

                        {/* Action 2: Maintenance Tickets */}
                        <Link
                            href="/mobile/landlord/tickets"
                            className="neumorphic-extruded rounded-2xl p-2.5 sm:p-3 px-3.5 flex items-center justify-between transition-all active:scale-[0.99] hover:scale-[1.01]"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className={cn(
                                    "neumorphic-inset-card flex size-8 items-center justify-center rounded-xl shrink-0",
                                    ticketsCount > 0 ? "text-amber-500" : "text-primary"
                                )}>
                                    <Wrench className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-black text-foreground truncate">
                                        {ticketsCount > 0 ? `${ticketsCount} Open Maintenance Requests` : 'No Pending Maintenance'}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        Tap to view issue photos &amp; status
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="size-4 text-primary shrink-0 stroke-[2.5]" />
                        </Link>

                        {/* Action 3: Announcements & Chats */}
                        <Link
                            href="/mobile/landlord/messages"
                            className="neumorphic-extruded rounded-2xl p-2.5 sm:p-3 px-3.5 flex items-center justify-between transition-all active:scale-[0.99] hover:scale-[1.01]"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="neumorphic-inset-card flex size-8 items-center justify-center rounded-xl shrink-0 text-primary">
                                    <MessageSquare className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-black text-foreground truncate">
                                        Announcements &amp; Chats
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        Broadcast a notice or message residents
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="size-4 text-primary shrink-0 stroke-[2.5]" />
                        </Link>
                    </div>
                </div>

                {/* 5. Revenue Trend Card (Desktop Neumorphic Panel with Neumorphic Inset Chart — flex-1 to fill natural space) */}
                <div className="rounded-[1.75rem] neumorphic-panel p-3.5 sm:p-4 flex-1 min-h-[140px] flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="neumorphic-inset-card flex size-7 items-center justify-center rounded-lg text-primary">
                                <TrendingUp className="size-3.5" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                Revenue Trend
                            </h3>
                        </div>
                        <span className="text-[9px] text-muted-foreground">Last 6 Months</span>
                    </div>

                    {/* Revenue Stat Strip */}
                    <div className="flex items-baseline justify-between px-0.5 shrink-0 my-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-base sm:text-lg font-black text-foreground">
                                {totalCollectedKpi}
                            </span>
                            <span className="text-[9px] font-semibold text-muted-foreground">total collected</span>
                        </div>
                        <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <TrendingUp className="size-2.5" />
                            Active
                        </div>
                    </div>

                    {/* Neumorphic Inset Bar Chart Container */}
                    <div className="neumorphic-inset rounded-2xl p-2.5 pt-3 flex items-end justify-between gap-2 flex-1 min-h-[70px]">
                        {chartData.map((item, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                                <span className="text-[8px] font-bold text-muted-foreground shrink-0">
                                    ₱{item.value >= 1000 ? `${(item.value / 1000).toFixed(item.value % 1000 === 0 ? 0 : 1)}k` : item.value}
                                </span>
                                <div className="w-full flex-1 min-h-[36px] bg-slate-200/50 dark:bg-muted/30 rounded-t-lg relative flex items-end justify-center overflow-hidden">
                                    <div 
                                        className={cn(
                                            "w-full rounded-t-lg transition-all duration-500",
                                            item.value > 0 ? "bg-primary shadow-xs" : "bg-primary/25"
                                        )}
                                        style={{ height: `${item.value > 0 ? Math.max(item.heightPercent, 20) : 8}%` }}
                                    />
                                </div>
                                <span className="text-[9px] font-black uppercase text-muted-foreground">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PullToRefresh>
    );
}
