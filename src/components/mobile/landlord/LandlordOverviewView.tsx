'use client';

import { useState, useEffect, useMemo, useReducer, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { m as motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
    CreditCard,
    Wrench,
    AlertTriangle,
    CheckCircle2,
    MessageSquare,
    Zap,
    Building2,
    QrCode,
    Banknote,
    UserPlus,
    FilePlus2,
    TrendingDown,
    RefreshCw,
    Check,
    ArrowUpRight,
    ShieldCheck,
    X,
    Camera,
    ChevronRight,
    Bed,
    ArrowRight,
    ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageContext } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import { useBrand } from '@/context/BrandContext';
import { useNotifications } from '@/context/NotificationContext';
import { useTimeFormat } from '@/hooks/useTimeFormat';
import { readViewCache, writeViewCache, fetchJsonDeduped } from '@/lib/mobile/view-cache';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';
import { ActionRequired } from '@/components/landlord/dashboard/ActionRequired';
import { MobilePaymentDrawer } from '@/components/mobile/landlord/MobilePaymentDrawer';
import { MobileVacantUnitsDrawer } from '@/components/mobile/landlord/MobileVacantUnitsDrawer';
import { QuickToolsFab } from '@/components/mobile/landlord/QuickToolsFab';
import { triggerHaptic } from '@/lib/haptics';
import { MobileCollectPaymentDrawer } from '@/components/mobile/landlord/MobileCollectPaymentDrawer';
import { MobileIssueInvoiceDrawer } from '@/components/mobile/landlord/MobileIssueInvoiceDrawer';
import { MobileRecordExpenseDrawer } from '@/components/mobile/landlord/MobileRecordExpenseDrawer';
import { WalkInApplicationModal } from '@/components/landlord/applications/WalkInApplicationModal';
import { TenantInviteManager } from '@/components/landlord/applications/TenantInviteManager';
import { LobbyFlyerModal } from '@/components/landlord/flyer/LobbyFlyerModal';
import { LandlordWelcomeLightbox } from '@/components/landlord/dashboard/LandlordWelcomeLightbox';
import { BannerCustomizerModal, DEFAULT_BANNER_URL } from '@/components/landlord/dashboard/BannerCustomizerModal';
import { getSafeAvatarBgColor, DEFAULT_AVATAR_URL } from '@/lib/constants';
import { ART } from '@/lib/art/abstract-art';

type PaymentCategory = 'Overdue' | 'Near Due' | 'Paid';

type PaymentListItem = {
    id: string;
    tenant: string;
    unit: string;
    amount: number;
    status: PaymentCategory;
    date: string;
    avatar: string | null;
    avatarBgColor: string | null;
};

type PaymentsState = {
    paymentsByCategory: Record<PaymentCategory, PaymentListItem[]>;
    loading: boolean;
    error: string | null;
};

type PaymentsAction =
    | { type: 'LOAD_START' }
    | { type: 'LOAD_SUCCESS'; payload: Record<PaymentCategory, PaymentListItem[]> }
    | { type: 'LOAD_ERROR'; error: string }
    | { type: 'RESET' };

function paymentsReducer(state: PaymentsState, action: PaymentsAction): PaymentsState {
    switch (action.type) {
        case 'LOAD_START':
            return { ...state, loading: true, error: null };
        case 'LOAD_SUCCESS':
            return { ...state, loading: false, error: null, paymentsByCategory: action.payload };
        case 'LOAD_ERROR':
            return { ...state, loading: false, error: action.error };
        case 'RESET':
            return { ...state, paymentsByCategory: { Overdue: [], 'Near Due': [], Paid: [] }, loading: false, error: null };
        default:
            return state;
    }
}

const OPEN_UNIT_STATUSES = ['available', 'vacant', 'open', 'listed'];
const INACTIVE_INVITE_STATUSES = ['expired', 'revoked', 'inactive', 'disabled', 'cancelled'];
const FALLBACK_AVATAR = DEFAULT_AVATAR_URL || ART.avatar;

type OverviewUnit = {
    id: string;
    name: string;
    rent_amount: number;
    property_id: string;
    property_name: string;
    property_address?: string;
    property_image?: string | null;
    status?: string;
    has_ongoing_application?: boolean;
    ongoing_application_status?: string | null;
};

type OverviewInvite = {
    id: string;
    mode: 'property' | 'unit';
    applicationType: 'online' | 'face_to_face';
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
};

type OverviewSnapshot = {
    paymentsByCategory: Record<PaymentCategory, PaymentListItem[]>;
    availableUnits: OverviewUnit[];
    tenantInvites: OverviewInvite[];
    pendingMoveOutCount: number;
    pendingRenewalsCount: number;
};

const getManilaTime = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));

/**
 * Ticking Manila clock, isolated in its own component so the per-second update
 * re-renders only these few nodes instead of the entire dashboard tree.
 * Ticks on the minute boundary since seconds are not displayed.
 */
function useManilaNow() {
    const [now, setNow] = useState<Date>(() => getManilaTime());
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        const tick = () => setNow(getManilaTime());
        const msToNextMinute = 60_000 - (Date.now() % 60_000);
        const timeout = setTimeout(() => {
            tick();
            interval = setInterval(tick, 60_000);
        }, msToNextMinute);
        return () => {
            clearTimeout(timeout);
            if (interval) clearInterval(interval);
        };
    }, []);
    return now;
}

function ManilaDateLabel() {
    const { locale } = useLanguageContext();
    const now = useManilaNow();
    return <span>{now.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}</span>;
}

function ManilaClockButton() {
    const { t } = useLanguageContext();
    const { is24Hour, formatTimeParts, toggleTimeFormat } = useTimeFormat();
    const now = useManilaNow();
    const { hours, minutes, period } = formatTimeParts(now);
    return (
        <button
            type="button"
            onClick={toggleTimeFormat}
            className="m-pill m-pill-ghost py-1 px-2.5 text-[11px] font-mono tabular-nums select-none active:scale-95 transition-all min-h-[28px] cursor-pointer"
            title={is24Hour ? t('Tap to switch to 12-hour format') : t('Tap to switch to 24-hour format')}
            aria-label={t("Digital clock toggle")}
        >
            <span>{hours}:{minutes}</span>
            {period ? (
                <span className="text-[10px] opacity-85">{period}</span>
            ) : (
                <span className="text-[10px] opacity-85">24H</span>
            )}
        </button>
    );
}

