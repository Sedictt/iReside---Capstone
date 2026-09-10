'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import Link from 'next/link';
import { 
    Building2, 
    CreditCard, 
    Ticket, 
    Users, 
    ArrowUpRight, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    ChevronRight,
    ChevronDown,
    TrendingUp,
    MessageSquare,
    ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';

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
    const { profile } = useAuth();
    const { properties, selectedPropertyId, setSelectedPropertyId } = useProperty();
    
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [payments, setPayments] = useState<PaymentOverviewData | null>(null);
    const [ticketsCount, setTicketsCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

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
    const paidCount = payments?.Paid?.length || 0;

    // Selected Property name
    const currentPropertyName = useMemo(() => {
        if (!selectedPropertyId || selectedPropertyId === 'all') return 'All Properties';
        return properties.find(p => p.id === selectedPropertyId)?.name || 'All Properties';
    }, [properties, selectedPropertyId]);

    // Monthly revenue mini-chart data
    const chartData = useMemo(() => {
        const months = analytics?.financialChart?.month?.labels || ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
        const values = analytics?.financialChart?.month?.earnings || [45000, 52000, 48000, 61000, 58000, 65000];
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
    const occupancyKpi = analytics?.primaryKpis?.find(k => k.title.toLowerCase().includes('occupancy'))?.value || '92%';
    const totalCollectedKpi = analytics?.primaryKpis?.find(k => k.title.toLowerCase().includes('collected') || k.title.toLowerCase().includes('revenue'))?.value || '₱0';

    return (
        <PullToRefresh onRefresh={fetchData}>
            <div className="flex flex-col gap-4 pb-6">
                {/* Prominently Highlighted Property Dropdown Selector */}
                <div className="px-4 pt-1">
                    <div className="relative w-full">
                        <div className="flex items-center justify-between w-full px-3.5 py-3 rounded-2xl bg-white dark:bg-card border-2 border-primary/40 shadow-xs hover:border-primary/60 transition-all active:scale-[0.99] pointer-events-none">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex size-8 items-center justify-center rounded-xl bg-primary/20 text-primary shrink-0 shadow-xs">
                                    <Building2 className="size-4" />
                                </div>
                                <div className="flex flex-col text-left min-w-0">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-primary leading-none mb-1">Select Property</span>
                                    <span className="text-sm font-bold text-foreground truncate">
                                        {currentPropertyName}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                <span className="text-[10px] font-extrabold text-primary uppercase tracking-tight bg-primary/10 px-2 py-0.5 rounded-md">Switch</span>
                                <div className="flex size-7 items-center justify-center rounded-xl bg-primary/15 text-primary">
                                    <ChevronDown className="size-4" />
                                </div>
                            </div>
                        </div>
                        <select
                            value={selectedPropertyId || 'all'}
                            onChange={(e) => setSelectedPropertyId(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-base"
                            aria-label="Filter by property"
                        >
                            <option value="all">All Properties</option>
                            {properties.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

            {/* Greeting Hero Card */}
            <div className="mx-4 rounded-2xl p-4 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between relative z-10">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary">Landlord Hub</span>
                        <h2 className="text-base font-black tracking-tight text-foreground">
                            Welcome, {profile?.first_name || 'Landlord'}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {overdueCount > 0 
                                ? `⚠️ ${overdueCount} payment${overdueCount > 1 ? 's are' : ' is'} overdue for review`
                                : 'Everything looks on track today'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 px-4">
                {/* Occupancy Card */}
                <div className="rounded-2xl p-4 bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground">Occupancy</span>
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <Users className="size-3.5" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <h3 className="text-xl font-black text-foreground">{occupancyKpi}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Active leases</p>
                    </div>
                </div>

                {/* Revenue / Collections Card */}
                <div className="rounded-2xl p-4 bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground">Collected</span>
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <CreditCard className="size-3.5" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <h3 className="text-xl font-black text-foreground truncate">{totalCollectedKpi}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">This period</p>
                    </div>
                </div>
            </div>

            {/* Action Required / Alerts Section */}
            <div className="px-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Action Items
                    </h3>
                </div>

                <div className="flex flex-col gap-2.5">
                    {/* Payments Attention */}
                    <Link
                        href="/mobile/landlord/payments"
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs active:scale-[0.98] transition-all hover:border-primary/40"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn(
                                'size-8 rounded-lg flex items-center justify-center shrink-0',
                                overdueCount > 0 ? 'bg-red-500/15 text-red-500' : 'bg-emerald-500/15 text-emerald-500'
                            )}>
                                {overdueCount > 0 ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-foreground truncate">
                                    {overdueCount > 0 ? `${overdueCount} Overdue Invoices` : 'All Invoices Paid / Current'}
                                </h4>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    {nearDueCount > 0 ? `${nearDueCount} due in next 7 days` : 'Tap to review all payments'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </Link>

                    {/* Maintenance Tickets */}
                    <Link
                        href="/mobile/landlord/tickets"
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs active:scale-[0.98] transition-all hover:border-primary/40"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn(
                                'size-8 rounded-lg flex items-center justify-center shrink-0',
                                ticketsCount > 0 ? 'bg-amber-500/15 text-amber-500' : 'bg-primary/15 text-primary'
                            )}>
                                <Ticket className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-foreground truncate">
                                    {ticketsCount > 0 ? `${ticketsCount} Open Maintenance Tickets` : 'No Pending Maintenance'}
                                </h4>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    Tap to view issue photos &amp; status
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </Link>

                    {/* Tenant Broadcast Quick Link */}
                    <Link
                        href="/mobile/landlord/messages"
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs active:scale-[0.98] transition-all hover:border-primary/40"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
                                <MessageSquare className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-foreground truncate">
                                    Announcements &amp; Chats
                                </h4>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    Broadcast a notice or message residents
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </Link>
                </div>
            </div>

            {/* Brief Revenue Trend Chart (Mobile-optimized) */}
            <div className="px-4">
                <div className="rounded-2xl p-4 bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="size-3.5 text-primary" />
                            <h3 className="text-xs font-black tracking-tight text-foreground">Revenue Trend</h3>
                        </div>
                        <span className="text-[10px] text-muted-foreground">Last 6 Months</span>
                    </div>

                    {/* SVG/CSS Micro Bar Chart */}
                    <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-1">
                        {chartData.map((item, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                <div className="text-[9px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                    ₱{(item.value / 1000).toFixed(0)}k
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-muted/40 rounded-t-md relative flex items-end justify-center h-full overflow-hidden border border-slate-200/80 dark:border-white/5">
                                    <div 
                                        className={cn(
                                            "w-full rounded-t-md transition-all duration-500",
                                            idx === chartData.length - 1 ? "bg-primary" : "bg-primary/50"
                                        )}
                                        style={{ height: `${Math.max(item.heightPercent, 12)}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            </div>
        </PullToRefresh>
    );
}
