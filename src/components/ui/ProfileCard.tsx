"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Mail,
    MessageSquare,
    Video,
    Calendar,
    ExternalLink,
    Pencil,
    FolderOpen,
    Wrench,
    Clock,
    ShieldCheck,
    User,
    ArrowUpRight,
    TrendingUp
} from "lucide-react";
import { useProfileCard } from "@/context/ProfileCardContext";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Profile } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function ProfileCard() {
    const { isOpen, userId, initialData, position, closeProfile } = useProfileCard();
    const { user } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(false);
    const [leaseData, setLeaseData] = useState<{
        unitName: string | null;
        status: string | null;
        termMonths: number | null;
        expiryDate: string | null;
        monthlyRent: number | null;
    } | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Fetch lease/unit data for the profile
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
                    units:unit_id (
                        unit_number,
                        properties:property_id (
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
        if (isOpen && userId) {
            setLoading(true);
            if (initialData) {
                setProfile(initialData as Profile);
            } else {
                setProfile(null);
            }

            const fetchProfile = async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (!error && data) {
                    setProfile(data as Profile);
                }
                setLoading(false);
            };

            fetchProfile();
        }
    }, [isOpen, userId, initialData, supabase]);

    const handleMessage = useCallback(async () => {
        if (!user || !userId) return;

        // Get or create conversation with this user
        const { data: conversation, error } = await supabase
            .from('conversations')
            .select('id')
            .contains('participant_ids', [user.id])
            .contains('participant_ids', [userId])
            .single();

        if (error || !conversation) {
            // Create new conversation
            const { data: newConv, error: createErr } = await supabase
                .from('conversations')
                .insert({
                    participant_ids: [user.id, userId],
                    created_by: user.id,
                })
                .select('id')
                .single();

            if (!createErr && newConv) {
                closeProfile();
                router.push(`/tenant/messages?conversation=${newConv.id}`);
            }
        } else {
            closeProfile();
            router.push(`/tenant/messages?conversation=${conversation.id}`);
        }
    }, [user, userId, supabase, closeProfile, router]);

    const handleViewDocuments = useCallback(() => {
        closeProfile();
        if (profile?.role === 'landlord') {
            router.push(`/landlord/documents?tenant=${userId}`);
        } else {
            router.push(`/tenant/documents`);
        }
    }, [userId, profile, closeProfile, router]);

    const handleMaintenance = useCallback(() => {
        closeProfile();
        if (profile?.role === 'landlord') {
            router.push(`/landlord/maintenance?tenant=${userId}`);
        } else {
            router.push(`/tenant/maintenance`);
        }
    }, [userId, profile, closeProfile, router]);

    const handleActivity = useCallback(() => {
        closeProfile();
        if (profile?.role === 'landlord') {
            router.push(`/landlord/activity?tenant=${userId}`);
        } else {
            router.push(`/tenant/activity`);
        }
    }, [userId, profile, closeProfile, router]);

    const handleOpenPortfolio = useCallback(() => {
        closeProfile();
        router.push(`/profile/${userId}`);
    }, [userId, closeProfile, router]);

    if (!isOpen) return null;

    const initials = profile?.full_name
        ?.split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join("") || "??";

    const isLandlord = profile?.role === 'landlord';

    // Smart Positioning Logic
    const GAP = 15;
    const cardWidth = 400;
    const cardHeight = 500; // Estimated max height
    let top = (position?.y ?? 0) + GAP;
    let left = (position?.x ?? 0) + GAP;

    if (typeof window !== 'undefined') {
        // Flip horizontally if hitting right edge
        if (left + cardWidth > window.innerWidth) {
            left = (position?.x ?? 0) - cardWidth - GAP;
        }
        // Flip vertically if hitting bottom edge
        if (top + cardHeight > window.innerHeight) {
            top = (position?.y ?? 0) - cardHeight - GAP;
        }

        // Constrain to viewport (final safety)
        left = Math.max(10, Math.min(left, window.innerWidth - cardWidth - 10));
        top = Math.max(10, Math.min(top, window.innerHeight - cardHeight - 10));
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] pointer-events-none">
                {/* Invisible backdrop for closing */}
                <div 
                    className="absolute inset-0 pointer-events-auto"
                    onClick={closeProfile}
                />

                {/* Tooltip Card */}
                <motion.div
                    ref={cardRef}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    style={{ 
                        top, 
                        left,
                        width: cardWidth
                    }}
                    className={cn(
                        "pointer-events-auto absolute overflow-hidden rounded-[2.5rem] border border-border bg-card/80 backdrop-blur-2xl transition-all duration-300",
                        "shadow-[0_8px_30px_rgb(0,0,0,0.04),0_20px_80px_rgba(0,0,0,0.08)]",
                        "dark:bg-neutral-900/90 dark:border-white/10 dark:shadow-[0_20px_50px_rgba(109,152,56,0.15)]"
                    )}
                >
                    {/* Header Section */}
                    <div className="p-8 pb-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-6">
                                {/* Avatar with status ring */}
                                <div 
                                    className="relative h-20 w-20 shrink-0 rounded-full flex items-center justify-center overflow-hidden shadow-sm"
                                    style={{ backgroundColor: profile?.avatar_bg_color || '#10b981' }}
                                >
                                    {profile?.avatar_url ? (
                                        <img 
                                            src={profile.avatar_url} 
                                            alt={profile.full_name} 
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl font-black text-white/90">{initials}</span>
                                    )}
                                    <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-4 border-card bg-emerald-500 shadow-lg" />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-2xl font-normal tracking-tight text-foreground truncate mb-0.5">
                                        {loading && !profile ? <Skeleton className="h-7 w-32" /> : profile?.full_name}
                                    </h2>
                                    <p className="text-base text-muted-foreground truncate font-medium">
                                        {loading && !profile ? <Skeleton className="h-4 w-40" /> : (isLandlord ? "Property Owner" : "Loft Resident")}
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={closeProfile}
                                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* iReside Specific Info: Lease & Property */}
                    <div className="px-8 pb-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-muted/40 p-4 border border-border/50">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Current Unit</p>
                                <p className="text-sm font-bold text-foreground">
                                    {loading && !leaseData ? (
                                        <Skeleton className="h-4 w-20" />
                                    ) : leaseData?.unitName || "—"}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-muted/40 p-4 border border-border/50">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Lease Status</p>
                                <p className={cn(
                                    "text-sm font-bold flex items-center gap-1.5",
                                    leaseData?.status === 'active' ? "text-emerald-500" : "text-muted-foreground"
                                )}>
                                    {loading && !leaseData ? (
                                        <Skeleton className="h-4 w-16" />
                                    ) : (
                                        <>
                                            {leaseData?.status ? (
                                                <span className="capitalize">{leaseData.status}</span>
                                            ) : "—"}
                                            {leaseData?.status === 'active' && (
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            )}
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {leaseData?.termMonths && (
                            <div className="rounded-2xl bg-muted/20 p-4 border border-border/30">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Lease Analytics</p>
                                    <TrendingUp className="h-3 w-3 text-primary" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-foreground">{leaseData.termMonths} Month Term</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {leaseData.expiryDate
                                                ? `Expires ${new Date(leaseData.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                                : "—"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-foreground">
                                            {leaseData.monthlyRent
                                                ? `₱${leaseData.monthlyRent.toLocaleString()}`
                                                : "—"}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">Monthly Rent</p>
                                    </div>
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
                            <MessageSquare className="h-5 w-5" />
                            Message
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleViewDocuments}
                                className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.92]"
                                title="View Documents"
                            >
                                <FolderOpen className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleMaintenance}
                                className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.92]"
                                title="Maintenance"
                            >
                                <Wrench className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleActivity}
                                className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.92]"
                                title="Activity Log"
                            >
                                <Clock className="h-5 w-5" />
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
                            <ArrowUpRight className="h-5 w-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
