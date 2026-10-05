"use client";

import React, { useState, useEffect, useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Lock,
    Mail,
    Eye,
    EyeOff,
    Loader2,
    RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TwoFactorManagementCardProps {
    apiEndpoint: string;
    accountEmail?: string;
    className?: string;
    onStatusChange?: (enabled: boolean) => void;
}

export function TwoFactorManagementCard({
    apiEndpoint,
    accountEmail,
    className,
    onStatusChange,
}: TwoFactorManagementCardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<"disabled" | "pending_otp" | "enabled">("disabled");
    const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

    // OTP Verification State
    const [otpInput, setOtpInput] = useState("");
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [otpError, setOtpError] = useState<string | null>(null);

    // Disable State
    const [disablePassword, setDisablePassword] = useState("");
    const [showDisablePassword, setShowDisablePassword] = useState(false);
    const [isDisabling, setIsDisabling] = useState(false);
    const [disableError, setDisableError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${apiEndpoint}?action=status`);
            if (res.ok) {
                const data = await res.json();
                if (data.enabled) {
                    setStatus("enabled");
                    setMaskedEmail(data.email ? data.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : null);
                    onStatusChange?.(true);
                } else {
                    setStatus("disabled");
                    setMaskedEmail(null);
                    onStatusChange?.(false);
                }
            }
        } catch (err) {
            console.error("[TwoFactorManagementCard] Failed to fetch status:", err);
        } finally {
            setIsLoading(false);
        }
    }, [apiEndpoint, onStatusChange]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Resend cooldown timer
    useEffect(() => {
        if (otpCooldown <= 0) return;
        const timer = setTimeout(() => {
            setOtpCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [otpCooldown]);

    const handleSendOtp = async () => {
        setIsSendingOtp(true);
        setOtpError(null);
        const toastId = toast.loading("Sending verification code…");

        try {
            const res = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "send-otp" }),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                const errMsg = data.error || "Failed to send verification code";
                setOtpError(errMsg);
                toast.error(errMsg, { id: toastId });
            } else {
                setStatus("pending_otp");
                setMaskedEmail(data.email || null);
                setOtpCooldown(60);
                toast.success(`Verification code sent to ${data.email || "your email"}`, { id: toastId });
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Failed to send code";
            setOtpError(errMsg);
            toast.error(errMsg, { id: toastId });
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const cleanOtp = otpInput.trim();
        if (cleanOtp.length < 6) {
            setOtpError("Please enter a 6-digit verification code");
            return;
        }

        setIsVerifyingOtp(true);
        setOtpError(null);
        const toastId = toast.loading("Verifying code…");

        try {
            const res = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "verify-otp", otp: cleanOtp }),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                const errMsg = data.error || "Failed to verify code";
                setOtpError(errMsg);
                toast.error(errMsg, { id: toastId });
            } else {
                setStatus("enabled");
                setMaskedEmail(data.email ? data.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : null);
                setOtpInput("");
                toast.success("Two-Factor Authentication enabled successfully!", { id: toastId });
                onStatusChange?.(true);
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Verification failed";
            setOtpError(errMsg);
            toast.error(errMsg, { id: toastId });
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleDisable2FA = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!disablePassword) {
            setDisableError("Please enter your account password");
            return;
        }

        setIsDisabling(true);
        setDisableError(null);
        const toastId = toast.loading("Disabling Two-Factor Authentication…");

        try {
            const res = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "disable", password: disablePassword }),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                const errMsg = data.error || "Incorrect password";
                setDisableError(errMsg);
                toast.error(errMsg, { id: toastId });
            } else {
                setStatus("disabled");
                setMaskedEmail(null);
                setDisablePassword("");
                toast.success("Two-Factor Authentication disabled successfully.", { id: toastId });
                onStatusChange?.(false);
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Failed to disable 2FA";
            setDisableError(errMsg);
            toast.error(errMsg, { id: toastId });
        } finally {
            setIsDisabling(false);
        }
    };

    return (
        <div
            className={cn(
                "rounded-3xl border border-border/60 neumorphic-panel p-6 sm:p-8 space-y-6 transition-all",
                className
            )}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
                        <ShieldCheck className="size-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-black text-foreground">
                                Two-Factor Authentication
                            </h3>
                            {status === "enabled" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <CheckCircle2 className="size-3" /> Active
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            Add an extra layer of security requiring a 6-digit verification code whenever you sign in.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content States */}
            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute size-10 animate-ping rounded-full bg-primary/20" />
                        <div className="relative size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                </div>
            ) : status === "disabled" ? (
                <div className="space-y-6 max-w-lg">
                    <div className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-2">
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Two-factor authentication protects your account against unauthorized access. A secure one-time passcode will be delivered to your verified email address:
                        </p>
                        {accountEmail && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/50 border border-border/40 text-xs font-mono font-medium text-foreground">
                                <Mail className="size-3.5 text-primary" />
                                {accountEmail}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                        className="w-full sm:w-auto rounded-xl sm:rounded-2xl neumorphic-primary py-3 px-6 text-sm font-black text-primary-foreground shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isSendingOtp ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Sending Code...</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="size-4" />
                                <span>Enable Two-Factor Authentication</span>
                            </>
                        )}
                    </button>
                </div>
            ) : status === "pending_otp" ? (
                <div className="space-y-6 max-w-lg">
                    <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                            <h4 className="text-xs font-black uppercase tracking-wider text-amber-500">
                                Verification Required
                            </h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Enter the 6-digit code sent to{" "}
                            <span className="font-mono font-bold text-foreground">
                                {maskedEmail || accountEmail || "your email"}
                            </span>{" "}
                            to activate two-factor authentication.
                        </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                                6-Digit Verification Code
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={8}
                                autoFocus
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                                placeholder="000000"
                                className="w-full text-center font-mono text-2xl tracking-[0.5em] py-3.5 px-4 rounded-xl neumorphic-inset bg-background/50 border border-border/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:tracking-normal placeholder:opacity-40"
                            />
                        </div>

                        {otpError && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-500">
                                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                <span>{otpError}</span>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isVerifyingOtp || otpInput.trim().length < 6}
                                className="w-full sm:flex-1 rounded-xl sm:rounded-2xl neumorphic-primary py-3 px-5 text-sm font-black text-primary-foreground shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isVerifyingOtp ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="size-4" />
                                        <span>Verify & Enable 2FA</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={isSendingOtp || otpCooldown > 0}
                                className="w-full sm:w-auto rounded-xl sm:rounded-2xl neumorphic-extruded py-3 px-4 text-xs font-bold text-foreground hover:text-primary transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <RotateCcw className="size-3.5" />
                                <span>
                                    {otpCooldown > 0 ? `Resend (${otpCooldown}s)` : "Resend Code"}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStatus("disabled");
                                    setOtpInput("");
                                    setOtpError(null);
                                }}
                                className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground font-medium py-2 px-3 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* Enabled State */
                <div className="space-y-6 max-w-lg">
                    <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 flex items-start gap-3.5">
                        <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <ShieldCheck className="size-5 text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-black text-foreground">
                                Two-Factor Authentication is Active
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Your account requires email verification on every sign-in.
                            </p>
                            {maskedEmail && (
                                <div className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground mt-1">
                                    <Mail className="size-3.5 text-primary" />
                                    <span>{maskedEmail}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Disable 2FA Form */}
                    <div className="pt-4 border-t border-border/40 space-y-4">
                        <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                Disable Protection
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                To disable two-factor authentication, please enter your current account password to confirm your identity.
                            </p>
                        </div>

                        <form onSubmit={handleDisable2FA} noValidate className="space-y-3">
                            <div className="relative">
                                <input
                                    type={showDisablePassword ? "text" : "password"}
                                    maxLength={16}
                                    value={disablePassword}
                                    onChange={(e) => setDisablePassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowDisablePassword(!showDisablePassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                    {showDisablePassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>

                            {disableError && (
                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-500">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <span>{disableError}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isDisabling || !disablePassword}
                                className="w-full sm:w-auto rounded-xl py-3 px-6 text-xs font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {isDisabling ? "Disabling..." : "Disable 2FA"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
