'use client';

import { useState, useEffect, useMemo, useReducer } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    Wrench,
    Users,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    MessageSquare,
    Zap,
    Building2,
    QrCode,
    Printer,
    Map,
    HelpCircle,
    Banknote,
    UserPlus,
    RefreshCw,
    SlidersHorizontal,
    EyeOff,
    RotateCcw,
    Check,
    Plus,
    ArrowUpRight,
    ShieldCheck,
    Pencil,
    FolderOpen,
    X,
    Camera,
    FolderSearch2,
    Calendar,
    ChevronRight,
    GripVertical,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import { useBrand } from '@/context/BrandContext';
import { useTimeFormat } from '@/hooks/useTimeFormat';
import { useQuickActions } from '@/hooks/useQuickActions';
import {
    DEFAULT_QUICK_ACTIONS,
    type QuickActionId,
    type QuickActionItem,
} from '@/lib/landlord/quick-actions';
import { SortableActionCard } from '@/components/landlord/dashboard/SortableActionCard';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';
import { ActionRequired } from '@/components/landlord/dashboard/ActionRequired';
import { PaymentModal } from '@/components/landlord/dashboard/PaymentModal';
import { CollectPaymentModal } from '@/components/landlord/dashboard/CollectPaymentModal';
import { WalkInApplicationModal } from '@/components/landlord/applications/WalkInApplicationModal';
import { VacantUnitsModal } from '@/components/landlord/dashboard/VacantUnitsModal';
import { TenantInviteManager } from '@/components/landlord/applications/TenantInviteManager';
import { LobbyFlyerModal } from '@/components/landlord/flyer/LobbyFlyerModal';
import { LandlordWelcomeLightbox } from '@/components/landlord/dashboard/LandlordWelcomeLightbox';
import { BannerCustomizerModal, DEFAULT_BANNER_URL } from '@/components/landlord/dashboard/BannerCustomizerModal';

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
const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80';

const PAYMENT_CATEGORIES: Array<{ key: PaymentCategory; label: string; hint: string; emptyState: string; tone: string; dot: string }> = [
    {
        key: 'Overdue',
        label: 'Past Due Rent',
        hint: 'Unpaid after due date',
        emptyState: 'No overdue rent',
        tone: 'text-red-500',
        dot: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]',
    },
    {
        key: 'Near Due',
        label: 'Due in Next 7 Days',
        hint: 'Pending invoices due soon',
        emptyState: 'No rent due this week',
        tone: 'text-amber-500',
        dot: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
    },
    {
        key: 'Paid',
        label: 'Recently Paid Rent',
        hint: 'Latest confirmed payments',
        emptyState: 'No recent payments',
        tone: 'text-emerald-500',
        dot: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
    },
];

