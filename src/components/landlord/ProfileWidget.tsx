"use client";

import Image from "next/image";
import { Settings, User, LogOut, CreditCard, Pencil } from "lucide-react";
import { signOut } from "@/lib/supabase/client-auth";
import { useState, useRef } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { RoleBadge } from "@/components/profile/RoleBadge";
import { ProfileCardTrigger } from "@/components/ui/ProfileCardTrigger";

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
    const [avatarFailed, setAvatarFailed] = useState(false);
    const { user, profile } = useAuth();

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
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Profile Avatar Button */}
            <button
                className="group relative flex size-10 items-center justify-center overflow-hidden rounded-full border border-border transition-all hover:ring-2 hover:ring-primary/50 dark:border-white/10"
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
                    <span className="relative z-10 text-sm font-bold text-text-high dark:text-white">{initials}</span>
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
                        className="absolute right-0 top-12 z-50 w-64 origin-top overflow-hidden rounded-xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/95"
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        {/* User Info Header */}
                        <div className="border-b border-border bg-gradient-to-br from-surface-0 to-surface-1 p-4 dark:border-white/10 dark:from-neutral-800/50 dark:to-neutral-900/50">
                            <div className="flex items-center gap-3">
                                <ProfileCardTrigger 
                                    userId={user?.id || ""} 
                                    initialData={{ full_name: displayName, avatar_url: displayAvatar as string, role: profile?.role as any }}
                                    asChild
                                >
                                    <div
                                        className="relative flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-border dark:border-white/10 shadow-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all shrink-0"
                                        style={{ backgroundColor: profile?.avatar_bg_color || '#10b981' }}
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
                                            <span className="text-xl font-bold text-white">{initials}</span>
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
                                                <p className="truncate text-lg font-bold text-foreground dark:text-white hover:text-primary transition-colors cursor-pointer leading-tight">{displayName}</p>
                                            </ProfileCardTrigger>
                                            <p className="truncate text-xs text-muted-foreground">{profile?.email || user?.email || "Account"}</p>
                                        </div>
                                        <Link href="/landlord/profile" className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                                            <Pencil className="size-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                            <Link
                                href="/landlord/profile"
                                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                                <User className="size-5" />
                                <span>My Profile</span>
                            </Link>
                            <Link
                                href="/landlord/settings"
                                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                                <Settings className="size-5" />
                                <Settings className="size-4 group-hover:text-primary transition-colors" />
                                <span>Settings</span>
                            </Link>
                            <Link
                                href="/landlord/billing"
                                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                                <CreditCard className="size-4 group-hover:text-primary transition-colors" />
                                <span>Billing & Plans</span>
                            </Link>

                            <div className="my-1.5 h-px bg-border dark:bg-white/10"></div>

                            <button
                                type="button"
                                onClick={() => {
                                    void signOut();
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors group text-left"
                            >
                                <LogOut className="size-4" />
                                <span>Log Out</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

