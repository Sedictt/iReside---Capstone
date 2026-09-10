"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { m as motion, AnimatePresence } from "framer-motion";
import { LogOut, X, Loader2 } from "lucide-react";
import { signOut } from "@/lib/supabase/client-auth";

interface LogoutConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => Promise<void> | void;
    title?: string;
    description?: string;
}

export function LogoutConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Sign Out",
    description = "Are you sure you want to log out of iReside? You will need to sign back in with your credentials to access your account."
}: LogoutConfirmationModalProps) {
    const [mounted, setMounted] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle Escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !isLoggingOut) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isLoggingOut, onClose]);

    // Prevent body scroll while open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleConfirm = async () => {
        try {
            setIsLoggingOut(true);
            if (onConfirm) {
                await onConfirm();
            } else {
                await signOut();
            }
        } catch (error) {
            console.error("Logout failed:", error);
            setIsLoggingOut(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6">
                    {/* Edge-to-edge dimmed overlay without heavy blur for optimal performance */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => {
                            if (!isLoggingOut) onClose();
                        }}
                        className="fixed inset-0 bg-black/80"
                        aria-hidden="true"
                    />

                    {/* Centered Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="logout-dialog-title"
                        className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] p-6 sm:p-8 neumorphic-panel bg-card text-card-foreground border border-border/50 shadow-2xl"
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => {
                                if (!isLoggingOut) onClose();
                            }}
                            disabled={isLoggingOut}
                            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors neumorphic-extruded disabled:opacity-40"
                            aria-label="Close dialog"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            {/* Warning / Logout Icon Badge */}
                            <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-inner">
                                <LogOut className="size-6" />
                            </div>

                            <h3 id="logout-dialog-title" className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                {title}
                            </h3>

                            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                                {description}
                            </p>

                            {/* Action Buttons */}
                            <div className="mt-8 flex w-full flex-col-reverse gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isLoggingOut}
                                    className="flex-1 rounded-xl px-5 py-3 text-sm font-bold text-muted-foreground hover:text-foreground neumorphic-extruded transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                                >
                                    Stay Logged In
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    disabled={isLoggingOut}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/25 transition-all active:scale-[0.98] disabled:opacity-75 cursor-pointer"
                                >
                                    {isLoggingOut ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Logging out...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogOut className="size-4" />
                                            <span>Yes, Log Out</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
