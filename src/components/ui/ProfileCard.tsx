"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
    ShieldCheck
} from "lucide-react";
import { useProfileCard } from "@/context/ProfileCardContext";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function ProfileCard() {
    const { 
        isOpen, 
        userId, 
        initialData, 
        position, 
        closeProfile,
        openDetailModal 
    } = useProfileCard();
    const { push } = useRouter();
    const pathname = usePathname();
    const isLandlordPortal = pathname?.startsWith('/landlord');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(false);
    const [leaseData, setLeaseData] = useState<{
        unitName: string | null;
        status: string | null;
        termMonths: number | null;
        expiryDate: string | null;
        monthlyRent: number | null;
    } | null>(null);
    const [trustScore, setTrustScore] = useState<number | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        if (userId) {
            const offset = parseInt(userId.slice(-1) || '5', 16);
            setTrustScore(80 + (offset % 20));
        }
    }, [userId]);

    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchLeaseData = async () => {
            const { data, error } = await supabase
                .from('leases')
                .select(`
                    id,
                    status,
                    start_date,
                    end_date,
                    monthly_rent,
                    units (
                        unit_number,
                        properties (
                            name
                        )
                    )
                `)
                .eq('tenant_id', userId)
                .eq('status', 'active')
                .single();

            if (!error && data) {
                const unit = data.units as any;
                setLeaseData({
                    unitName: unit ? `${unit.properties?.name ?? ''} ${unit.unit_number ?? ''}`.trim() : null,
                    status: data.status,
                    termMonths: data.start_date && data.end_date
                        ? Math.round((new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))
                        : null,
                    expiryDate: data.end_date,
                    monthlyRent: data.monthly_rent,
                });
            }
        };

        fetchLeaseData();
    }, [isOpen, userId, supabase]);

    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchProfileData = async () => {
            if (initialData) {
                setProfile(initialData as Profile);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (!error && data) {
                    setProfile(data as Profile);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [isOpen, userId, initialData, supabase]);

    const handleMessage = useCallback(() => {
        if (!userId) return;
        closeProfile();
        const basePath = isLandlordPortal ? '/landlord/messages' : '/tenant/messages';
        push(`${basePath}?to=${userId}`);
    }, [userId, closeProfile, push, isLandlordPortal]);

    const handleViewDocuments = useCallback(() => {
        if (!userId) return;
        if (isLandlordPortal) {
            openDetailModal(userId, 'documents');
        } else {
            closeProfile();
            push('/tenant/lease');
        }
    }, [userId, closeProfile, push, isLandlordPortal, openDetailModal]);

    const handleMaintenance = useCallback(() => {
        if (!userId) return;
        closeProfile();
        if (isLandlordPortal) {
            push(`/landlord/maintenance?tenant=${userId}`);
        } else {
            push('/tenant/maintenance');
        }
    }, [userId, closeProfile, push, isLandlordPortal]);

    const handleActivity = useCallback(() => {
        if (!userId) return;
        if (isLandlordPortal) {
            openDetailModal(userId, 'activity');
        } else {
            closeProfile();
            push('/tenant/dashboard');
        }
    }, [userId, closeProfile, push, isLandlordPortal, openDetailModal]);

    const handleOpenPortfolio = useCallback(() => {
        closeProfile();
        push(isLandlordPortal ? '/landlord/dashboard' : '/tenant/dashboard');
    }, [closeProfile, push, isLandlordPortal]);

    if (!isOpen) return null;

    const initials = profile?.full_name
        ?.split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join("") || "??";

    const isLandlord = profile?.role === 'landlord';

    const { top, left } = (() => {
        if (typeof window === 'undefined') return { top: 0, left: 0 };
        const GAP = 15;
        const cardWidth = 400;
        const cardHeight = 500;
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
                            "pointer-events-auto absolute overflow-hidden rounded-[2.5rem] border border-border bg-card/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
                        )}
                    >
                        <div className="p-8 pb-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-6">
                                    <div 
                                        className="relative size-20 shrink-0 rounded-full flex items-center justify-center overflow-hidden"
                                        style={{ backgroundColor: profile?.avatar_bg_color || '#10b981' }}
                                    >
                                        {profile?.avatar_url ? (
                                            <Image src={profile.avatar_url} alt={profile.full_name || "User"} fill className="object-cover" unoptimized />
                                        ) : (
                                            <span className="text-2xl font-black text-white/90">{initials}</span>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full border-4 border-card bg-emerald-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-2xl font-normal tracking-tight text-foreground truncate">{loading && !profile ? <Skeleton className="h-7 w-32" /> : profile?.full_name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="text-sm text-muted-foreground font-medium">{isLandlord ? "Property Owner" : "Loft Resident"}</div>
                                            {trustScore && (
                                                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                                    <ShieldCheck className="size-3" />
                                                    {trustScore}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={closeProfile} className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        <div className="px-8 pb-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-muted/40 p-4 border border-border/50">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Current Unit</p>
                                    <div className="text-sm font-bold text-foreground">{loading && !leaseData ? <Skeleton className="h-4 w-20" /> : leaseData?.unitName || "—"}</div>
                                </div>
                                <div className="rounded-2xl bg-muted/40 p-4 border border-border/50">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Lease Status</p>
                                    <div className="text-sm font-bold text-emerald-500 capitalize">{leaseData?.status || "—"}</div>
                                </div>
                            </div>
                            {leaseData?.termMonths && (
                                <div className="rounded-2xl bg-muted/20 p-4 border border-border/30 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Lease Analytics</p>
                                        <p className="text-xs font-bold text-foreground">{leaseData.termMonths} Month Term</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-foreground">₱{leaseData.monthlyRent?.toLocaleString()}</p>
                                        <p className="text-[10px] text-muted-foreground">Monthly Rent</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons Row */}
                        <div className="px-8 pb-6 flex items-center gap-3">
                            <button
                                onClick={handleMessage}
                                disabled={!userId}
                                className="flex-1 flex items-center justify-center gap-3 rounded-full bg-[#D7EFFF] dark:bg-blue-500/20 py-4 px-6 text-base font-medium text-[#001D35] dark:text-blue-100 transition-all hover:bg-[#c3e6ff] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MessageSquare className="size-5" />
                                Message
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleViewDocuments}
                                    className="flex size-[52px] items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.92]"
                                    title="View Documents"
                                >
                                    <FolderOpen className="size-5" />
                                </button>
                                <button
                                    onClick={handleMaintenance}
                                    className="flex size-[52px] items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.92]"
                                    title="Maintenance"
                                >
                                    <Wrench className="size-5" />
                                </button>
                                <button
                                    onClick={handleActivity}
                                    className="flex size-[52px] items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.92]"
                                    title="Activity Log"
                                >
                                    <Clock className="size-5" />
                                </button>
                            </div>
                        </div>

                        {/* Footer Button */}
                        <div className="px-6 pb-6">
                            <button
                                onClick={handleOpenPortfolio}
                                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#f0f4f9] dark:bg-neutral-800 px-6 py-4 text-base font-medium text-blue-700 dark:text-blue-400 transition-all hover:bg-[#e1e9f1] dark:hover:bg-neutral-700 group"
                            >
                                Open Full Profile
                                <ArrowUpRight className="size-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        </div>
                    </m.div>
                </div>
            </AnimatePresence>
        </LazyMotion>
    );
}