const PAYMENT_CATEGORIES: Array<{ key: PaymentCategory; label: string; hint: string; emptyState: string; tone: string; dot: string }> = [
    {
        key: 'Overdue',
        label: 'Unpaid Rent',
        hint: 'Unpaid after due date',
        emptyState: 'No overdue rent',
        tone: 'text-red-500',
        dot: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]',
    },
    {
        key: 'Near Due',
        label: 'Due in 7 Days',
        hint: 'Invoices due this week',
        emptyState: 'No rent due this week',
        tone: 'text-amber-500',
        dot: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
    },
    {
        key: 'Paid',
        label: 'Recently Paid',
        hint: 'Confirmed settlements',
        emptyState: 'No recent payments',
        tone: 'text-emerald-500',
        dot: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
    },
];

export function LandlordOverviewView() {
    const { profile, user } = useAuth();
    const { properties, selectedPropertyId } = useProperty();
    const brand = useBrand();
    const { counts } = useNotifications();
    const { t } = useLanguageContext();
    const shouldReduceMotion = useReducedMotion();

    // Snapshot of the last loaded dashboard data for this property scope.
    // Lets the tab render instantly when revisited; it still revalidates on mount.
    const overviewCacheKey = `landlord-overview:${selectedPropertyId || 'all'}`;
    const cachedOverview = readViewCache<OverviewSnapshot>(overviewCacheKey);

    // Progressive Disclosure Tab State (matching desktop simplicity)
    const [activeDashboardTab, setActiveDashboardTab] = useState<'cash-flow' | 'utilities' | 'renewals'>('cash-flow');

    // Active Banner with BrandContext & LocalStorage Persistence
    const [activeBanner, setActiveBanner] = useState<string>(() => {
        if (brand.bannerUrl) return brand.bannerUrl;
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('ireside_landlord_custom_banner_url');
                if (saved) return saved;
            } catch {
                // Ignore storage errors
            }
        }
        return DEFAULT_BANNER_URL;
    });

    useEffect(() => {
        if (brand.bannerUrl) {
            setActiveBanner(brand.bannerUrl);
            return;
        }
        try {
            const saved = localStorage.getItem('ireside_landlord_custom_banner_url');
            if (saved) {
                setActiveBanner(saved);
                return;
            }
        } catch {
            // Ignore storage errors
        }
        setActiveBanner(DEFAULT_BANNER_URL);
    }, [brand.bannerUrl]);

    // Modals and Drawers State
    const [openPaymentModal, setOpenPaymentModal] = useState<PaymentCategory | null>(null);
    const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
    const [selectedWalkInUnitId, setSelectedWalkInUnitId] = useState<string | undefined>(undefined);
    const [isVacantUnitsModalOpen, setIsVacantUnitsModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);
    const [isCollectPaymentModalOpen, setIsCollectPaymentModalOpen] = useState(false);
    const [collectPaymentInvoiceId, setCollectPaymentInvoiceId] = useState<string | null>(null);
    const [isIssueInvoiceDrawerOpen, setIsIssueInvoiceDrawerOpen] = useState(false);
    const [isRecordExpenseDrawerOpen, setIsRecordExpenseDrawerOpen] = useState(false);
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

    // Payments, Units, Invites data state
    const [paymentsState, dispatchPayments] = useReducer(paymentsReducer, undefined, () => ({
        paymentsByCategory: cachedOverview?.paymentsByCategory ?? { Overdue: [], 'Near Due': [], Paid: [] },
        loading: !cachedOverview,
        error: null,
    }));
    const [loadingUnits, setLoadingUnits] = useState(!cachedOverview);
    const [loadingInvites, setLoadingInvites] = useState(!cachedOverview);
    const [pendingMoveOutCount, setPendingMoveOutCount] = useState(cachedOverview?.pendingMoveOutCount ?? 0);
    const [pendingRenewalsCount, setPendingRenewalsCount] = useState(cachedOverview?.pendingRenewalsCount ?? 0);
    const [availableUnits, setAvailableUnits] = useState<OverviewUnit[]>(cachedOverview?.availableUnits ?? []);
    const [tenantInvites, setTenantInvites] = useState<OverviewInvite[]>(cachedOverview?.tenantInvites ?? []);

    // Greeting name
    const rawName =
        profile?.full_name ||
        user?.user_metadata?.first_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        '';
    const firstName = rawName.trim() ? rawName.trim().split(' ')[0] : t('Landlord');
    const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    // Fetch all real-time dashboard data. When a snapshot is already on screen this
    // runs as a silent background refresh: failed requests keep the last good values
    // instead of blanking the dashboard.
    const loadRequestRef = useRef(0);
    const loadAll = async () => {
        const requestId = ++loadRequestRef.current;
        const cacheKey = overviewCacheKey;
        const previous = readViewCache<OverviewSnapshot>(cacheKey);
        try {
            const queryParam = selectedPropertyId && selectedPropertyId !== 'all'
                ? `?propertyId=${selectedPropertyId}`
                : '';

            const [paymentsRes, unitsRes, invitesRes, moveOutRes, renewalsRes] = await Promise.allSettled([
                fetchJsonDeduped(`/api/landlord/payments/overview${queryParam}`),
                fetchJsonDeduped('/api/landlord/property-units'),
                fetchJsonDeduped('/api/landlord/invites'),
                fetchJsonDeduped('/api/landlord/move-out?status=pending'),
                fetchJsonDeduped('/api/landlord/renewals?status=pending'),
            ]);

            // A newer load (e.g. property switch) superseded this one.
            if (requestId !== loadRequestRef.current) return;

            const snapshot: OverviewSnapshot = {
                paymentsByCategory: previous?.paymentsByCategory ?? { Overdue: [], 'Near Due': [], Paid: [] },
                availableUnits: previous?.availableUnits ?? [],
                tenantInvites: previous?.tenantInvites ?? [],
                pendingMoveOutCount: previous?.pendingMoveOutCount ?? 0,
                pendingRenewalsCount: previous?.pendingRenewalsCount ?? 0,
            };

            if (paymentsRes.status === 'fulfilled') {
                const payload = paymentsRes.value;
                snapshot.paymentsByCategory = {
                    Overdue: payload.payments?.Overdue ?? [],
                    'Near Due': payload.payments?.['Near Due'] ?? [],
                    Paid: payload.payments?.Paid ?? [],
                };
                dispatchPayments({ type: 'LOAD_SUCCESS', payload: snapshot.paymentsByCategory });
            } else if (previous) {
                dispatchPayments({ type: 'LOAD_SUCCESS', payload: previous.paymentsByCategory });
            } else {
                dispatchPayments({ type: 'LOAD_ERROR', error: 'Unable to load payments' });
            }

            if (unitsRes.status === 'fulfilled') {
                const data = unitsRes.value;
                const options = Array.isArray(data.properties) ? data.properties : [];
                const unitsList: OverviewUnit[] = options.flatMap((property: any) => {
                    const units = Array.isArray(property.units) ? property.units : [];
                    return units.map((unit: any) => ({
                        id: unit.id,
                        name: unit.name,
                        rent_amount: Number(unit.rentAmount ?? 0),
                        property_id: property.id,
                        property_name: property.name,
                        property_address: property.address,
                        property_image: property.image ?? null,
                        status: unit.status,
                        has_ongoing_application: Boolean(unit.hasOngoingApplication),
                        ongoing_application_status: unit.ongoingApplicationStatus ?? null,
                    }));
                });
                snapshot.availableUnits = unitsList;
                setAvailableUnits(unitsList);
            }
            setLoadingUnits(false);

            if (invitesRes.status === 'fulfilled') {
                const payload = invitesRes.value;
                snapshot.tenantInvites = Array.isArray(payload.invites) ? payload.invites : [];
            }
            setTenantInvites(snapshot.tenantInvites);
            setLoadingInvites(false);

            if (moveOutRes.status === 'fulfilled' && Array.isArray(moveOutRes.value)) {
                const list = moveOutRes.value;
                snapshot.pendingMoveOutCount = (!selectedPropertyId || selectedPropertyId === 'all')
                    ? list.length
                    : list.filter((r: any) => r.lease?.unit?.property?.id === selectedPropertyId || r.property_id === selectedPropertyId).length;
            }
            setPendingMoveOutCount(snapshot.pendingMoveOutCount);

            if (renewalsRes.status === 'fulfilled' && Array.isArray(renewalsRes.value)) {
                const list = renewalsRes.value;
                snapshot.pendingRenewalsCount = (!selectedPropertyId || selectedPropertyId === 'all')
                    ? list.length
                    : list.filter((r: any) => r.current_lease?.unit?.property?.id === selectedPropertyId || r.current_lease?.unit?.property_id === selectedPropertyId).length;
            }
            setPendingRenewalsCount(snapshot.pendingRenewalsCount);

            // Only cache when the core payload succeeded, so a failed refresh never
            // becomes the "last good" snapshot.
            if (paymentsRes.status === 'fulfilled' || unitsRes.status === 'fulfilled') {
                writeViewCache(cacheKey, snapshot);
            }
        } catch (err) {
            console.error('[MobileOverview] Error loading data:', err);
        }
    };

    useEffect(() => {
        const snapshot = readViewCache<OverviewSnapshot>(overviewCacheKey);
        if (snapshot) {
            // Show the cached dashboard for this scope immediately, then refresh silently.
            dispatchPayments({ type: 'LOAD_SUCCESS', payload: snapshot.paymentsByCategory });
            setAvailableUnits(snapshot.availableUnits);
            setTenantInvites(snapshot.tenantInvites);
            setPendingMoveOutCount(snapshot.pendingMoveOutCount);
            setPendingRenewalsCount(snapshot.pendingRenewalsCount);
            setLoadingUnits(false);
            setLoadingInvites(false);
        } else {
            dispatchPayments({ type: 'LOAD_START' });
            setLoadingUnits(true);
            setLoadingInvites(true);
        }
        void loadAll();
    }, [selectedPropertyId]);

    // Computed counts
    const filteredUnits = useMemo(() => {
        if (!selectedPropertyId || selectedPropertyId === 'all') return availableUnits;
        return availableUnits.filter((unit) => unit.property_id === selectedPropertyId);
    }, [availableUnits, selectedPropertyId]);

    const vacantUnitsList = useMemo(() => {
        return filteredUnits.filter((unit) => {
            const statusKey = String(unit.status ?? '').toLowerCase().trim();
            const isOpenStatus = OPEN_UNIT_STATUSES.includes(statusKey);
            const hasOngoingApp = Boolean(unit.has_ongoing_application);
            return isOpenStatus && !hasOngoingApp;
        });
    }, [filteredUnits]);

    const openUnitsCount = vacantUnitsList.length;
    const totalUnits = filteredUnits.length;
    const occupiedUnits = Math.max(0, totalUnits - openUnitsCount);
    const occupancyPercentage = totalUnits > 0
        ? Math.min(100, Math.round((occupiedUnits / totalUnits) * 100))
        : 0;

    const overdueCount = paymentsState.paymentsByCategory.Overdue.length;
    const nearDueCount = paymentsState.paymentsByCategory['Near Due'].length;
    const hasOverdue = overdueCount > 0;

    const overdueAmount = useMemo(() => {
        return paymentsState.paymentsByCategory.Overdue.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, [paymentsState.paymentsByCategory.Overdue]);

    const maintenanceCount = counts?.maintenance ?? 0;
    const needsAttention = hasOverdue || maintenanceCount > 0 || pendingMoveOutCount > 0 || pendingRenewalsCount > 0;
    const isRoomsEmpty = totalUnits === 0;
    const isRentPaymentsEmpty = !loadingUnits && (totalUnits === 0 || (occupiedUnits === 0 && !hasOverdue && paymentsState.paymentsByCategory.Paid.length === 0 && paymentsState.paymentsByCategory['Near Due'].length === 0));

    const filteredInvites = useMemo(() => {
        if (!selectedPropertyId || selectedPropertyId === "all") return tenantInvites;
        return tenantInvites.filter(i => i.propertyId === selectedPropertyId);
    }, [tenantInvites, selectedPropertyId]);

    // Popout payment action card state
    const [selectedActionPayment, setSelectedActionPayment] = useState<PaymentListItem | null>(null);
    const [isConfirmingAction, setIsConfirmingAction] = useState(false);

    return (
        <PullToRefresh onRefresh={loadAll} className="h-full flex flex-col">
            <div className="flex-1 min-h-0 flex flex-col gap-4 px-3.5 pt-2.5 pb-28 overflow-y-auto custom-scrollbar-premium">
                {/* 1. Property Selector (Context Switcher) */}
                <div className="shrink-0">
                    <MobilePropertySelector />
                </div>

                {/* 2. Hero Card (Compacted height for clear visual hierarchy) */}
                <div className="m-hero group p-4 flex flex-col gap-3 shrink-0">
                    {/* Background Layer with Custom Banner */}
                    <div className="absolute inset-0 overflow-hidden rounded-[var(--m-radius-hero)] pointer-events-none">
                        <Image
                            src={activeBanner}
                            alt={t("Property Skyline")}
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, 500px"
                            className="object-cover opacity-25 mix-blend-luminosity transition-transform duration-[2000ms] group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-transparent" />
                    </div>

                    {/* Top Row: Date Pill & Manila Digital Clock + Banner Customizer */}
                    <div className="relative z-10 flex items-center justify-between gap-2">
                        <div className="m-pill m-pill-ghost gap-1.5 py-1 px-2.5 text-[11px]">
                            <span className="relative flex size-1.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-[#5ee0ea] opacity-75 animate-ping" />
                                <span className="relative inline-flex size-1.5 rounded-full bg-[#5ee0ea]" />
                            </span>
                            <ManilaDateLabel />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <ManilaClockButton />

                            <button
                                type="button"
                                onClick={() => setIsCustomizerOpen(true)}
                                className="size-7 rounded-full bg-white/20 text-inherit flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                title={t("Customize banner photo")}
                                aria-label={t("Customize banner photo")}
                            >
                                <Camera className="size-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Middle Row: Concise Greeting */}
                    <div className="relative z-10 flex flex-col gap-0.5">
                        <h1 className="m-display text-[20px] sm:text-[22px] leading-tight">
                            {t('Welcome back, {name}', { name: formattedFirstName })}
                        </h1>
                        <p className="m-hero-muted text-xs line-clamp-1">
                            {overdueCount > 0
                                ? (overdueCount > 1
                                    ? t('⚠️ {count} payments are overdue for review', { count: overdueCount })
                                    : t('⚠️ {count} payment is overdue for review', { count: overdueCount }))
                                : t("Here's what's happening with your properties today.")}
                        </p>
                    </div>

                    {/* Compact 4-Column Primary Action Grid (>= 48px Touch Target) */}
                    <div className="relative z-10 grid grid-cols-4 gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setIsCollectPaymentModalOpen(true);
                            }}
                            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/15 hover:bg-white/25 py-2 px-1.5 min-h-[48px] active:scale-95 transition-all text-inherit cursor-pointer"
                        >
                            <Banknote className="size-[18px]" />
                            <span className="text-[11px] font-bold leading-none">{t("Record")}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setSelectedWalkInUnitId(undefined);
                                setIsWalkInModalOpen(true);
                            }}
                            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/15 hover:bg-white/25 py-2 px-1.5 min-h-[48px] active:scale-95 transition-all text-inherit cursor-pointer"
                        >
                            <UserPlus className="size-[18px]" />
                            <span className="text-[11px] font-bold leading-none">{t("New App")}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setIsInviteModalOpen(true);
                            }}
                            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/15 hover:bg-white/25 py-2 px-1.5 min-h-[48px] active:scale-95 transition-all text-inherit cursor-pointer"
                        >
                            <QrCode className="size-[18px]" />
                            <span className="text-[11px] font-bold leading-none">{t("Invite")}</span>
                        </button>

                        <Link
                            href="/mobile/landlord/applications"
                            onClick={() => triggerHaptic('light')}
                            className="relative flex flex-col items-center justify-center gap-1 rounded-xl bg-white/15 hover:bg-white/25 py-2 px-1.5 min-h-[48px] active:scale-95 transition-all text-inherit cursor-pointer"
                        >
                            {(counts?.applications ?? 0) > 0 && (
                                <span
                                    aria-label={t('{count} pending applications', { count: counts.applications })}
                                    className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold tabular-nums flex items-center justify-center shadow-xs"
                                >
                                    {counts.applications}
                                </span>
                            )}
                            <ClipboardCheck className="size-[18px]" />
                            <span className="text-[11px] font-bold leading-none">{t("Applications")}</span>
                        </Link>
                    </div>
                </div>

                {/* 3. Today's Overview (Adapted Desktop SeniorOverviewHub Look & Compact Hierarchy) */}
                <section aria-label={t("Today's Overview")} className="flex flex-col gap-2.5 shrink-0">
                    <div className="flex items-center justify-between px-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                                {t("Today's Overview")}
                            </h2>
                            {needsAttention ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                    <span className="relative flex size-1.5 shrink-0" aria-hidden="true">
                                        <span className="animate-ping motion-reduce:hidden absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-60" />
                                        <span className="relative inline-flex rounded-full size-1.5 bg-rose-600 dark:bg-rose-400" />
                                    </span>
                                    <span>{t("Needs Attention")}</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                                    <span>{t("All Good! No Issues Today")}</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Primary Focal Card: Rent Payments (Exact Desktop SeniorOverviewHub Look) */}
                    <div
                        className={cn(
                            "group/hero relative rounded-2xl p-4 overflow-hidden flex flex-col justify-between transition-all duration-200 border",
                            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_4px_14px_-4px_rgba(0,0,0,0.12)]",
                            isRentPaymentsEmpty
                                ? "bg-slate-900 dark:bg-zinc-800/90 text-white border-slate-800 dark:border-zinc-700"
                                : "bg-primary text-primary-foreground border-primary/30"
                        )}
                    >
                        {/* Directional depth gradient */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/28 via-transparent to-white/14" aria-hidden="true" />

                        {/* Tactile architectural grid & dot-node surface texture */}
                        <div className="overview-grid-texture-hero pointer-events-none absolute inset-0" aria-hidden="true" />

                        {/* Periodic satin light sheen */}
                        {!shouldReduceMotion && (
                            <motion.div
                                initial={{ x: "-140%" }}
                                animate={{ x: "420%" }}
                                transition={{
                                    duration: 1.4,
                                    delay: 0.6,
                                    repeat: Infinity,
                                    repeatDelay: 5,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                                aria-hidden="true"
                            />
                        )}

                        <div className="relative z-10">
                            {/* Top Meta Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className={cn(
                                    "flex items-center gap-2",
                                    isRentPaymentsEmpty ? "text-slate-200" : "text-primary-foreground/90"
                                )}>
                                    <div className={cn(
                                        "flex size-7 items-center justify-center rounded-lg border shadow-2xs",
                                        isRentPaymentsEmpty ? "bg-white/10 border-white/15" : "bg-black/15 border-white/15"
                                    )}>
                                        <CreditCard className="size-3.5 shrink-0" aria-hidden="true" />
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider">
                                        {t("Rent Payments")}
                                    </span>
                                </div>

                                {hasOverdue ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-rose-700 shadow-xs">
                                        <span className="relative flex size-1.5 shrink-0" aria-hidden="true">
                                            <span className="animate-ping motion-reduce:hidden absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                                            <span className="relative inline-flex rounded-full size-1.5 bg-rose-600" />
                                        </span>
                                        <span>
                                            {overdueCount === 1
                                                ? t("{count} tenant has not paid", { count: overdueCount })
                                                : t("{count} tenants have not paid", { count: overdueCount })}
                                        </span>
                                    </span>
                                ) : isRentPaymentsEmpty ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-slate-200 border border-white/10">
                                        <span className="size-1.5 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
                                        <span>{totalUnits === 0 ? t("No properties added yet") : t("No active tenants yet")}</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-black/15 text-primary-foreground border border-white/15">
                                        <CheckCircle2 className="size-3 shrink-0" aria-hidden="true" />
                                        <span>{t("All rent paid on time")}</span>
                                    </span>
                                )}
                            </div>

                            {/* Compact Hero Metric */}
                            <div className="my-3 space-y-0.5">
                                <p className={cn(
                                    "text-[11px] font-medium",
                                    isRentPaymentsEmpty ? "text-slate-300" : "text-primary-foreground/80"
                                )}>
                                    {hasOverdue ? t("Unpaid Rent") : t("Unpaid Balance")}
                                </p>
                                <div className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums leading-none">
                                    {hasOverdue
                                        ? `₱${overdueAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : "₱0.00"}
                                </div>
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className={cn(
                            "relative z-10 pt-3 border-t flex flex-wrap items-center gap-2",
                            isRentPaymentsEmpty ? "border-white/15" : "border-primary-foreground/15"
                        )}>
                            {hasOverdue ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setOpenPaymentModal('Overdue');
                                        }}
                                        className="group flex-1 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-primary-foreground hover:opacity-95 text-primary shadow-xs transition-all active:scale-[0.98] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <span>{t("View Unpaid Rent")}</span>
                                        <ArrowRight className="size-3.5 transition-transform motion-reduce:transition-none group-hover:translate-x-0.5" aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setIsCollectPaymentModalOpen(true);
                                        }}
                                        className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-black/15 hover:bg-black/25 text-primary-foreground border border-primary-foreground/20 transition-all active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Banknote className="size-3.5" aria-hidden="true" />
                                        <span>{t("Record Payment")}</span>
                                    </button>
                                </>
                            ) : isRentPaymentsEmpty ? (
                                totalUnits === 0 ? (
                                    <Link
                                        href="/landlord/properties/new"
                                        className="group min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 shadow-xs transition-all active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <span>{t("Add Property")}</span>
                                        <ArrowRight className="size-3.5" aria-hidden="true" />
                                    </Link>
                                ) : (
                                    <Link
                                        href="/mobile/landlord/tenants"
                                        className="group min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 shadow-xs transition-all active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <span>{t("Add First Tenant")}</span>
                                        <ArrowRight className="size-3.5" aria-hidden="true" />
                                    </Link>
                                )
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setIsCollectPaymentModalOpen(true);
                                    }}
                                    className="group min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-primary-foreground hover:opacity-95 text-primary shadow-xs transition-all active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>{t("Record Payment")}</span>
                                    <ArrowRight className="size-3.5" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stacked Compact Secondary Cards (Exact Desktop SeniorOverviewHub Look) */}
                    <div className="flex flex-col gap-2.5">
                        {/* ROW 1: Room Occupancy */}
                        <div className="relative overflow-hidden rounded-2xl bg-card dark:bg-zinc-900 border border-border p-3.5 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] flex flex-col justify-between gap-2.5">
                            <div className="overview-grid-texture-surface pointer-events-none absolute inset-0" aria-hidden="true" />

                            <div className="relative z-10 flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <div className="flex size-6 items-center justify-center rounded-md bg-muted/80 border border-border text-foreground/80">
                                            <Bed className="size-3.5 shrink-0" aria-hidden="true" />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider">
                                            {t("Room Occupancy")}
                                        </span>
                                    </div>

                                    <div className="flex items-baseline gap-1.5 tabular-nums">
                                        {isRoomsEmpty ? (
                                            <span className="text-xl sm:text-2xl font-black tracking-tight text-muted-foreground">
                                                0 {t("of")} 0
                                            </span>
                                        ) : (
                                            <>
                                                <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                                    {occupiedUnits}
                                                </span>
                                                <span className="text-xs font-semibold text-muted-foreground">
                                                    {t("of")} {totalUnits}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isRoomsEmpty ? (
                                    <Link
                                        href="/mobile/landlord/unit-map"
                                        className="group min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold bg-muted/60 hover:bg-muted text-foreground border border-border transition-all active:scale-[0.98] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                                    >
                                        <span>{t("Set Up Rooms")}</span>
                                        <ArrowRight className="size-3.5" aria-hidden="true" />
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setIsVacantUnitsModalOpen(true);
                                        }}
                                        className="group min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold bg-muted/60 hover:bg-muted text-foreground border border-border transition-all active:scale-[0.98] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                                    >
                                        <span>{t("View Empty Rooms")}</span>
                                        <ArrowRight className="size-3.5" aria-hidden="true" />
                                    </button>
                                )}
                            </div>

                            <div className="relative z-10 space-y-1.5">
                                <div className="h-1.5 w-full rounded-full bg-muted/80 border border-border/50 overflow-hidden" aria-hidden="true">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-500"
                                        style={{ width: `${occupancyPercentage}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    {isRoomsEmpty ? (
                                        <span className="font-medium text-muted-foreground">
                                            {t("No rooms added yet")}
                                        </span>
                                    ) : openUnitsCount > 0 ? (
                                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                            <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" aria-hidden="true" />
                                            <span>{openUnitsCount} {t(openUnitsCount === 1 ? "room ready for move-in" : "rooms ready for move-in")}</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                                            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                                            <span>{t("All rooms occupied")}</span>
                                        </span>
                                    )}
                                    {!isRoomsEmpty && (
                                        <span className="font-mono text-[11px] font-semibold text-muted-foreground tabular-nums">
                                            {occupancyPercentage}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: Repairs & Maintenance */}
                        <div className="relative overflow-hidden rounded-2xl bg-card dark:bg-zinc-900 border border-border p-3.5 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] flex items-center justify-between gap-3">
                            <div className="overview-grid-texture-surface pointer-events-none absolute inset-0" aria-hidden="true" />

                            <div className="relative z-10 space-y-1 min-w-0">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <div className="flex size-6 items-center justify-center rounded-md bg-muted/80 border border-border text-foreground/80">
                                        <Wrench className="size-3.5 shrink-0" aria-hidden="true" />
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider">
                                        {t("Repairs & Maintenance")}
                                    </span>
                                </div>

                                <div className="flex items-baseline gap-1.5 tabular-nums">
                                    <span className={cn(
                                        "text-xl sm:text-2xl font-black tracking-tight",
                                        maintenanceCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                                    )}>
                                        {maintenanceCount}
                                    </span>
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        {t("Open Requests")}
                                    </span>
                                </div>

                                <div>
                                    {maintenanceCount > 0 ? (
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                            <span className="relative flex size-1.5 shrink-0" aria-hidden="true">
                                                <span className="animate-ping motion-reduce:hidden absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-65" />
                                                <span className="relative inline-flex rounded-full size-1.5 bg-amber-500" />
                                            </span>
                                            <span>{t("Needs landlord review")}</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                                            <span>{t("All repairs resolved")}</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Link
                                href="/mobile/landlord/tickets"
                                onClick={() => triggerHaptic('light')}
                                className="relative z-10 group min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold bg-muted/60 hover:bg-muted text-foreground border border-border transition-all active:scale-[0.98] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                                <span>{t("View Repair Requests")}</span>
                                <ArrowRight className="size-3.5" aria-hidden="true" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* 4. Progressive Disclosure Tabs (Eliminating Endless Scrolling) */}
                <div className="flex flex-col gap-3 shrink-0 pt-1">
                    {/* Segmented Tab Switcher — 3 equal stacked columns prevent horizontal overflow on narrow phones */}
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-muted/50 border border-border/60 w-full shrink-0 select-none">
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setActiveDashboardTab('cash-flow');
                            }}
                            className={cn(
                                'relative flex flex-col items-center justify-center gap-1 py-2 px-1.5 min-h-[54px] rounded-xl text-[11px] font-bold leading-[1.15] text-center transition-all active:scale-[0.98] cursor-pointer',
                                activeDashboardTab === 'cash-flow'
                                    ? 'bg-card text-foreground shadow-xs border border-border/60'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <CreditCard className={cn('size-4 shrink-0', activeDashboardTab === 'cash-flow' ? 'text-primary' : 'text-muted-foreground')} />
                            <span className="break-words">{t('Rent & Payments')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setActiveDashboardTab('utilities');
                            }}
                            className={cn(
                                'relative flex flex-col items-center justify-center gap-1 py-2 px-1.5 min-h-[54px] rounded-xl text-[11px] font-bold leading-[1.15] text-center transition-all active:scale-[0.98] cursor-pointer',
                                activeDashboardTab === 'utilities'
                                    ? 'bg-card text-foreground shadow-xs border border-border/60'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Zap className={cn('size-4 shrink-0', activeDashboardTab === 'utilities' ? 'text-amber-500' : 'text-muted-foreground')} />
                            <span className="break-words">{t('Water & Electricity')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setActiveDashboardTab('renewals');
                            }}
                            className={cn(
                                'relative flex flex-col items-center justify-center gap-1 py-2 px-1.5 min-h-[54px] rounded-xl text-[11px] font-bold leading-[1.15] text-center transition-all active:scale-[0.98] cursor-pointer',
                                activeDashboardTab === 'renewals'
                                    ? 'bg-card text-foreground shadow-xs border border-border/60'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {pendingRenewalsCount + pendingMoveOutCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tabular-nums">
                                    {pendingRenewalsCount + pendingMoveOutCount}
                                </span>
                            )}
                            <RefreshCw className={cn('size-4 shrink-0', activeDashboardTab === 'renewals' ? 'text-primary' : 'text-muted-foreground')} />
                            <span className="break-words">{t('Contracts & Tasks')}</span>
                        </button>
                    </div>

                    {/* Tab 1: Rent & Payments */}
                    {activeDashboardTab === 'cash-flow' && (
                        <div className="flex flex-col gap-3.5 animate-in fade-in duration-200">
                            <div className="m-card p-4 border border-border/60 rounded-2xl flex flex-col gap-3.5 shadow-xs">
                                {/* Header (Full width so title and subtitle never truncate) */}
                                <div className="flex items-center gap-3 w-full">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/15 shrink-0">
                                        <CreditCard className="size-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-bold text-foreground leading-snug">{t('Rent & Payments')}</h3>
                                        <p className="text-xs text-muted-foreground leading-snug">{t('Unpaid, due soon, and settled rent')}</p>
                                    </div>
                                </div>

                                {/* 3 Quick Action Buttons — Equal 3-column grid with >= 44px touch targets */}
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setIsIssueInvoiceDrawerOpen(true);
                                        }}
                                        className="px-2 py-2 min-h-[44px] rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                                        aria-label={t('Issue invoice')}
                                    >
                                        <FilePlus2 className="size-3.5 shrink-0" />
                                        <span className="truncate">{t('Issue Bill')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setIsRecordExpenseDrawerOpen(true);
                                        }}
                                        className="px-2 py-2 min-h-[44px] rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                                        aria-label={t('Record expense')}
                                    >
                                        <TrendingDown className="size-3.5 shrink-0" />
                                        <span className="truncate">{t('Expense')}</span>
                                    </button>
                                    <Link
                                        href="/mobile/landlord/payments"
                                        className="px-2 py-2 min-h-[44px] rounded-xl text-xs font-bold bg-muted/70 hover:bg-muted text-foreground border border-border flex items-center justify-center gap-1 active:scale-95 transition-all"
                                    >
                                        <span className="truncate">{t('All Bills')}</span>
                                        <ArrowUpRight className="size-3.5 shrink-0" />
                                    </Link>
                                </div>

                                {/* 3 Payment Category Status Tiles */}
                                <div className="grid grid-cols-3 gap-2">
                                    {PAYMENT_CATEGORIES.map(({ key, label, dot, tone }) => {
                                        const items = paymentsState.paymentsByCategory[key] ?? [];
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => {
                                                    triggerHaptic('light');
                                                    setOpenPaymentModal(key);
                                                }}
                                                className="p-3 rounded-xl bg-muted/35 hover:bg-muted/55 border border-border/60 flex flex-col items-center justify-between text-center active:scale-95 transition-all min-h-[82px] cursor-pointer"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn('size-2 rounded-full shrink-0', dot)} aria-hidden="true" />
                                                    <span className={cn('text-[11px] font-bold tracking-tight truncate', tone)}>
                                                        {t(key)}
                                                    </span>
                                                </div>
                                                <h4 className="text-xl font-black text-foreground my-0.5 tabular-nums">
                                                    {paymentsState.loading ? '…' : items.length}
                                                </h4>
                                                <span className="text-[11px] text-muted-foreground font-semibold">{t('View list')}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Recent Payment Activity / Preview Card */}
                                <div className="pt-2 border-t border-border/40">
                                    <p className="text-xs font-bold text-muted-foreground mb-2">{t('Recent Activity')}</p>
                                    {paymentsState.loading ? (
                                        <div className="p-3 rounded-2xl bg-muted/20 animate-pulse flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-muted/40 shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 w-1/2 rounded bg-muted/40" />
                                                <div className="h-2 w-1/3 rounded bg-muted/30" />
                                            </div>
                                        </div>
                                    ) : paymentsState.paymentsByCategory.Overdue[0] ? (
                                        <PaymentCard
                                            payment={paymentsState.paymentsByCategory.Overdue[0]}
                                            fallbackAvatar={FALLBACK_AVATAR}
                                            onClick={() => setSelectedActionPayment(paymentsState.paymentsByCategory.Overdue[0])}
                                        />
                                    ) : paymentsState.paymentsByCategory['Near Due'][0] ? (
                                        <PaymentCard
                                            payment={paymentsState.paymentsByCategory['Near Due'][0]}
                                            fallbackAvatar={FALLBACK_AVATAR}
                                            onClick={() => setSelectedActionPayment(paymentsState.paymentsByCategory['Near Due'][0])}
                                        />
                                    ) : paymentsState.paymentsByCategory.Paid[0] ? (
                                        <PaymentCard
                                            payment={paymentsState.paymentsByCategory.Paid[0]}
                                            fallbackAvatar={FALLBACK_AVATAR}
                                            onClick={() => setSelectedActionPayment(paymentsState.paymentsByCategory.Paid[0])}
                                        />
                                    ) : (
                                        <div className="p-4 rounded-2xl bg-muted/20 text-center text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                                            <CheckCircle2 className="size-6 text-emerald-500 opacity-80" />
                                            <p className="text-xs font-bold text-foreground">{t('All Good! No Issues Today')}</p>
                                            <p className="text-[11px] text-muted-foreground">{t('No pending or overdue rent records.')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Water & Electricity */}
                    {activeDashboardTab === 'utilities' && (
                        <div className="flex flex-col gap-3.5 animate-in fade-in duration-200">
                            <div className="m-card p-4 border border-border/60 rounded-2xl flex flex-col gap-3.5 shadow-xs">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                                            <Zap className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-foreground leading-snug">{t('Water & Electricity')}</h3>
                                            <p className="text-xs text-muted-foreground leading-snug">{t('Monthly Submeter Cycle')}</p>
                                        </div>
                                    </div>
                                    <span className="m-pill m-pill-amber text-[10px] py-1 px-2.5 shrink-0">
                                        {t('Active')}
                                    </span>
                                </div>

                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t('Record water and electric meter readings, calculate monthly consumption, and bill residents automatically.')}
                                </p>

                                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border/40">
                                    <Link
                                        href="/mobile/utilities?tab=verify"
                                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border text-xs font-bold active:scale-95 transition-all text-center min-h-[44px]"
                                    >
                                        <span>{t('Review Payments')}</span>
                                        <ArrowUpRight className="size-4 shrink-0" />
                                    </Link>
                                    <Link
                                        href="/mobile/utilities"
                                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-all text-center min-h-[44px] shadow-xs"
                                    >
                                        <Zap className="size-4 shrink-0" />
                                        <span>{t('Record Readings')}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Contracts & Tasks */}
                    {activeDashboardTab === 'renewals' && (
                        <div className="flex flex-col gap-3.5 animate-in fade-in duration-200">
                            <div className="m-card p-4 border border-border/60 rounded-2xl flex flex-col gap-3.5 shadow-xs">
                                <div className="flex items-center gap-3 w-full">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                                        <RefreshCw className="size-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-bold text-foreground leading-snug">{t('Contracts & Tasks')}</h3>
                                        <p className="text-xs text-muted-foreground leading-snug">{t('Review lease contracts and tenant requests.')}</p>
                                    </div>
                                </div>

                                <Link
                                    href="/mobile/landlord/leases?tab=renewals"
                                    className="w-full py-2.5 px-4 min-h-[44px] rounded-xl text-xs font-bold bg-muted/70 hover:bg-muted text-foreground border border-border flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                                >
                                    <span>{t('View All Contracts')}</span>
                                    <ArrowUpRight className="size-4 shrink-0" />
                                </Link>
                            </div>

                            {/* Live Task Operations Queue */}
                            <div className="pt-1">
                                <ActionRequired variant="mobile" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Peeking Edge Quick Tools FAB + Bottom Sheet */}
            <QuickToolsFab onOpenFlyer={() => setIsFlyerModalOpen(true)} />

            {/* Welcome Lightbox */}
            <LandlordWelcomeLightbox />

            {/* Modals, Drawers and Overlays */}
            <MobilePaymentDrawer
                isOpen={openPaymentModal !== null}
                onClose={() => setOpenPaymentModal(null)}
                category={openPaymentModal}
                paymentsByCategory={paymentsState.paymentsByCategory}
                onPaymentSettled={() => {
                    void loadAll();
                }}
                onRecordPayment={(invoiceId) => {
                    setOpenPaymentModal(null);
                    setCollectPaymentInvoiceId(invoiceId);
                    setIsCollectPaymentModalOpen(true);
                }}
            />

            <WalkInApplicationModal
                isOpen={isWalkInModalOpen}
                onClose={() => {
                    setIsWalkInModalOpen(false);
                    setSelectedWalkInUnitId(undefined);
                }}
                units={filteredUnits}
                selectedUnitId={selectedWalkInUnitId}
                onSuccess={() => {
                    setSelectedWalkInUnitId(undefined);
                    void loadAll();
                }}
            />

            <MobileVacantUnitsDrawer
                isOpen={isVacantUnitsModalOpen}
                onClose={() => setIsVacantUnitsModalOpen(false)}
                units={vacantUnitsList}
                onStartWalkIn={(unitId) => {
                    setSelectedWalkInUnitId(unitId);
                    setIsWalkInModalOpen(true);
                }}
            />

            {/* Tenant Referral Invite Manager Bottom Sheet */}
            <AnimatePresence>
                {isInviteModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsInviteModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="relative z-10 w-full max-w-lg max-h-[88vh] rounded-t-[2.5rem] border-t border-border/80 bg-card text-card-foreground shadow-2xl flex flex-col overflow-hidden"
                        >
                            <div className="pt-3 pb-1 shrink-0 flex justify-center">
                                <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                            </div>
                            <div className="px-5 pt-2 pb-3.5 border-b border-border/50 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="size-10 rounded-2xl bg-violet-500/15 text-violet-500 border border-violet-500/20 flex items-center justify-center shrink-0">
                                        <QrCode className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base font-bold text-foreground truncate">
                                            {t('Private Referral Link')}
                                        </h2>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {t('Generate referral tokens for applicant intake')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="size-9 min-h-[36px] min-w-[36px] rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95 shrink-0"
                                    aria-label={t("Close sheet")}
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar-premium">
                                <TenantInviteManager
                                    availableUnits={filteredUnits}
                                    invites={filteredInvites}
                                    onRefresh={async () => {
                                        try {
                                            const response = await fetch("/api/landlord/invites");
                                            if (!response.ok) return;
                                            const payload = (await response.json()) as { invites?: typeof tenantInvites };
                                            setTenantInvites(Array.isArray(payload.invites) ? payload.invites : []);
                                        } catch {}
                                    }}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Collect / Record Payment Modal */}
            <MobileCollectPaymentDrawer
                isOpen={isCollectPaymentModalOpen}
                initialInvoiceId={collectPaymentInvoiceId}
                onClose={() => {
                    setIsCollectPaymentModalOpen(false);
                    setCollectPaymentInvoiceId(null);
                }}
                onPaymentRecorded={() => {
                    void loadAll();
                }}
            />

            {/* Mobile Issue Invoice Drawer */}
            <MobileIssueInvoiceDrawer
                isOpen={isIssueInvoiceDrawerOpen}
                onClose={() => setIsIssueInvoiceDrawerOpen(false)}
                onIssued={() => {
                    void loadAll();
                }}
                propertyId={selectedPropertyId}
            />

            {/* Mobile Record Expense Drawer */}
            <MobileRecordExpenseDrawer
                isOpen={isRecordExpenseDrawerOpen}
                onClose={() => setIsRecordExpenseDrawerOpen(false)}
                onSaved={() => {
                    void loadAll();
                }}
                propertyId={selectedPropertyId}
            />

            {/* Lobby QR Code Flyer Generator Modal */}
            <LobbyFlyerModal
                isOpen={isFlyerModalOpen}
                onClose={() => setIsFlyerModalOpen(false)}
            />

            {/* Property Banner Customizer Modal */}
            <BannerCustomizerModal
                isOpen={isCustomizerOpen}
                onClose={() => setIsCustomizerOpen(false)}
                currentBanner={activeBanner}
                onBannerChange={(url: string) => {
                    setActiveBanner(url);
                    try {
                        localStorage.setItem('ireside_landlord_custom_banner_url', url);
                    } catch {
                        // Ignore storage error
                    }
                }}
            />

            {/* Mobile Payment Card Detail Bottom Sheet */}
            <AnimatePresence>
                {selectedActionPayment && (
                    <div className="fixed inset-0 z-[150] flex items-end justify-center p-0">
                        <button
                            aria-label={t('Close')}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => {
                                setSelectedActionPayment(null);
                                setIsConfirmingAction(false);
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="relative z-10 w-full max-w-lg rounded-t-[2.5rem] border-t border-border bg-card p-6 shadow-2xl"
                        >
                            {!isConfirmingAction ? (
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="relative size-14 rounded-full flex items-center justify-center overflow-hidden border-2 border-background/50 shadow-xs"
                                                style={{ backgroundColor: getSafeAvatarBgColor((selectedActionPayment as any).avatarBgColor) }}
                                            >
                                                {selectedActionPayment.avatar ? (
                                                    <Image
                                                        src={selectedActionPayment.avatar}
                                                        alt={selectedActionPayment.tenant}
                                                        fill
                                                        sizes="56px"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xl font-black text-white">{selectedActionPayment.tenant.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground truncate">{selectedActionPayment.tenant}</h3>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">{t('Unit {unit}', { unit: selectedActionPayment.unit })}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedActionPayment(null)}
                                            className="size-8 flex items-center justify-center rounded-full bg-muted/40 text-muted-foreground hover:text-foreground cursor-pointer"
                                            aria-label={t('Close')}
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>

                                    <div className="rounded-2xl bg-muted/30 p-4 border border-border/50">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-primary">{t("Settlement Due")}</span>
                                            <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                                                {t(selectedActionPayment.status)}
                                            </span>
                                        </div>
                                        <h4 className="text-2xl font-black text-foreground tabular-nums">PHP {selectedActionPayment.amount.toLocaleString()}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">{t('Due date: {date}', { date: selectedActionPayment.date })}</p>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <Link
                                            href="/mobile/landlord/messages"
                                            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-bold active:scale-95 transition-all"
                                        >
                                            <MessageSquare className="size-4 text-primary" />
                                            <span>{t('Message')}</span>
                                        </Link>
                                        <button
                                            onClick={() => setIsConfirmingAction(true)}
                                            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer"
                                        >
                                            <CheckCircle2 className="size-4" />
                                            <span>{t('Settle')}</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 text-center py-2">
                                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                                        <AlertTriangle className="size-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-foreground">{t("Confirm Settlement")}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {t('Make sure that the tenant has paid rent. Verify bank or GCash proof of payment.')}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 pt-2">
                                        <button
                                            onClick={() => {
                                                const targetId = selectedActionPayment.id;
                                                setSelectedActionPayment(null);
                                                setIsConfirmingAction(false);
                                                setCollectPaymentInvoiceId(targetId);
                                                setIsCollectPaymentModalOpen(true);
                                            }}
                                            className="w-full min-h-[44px] rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider active:scale-95 transition-all shadow-xs cursor-pointer"
                                        >
                                            {t('Complete Settlement')}
                                        </button>
                                        <button
                                            onClick={() => setIsConfirmingAction(false)}
                                            className="w-full min-h-[44px] rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-bold active:scale-95 transition-all cursor-pointer"
                                        >
                                            {t('Go Back')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PullToRefresh>
    );
}

function PaymentCard({
    payment,
    fallbackAvatar,
    onClick,
}: {
    payment: PaymentListItem;
    fallbackAvatar: string;
    onClick?: () => void;
}) {
    const { t } = useLanguageContext();
    const { tenant, unit, amount, status, date, avatar } = payment;
    const isPaid = status === 'Paid';
    const isNearDue = status === 'Near Due';

    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-2xl p-3.5 m-card border border-border/50 active:scale-[0.98] transition-all text-left min-h-[56px]"
        >
            <div className="flex items-center gap-3 relative z-10 min-w-0 flex-1 mr-2">
                <div className="relative shrink-0">
                    <div
                        className="relative size-11 rounded-full border-2 border-background/50 overflow-hidden shadow-xs"
                        style={{ backgroundColor: getSafeAvatarBgColor((payment as any).avatarBgColor) }}
                    >
                        <Image src={avatar || fallbackAvatar} alt="" fill sizes="44px" className="object-cover" />
                    </div>
                    <div
                        className={cn(
                            'absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-background',
                            isPaid
                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                : isNearDue
                                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                        )}
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {tenant}
                    </h4>
                    <p className="text-xs font-semibold text-muted-foreground truncate">{t('Unit {unit}', { unit })}</p>
                </div>
            </div>

            <div className="text-right relative z-10 flex flex-col items-end shrink-0">
                <h4 className="text-sm font-bold text-foreground whitespace-nowrap tabular-nums">PHP {amount.toLocaleString()}</h4>
                <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap mt-0.5">{date}</span>
            </div>
        </button>
    );
}