export function LandlordOverviewView() {
    const { profile, user } = useAuth();
    const { properties, selectedPropertyId } = useProperty();
    const brand = useBrand();
    const { is24Hour, formatTimeParts, toggleTimeFormat } = useTimeFormat();

    // Live Manila Clock
    const getManilaTime = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const [currentTime, setCurrentTime] = useState<Date>(() => getManilaTime());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(getManilaTime()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { hours, minutes, period } = formatTimeParts(currentTime);

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

    // Modals state
    const [openPaymentModal, setOpenPaymentModal] = useState<PaymentCategory | null>(null);
    const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
    const [selectedWalkInUnitId, setSelectedWalkInUnitId] = useState<string | undefined>(undefined);
    const [isVacantUnitsModalOpen, setIsVacantUnitsModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);
    const [isCollectPaymentModalOpen, setIsCollectPaymentModalOpen] = useState(false);
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

    // Payments, Units, Invites data state
    const [paymentsState, dispatchPayments] = useReducer(paymentsReducer, {
        paymentsByCategory: { Overdue: [], 'Near Due': [], Paid: [] },
        loading: true,
        error: null,
    });
    const [loadingUnits, setLoadingUnits] = useState(true);
    const [loadingInvites, setLoadingInvites] = useState(true);
    const [availableUnits, setAvailableUnits] = useState<Array<{
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
    }>>([]);
    const [tenantInvites, setTenantInvites] = useState<Array<{
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
    }>>([]);

    // Quick actions catalog tailored for mobile
    const mobileActionsCatalog = useMemo(() => {
        return DEFAULT_QUICK_ACTIONS.map(action => {
            if (action.id === 'invoice-ledger') return { ...action, href: '/mobile/landlord/payments' };
            if (action.id === 'maintenance-desk') return { ...action, href: '/mobile/landlord/tickets' };
            return action;
        });
    }, []);

    const {
        config,
        displayedActions,
        hiddenActions,
        isCustomizing,
        startCustomizing,
        finishCustomizing,
        reorderActions,
        toggleVisibility,
        restoreAll,
        setSortMode,
        trackActionUsage,
        resetToDefaults,
    } = useQuickActions(mobileActionsCatalog);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            reorderActions(active.id as QuickActionId, over.id as QuickActionId);
        }
    };

    // User greeting name
    const rawName =
        profile?.full_name ||
        user?.user_metadata?.first_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        '';
    const firstName = rawName.trim() ? rawName.trim().split(' ')[0] : 'Landlord';
    const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    // Fetch all real-time dashboard data
    const loadAll = async () => {
        try {
            const queryParam = selectedPropertyId && selectedPropertyId !== 'all'
                ? `?propertyId=${selectedPropertyId}`
                : '';

            const [paymentsRes, unitsRes, invitesRes] = await Promise.allSettled([
                fetch(`/api/landlord/payments/overview${queryParam}`).then(r => r.ok ? r.json() : Promise.reject(r)),
                fetch('/api/landlord/properties/overview').then(r => r.ok ? r.json() : Promise.reject(r)),
                fetch('/api/landlord/invites').then(r => r.ok ? r.json() : Promise.reject(r)),
            ]);

            if (paymentsRes.status === 'fulfilled') {
                const payload = paymentsRes.value;
                dispatchPayments({
                    type: 'LOAD_SUCCESS',
                    payload: {
                        Overdue: payload.payments?.Overdue ?? [],
                        'Near Due': payload.payments?.['Near Due'] ?? [],
                        Paid: payload.payments?.Paid ?? [],
                    },
                });
            } else {
                dispatchPayments({ type: 'LOAD_ERROR', error: 'Unable to load payments' });
            }

            if (unitsRes.status === 'fulfilled') {
                const data = unitsRes.value;
                const options = Array.isArray(data.properties) ? data.properties : [];
                const unitsList = options.flatMap((property: any) => {
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
                setAvailableUnits(unitsList);
            }
            setLoadingUnits(false);

            if (invitesRes.status === 'fulfilled') {
                const payload = invitesRes.value;
                setTenantInvites(Array.isArray(payload.invites) ? payload.invites : []);
            } else {
                setTenantInvites([]);
            }
            setLoadingInvites(false);
        } catch (err) {
            console.error('[MobileOverview] Error loading data:', err);
        }
    };

    useEffect(() => {
        dispatchPayments({ type: 'LOAD_START' });
        setLoadingUnits(true);
        setLoadingInvites(true);
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

    const filteredInvites = useMemo(() => {
        if (!selectedPropertyId || selectedPropertyId === "all") return tenantInvites;
        return tenantInvites.filter(i => i.propertyId === selectedPropertyId);
    }, [tenantInvites, selectedPropertyId]);

    const activeInviteCount = useMemo(() => {
        return filteredInvites.filter((invite) => {
            const normalizedStatus = String(invite.status || '').toLowerCase().trim();
            const isExplicitlyInactive = INACTIVE_INVITE_STATUSES.includes(normalizedStatus);
            const isExpired = invite.expiresAt ? new Date(invite.expiresAt).getTime() < Date.now() : false;
            const isExhausted = invite.maxUses > 0 && invite.useCount >= invite.maxUses;
            return !isExplicitlyInactive && !isExpired && !isExhausted;
        }).length;
    }, [filteredInvites]);

    const overdueCount = paymentsState.paymentsByCategory.Overdue.length;
    const nearDueCount = paymentsState.paymentsByCategory['Near Due'].length;

    // Popout payment action card state
    const [selectedActionPayment, setSelectedActionPayment] = useState<PaymentListItem | null>(null);
    const [isConfirmingAction, setIsConfirmingAction] = useState(false);

    return (
        <PullToRefresh onRefresh={loadAll} className="h-full flex flex-col">
            <div className="flex-1 min-h-0 flex flex-col gap-4 px-3.5 pt-2.5 pb-6 overflow-y-auto custom-scrollbar-premium">
                {/* 1. Property Selector */}
                <div className="shrink-0">
                    <MobilePropertySelector />
                </div>

                {/* 2. Hero Card with Branded Background & Mobile Digital Clock */}
                <div className="group relative rounded-[2rem] neumorphic-panel p-4 flex flex-col gap-3.5 shadow-sm shrink-0 overflow-hidden">
                    {/* Background Layer with Custom Banner */}
                    <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
                        <Image
                            src={activeBanner}
                            alt="Property Skyline"
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, 500px"
                            className="object-cover opacity-40 dark:opacity-20 transition-transform duration-[2000ms] group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/90 to-background/30" />
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />
                        <div className="absolute -top-12 -right-12 size-40 rounded-full bg-primary/15 blur-[50px] pointer-events-none" />
                    </div>

                    {/* Top Row: Date Pill & Banner Customizer Trigger */}
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 rounded-full neumorphic-inset-card px-2.5 py-1">
                            <div className="relative">
                                <div className="size-1.5 rounded-full bg-primary animate-ping" />
                                <div className="absolute inset-0 size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-foreground/80">
                                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsCustomizerOpen(true)}
                            className="px-2 py-1 rounded-lg neumorphic-extruded text-[9px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-all active:scale-95"
                            title="Customize banner photo"
                        >
                            <Camera className="size-3 text-primary" />
                            <span>Banner</span>
                        </button>
                    </div>

                    {/* Middle Row: Greeting + Mobile Digital Clock */}
                    <div className="relative z-10 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground leading-tight">
                                Welcome back, {formattedFirstName}
                                <span className="text-primary prose-invert">.</span>
                            </h1>
                            <p className="text-[11px] font-medium text-muted-foreground mt-0.5 line-clamp-1">
                                {overdueCount > 0
                                    ? `⚠️ ${overdueCount} payment${overdueCount > 1 ? 's are' : ' is'} overdue for review`
                                    : "Here's what's happening with your properties today."}
                            </p>
                        </div>

                        {/* Mobile Digital Clock with 12H/24H Tap Toggle */}
                        <button
                            type="button"
                            onClick={toggleTimeFormat}
                            className="flex flex-col items-end shrink-0 select-none group active:scale-95 transition-transform"
                            title={`Click to switch to ${is24Hour ? '12-hour' : '24-hour'} format`}
                            aria-label="Digital clock toggle"
                        >
                            <div className="flex items-baseline gap-1 font-mono text-2xl sm:text-3xl font-black text-foreground tabular-nums group-hover:text-primary transition-colors">
                                <span>{hours}:{minutes}</span>
                                {period ? (
                                    <span className="text-xs font-black uppercase tracking-wider text-primary">{period}</span>
                                ) : (
                                    <span className="text-[9px] font-bold text-muted-foreground bg-muted/40 px-1 py-0.2 rounded">24H</span>
                                )}
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/60">
                                Manila Time
                            </span>
                        </button>
                    </div>

                    {/* Primary Action Buttons Row */}
                    <div className="relative z-10 grid grid-cols-2 gap-2 mt-1">
                        <button
                            onClick={() => {
                                setSelectedWalkInUnitId(undefined);
                                setIsWalkInModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 rounded-xl neumorphic-primary py-2.5 px-3 active:scale-95 transition-all text-primary-foreground font-black text-xs uppercase tracking-wider shadow-sm"
                        >
                            <UserPlus className="size-4" />
                            <span>New App</span>
                        </button>

                        <button
                            onClick={() => setIsCollectPaymentModalOpen(true)}
                            className="flex items-center justify-center gap-2 rounded-xl neumorphic-extruded border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 py-2.5 px-3 active:scale-95 transition-all text-emerald-500 font-black text-xs uppercase tracking-wider shadow-sm"
                        >
                            <Banknote className="size-4" />
                            <span>Collect</span>
                        </button>
                    </div>

                    {/* Quick Utility Icon Dock */}
                    <div className="relative z-10 flex items-center justify-between gap-1.5 pt-1 border-t border-border/40">
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            title="Generate Referral Invite Link"
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl neumorphic-extruded active:scale-95 transition-all"
                        >
                            <QrCode className="size-4 text-primary" />
                            <span className="text-[8px] font-bold text-muted-foreground">Invite</span>
                        </button>

                        <button
                            onClick={() => setIsFlyerModalOpen(true)}
                            title="Generate Lobby QR Flyer Poster"
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl neumorphic-extruded active:scale-95 transition-all"
                        >
                            <Printer className="size-4 text-foreground" />
                            <span className="text-[8px] font-bold text-muted-foreground">Flyer</span>
                        </button>

                        <Link
                            href="/mobile/landlord/tickets"
                            title="Maintenance Queue"
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl neumorphic-extruded active:scale-95 transition-all"
                        >
                            <Wrench className="size-4 text-amber-500" />
                            <span className="text-[8px] font-bold text-muted-foreground">Tickets</span>
                        </Link>

                        <Link
                            href="/landlord/unit-map"
                            title="Unit Map Visualizer"
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl neumorphic-extruded active:scale-95 transition-all"
                        >
                            <Map className="size-4 text-rose-500" />
                            <span className="text-[8px] font-bold text-muted-foreground">Unit Map</span>
                        </Link>

                        <Link
                            href="/landlord/docs"
                            title="User Manual & Docs"
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl neumorphic-extruded active:scale-95 transition-all"
                        >
                            <HelpCircle className="size-4 text-indigo-400" />
                            <span className="text-[8px] font-bold text-muted-foreground">Help</span>
                        </Link>
                    </div>
                </div>

                {/* 3. Intelligence Hub (4 Status Badges in 2x2 Grid) */}
                <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex items-center gap-2 px-1">
                        <div className="flex size-6 items-center justify-center rounded-lg neumorphic-inset-card text-primary shrink-0">
                            <ShieldCheck className="size-3.5" />
                        </div>
                        <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
                            Intelligence Hub
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        {/* Overdue */}
                        <button
                            type="button"
                            onClick={() => setOpenPaymentModal('Overdue')}
                            className="neumorphic-extruded rounded-2xl p-3 flex items-center justify-between active:scale-95 transition-all text-left group hover:border-red-500/40"
                        >
                            <div className="min-w-0">
                                <span className="text-[9px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1">
                                    <Zap className="size-2.5 text-red-500 fill-red-500" />
                                    Overdue
                                </span>
                                <h3 className="text-xl font-black text-foreground mt-0.5 tabular-nums">
                                    {paymentsState.loading ? '…' : overdueCount}
                                </h3>
                                <p className="text-[9px] text-muted-foreground truncate">Tap to review</p>
                            </div>
                            <div className="neumorphic-inset-card flex size-8 items-center justify-center rounded-xl text-red-500 shrink-0">
                                <Zap className="size-4" />
                            </div>
                        </button>

                        {/* Near Due */}
                        <button
                            type="button"
                            onClick={() => setOpenPaymentModal('Near Due')}
                            className="neumorphic-extruded rounded-2xl p-3 flex items-center justify-between active:scale-95 transition-all text-left group hover:border-amber-500/40"
                        >
                            <div className="min-w-0">
                                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                                    <TrendingUp className="size-2.5 text-amber-500" />
                                    Near Due
                                </span>
                                <h3 className="text-xl font-black text-foreground mt-0.5 tabular-nums">
                                    {paymentsState.loading ? '…' : nearDueCount}
                                </h3>
                                <p className="text-[9px] text-muted-foreground truncate">Next 7 days</p>
                            </div>
                            <div className="neumorphic-inset-card flex size-8 items-center justify-center rounded-xl text-amber-500 shrink-0">
                                <TrendingUp className="size-4" />
                            </div>
                        </button>

                        {/* Vacant */}
                        <button
                            type="button"
                            onClick={() => setIsVacantUnitsModalOpen(true)}
                            className="neumorphic-extruded rounded-2xl p-3 flex items-center justify-between active:scale-95 transition-all text-left group hover:border-sky-500/40"
                        >
                            <div className="min-w-0">
                                <span className="text-[9px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1">
                                    <Building2 className="size-2.5 text-sky-500" />
                                    Vacant
                                </span>
                                <h3 className="text-xl font-black text-foreground mt-0.5 tabular-nums">
                                    {loadingUnits ? '…' : openUnitsCount}
                                </h3>
                                <p className="text-[9px] text-muted-foreground truncate">Available units</p>
                            </div>
                            <div className="neumorphic-inset-card flex size-8 items-center justify-center rounded-xl text-sky-500 shrink-0">
                                <Building2 className="size-4" />
                            </div>
                        </button>

                        {/* Invites */}
                        <button
                            type="button"
                            onClick={() => setIsInviteModalOpen(true)}
                            className="neumorphic-extruded rounded-2xl p-3 flex items-center justify-between active:scale-95 transition-all text-left group hover:border-violet-500/40"
                        >
                            <div className="min-w-0">
                                <span className="text-[9px] font-black uppercase tracking-wider text-violet-400 flex items-center gap-1">
                                    <QrCode className="size-2.5 text-violet-500" />
                                    Invites
                                </span>
                                <h3 className="text-xl font-black text-foreground mt-0.5 tabular-nums">
                                    {loadingInvites ? '…' : activeInviteCount}
                                </h3>
                                <p className="text-[9px] text-muted-foreground truncate">Active referral tokens</p>
                            </div>
                            <div className="neumorphic-inset-card flex size-8 items-center justify-center rounded-xl text-violet-500 shrink-0">
                                <QrCode className="size-4" />
                            </div>
                        </button>
                    </div>
                </div>

                {/* 4. Smart Action Center: Next Priorities & Urgent Tasks */}
                <div className="flex flex-col gap-2 shrink-0">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
                        ACTION CENTER &amp; PRIORITIES
                    </h3>

                    <div className="flex flex-col gap-2">
                        {/* High Priority: Overdue Invoices Alert */}
                        {overdueCount > 0 ? (
                            <div className="neumorphic-panel rounded-2xl p-3 border-l-4 border-l-red-500 flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                                        High Priority
                                    </span>
                                    <h4 className="text-xs font-black text-foreground mt-1 truncate">
                                        {overdueCount} Overdue Rent Invoice{overdueCount > 1 ? 's' : ''}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground">Immediate follow-up required with tenants.</p>
                                </div>
                                <button
                                    onClick={() => setOpenPaymentModal('Overdue')}
                                    className="shrink-0 px-3 py-1.5 rounded-xl neumorphic-primary text-[10px] font-black uppercase text-primary-foreground tracking-wider active:scale-95"
                                >
                                    Review
                                </button>
                            </div>
                        ) : null}

                        {/* Medium Priority: Vacant Units Occupancy */}
                        {openUnitsCount > 0 ? (
                            <div className="neumorphic-panel rounded-2xl p-3 border-l-4 border-l-amber-500 flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                        Occupancy
                                    </span>
                                    <h4 className="text-xs font-black text-foreground mt-1 truncate">
                                        {openUnitsCount} Vacant Unit{openUnitsCount > 1 ? 's' : ''} Awaiting Residents
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground">Start walk-in application or share invite QR.</p>
                                </div>
                                <button
                                    onClick={() => setIsVacantUnitsModalOpen(true)}
                                    className="shrink-0 px-3 py-1.5 rounded-xl neumorphic-extruded text-[10px] font-black uppercase text-primary tracking-wider active:scale-95"
                                >
                                    View
                                </button>
                            </div>
                        ) : null}

                        {/* Low Priority / Healthy Check */}
                        {overdueCount === 0 && openUnitsCount === 0 ? (
                            <div className="neumorphic-panel rounded-2xl p-3 border-l-4 border-l-emerald-500 flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        System Healthy
                                    </span>
                                    <h4 className="text-xs font-black text-foreground mt-1">
                                        Every Account is Up to Date
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground">Properties are fully occupied and rents are current.</p>
                                </div>
                                <Link
                                    href="/mobile/landlord/payments"
                                    className="shrink-0 px-3 py-1.5 rounded-xl neumorphic-extruded text-[10px] font-black uppercase text-foreground tracking-wider active:scale-95"
                                >
                                    Ledger
                                </Link>
                            </div>
                        ) : null}
                    </div>

                    {/* ActionRequired Live Task Operations Queue */}
                    <div className="mt-1">
                        <ActionRequired />
                    </div>
                </div>

                {/* 5. Operations Center (Modular 2-Column App Grid) */}
                <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-primary" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                Operations Center
                            </h3>
                        </div>

                        {/* Custom / Frequent Sorting & Customize Toggle */}
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center rounded-lg neumorphic-inset p-0.5 text-[9px] font-bold">
                                <button
                                    onClick={() => setSortMode('custom')}
                                    className={cn(
                                        'px-2 py-0.5 rounded-md transition-all',
                                        config.sortMode === 'custom'
                                            ? 'bg-primary text-primary-foreground font-black shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    Custom
                                </button>
                                <button
                                    onClick={() => setSortMode('frequently_used')}
                                    className={cn(
                                        'px-2 py-0.5 rounded-md transition-all',
                                        config.sortMode === 'frequently_used'
                                            ? 'bg-primary text-primary-foreground font-black shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    Frequent
                                </button>
                            </div>

                            <button
                                onClick={isCustomizing ? finishCustomizing : startCustomizing}
                                className={cn(
                                    'px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95',
                                    isCustomizing
                                        ? 'bg-emerald-500 text-white shadow-xs'
                                        : 'neumorphic-extruded text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {isCustomizing ? <Check className="size-3" /> : <SlidersHorizontal className="size-3 text-primary" />}
                                <span>{isCustomizing ? 'Done' : 'Edit'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Customize Mode Banner */}
                    {isCustomizing && (
                        <div className="p-3 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-primary">Tap eye to hide, or drag to reorder.</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={restoreAll}
                                    className="font-bold text-muted-foreground hover:text-primary underline"
                                >
                                    Restore All
                                </button>
                                <button
                                    onClick={resetToDefaults}
                                    className="font-bold text-muted-foreground hover:text-red-400"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2-Column Action Cards Grid with DndContext */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={displayedActions.map((a) => a.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {displayedActions.map((action) => (
                                    <SortableActionCard
                                        key={action.id}
                                        action={action}
                                        isCustomizing={isCustomizing}
                                        onHide={toggleVisibility}
                                        onTrackUsage={trackActionUsage}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                {/* 6. Cash Flow Ledger Section */}
                <div className="rounded-[2rem] neumorphic-panel p-4 flex flex-col gap-3.5 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl neumorphic-inset-card text-primary shrink-0">
                                <CreditCard className="size-4" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Cash Flow Ledger</h3>
                                <p className="text-[10px] text-muted-foreground">What is overdue, due soon, and paid</p>
                            </div>
                        </div>

                        <Link
                            href="/mobile/landlord/payments"
                            className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold neumorphic-extruded text-muted-foreground hover:text-primary flex items-center gap-1 active:scale-95"
                        >
                            <span>Ledger</span>
                            <ArrowUpRight className="size-3" />
                        </Link>
                    </div>

                    {/* 3 Payment Category Tabs / Cards */}
                    <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_CATEGORIES.map(({ key, label, hint, tone }) => {
                            const items = paymentsState.paymentsByCategory[key] ?? [];
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setOpenPaymentModal(key)}
                                    className="neumorphic-inset rounded-xl p-2.5 flex flex-col items-center justify-between text-center active:scale-95 transition-all"
                                >
                                    <span className={cn('text-[9px] font-black uppercase tracking-tight', tone)}>
                                        {key}
                                    </span>
                                    <h4 className="text-base font-black text-foreground my-0.5 tabular-nums">
                                        {paymentsState.loading ? '…' : items.length}
                                    </h4>
                                    <span className="text-[8px] text-muted-foreground font-semibold">View list</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Top Payment Item Preview Card */}
                    <div className="mt-1">
                        {paymentsState.loading ? (
                            <div className="neumorphic-inset rounded-2xl p-3 animate-pulse flex items-center gap-3">
                                <div className="size-10 rounded-full neumorphic-inset shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/2 rounded bg-muted/30" />
                                    <div className="h-2 w-1/3 rounded bg-muted/20" />
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
                            <div className="neumorphic-inset rounded-2xl p-4 text-center text-muted-foreground/60">
                                <CheckCircle2 className="size-5 mx-auto mb-1 text-emerald-500 opacity-70" />
                                <p className="text-[11px] font-bold">No Pending Payments</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 7. Dedicated Operational Modules: Utility Submeters & Lease Renewals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                    {/* Utility Submeters Card */}
                    <div className="rounded-[1.75rem] neumorphic-panel p-3.5 flex flex-col justify-between gap-2.5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-xl neumorphic-inset-card text-amber-500">
                                    <Zap className="size-4" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                    Utility Submeters
                                </h3>
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground">Monthly Cycle</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Record water &amp; electric submeter readings, calculate consumption, and update active invoices.
                        </p>
                        <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                            <Link
                                href="/landlord/utility-billing?tab=verify"
                                className="flex-1 text-center py-2 rounded-xl neumorphic-extruded text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-primary active:scale-95 transition-all"
                            >
                                Verify Queue
                            </Link>
                            <Link
                                href="/landlord/utility-billing"
                                className="flex-1 text-center py-2 rounded-xl neumorphic-primary text-[10px] font-black uppercase tracking-wider text-primary-foreground active:scale-95 transition-all"
                            >
                                Record
                            </Link>
                        </div>
                    </div>

                    {/* Lease Renewals Card */}
                    <div className="rounded-[1.75rem] neumorphic-panel p-3.5 flex flex-col justify-between gap-2.5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-xl neumorphic-inset-card text-primary">
                                    <RefreshCw className="size-4" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                    Lease Renewals
                                </h3>
                            </div>
                            <span className="text-[9px] font-bold text-emerald-500">Active</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Review and manage tenant lease renewal requests, expiration dates, and tenancy extensions.
                        </p>
                        <div className="pt-1 border-t border-border/40">
                            <Link
                                href="/landlord/tenants?tab=renewals"
                                className="w-full block text-center py-2 rounded-xl neumorphic-extruded text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-primary active:scale-95 transition-all"
                            >
                                View All Renewals
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Welcome Lightbox */}
            <LandlordWelcomeLightbox />

            {/* 8. All 7 Modals and Overlays */}
            <PaymentModal
                isOpen={openPaymentModal !== null}
                onClose={() => setOpenPaymentModal(null)}
                category={openPaymentModal}
                paymentsByCategory={paymentsState.paymentsByCategory}
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
                }}
            />

            <VacantUnitsModal
                isOpen={isVacantUnitsModalOpen}
                onClose={() => setIsVacantUnitsModalOpen(false)}
                units={vacantUnitsList}
                onStartWalkIn={(unitId) => {
                    setSelectedWalkInUnitId(unitId);
                    setIsWalkInModalOpen(true);
                }}
            />

            {/* Tenant Referral Invite Manager Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-3">
                    <button
                        type="button"
                        aria-label="Close invite modal"
                        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                        onClick={() => setIsInviteModalOpen(false)}
                    />
                    <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-card shadow-2xl flex flex-col">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-card/95 px-5 py-4 backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <QrCode className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-foreground">Referral Invite Link</h2>
                                    <p className="text-[10px] text-muted-foreground">Tokens for new residents</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsInviteModalOpen(false)}
                                className="size-8 flex items-center justify-center rounded-xl border border-white/10 bg-card text-muted-foreground hover:text-foreground active:scale-95"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="p-4 max-h-[calc(90vh-80px)] overflow-y-auto custom-scrollbar-premium">
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
                    </div>
                </div>
            )}

            {/* Collect / Record Payment Modal */}
            <CollectPaymentModal
                isOpen={isCollectPaymentModalOpen}
                onClose={() => setIsCollectPaymentModalOpen(false)}
                onPaymentRecorded={() => {
                    void loadAll();
                }}
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
                                                className="relative size-14 rounded-full flex items-center justify-center overflow-hidden"
                                                style={{ backgroundColor: (selectedActionPayment as any).avatarBgColor || '#8B5CF6' }}
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
                                                <h3 className="text-lg font-black text-foreground truncate">{selectedActionPayment.tenant}</h3>
                                                <p className="text-xs font-bold text-muted-foreground uppercase">{selectedActionPayment.unit}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedActionPayment(null)}
                                            className="size-8 flex items-center justify-center rounded-full bg-muted/40 text-muted-foreground"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>

                                    <div className="rounded-2xl bg-muted/30 p-4 border border-border/50">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">Settlement Due</span>
                                            <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                                                {selectedActionPayment.status}
                                            </span>
                                        </div>
                                        <h4 className="text-2xl font-black text-foreground">PHP {selectedActionPayment.amount.toLocaleString()}</h4>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Due date: {selectedActionPayment.date}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link
                                            href="/mobile/landlord/messages"
                                            className="flex-1 flex items-center justify-center gap-2 rounded-xl neumorphic-extruded py-3 text-xs font-bold text-foreground active:scale-95"
                                        >
                                            <MessageSquare className="size-4 text-primary" />
                                            <span>Message</span>
                                        </Link>
                                        <button
                                            onClick={() => setIsConfirmingAction(true)}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-xl neumorphic-primary py-3 text-xs font-black uppercase tracking-wider text-primary-foreground active:scale-95"
                                        >
                                            <CheckCircle2 className="size-4" />
                                            <span>Settle</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 text-center py-2">
                                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                                        <AlertTriangle className="size-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-foreground">Confirm Settlement</h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Make sure that the tenant has paid rent. Verify bank or GCash proof of payment.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 pt-2">
                                        <button
                                            onClick={() => {
                                                setSelectedActionPayment(null);
                                                setIsConfirmingAction(false);
                                            }}
                                            className="w-full rounded-xl neumorphic-primary py-3 text-xs font-black uppercase tracking-wider text-primary-foreground active:scale-95"
                                        >
                                            Complete Settlement
                                        </button>
                                        <button
                                            onClick={() => setIsConfirmingAction(false)}
                                            className="w-full rounded-xl neumorphic-extruded py-3 text-xs font-bold text-muted-foreground active:scale-95"
                                        >
                                            Go Back
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
    const { tenant, unit, amount, status, date, avatar } = payment;
    const isPaid = status === 'Paid';
    const isNearDue = status === 'Near Due';

    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-2xl p-3 neumorphic-extruded active:scale-[0.98] transition-all text-left"
        >
            <div className="flex items-center gap-2.5 relative z-10 min-w-0 flex-1 mr-2">
                <div className="relative shrink-0">
                    <div
                        className="relative size-10 rounded-full border-2 border-background/50 overflow-hidden shadow-xs"
                        style={{ backgroundColor: (payment as any).avatarBgColor || '#171717' }}
                    >
                        <Image src={avatar || fallbackAvatar} alt="" fill sizes="40px" className="object-cover" />
                    </div>
                    <div
                        className={cn(
                            'absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background',
                            isPaid
                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                : isNearDue
                                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                        )}
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="truncate text-xs font-black text-foreground group-hover:text-primary transition-colors">
                        {tenant}
                    </h4>
                    <p className="text-[10px] font-semibold text-muted-foreground truncate">Unit {unit}</p>
                </div>
            </div>

            <div className="text-right relative z-10 flex flex-col items-end shrink-0">
                <h4 className="text-xs font-black text-foreground whitespace-nowrap">PHP {amount.toLocaleString()}</h4>
                <span className="text-[9px] font-semibold text-muted-foreground whitespace-nowrap mt-0.5">{date}</span>
            </div>
        </button>
    );
}
