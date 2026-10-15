"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { KeyRound, AlertCircle, RefreshCw, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { SecurityKeyDisplayCard } from "@/components/auth/SecurityKeyDisplayCard";
import { useFormValidation } from "@/hooks/useFormValidation";
import { otpRule } from "@/lib/validation/rules";
import { CURRENT_PASSWORD_MAX_LENGTH, currentPasswordRule } from "@/lib/validation/schemas/account.schema";
import {
    SettingsButton,
    SettingsField,
    SettingsNotice,
    SettingsPasswordInput,
    settingsInputClass,
} from "@/components/settings/settings-ui";

interface SecurityKeyManagementCardProps {
    className?: string;
    accountEmail?: string;
}

export function SecurityKeyManagementCard({
    className,
    accountEmail,
}: SecurityKeyManagementCardProps) {
    const { t } = useLanguageContext();
    const [isLoading, setIsLoading] = useState(true);
    const [hasSecurityKey, setHasSecurityKey] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);
    const [isRotating, setIsRotating] = useState(false);
    const [rotationError, setRotationError] = useState<string | null>(null);

    // Newly generated key after rotation
    const [newSecurityKey, setNewSecurityKey] = useState<string | null>(null);
    const [isAcknowledged, setIsAcknowledged] = useState(false);

    // Re-auth only checks that the current password was entered (no strength rules).
    const rotateForm = useFormValidation(
        { currentPassword, otpCode },
        {
            currentPassword: (value) => currentPasswordRule(value, { label: "Current password" }),
            otpCode: (value) => otpRule(value),
        },
    );

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
                setRotationError(t(data.error || "Failed to dispatch verification code."));
            } else {
                setOtpSentMessage(t(data.message || "Verification code sent to your email."));
                setOtpCooldown(60);
                toast.success(t("Verification code sent to your registered email."));
            }
        } catch (err) {
            console.error("[SecurityKeyManagementCard] Error sending OTP:", err);
            setRotationError(t("Failed to dispatch verification code. Please try again."));
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleRotateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isRotating) return;
        setRotationError(null);

        if (!rotateForm.validateAll()) return;

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
                rotateForm.setServerErrors(data.fieldErrors);
                setRotationError(t(data.error || "Failed to rotate security key. Please check your credentials."));
            } else if (data.newSecurityKey) {
                setNewSecurityKey(data.newSecurityKey);
                setHasSecurityKey(true);
                setUpdatedAt(data.updatedAt || new Date().toISOString());
                toast.success(t("New security recovery key generated!"));
            }
        } catch (err) {
            console.error("[SecurityKeyManagementCard] Error rotating key:", err);
            setRotationError(t("An unexpected error occurred. Please try again."));
        } finally {
            setIsRotating(false);
        }
    };

    const handleCloseModal = () => {
        if (newSecurityKey && !isAcknowledged) {
            toast.error(t("Please confirm that you have safely stored your new recovery key."));
            return;
        }
        setIsModalOpen(false);
        setCurrentPassword("");
        setOtpCode("");
        setOtpSentMessage(null);
        setRotationError(null);
        rotateForm.reset();
        setNewSecurityKey(null);
        setIsAcknowledged(false);
        fetchStatus();
    };

    const openModal = () => {
        setRotationError(null);
        setNewSecurityKey(null);
        setIsAcknowledged(false);
        setCurrentPassword("");
        setOtpCode("");
        setIsModalOpen(true);
    };

    return (
        <>
            <div className={cn("space-y-5 rounded-2xl border-2 border-foreground/15 p-5", className)}>
                <div className="flex items-start gap-3">
                    <KeyRound className="mt-0.5 size-7 shrink-0 text-foreground" aria-hidden />
                    <div className="space-y-1">
                        <h3 className="flex flex-wrap items-center gap-2 text-xl font-bold text-foreground">
                            <span>{t("Backup recovery key")}</span>
                            {!isLoading && (
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-bold",
                                        hasSecurityKey ? "bg-emerald-700 text-white" : "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100",
                                    )}
                                >
                                    {hasSecurityKey ? <CheckCircle2 className="size-4" aria-hidden /> : <AlertCircle className="size-4" aria-hidden />}
                                    {hasSecurityKey ? t("Ready") : t("Not made yet")}
                                </span>
                            )}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed">
                            {t("A secret code you keep somewhere safe, like a notebook. If you ever cannot sign in, this code lets you back in. Each code works one time.")}
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <p role="status" className="flex items-center gap-2 text-lg text-muted-foreground">
                        <Loader2 className="size-5 motion-safe:animate-spin" aria-hidden /> {t("Checking…")}
                    </p>
                ) : (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-base text-foreground">
                            {t("Last made:")}{" "}
                            <span className="font-bold">
                                {updatedAt ? <ClientOnlyDate date={updatedAt} format={{ month: "long", day: "numeric", year: "numeric" }} /> : t("Not made yet")}
                            </span>
                        </p>
                        <SettingsButton variant="secondary" icon={RefreshCw} onClick={openModal}>
                            {hasSecurityKey ? t("Make a new recovery key") : t("Make my recovery key")}
                        </SettingsButton>
                    </div>
                )}
            </div>

            <Dialog.Root open={isModalOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/60" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-[201] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-2 border-foreground/15 bg-card p-6 sm:p-8 shadow-2xl focus:outline-none">
                        <div className="mb-6 space-y-2">
                            <Dialog.Title className="text-2xl font-bold text-foreground">
                                {newSecurityKey ? t("Your new recovery key") : t("Make a new recovery key")}
                            </Dialog.Title>
                            <Dialog.Description className="text-lg text-muted-foreground leading-relaxed">
                                {newSecurityKey
                                    ? t("Write this down or save it somewhere safe before you close this window.")
                                    : t("To make sure it is really you, type your password and the code we email you.")}
                            </Dialog.Description>
                        </div>

                        {newSecurityKey ? (
                            <div className="space-y-5">
                                <SecurityKeyDisplayCard
                                    securityKey={newSecurityKey}
                                    isAcknowledged={isAcknowledged}
                                    onToggleAcknowledge={setIsAcknowledged}
                                    title={t("New Single-Use Recovery Key")}
                                    description={t("Your previous security key has been invalidated. Save this new recovery key in a password manager or offline file.")}
                                    accountEmail={accountEmail}
                                />
                                <SettingsButton size="lg" icon={CheckCircle2} disabled={!isAcknowledged} onClick={handleCloseModal} className="w-full">
                                    {t("I saved it. Close")}
                                </SettingsButton>
                            </div>
                        ) : (
                            <form onSubmit={handleRotateSubmit} className="space-y-6" noValidate>
                                {hasSecurityKey && (
                                    <SettingsNotice tone="warning">{t("Your old recovery key will stop working once you make a new one.")}</SettingsNotice>
                                )}
                                {rotationError && (
                                    <SettingsNotice tone="danger" live>
                                        {rotationError}
                                    </SettingsNotice>
                                )}

                                <SettingsField
                                    label={t("Your password")}
                                    htmlFor="security-key-password"
                                    error={rotateForm.errorFor("currentPassword") ? t(rotateForm.errorFor("currentPassword")!) : undefined}
                                    errorId={rotateForm.errorId("currentPassword")}
                                >
                                    <SettingsPasswordInput
                                        id="security-key-password"
                                        {...rotateForm.fieldProps("currentPassword")}
                                        maxLength={CURRENT_PASSWORD_MAX_LENGTH}
                                        autoComplete="current-password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        hasError={Boolean(rotateForm.errorFor("currentPassword"))}
                                    />
                                </SettingsField>

                                <SettingsField
                                    label={t("Code from your email")}
                                    htmlFor="security-key-otp"
                                    help={t("Press the button below and we will email you a 6-digit code.")}
                                    error={rotateForm.errorFor("otpCode") ? t(rotateForm.errorFor("otpCode")!) : undefined}
                                    errorId={rotateForm.errorId("otpCode")}
                                >
                                    <input
                                        id="security-key-otp"
                                        {...rotateForm.fieldProps("otpCode")}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        placeholder="000000"
                                        className={settingsInputClass(Boolean(rotateForm.errorFor("otpCode")), "max-w-xs text-center font-mono text-2xl tracking-[0.4em] placeholder:tracking-normal")}
                                    />
                                    <SettingsButton
                                        variant="secondary"
                                        icon={Mail}
                                        className="mt-3"
                                        loading={isSendingOtp}
                                        disabled={otpCooldown > 0}
                                        onClick={handleSendOtp}
                                    >
                                        {isSendingOtp
                                            ? t("Sending the code…")
                                            : otpCooldown > 0
                                              ? t("Send a new code in {seconds} seconds", { seconds: otpCooldown })
                                              : t("Email me a code")}
                                    </SettingsButton>
                                    {otpSentMessage && (
                                        <p role="status" className="mt-2 text-base font-semibold text-emerald-700 dark:text-emerald-400">
                                            {otpSentMessage}
                                        </p>
                                    )}
                                </SettingsField>

                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <SettingsButton variant="ghost" onClick={handleCloseModal}>
                                        {t("Cancel")}
                                    </SettingsButton>
                                    <SettingsButton type="submit" icon={KeyRound} loading={isRotating}>
                                        {isRotating ? t("Making your key…") : t("Make my recovery key")}
                                    </SettingsButton>
                                </div>
                            </form>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}
