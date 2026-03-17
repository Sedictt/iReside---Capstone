"use client";

import { Settings, User, LogOut, CreditCard } from "lucide-react";
import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

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
    const displayRole = profile?.role ? `${profile.role[0].toUpperCase()}${profile.role.slice(1)}` : "Account";
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
        .map((part) => part[0]?.toUpperCase() ?? "")
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
            <button className="relative h-10 w-10 overflow-visible rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 ring-2 ring-white/10 hover:ring-primary/50 transition-all group flex items-center justify-center shadow-lg">
                {shouldShowAvatar ? (
                    <img
                        src={displayAvatar}
                        alt={displayName}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={() => setAvatarFailed(true)}
                    />
                ) : (
                    <span className="font-bold text-white relative z-10 text-sm">{initials}</span>
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
                        className="absolute right-0 top-12 z-50 w-64 rounded-xl bg-neutral-900/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden origin-top"
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        {/* User Info Header */}
                        <div className="p-4 border-b border-white/10 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 ring-2 ring-white/10 flex items-center justify-center shadow-lg relative">
                                    {shouldShowAvatar ? (
                                        <img
                                            src={displayAvatar}
                                            alt={displayName}
                                            className="h-12 w-12 rounded-full object-cover"
                                            onError={() => setAvatarFailed(true)}
                                        />
                                    ) : (
                                        <span className="font-bold text-white text-base">{initials}</span>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate text-sm font-bold text-white">
                                        {displayName}
                                    </p>
                                    <p className="truncate text-xs text-neutral-400">{displayRole}</p>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                            <Link
                                href="/landlord/profile"
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 hover:bg-white/10 hover:text-white transition-colors group"
                            >
                                <User className="h-4 w-4 group-hover:text-primary transition-colors" />
                                <span>My Profile</span>
                            </Link>
                            <Link
                                href="/landlord/settings"
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 hover:bg-white/10 hover:text-white transition-colors group"
                            >
                                <Settings className="h-4 w-4 group-hover:text-primary transition-colors" />
                                <span>Settings</span>
                            </Link>
                            <Link
                                href="/landlord/billing"
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 hover:bg-white/10 hover:text-white transition-colors group"
                            >
                                <CreditCard className="h-4 w-4 group-hover:text-primary transition-colors" />
                                <span>Billing & Plans</span>
                            </Link>

                            <div className="my-1.5 h-px bg-white/10"></div>

                            <Link
                                href="/auth/logout"
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors group"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Log Out</span>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
