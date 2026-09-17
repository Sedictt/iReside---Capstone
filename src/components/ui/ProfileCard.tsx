"use client";

import { useEffect, useState, useRef, useCallback, useReducer } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
    X,
    MessageSquare,
    FolderOpen,
    Wrench,
    Clock,
    ArrowUpRight,
    User,
    Settings
} from "lucide-react";
import { useProfileCard } from "@/context/ProfileCardContext";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface LeaseData {
    unitName: string | null;
    propertyName: string | null;
    rawUnitName: string | null;
    status: string | null;
    termMonths: number | null;
    expiryDate: string | null;
    monthlyRent: number | null;
}

interface LandlordData {
    propertyCount: number;
    primaryPropertyName: string | null;
}

export function ProfileCard() {
    const { 
        isOpen, 
        userId, 
        initialData, 
        position, 
        closeProfile,
        openDetailModal 
    } = useProfileCard();
    const { user: authUser } = useAuth();
    const { push } = useRouter();
    const pathname = usePathname();
    const isLandlordPortal = pathname?.startsWith('/landlord');

    const [leaseData, setLeaseData] = useState<LeaseData | null>(null);
    const [landlordData, setLandlordData] = useState<LandlordData | null>(null);
    const [leaseLoading, setLeaseLoading] = useState(false);
    const [imageError, setImageError] = useState(false);

    const cardRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Reducer for profile and loading state
    type ProfileState = { profile: Profile | null; loading: boolean };
    type ProfileAction =
        | { type: 'SET_PROFILE'; payload: Profile | null }
        | { type: 'SET_LOADING'; payload: boolean }
        | { type: 'INIT_WITH_DATA'; payload: Profile }
        | { type: 'INIT_FROM_FETCH'; payload: Profile };

    const profileReducer = (state: ProfileState, action: ProfileAction): ProfileState => {
        switch (action.type) {
            case 'SET_PROFILE':
                return { ...state, profile: action.payload };
            case 'SET_LOADING':
                return { ...state, loading: action.payload };
            case 'INIT_WITH_DATA':
                return { ...state, profile: action.payload, loading: false };
            case 'INIT_FROM_FETCH':
                return { ...state, profile: action.payload, loading: false };
            default:
                return state;
        }
    };

    const [profileState, dispatch] = useReducer(profileReducer, { profile: null, loading: false });
    const { profile, loading } = profileState;

    const isSelf = Boolean(authUser?.id && userId && authUser.id === userId);

    // Reset temporary states on open/close or user switch
    useEffect(() => {
        if (!isOpen) {
            setLeaseData(null);
            setLandlordData(null);
            setImageError(false);
        } else {
            setImageError(false);
        }
    }, [isOpen, userId]);

    // Fetch residency / portfolio data dynamically
    useEffect(() => {
        if (!isOpen || !userId) return;

        let isCancelled = false;

        const fetchResidencyData = async () => {
            setLeaseLoading(true);
            try {
                // 1. Check leases for tenant (joined with units and properties)
                const { data: leases, error: leaseErr } = await supabase
                    .from('leases')
                    .select(`
                        id,
                        status,
                        start_date,
                        end_date,
                        monthly_rent,
                        unit_id,
                        units (
                            id,
                            name,
                            properties (
                                id,
                                name
                            )
                        )
                    `)
                    .eq('tenant_id', userId)
                    .order('start_date', { ascending: false });

                if (!isCancelled && !leaseErr && leases && leases.length > 0) {
                    const activeLease = leases.find((l: any) => l.status === 'active') || leases[0];
                    const rawUnit = (activeLease as any).units;
                    const unit = Array.isArray(rawUnit) ? rawUnit[0] : rawUnit;
                    const rawProp = unit?.properties;
                    const property = Array.isArray(rawProp) ? rawProp[0] : rawProp;

                    const propertyName = property?.name || null;
                    const unitName = unit?.name || null;
                    const unitDisplayName = propertyName && unitName
                        ? `${propertyName} • Unit ${unitName}`
                        : unitName
                            ? `Unit ${unitName}`
                            : propertyName || "Assigned Unit";

                    setLeaseData({
                        unitName: unitDisplayName,
                        propertyName,
                        rawUnitName: unitName,
                        status: activeLease.status || "—",
                        termMonths: activeLease.start_date && activeLease.end_date
                            ? Math.round((new Date(activeLease.end_date).getTime() - new Date(activeLease.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))
                            : null,
                        expiryDate: activeLease.end_date,
                        monthlyRent: activeLease.monthly_rent,
                    });
                    return;
                }

                // Fallback: If joined query returned no rows or had a relational error, try direct unit query
                if (!isCancelled && (!leases || leases.length === 0 || leaseErr)) {
                    const { data: directLeases } = await supabase
                        .from('leases')
                        .select('id, status, start_date, end_date, monthly_rent, unit_id')
                        .eq('tenant_id', userId)
                        .order('start_date', { ascending: false });

                    if (!isCancelled && directLeases && directLeases.length > 0) {
                        const activeLease = directLeases.find((l: any) => l.status === 'active') || directLeases[0];
                        let unitName: string | null = null;
                        let propertyName: string | null = null;

                        if (activeLease.unit_id) {
                            const { data: unitData } = await supabase
                                .from('units')
                                .select('name, property_id')
                                .eq('id', activeLease.unit_id)
                                .maybeSingle();

                            if (unitData) {
                                unitName = unitData.name;
                                if (unitData.property_id) {
                                    const { data: propData } = await supabase
                                        .from('properties')
                                        .select('name')
                                        .eq('id', unitData.property_id)
                                        .maybeSingle();
                                    if (propData) {
                                        propertyName = propData.name;
                                    }
                                }
                            }
                        }

                        const unitDisplayName = propertyName && unitName
                            ? `${propertyName} • Unit ${unitName}`
                            : unitName
                                ? `Unit ${unitName}`
                                : propertyName || "Assigned Unit";

                        setLeaseData({
                            unitName: unitDisplayName,
                            propertyName,
                            rawUnitName: unitName,
                            status: activeLease.status || "—",
                            termMonths: activeLease.start_date && activeLease.end_date
                                ? Math.round((new Date(activeLease.end_date).getTime() - new Date(activeLease.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))
                                : null,
                            expiryDate: activeLease.end_date,
                            monthlyRent: activeLease.monthly_rent,
                        });
                        return;
                    }
                }

                // 2. Check if user is a landlord managing properties
                const { data: properties, error: propErr } = await supabase
                    .from('properties')
                    .select('id, name')
                    .eq('landlord_id', userId);

                if (!isCancelled && !propErr && properties && properties.length > 0) {
                    setLandlordData({
                        propertyCount: properties.length,
                        primaryPropertyName: properties[0].name,
                    });
                    setLeaseData(null);
                    return;
                }

                if (!isCancelled) {
                    setLeaseData(null);
                    setLandlordData(null);
                }
            } catch (err) {
                console.error('[ProfileCard] error fetching residency data:', err);
                if (!isCancelled) {
                    setLeaseData(null);
                    setLandlordData(null);
                }
            } finally {
                if (!isCancelled) {
                    setLeaseLoading(false);
                }
            }
        };

        void fetchResidencyData();

        return () => {
            isCancelled = true;
        };
    }, [isOpen, userId, supabase]);

    // Fetch user profile data
    useEffect(() => {
        if (!isOpen || !userId) return;

        let isCancelled = false;

        const fetchProfileData = async () => {
            if (initialData) {
                dispatch({ type: 'INIT_WITH_DATA', payload: initialData as Profile });
            } else {
                dispatch({ type: 'SET_LOADING', payload: true });
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (!isCancelled && !error && data) {
                    dispatch({ type: 'INIT_FROM_FETCH', payload: data as Profile });
                }
            } catch (err) {
                console.error('[ProfileCard] error fetching profile:', err);
            } finally {
                if (!isCancelled) {
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            }
        };

        void fetchProfileData();

        return () => {
            isCancelled = true;
        };
    }, [isOpen, userId, initialData, supabase]);

    const handleMessage = useCallback(() => {
        if (!userId) return;
        closeProfile();
        const basePath = isLandlordPortal ? '/landlord/messages' : '/tenant/messages';
        push(`${basePath}?to=${userId}`);
    }, [userId, closeProfile, push, isLandlordPortal]);

    const handleViewDocuments = useCallback(() => {
        if (!userId) return;
        closeProfile();
        if (isLandlordPortal) {
            if (isSelf) {
                push('/landlord/documents');
            } else {
                openDetailModal(userId, 'documents');
            }
        } else {
            push('/tenant/lease');
        }
    }, [userId, closeProfile, push, isLandlordPortal, isSelf, openDetailModal]);

    const handleMaintenance = useCallback(() => {
        if (!userId) return;
        closeProfile();
        if (isLandlordPortal) {
            push(isSelf ? '/landlord/maintenance' : `/landlord/maintenance?tenant=${userId}`);
        } else {
            push('/tenant/maintenance');
        }
    }, [userId, closeProfile, push, isLandlordPortal, isSelf]);

    const handleActivity = useCallback(() => {
        if (!userId) return;
        closeProfile();
        if (isLandlordPortal) {
            if (isSelf) {
                push('/landlord/dashboard');
            } else {
                openDetailModal(userId, 'activity');
            }
        } else {
            push('/tenant/dashboard');
        }
    }, [userId, closeProfile, push, isLandlordPortal, isSelf, openDetailModal]);

    const handleOpenPortfolio = useCallback(() => {
        closeProfile();
        if (isSelf) {
            push(isLandlordPortal ? '/landlord/profile' : '/tenant/profile');
        } else if (profile?.role === 'landlord') {
            push('/landlord/profile');
        } else {
            push(isLandlordPortal ? `/landlord/tenants?highlight=${userId}` : '/tenant/profile');
        }
    }, [closeProfile, push, isLandlordPortal, isSelf, profile?.role, userId]);

    if (!isOpen) return null;

    const initials = profile?.full_name
        ?.split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join("") || "??";

    const isLandlord = profile?.role === 'landlord';

    const getStatusColor = (status?: string | null) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'text-emerald-500';
            case 'pending':
            case 'pending_signature':
            case 'countersigning':
                return 'text-amber-500';
            case 'expired':
            case 'terminated':
                return 'text-rose-500';
            default:
                return 'text-muted-foreground';
        }
    };

    const { top, left } = (() => {
        if (typeof window === 'undefined') return { top: 0, left: 0 };
        const GAP = 15;
        const cardWidth = 400;
        const cardHeight = 480;
        let t = (position?.y ?? 0) + GAP;
        let l = (position?.x ?? 0) + GAP;
        if (l + cardWidth > window.innerWidth) l = (position?.x ?? 0) - cardWidth - GAP;
        if (t + cardHeight > window.innerHeight) t = (position?.y ?? 0) - cardHeight - GAP;
        return { 
            top: Math.max(10, Math.min(t, window.innerHeight - cardHeight - 10)),
            left: Math.max(10, Math.min(l, window.innerWidth - cardWidth - 10))
        };
    })();

    return (
        <LazyMotion features={domAnimation}>
            <AnimatePresence>
                <div className="fixed inset-0 z-[1000] pointer-events-none">
                    <div className="absolute inset-0 pointer-events-auto" onClick={closeProfile} />

                    <m.div
                        ref={cardRef}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        style={{ top, left, width: 400 }}
                        className={cn(
                            "pointer-events-auto absolute overflow-hidden rounded-[2.5rem] border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl neumorphic-panel"
                        )}
                    >
                        <div className="p-8 pb-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-5">
                                    <div 
                                        className="relative size-20 shrink-0 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-border/60 neumorphic-inset-card"
                                        style={{ backgroundColor: profile?.avatar_bg_color || '#8B5CF6' }}
                                    >
                                        {profile?.avatar_url && !imageError ? (
                                            <Image 
                                                src={profile.avatar_url} 
                                                alt={profile.full_name || "User"} 
                                                fill 
                                                sizes="80px" 
                                                className="object-cover" 
                                                unoptimized 
                                                onError={() => setImageError(true)}
                                            />
                                        ) : (
                                            <span className="text-2xl font-black text-white/90">{initials}</span>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full border-4 border-card bg-emerald-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-2xl font-normal tracking-tight text-foreground truncate">
                                            {loading && !profile ? <Skeleton className="h-7 w-32" /> : (profile?.full_name || "Resident")}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="text-sm text-muted-foreground font-medium truncate">
                                                {isLandlord
                                                    ? "Property Owner"
                                                    : leaseData?.propertyName
                                                        ? `${leaseData.propertyName} Resident`
                                                        : "Resident"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={closeProfile} 
                                    className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                    aria-label="Close profile card"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        <div className="px-8 pb-4 space-y-3">
                            {isLandlord ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl neumorphic-inset p-4 border border-border/50">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Portfolio</p>
                                        <div className="text-sm font-black text-foreground truncate" title={landlordData?.primaryPropertyName || "Managed Property"}>
                                            {leaseLoading && !landlordData ? (
                                                <Skeleton className="h-4 w-20" />
                                            ) : landlordData?.primaryPropertyName ? (
                                                landlordData.propertyCount > 1 
                                                    ? `${landlordData.primaryPropertyName} (+${landlordData.propertyCount - 1})`
                                                    : landlordData.primaryPropertyName
                                            ) : (
                                                "Property Owner"
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl neumorphic-inset p-4 border border-border/50">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Account Role</p>
                                        <div className="text-sm font-black text-emerald-500 capitalize flex items-center gap-1.5">
                                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                            <span>Verified Owner</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl neumorphic-inset p-4 border border-border/50">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Current Unit</p>
                                        <div className="text-sm font-black text-foreground truncate" title={leaseData?.unitName || "No assigned unit"}>
                                            {leaseLoading && !leaseData ? (
                                                <Skeleton className="h-4 w-20" />
                                            ) : (
                                                leaseData?.unitName || "Not Assigned"
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl neumorphic-inset p-4 border border-border/50">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Lease Status</p>
                                        <div className={cn("text-sm font-black capitalize flex items-center gap-1.5", getStatusColor(leaseData?.status))}>
                                            {leaseLoading && !leaseData ? (
                                                <Skeleton className="h-4 w-16" />
                                            ) : leaseData?.status ? (
                                                <>
                                                    <span className={cn(
                                                        "size-1.5 rounded-full shrink-0",
                                                        leaseData.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-current"
                                                    )} />
                                                    <span>{leaseData.status.replace(/_/g, ' ')}</span>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground">No Lease</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {leaseData?.termMonths && leaseData.monthlyRent ? (
                                <div className="rounded-2xl neumorphic-inset p-4 border border-border/30 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Lease Term</p>
                                        <p className="text-xs font-black text-foreground">{leaseData.termMonths} Month Term</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-foreground">₱{leaseData.monthlyRent.toLocaleString()}</p>
                                        <p className="text-[10px] text-muted-foreground">Monthly Rent</p>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Action Buttons Row */}
                        {isSelf ? (
                            <div className="px-8 pb-6 flex items-center gap-3">
                                <button
                                    onClick={handleOpenPortfolio}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-full neumorphic-primary py-4 px-6 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 active:scale-[0.98]"
                                >
                                    <User className="size-4" />
                                    View Full Profile
                                    <ArrowUpRight className="size-4" />
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleViewDocuments}
                                        className="flex size-[52px] items-center justify-center rounded-full neumorphic-extruded border border-border text-foreground hover:text-primary transition-all active:scale-[0.92]"
                                        title="View Documents & Leases"
                                    >
                                        <FolderOpen className="size-5" />
                                    </button>
                                    <button
                                        onClick={handleMaintenance}
                                        className="flex size-[52px] items-center justify-center rounded-full neumorphic-extruded border border-border text-foreground hover:text-primary transition-all active:scale-[0.92]"
                                        title="Maintenance"
                                    >
                                        <Wrench className="size-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            closeProfile();
                                            push(isLandlordPortal ? '/landlord/settings' : '/tenant/settings');
                                        }}
                                        className="flex size-[52px] items-center justify-center rounded-full neumorphic-extruded border border-border text-foreground hover:text-primary transition-all active:scale-[0.92]"
                                        title="Account Settings"
                                    >
                                        <Settings className="size-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="px-8 pb-4 flex items-center gap-3">
                                    <button
                                        onClick={handleMessage}
                                        disabled={!userId}
                                        className="flex-1 flex items-center justify-center gap-3 rounded-full neumorphic-primary py-4 px-6 text-base font-medium text-primary-foreground transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <MessageSquare className="size-5" />
                                        Message
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleViewDocuments}
                                            className="flex size-[52px] items-center justify-center rounded-full neumorphic-extruded border border-border text-foreground hover:text-primary transition-all active:scale-[0.92]"
                                            title="View Documents"
                                        >
                                            <FolderOpen className="size-5" />
                                        </button>
                                        <button
                                            onClick={handleMaintenance}
                                            className="flex size-[52px] items-center justify-center rounded-full neumorphic-extruded border border-border text-foreground hover:text-primary transition-all active:scale-[0.92]"
                                            title="Maintenance"
                                        >
                                            <Wrench className="size-5" />
                                        </button>
                                        <button
                                            onClick={handleActivity}
                                            className="flex size-[52px] items-center justify-center rounded-full neumorphic-extruded border border-border text-foreground hover:text-primary transition-all active:scale-[0.92]"
                                            title="Activity Log"
                                        >
                                            <Clock className="size-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="px-8 pb-6">
                                    <button
                                        onClick={handleOpenPortfolio}
                                        className="w-full flex items-center justify-center gap-3 rounded-2xl neumorphic-extruded border border-border/70 px-6 py-3.5 text-sm font-semibold text-primary transition-all hover:bg-muted/40 active:scale-[0.98] group"
                                    >
                                        Open Full Profile
                                        <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </button>
                                </div>
                            </>
                        )}
                    </m.div>
                </div>
            </AnimatePresence>
        </LazyMotion>
    );
}
