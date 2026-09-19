"use client";

import React, { useState, useEffect, useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    KeyRound,
    ShieldCheck,
    AlertCircle,
    RefreshCw,
    Lock,
    Mail,
    Eye,
    EyeOff,
    CheckCircle2,
    X,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { SecurityKeyDisplayCard } from "@/components/auth/SecurityKeyDisplayCard";

interface SecurityKeyManagementCardProps {
    className?: string;
    accountEmail?: string;
}

export function SecurityKeyManagementCard({
    className,
    accountEmail,
}: SecurityKeyManagementCardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasSecurityKey, setHasSecurityKey] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);
    const [isRotating, setIsRotating] = useState(false);
    const [rotationError, setRotationError] = useState<string | null>(null);

    // Newly generated key after rotation
    const [newSecurityKey, setNewSecurityKey] = useState<string | null>(null);
    const [isAcknowledged, setIsAcknowledged] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/auth/security-key");
            if (res.ok) {
                const data = await res.json();
                setHasSecurityKey(Boolean(data.hasSecurityKey));
                setUpdatedAt(data.updatedAt || null);
            }
        } catch (err) {
            console.error("[SecurityKeyManagementCard] Failed to fetch key status:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // OTP Cooldown timer
    useEffect(() => {
        if (otpCooldown <= 0) return;
        const timer = setTimeout(() => {
            setOtpCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [otpCooldown]);

    const handleSendOtp = async () => {
        setIsSendingOtp(true);
        setRotationError(null);
        try {
            const res = await fetch("/api/auth/security-key/rotate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "send-otp" }),
            });
            const data = await res.json();
            if (!res.ok) {
                setRotationError(data.error || "Failed to dispatch verification code.");
            } else {
                setOtpSentMessage(data.message || "Verification code sent to your email.");
                setOtpCooldown(60);
                toast.success("Verification code sent to your registered email.");
            }
        } catch (err) {
            console.error("[SecurityKeyManagementCard] Error sending OTP:", err);
            setRotationError("Failed to dispatch verification code. Please try again.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleRotateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setRotationError(null);

        if (!currentPassword) {
            setRotationError("Please enter your current account password.");
            return;
        }

        if (!otpCode.trim() || otpCode.trim().length !== 6) {
            setRotationError("Please enter the 6-digit verification code sent to your email.");
            return;
        }

        setIsRotating(true);
        try {
            const res = await fetch("/api/auth/security-key/rotate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword,
                    otpCode: otpCode.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setRotationError(data.error || "Failed to rotate security key. Please check your credentials.");
            } else if (data.newSecurityKey) {
                setNewSecurityKey(data.newSecurityKey);
                setHasSecurityKey(true);
                setUpdatedAt(data.updatedAt || new Date().toISOString());
                toast.success("New security recovery key generated!");
            }
        } catch (err) {
            console.error("[SecurityKeyManagementCard] Error rotating key:", err);
            setRotationError("An unexpected error occurred. Please try again.");
        } finally {
            setIsRotating(false);
        }
    };

    const handleCloseModal = () => {
        if (newSecurityKey && !isAcknowledged) {
            toast.error("Please confirm that you have safely stored your new recovery key.");
            return;
        }
        setIsModalOpen(false);
        setCurrentPassword("");
        setOtpCode("");
        setOtpSentMessage(null);
        setRotationError(null);
        setNewSecurityKey(null);
        setIsAcknowledged(false);
        fetchStatus();
    };

    return (
        <>
            <div
                className={cn(
                    "relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/70 bg-card p-5 sm:p-7 shadow-xs space-y-5",
                    className
                )}
            >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                            <KeyRound className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 className="text-base sm:text-lg font-black text-foreground">
                                    Security Recovery Key
                                </h3>
                                {isLoading ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                                        <Loader2 className="size-3 animate-spin" /> Checking...
                                    </span>
                                ) : hasSecurityKey ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        <CheckCircle2 className="size-3" /> Active & Encrypted
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                        <AlertCircle className="size-3" /> Not Configured
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Single-use emergency recovery mechanism protected by AES-256-GCM encryption.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setRotationError(null);
                            setNewSecurityKey(null);
                            setIsAcknowledged(false);
                            setCurrentPassword("");
                            setOtpCode("");
                            setIsModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border shrink-0 active:scale-95 cursor-pointer"
                    >
                        <RefreshCw className="size-3.5" />
                        <span>{hasSecurityKey ? "Rotate Recovery Key" : "Generate Recovery Key"}</span>
                    </button>
                </div>

                {/* Information Card & Status Details */}
                <div className="rounded-xl bg-muted/40 border border-border/50 p-4 space-y-3 text-xs">
                    <p className="text-muted-foreground leading-relaxed">
                        If you ever lose access to your registered email inbox or get locked out of your account, you can use your single-use security recovery key to regain access. For maximum security, keys are encrypted at rest and are never stored or displayed in plain text after generation.
                    </p>

                    <div className="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                            <span className="text-muted-foreground">Storage Method:</span>
                            <span className="font-semibold text-foreground">AES-256-GCM (Zero Plaintext)</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <KeyRound className="size-4 text-primary shrink-0" />
                            <span className="text-muted-foreground">Last Rotated:</span>
                            <span className="font-semibold text-foreground">
                                {updatedAt ? (
                                    <ClientOnlyDate
                                        date={updatedAt}
                                        format={{ month: "short", day: "numeric", year: "numeric" }}
                                    />
                                ) : (
                                    "Initial Account Setup"
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Protected Rotation Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="fixed inset-0"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5"
                        >
                            {/* Modal Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                                        <KeyRound className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-foreground">
                                            {newSecurityKey ? "New Security Recovery Key" : "Rotate Security Recovery Key"}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {newSecurityKey
                                                ? "Save your new recovery key safely."
                                                : "Verify your identity to generate a new key."}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    aria-label="Close modal"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            {newSecurityKey ? (
                                <div className="space-y-4">
                                    <SecurityKeyDisplayCard
                                        securityKey={newSecurityKey}
                                        isAcknowledged={isAcknowledged}
                                        onToggleAcknowledge={setIsAcknowledged}
                                        title="New Single-Use Recovery Key"
                                        description="Your previous security key has been invalidated. Save this new recovery key in a password manager or offline file."
                                        accountEmail={accountEmail}
                                    />

                                    <button
                                        type="button"
                                        disabled={!isAcknowledged}
                                        onClick={handleCloseModal}
                                        className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="size-4" />
                                        <span>Done & Close</span>
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleRotateSubmit} className="space-y-4">
                                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                                        <p className="font-semibold flex items-center gap-1.5">
                                            <AlertCircle className="size-3.5 shrink-0" />
                                            Immediate Invalidation
                                        </p>
                                        <p className="leading-relaxed text-[11px] opacity-90">
                                            Generating a new key immediately revokes any previously issued recovery key.
                                            You will need your current password and a verification code sent to your registered email.
                                        </p>
                                    </div>

                                    {rotationError && (
                                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                            <p className="font-medium">{rotationError}</p>
                                        </div>
                                    )}

                                    {/* Current Password Field */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                            <Lock className="size-3.5 text-muted-foreground" />
                                            Current Password
                                        </label>
                                        <div className="relative flex items-center">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="Enter your current password"
                                                className="h-10 w-full rounded-xl border border-border bg-background pl-3.5 pr-10 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors p-1"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Verification Code Field */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                                <Mail className="size-3.5 text-muted-foreground" />
                                                Email Verification Code
                                            </label>
                                            <button
                                                type="button"
                                                disabled={isSendingOtp || otpCooldown > 0}
                                                onClick={handleSendOtp}
                                                className="text-[11px] font-bold text-primary hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                                            >
                                                {isSendingOtp
                                                    ? "Sending..."
                                                    : otpCooldown > 0
                                                    ? `Resend in ${otpCooldown}s`
                                                    : "Send Code to Email"}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                            placeholder="6-digit verification code"
                                            className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-xs text-foreground font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                        {otpSentMessage && (
                                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                {otpSentMessage}
                                            </p>
                                        )}
                                    </div>

                                    {/* Modal Actions */}
                                    <div className="flex items-center justify-end gap-2.5 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isRotating || !currentPassword || otpCode.length !== 6}
                                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                                        >
                                            {isRotating ? (
                                                <>
                                                    <Loader2 className="size-3.5 animate-spin" />
                                                    <span>Verifying & Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <KeyRound className="size-3.5" />
                                                    <span>Verify & Generate Key</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
