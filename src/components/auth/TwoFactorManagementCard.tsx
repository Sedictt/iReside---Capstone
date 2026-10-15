"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ShieldCheck, CheckCircle2, Mail, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";
import { otpRule } from "@/lib/validation/rules";
import { CURRENT_PASSWORD_MAX_LENGTH, currentPasswordRule } from "@/lib/validation/schemas/account.schema";
import { tr } from "@/hooks/useLanguage";
import {
    SettingsButton,
    SettingsField,
    SettingsNotice,
    SettingsPasswordInput,
    settingsInputClass,
} from "@/components/settings/settings-ui";

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
    const { t } = useLanguageContext();
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
    const [isDisabling, setIsDisabling] = useState(false);
    const [disableError, setDisableError] = useState<string | null>(null);

    const onStatusChangeRef = useRef(onStatusChange);
    useEffect(() => {
        onStatusChangeRef.current = onStatusChange;
    });

    const fetchStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${apiEndpoint}?action=status`);
            if (res.ok) {
                const data = await res.json();
                if (data.enabled) {
                    setStatus("enabled");
                    setMaskedEmail(data.email ? data.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : null);
                    onStatusChangeRef.current?.(true);
                } else {
                    setStatus("disabled");
                    setMaskedEmail(null);
                    onStatusChangeRef.current?.(false);
                }
            }
        } catch (err) {
            console.error("[TwoFactorManagementCard] Failed to fetch status:", err);
        } finally {
            setIsLoading(false);
        }
    }, [apiEndpoint]);

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
        const toastId = toast.loading(t("Sending verification code…"));

        try {
            const res = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "send-otp" }),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                const errMsg = data.error || "Failed to send verification code";
                setOtpError(tr(errMsg));
                toast.error(t(errMsg), { id: toastId });
            } else {
                setStatus("pending_otp");
                setMaskedEmail(data.email || null);
                setOtpCooldown(60);
                toast.success(t("Verification code sent to {email}", { email: data.email || t("your email") }), { id: toastId });
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Failed to send code";
            setOtpError(tr(errMsg));
            toast.error(t(errMsg), { id: toastId });
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isVerifyingOtp) return;
        const cleanOtp = otpInput.trim();
        const otpRuleError = otpRule(cleanOtp);
        if (otpRuleError) {
            setOtpError(tr(otpRuleError));
            return;
        }

        setIsVerifyingOtp(true);
        setOtpError(null);
        const toastId = toast.loading(t("Verifying code…"));

        try {
            const res = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "verify-otp", otp: cleanOtp }),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                const errMsg = data.error || "Failed to verify code";
                setOtpError(tr(errMsg));
                toast.error(t(errMsg), { id: toastId });
            } else {
                setStatus("enabled");
                setMaskedEmail(data.email ? data.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : null);
                setOtpInput("");
                toast.success(t("2-step sign-in is now on."), { id: toastId });
                onStatusChange?.(true);
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Verification failed";
            setOtpError(tr(errMsg));
            toast.error(t(errMsg), { id: toastId });
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleDisable2FA = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isDisabling) return;
        // Only checks that a password was entered (never strength rules).
        if (currentPasswordRule(disablePassword, { label: "Account password" })) {
            setDisableError("Please enter your account password");
            return;
        }

        setIsDisabling(true);
        setDisableError(null);
        const toastId = toast.loading(t("Turning off 2-step sign-in…"));

        try {
            const res = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "disable", password: disablePassword }),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                const errMsg = data.error || "Incorrect password";
                setDisableError(tr(errMsg));
                toast.error(t(errMsg), { id: toastId });
            } else {
                setStatus("disabled");
                setMaskedEmail(null);
                setDisablePassword("");
                toast.success(t("2-step sign-in is now off."), { id: toastId });
                onStatusChange?.(false);
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Failed to disable 2FA";
            setDisableError(tr(errMsg));
            toast.error(t(errMsg), { id: toastId });
        } finally {
            setIsDisabling(false);
        }
    };

    return (
        <div className={cn("space-y-5 rounded-2xl border-2 border-foreground/15 p-5", className)}>
            <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-7 shrink-0 text-foreground" aria-hidden />
                <div className="space-y-1">
                    <h3 className="flex flex-wrap items-center gap-2 text-xl font-bold text-foreground">
                        <span>{t("2-step sign-in")}</span>
                        {status === "enabled" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-0.5 text-sm font-bold text-white">
                                <CheckCircle2 className="size-4" aria-hidden /> {t("On")}
                            </span>
                        )}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                        {t("Each time you sign in, we email you a 6-digit code to type in. This keeps other people out, even if they know your password.")}
                    </p>
                </div>
            </div>

            {isLoading ? (
                <p role="status" className="flex items-center gap-2 text-lg text-muted-foreground">
                    <Loader2 className="size-5 motion-safe:animate-spin" aria-hidden /> {t("Checking…")}
                </p>
            ) : status === "disabled" ? (
                <div className="space-y-4">
                    {accountEmail && (
                        <p className="flex flex-wrap items-center gap-2 text-base text-foreground">
                            <Mail className="size-5 shrink-0" aria-hidden />
                            <span>{t("We will send the code to:")}</span>
                            <span className="font-bold">{accountEmail}</span>
                        </p>
                    )}
                    {otpError && (
                        <SettingsNotice tone="danger" live>
                            {t(otpError)}
                        </SettingsNotice>
                    )}
                    <SettingsButton icon={ShieldCheck} loading={isSendingOtp} onClick={handleSendOtp}>
                        {isSendingOtp ? t("Sending the code…") : t("Turn on 2-step sign-in")}
                    </SettingsButton>
                </div>
            ) : status === "pending_otp" ? (
                <div className="space-y-5">
                    <SettingsNotice tone="warning" title={t("Check your email")}>
                        {t("We sent a 6-digit code to")} <span className="font-bold">{maskedEmail || accountEmail || t("your email")}</span>.{" "}
                        {t("Type it below to finish.")}
                    </SettingsNotice>

                    <form onSubmit={handleVerifyOtp} noValidate className="space-y-5">
                        <SettingsField label={t("The 6-digit code")} htmlFor="two-factor-otp" error={otpError ? t(otpError) : undefined} errorId="two-factor-otp-error">
                            <input
                                id="two-factor-otp"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                autoFocus
                                aria-invalid={otpError ? true : undefined}
                                aria-describedby={otpError ? "two-factor-otp-error" : undefined}
                                value={otpInput}
                                onChange={(e) => {
                                    setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                                    if (otpError) setOtpError(null);
                                }}
                                placeholder="000000"
                                className={settingsInputClass(Boolean(otpError), "max-w-xs text-center font-mono text-2xl tracking-[0.4em] placeholder:tracking-normal")}
                            />
                        </SettingsField>

                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <SettingsButton type="submit" icon={CheckCircle2} loading={isVerifyingOtp} disabled={otpInput.trim().length < 6}>
                                {isVerifyingOtp ? t("Checking the code…") : t("Finish turning it on")}
                            </SettingsButton>
                            <SettingsButton variant="secondary" icon={RotateCcw} onClick={handleSendOtp} disabled={isSendingOtp || otpCooldown > 0}>
                                {otpCooldown > 0 ? t("Send a new code in {seconds} seconds", { seconds: otpCooldown }) : t("Send a new code")}
                            </SettingsButton>
                            <SettingsButton
                                variant="ghost"
                                onClick={() => {
                                    setStatus("disabled");
                                    setOtpInput("");
                                    setOtpError(null);
                                }}
                            >
                                {t("Cancel")}
                            </SettingsButton>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="space-y-5">
                    <SettingsNotice tone="success" title={t("2-step sign-in is on")}>
                        {t("We will email you a code each time you sign in.")}
                        {maskedEmail && <span className="mt-1 block font-semibold">{maskedEmail}</span>}
                    </SettingsNotice>

                    <form onSubmit={handleDisable2FA} noValidate className="space-y-4 border-t-2 border-border pt-5">
                        <SettingsField
                            label={t("Turn off 2-step sign-in")}
                            htmlFor="two-factor-disable-password"
                            help={t("To turn it off, type your password first.")}
                            error={disableError ? t(disableError) : undefined}
                            errorId="two-factor-disable-error"
                        >
                            <SettingsPasswordInput
                                id="two-factor-disable-password"
                                maxLength={CURRENT_PASSWORD_MAX_LENGTH}
                                autoComplete="current-password"
                                aria-invalid={disableError ? true : undefined}
                                aria-describedby={["two-factor-disable-password-help", disableError ? "two-factor-disable-error" : null].filter(Boolean).join(" ")}
                                value={disablePassword}
                                onChange={(e) => {
                                    setDisablePassword(e.target.value);
                                    if (disableError) setDisableError(null);
                                }}
                                placeholder={t("Your password")}
                                hasError={Boolean(disableError)}
                            />
                        </SettingsField>
                        <SettingsButton type="submit" variant="secondary" loading={isDisabling} disabled={!disablePassword}>
                            {isDisabling ? t("Turning it off…") : t("Turn off 2-step sign-in")}
                        </SettingsButton>
                    </form>
                </div>
            )}
        </div>
    );
}
