"use client";

import Image from "next/image";
import { Settings, User, LogOut, Pencil, Contrast } from "lucide-react";
import { signOut } from "@/lib/supabase/client-auth";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useHighContrast } from "@/hooks/useHighContrast";
import { RoleBadge } from "@/components/profile/RoleBadge";
import { ProfileCardTrigger } from "@/components/ui/ProfileCardTrigger";
import { cn } from "@/lib/utils";

function readProviderAvatar(user: ReturnType<typeof useAuth>["user"]) {
    const identities = user?.identities;
    if (!identities || identities.length === 0) {
        return null;
    }

    for (const identity of identities) {
        const identityData = identity.identity_data;
        if (!identityData || typeof identityData !== "object") {
            continue;
        }

        const avatarUrl = "avatar_url" in identityData ? identityData.avatar_url : null;
        if (typeof avatarUrl === "string" && avatarUrl.trim().length > 0) {
            return avatarUrl;
        }

        const picture = "picture" in identityData ? identityData.picture : null;
        if (typeof picture === "string" && picture.trim().length > 0) {
            return picture;
        }
    }

    return null;
}

export function ProfileWidget() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [avatarFailed, setAvatarFailed] = useState(false);
    const { user, profile } = useAuth();
    const { isHighContrast, toggleHighContrast } = useHighContrast();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Landlord";
    const avatarCandidates = [
        profile?.avatar_url,
        typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
        typeof user?.user_metadata?.picture === "string" ? user.user_metadata.picture : null,
        readProviderAvatar(user),
    ];
    const displayAvatar = avatarCandidates.find(
        (value): value is string => typeof value === "string" && value.trim().length > 0
    ) ?? null;
    const shouldShowAvatar = Boolean(displayAvatar) && !avatarFailed;
    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase() ?? "")
        .join("") || "LD";

    const handleMouseEnter = () => {
        // Clear any pending close timeout
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsMenuOpen(true);
    };

    const handleMouseLeave = () => {
        // Add a 200ms delay before closing
        closeTimeoutRef.current = setTimeout(() => {
            setIsMenuOpen(false);
        }, 200);
    };

    return (
        <div
            ref={containerRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Profile Avatar Button */}
            <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="group relative flex size-10 items-center justify-center overflow-hidden rounded-full neumorphic-extruded active:scale-95 shrink-0 border border-white/5 transition-all"
                style={{ backgroundColor: profile?.avatar_bg_color || '#171717' }}
            >
                {shouldShowAvatar ? (
                    <Image
                        src={displayAvatar as string}
                        alt={displayName}
                        fill
                        sizes="40px"
                        className="object-cover"
                        onError={() => setAvatarFailed(true)}
                    />
                ) : (
                    <span className="relative z-10 text-sm font-black text-text-high dark:text-white">{initials}</span>
                )}
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9, rotateX: -15 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95, rotateX: -10 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                            mass: 0.5
                        }}
                        className="absolute right-0 top-12 z-50 w-64 origin-top overflow-hidden rounded-[2rem] neumorphic-panel bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl shadow-2xl"
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        {/* User Info Header */}
                        <div className="border-b border-white/5 bg-gradient-to-br from-surface-0 to-surface-1 p-4 dark:from-neutral-800/50 dark:to-neutral-900/50">
                            <div className="flex items-center gap-3">
                                <ProfileCardTrigger 
                                    userId={user?.id || ""} 
                                    initialData={{ full_name: displayName, avatar_url: displayAvatar as string, role: profile?.role as any }}
                                    asChild
                                >
                                    <div
                                        className="relative flex size-16 items-center justify-center overflow-hidden rounded-full neumorphic-inset-card border border-white/5 cursor-pointer shrink-0"
                                        style={{ backgroundColor: profile?.avatar_bg_color || '#8B5CF6' }}
                                    >
                                        {shouldShowAvatar ? (
                                            <Image
                                                src={displayAvatar as string}
                                                alt={displayName}
                                                fill
                                                sizes="64px"
                                                className="object-cover"
                                                onError={() => setAvatarFailed(true)}
                                            />
                                        ) : (
                                            <span className="text-xl font-black text-white">{initials}</span>
                                        )}
                                    </div>
                                </ProfileCardTrigger>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <ProfileCardTrigger 
                                                userId={user?.id || ""} 
                                                initialData={{ full_name: displayName, avatar_url: displayAvatar as string, role: profile?.role as any }}
                                            >
                                                <p className="truncate text-base font-black text-foreground dark:text-white hover:text-primary transition-colors cursor-pointer leading-tight">{displayName}</p>
                                            </ProfileCardTrigger>
                                            <p className="truncate text-xs text-muted-foreground">{profile?.email || user?.email || "Account"}</p>
                                        </div>
                                        <Link 
                                            href="/landlord/profile" 
                                            title="Edit Profile"
                                            className="flex size-8 items-center justify-center rounded-full neumorphic-extruded text-muted-foreground hover:text-primary active:scale-95 transition-all shrink-0"
                                        >
                                            <Pencil className="size-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-3 space-y-1">
                            <Link
                                href="/landlord/profile"
                                className="group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-black transition-all hover:neumorphic-inset-card active:scale-[0.98] text-muted-foreground hover:text-primary border border-transparent"
                            >
                                <User className="size-4 group-hover:text-primary transition-colors" />
                                <span>My Profile</span>
                            </Link>
                            <Link
                                href="/landlord/settings"
                                className="group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-black transition-all hover:neumorphic-inset-card active:scale-[0.98] text-muted-foreground hover:text-primary border border-transparent"
                            >
                                <Settings className="size-4 group-hover:text-primary transition-colors" />
                                <span>Settings</span>
                            </Link>

                            <button
                                type="button"
                                onClick={() => toggleHighContrast()}
                                className="flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-black transition-all hover:neumorphic-inset-card active:scale-[0.98] text-muted-foreground hover:text-primary group text-left border border-transparent cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <Contrast className="size-4 group-hover:text-primary transition-colors" />
                                    <span>High Contrast</span>
                                </div>
                                <span className={cn(
                                    "text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-md",
                                    isHighContrast ? "bg-primary text-primary-foreground" : "bg-white/10 text-muted-foreground"
                                )}>
                                    {isHighContrast ? "ON" : "OFF"}
                                </span>
                            </button>

                            <div className="my-1.5 h-px bg-white/5"></div>

                            <button
                                type="button"
                                onClick={() => {
                                    void signOut();
                                }}
                                className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-black transition-all hover:neumorphic-inset-card active:scale-[0.98] text-red-400 hover:text-red-300 group text-left border border-transparent"
                            >
                                <LogOut className="size-4 text-red-400 group-hover:text-red-300 transition-colors" />
                                <span>Log Out</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

