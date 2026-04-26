"use client";

import { useEffect, useState, useRef } from "react";
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
import { Profile } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function ProfileCard() {
    const { isOpen, userId, initialData, position, closeProfile } = useProfileCard();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

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
                                <p className="text-sm font-bold text-foreground">Loft 1A</p>
                            </div>
                            <div className="rounded-2xl bg-muted/40 p-4 border border-border/50">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Lease Status</p>
                                <p className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                                    Active
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-muted/20 p-4 border border-border/30">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Lease Analytics</p>
                                <TrendingUp className="h-3 w-3 text-primary" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-foreground">12 Month Term</p>
                                    <p className="text-[10px] text-muted-foreground">Expires June 15, 2026</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-foreground">₱24,500</p>
                                    <p className="text-[10px] text-muted-foreground">Monthly Rent</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="px-8 pb-6 flex items-center gap-3">
                        <button className="flex-1 flex items-center justify-center gap-3 rounded-full bg-[#D7EFFF] dark:bg-blue-500/20 py-4 px-6 text-base font-medium text-[#001D35] dark:text-blue-100 transition-all hover:bg-[#c3e6ff] active:scale-[0.98]">
                            <MessageSquare className="h-5 w-5" />
                            Message
                        </button>
                        
                        <div className="flex items-center gap-2">
                            <button className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.92]">
                                <FolderOpen className="h-5 w-5" />
                            </button>
                            <button className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.92]">
                                <Wrench className="h-5 w-5" />
                            </button>
                            <button className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.92]">
                                <Clock className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Footer Button */}
                    <div className="px-6 pb-6">
                        <button className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#f0f4f9] dark:bg-neutral-800 px-6 py-4 text-base font-medium text-blue-700 dark:text-blue-400 transition-all hover:bg-[#e1e9f1] dark:hover:bg-neutral-700 group">
                            Open Full Portfolio
                            <ArrowUpRight className="h-5 w-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
