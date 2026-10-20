'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
    Building2,
    Sparkles,
    BookOpen, 
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
import { triggerHaptic } from '@/lib/haptics';
import { MobileAmenityBookingDrawer } from './MobileAmenityBookingDrawer';
import { useLanguageContext } from '@/context/LanguageContext';
import { formatPhMobile } from "@/lib/phone";

interface LeaseInfo {
    id: string;
    status: string;
    startDate: string;
    endDate: string | null;
    termType?: string | null;
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
    const { profile, user } = useAuth();
    const { t, locale } = useLanguageContext();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAmenityDrawerOpen, setIsAmenityDrawerOpen] = useState(false);

    const rawName = 
        (data as any)?.userName ||
        profile?.full_name ||
        user?.user_metadata?.first_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        '';
    const username = rawName.trim() ? (rawName.trim().split(' ')[0]) : t('Resident');
    const formattedUsername = username.charAt(0).toUpperCase() + username.slice(1);

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
    const landlordInitials = (lease?.landlordName || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() || 'PM';

    return (
        <PullToRefresh onRefresh={fetchDashboard}>
            <div className="m-stagger flex flex-col gap-4 pb-4">
                {/* Greeting header */}
                <div className="px-4 pt-1 flex flex-col gap-1.5 min-w-0">
                    <div className="m-eyebrow flex items-center gap-1.5 min-w-0">
                        <Building2 className="size-3.5 shrink-0" />
                        <span className="truncate">{lease?.propertyName || t('My Residence')}</span>
                    </div>
                    <h2 className="m-display text-[26px] text-foreground">
                        {t('Welcome, {name}', { name: formattedUsername })}
                    </h2>
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="m-pill m-pill-brand shrink-0">
                            {lease?.unitName ? t('Unit {unit}', { unit: lease.unitName }) : t('Assigned Unit')}
                        </span>
                        {lease?.propertyAddress ? (
                            <span className="text-[13px] text-muted-foreground truncate">{lease.propertyAddress}</span>
                        ) : null}
                    </div>
                </div>

                {/* Primary Payment Due / Status Card */}
                <div className="px-4">
                    <div className={cn("m-hero p-5 flex flex-col gap-3.5", hasOverdue && "m-hero-coral")}>
                        <div className="relative flex items-center justify-between gap-2">
                            <span className="m-eyebrow flex items-center gap-1.5">
                                {hasOverdue ? (
                                    <AlertTriangle className="size-3.5" />
                                ) : (
                                    <Clock className="size-3.5" />
                                )}
                                {hasOverdue ? t('Overdue Payment Required') : t('Next Rent Payment')}
                            </span>
                            <span className="m-pill m-pill-ghost">
                                {hasOverdue ? t('Overdue') : t('Due Soon')}
                            </span>
                        </div>

                        <div className="relative">
                            <h3 className="m-amount text-[40px]">
                                {hasOverdue
                                    ? formatCurrency(overduePayments[0].amount)
                                    : nextPayment
                                        ? formatCurrency(nextPayment.amount)
                                        : lease?.monthlyRent
                                            ? formatCurrency(lease.monthlyRent)
                                            : '₱0.00'}
                            </h3>
                            <p className="m-hero-muted text-sm mt-2 flex items-center gap-1.5">
                                <Calendar className="size-3.5" />
                                {hasOverdue
                                    ? t('Due date was {date}', { date: new Date(overduePayments[0].dueDate).toLocaleDateString(locale, { month: 'short', day: 'numeric' }) })
                                    : nextPayment?.dueDate
                                        ? t('Due on {date}', { date: new Date(nextPayment.dueDate).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) })
                                        : t('No active upcoming invoice')}
                            </p>
                        </div>

                        {/* Direct Pay Action */}
                        <div className="relative mt-0.5 flex items-center gap-2.5">
                            <Link
                                href="/mobile/tenant/pay"
                                className="m-btn m-btn-on-hero flex-1 min-h-[48px] text-[15px]"
                            >
                                <CreditCard className="size-4" />
                                <span>{t('Pay Rent / Upload Proof')}</span>
                            </Link>
                            <Link
                                href="/mobile/tenant/calendar"
                                className="m-btn m-btn-on-hero-ghost size-12 px-0 shrink-0"
                                aria-label={t("Schedule")}
                            >
                                <Calendar className="size-5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Action Shortcuts Grid */}
                <div className="px-4">
                    <div className="grid grid-cols-4 gap-2">
                        <Link
                            href="/mobile/tenant/maintenance"
                            className="flex flex-col items-center text-center gap-2 active:scale-[0.97] transition-all"
                        >
                            <div className="m-tile m-tile-coral size-14">
                                <Wrench className="size-[22px]" />
                            </div>
                            <span className="text-xs font-semibold text-foreground leading-tight">
                                {t('Request Repair')}
                            </span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setIsAmenityDrawerOpen(true);
                            }}
                            className="flex flex-col items-center text-center gap-2 active:scale-[0.97] transition-all"
                        >
                            <div className="m-tile m-tile-teal size-14">
                                <Sparkles className="size-[22px]" />
                            </div>
                            <span className="text-xs font-semibold text-foreground leading-tight">
                                {t('Amenities')}
                            </span>
                        </button>

                        <Link
                            href="/mobile/tenant/messages"
                            className="flex flex-col items-center text-center gap-2 active:scale-[0.97] transition-all"
                        >
                            <div className="m-tile m-tile-brand size-14">
                                <MessageSquare className="size-[22px]" />
                            </div>
                            <span className="text-xs font-semibold text-foreground leading-tight">
                                {t('Message Landlord')}
                            </span>
                        </Link>

                        <Link
                            href="/mobile/tenant/lease"
                            className="flex flex-col items-center text-center gap-2 active:scale-[0.97] transition-all"
                        >
                            <div className="m-tile m-tile-deep size-14">
                                <FileText className="size-[22px]" />
                            </div>
                            <span className="text-xs font-semibold text-foreground leading-tight">
                                {t('View Lease')}
                            </span>
                        </Link>
                    </div>
                </div>

                {/* House Rules & Safety Quick Banner */}
                <div className="px-4">
                    <Link
                        href="/mobile/tenant/manual"
                        className="m-card p-3.5 flex items-center gap-3.5 active:scale-[0.98] transition-all"
                    >
                        <div className="m-tile m-tile-amber size-11">
                            <BookOpen className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-[15px] font-bold text-foreground">
                                {t('House Rules & Emergency Guide')}
                            </h4>
                            <p className="text-[13px] text-muted-foreground">
                                {t('Quiet hours, safety protocols & speed dial')}
                            </p>
                        </div>
                        <ChevronRight className="size-[18px] text-muted-foreground shrink-0" />
                    </Link>
                </div>

                {/* Amenities & Facility Booking Quick Banner */}
                <div className="px-4">
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light');
                            setIsAmenityDrawerOpen(true);
                        }}
                        className="m-card w-full p-3.5 flex items-center gap-3.5 active:scale-[0.98] transition-all text-left"
                    >
                        <div className="m-tile m-tile-brand size-11">
                            <Sparkles className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-[15px] font-bold text-foreground">
                                Property Amenities & Facility Booking
                            </h4>
                            <p className="text-[13px] text-muted-foreground">
                                Reserve clubhouse, pool, lounge & gym slots
                            </p>
                        </div>
                        <ChevronRight className="size-[18px] text-muted-foreground shrink-0" />
                    </button>
                </div>

                {/* Landlord Contact Quick Card */}
                {lease?.landlordName && (
                    <div className="px-4">
                        <div className="m-card p-3.5 flex items-center gap-3.5">
                            <span
                                aria-hidden="true"
                                className="m-avatar size-11 text-[15px] bg-[var(--brand-primary-900)] text-white"
                            >
                                {landlordInitials}
                            </span>
                            <div className="min-w-0 flex-1">
                                <span className="m-eyebrow">
                                    {t('Property Manager')}
                                </span>
                                <h4 className="text-[15px] font-bold text-foreground truncate">
                                    {lease.landlordName}
                                </h4>
                                <p className="text-[13px] text-muted-foreground truncate">
                                    {formatPhMobile(lease.landlordPhone) || lease.landlordEmail || t('Tap to message')}
                                </p>
                            </div>
                            <Link
                                href="/mobile/tenant/messages"
                                className="m-btn m-btn-tint min-h-[40px] px-3.5 text-[13px] shrink-0"
                            >
                                <MessageSquare className="size-4" />
                                <span>{t('Chat')}</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Announcements / Building Notices Section */}
                <div className="px-4">
                    <div className="flex items-baseline justify-between mb-2.5">
                        <h3 className="m-display text-[18px] text-foreground">
                            {t('Building Notices')}
                        </h3>
                        <span className="text-[13px] font-semibold text-primary">{t('Community')}</span>
                    </div>

                    {announcements.length === 0 ? (
                        <div className="m-card p-5 flex items-center gap-3.5">
                            <div className="m-tile m-tile-teal size-11">
                                <Megaphone className="size-5" />
                            </div>
                            <p className="text-[13px] text-muted-foreground">{t('No new announcements at this time.')}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {announcements.slice(0, 3).map((notice) => (
                                <div
                                    key={notice.id}
                                    className="m-card p-3.5 flex items-start gap-3.5"
                                >
                                    <div className="m-tile m-tile-teal size-11">
                                        <Megaphone className="size-5" />
                                    </div>
                                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-[15px] font-bold text-foreground truncate">{notice.title}</h4>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {new Date(notice.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">
                                            {notice.message}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Amenity Booking Drawer */}
            <MobileAmenityBookingDrawer
                isOpen={isAmenityDrawerOpen}
                onClose={() => setIsAmenityDrawerOpen(false)}
            />
        </PullToRefresh>
    );
}
