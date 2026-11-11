"use client";

import { useState, useEffect } from "react";
import { Clock, Lock, Unlock, AlertCircle, CheckCircle2, X, Users, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";
import type { HoldDurationPreset } from "@/lib/validation/schemas/tenant-lifecycle.schema";
import type { UnitHoldInfo } from "@/lib/application-intake";

interface UnitHoldModalProps {
    isOpen: boolean;
    onClose: () => void;
    unitId: string;
    unitName: string;
    propertyName: string;
    defaultApplicantName?: string;
    defaultApplicationId?: string | null;
    competingApplicantsCount?: number;
    existingHold?: UnitHoldInfo | null;
    onHoldUpdated: (unitId: string, holdInfo: UnitHoldInfo | null) => void;
}

const DURATION_OPTIONS: { value: HoldDurationPreset; label: string; sublabel: string }[] = [
    { value: "24h", label: "24 Hours", sublabel: "Good for same-day cash or GCash" },
    { value: "48h", label: "48 Hours", sublabel: "Recommended (2 days)" },
    { value: "72h", label: "3 Days", sublabel: "For bank transfer or parents sending funds" },
    { value: "manual", label: "Until I Turn It Off", sublabel: "No automatic timer" },
];

export function UnitHoldModal({
    isOpen,
    onClose,
    unitId,
    unitName,
    propertyName,
    defaultApplicantName = "",
    defaultApplicationId = null,
    competingApplicantsCount = 0,
    existingHold = null,
    onHoldUpdated,
}: UnitHoldModalProps) {
    const { t } = useLanguageContext();
    const [heldForName, setHeldForName] = useState(defaultApplicantName);
    const [durationPreset, setDurationPreset] = useState<HoldDurationPreset>("48h");
    const [holdNote, setHoldNote] = useState("");
    const [notifyOthers, setNotifyOthers] = useState(competingApplicantsCount > 0);
    const [nameError, setNameError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [releasing, setReleasing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setHeldForName(existingHold?.held_for_name || defaultApplicantName || "");
            setHoldNote(existingHold?.hold_note || "");
            setDurationPreset("48h");
            setNotifyOthers(competingApplicantsCount > 0);
            setNameError(null);
            setSubmitError(null);
        }
    }, [isOpen, existingHold, defaultApplicantName, competingApplicantsCount]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const validateName = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return t("Please enter the name of the person you are holding this room for.");
        if (trimmed.length < 2) return t("Name must be at least 2 characters.");
        if (trimmed.length > 50) return t("Name cannot exceed 50 characters.");
        return null;
    };

    const handleNameChange = (value: string) => {
        setHeldForName(value);
        if (nameError) {
            setNameError(validateName(value));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        const err = validateName(heldForName);
        if (err) {
            setNameError(err);
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`/api/landlord/units/${unitId}/hold`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    held_for_name: heldForName.trim(),
                    held_by_application_id: defaultApplicationId,
                    duration_preset: durationPreset,
                    hold_note: holdNote.trim() || null,
                    notify_other_applicants: notifyOthers,
                }),
            });

            const data = (await response.json()) as any;
            if (!response.ok) {
                throw new Error(data.error || "Failed to place room on hold.");
            }

            onHoldUpdated(unitId, data.hold_info ?? null);
            onClose();
        } catch (error: any) {
            setSubmitError(error.message || "Could not place room on hold. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReleaseHold = async () => {
        setSubmitError(null);
        setReleasing(true);
        try {
            const response = await fetch(`/api/landlord/units/${unitId}/hold`, {
                method: "DELETE",
            });
            const data = (await response.json()) as any;
            if (!response.ok) {
                throw new Error(data.error || "Failed to release hold.");
            }
            onHoldUpdated(unitId, null);
            onClose();
        } catch (error: any) {
            setSubmitError(error.message || "Could not release room hold.");
        } finally {
            setReleasing(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-card border border-border/60 shadow-xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto overscroll-contain space-y-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle on Mobile */}
                <div className="mx-auto h-1.5 w-12 rounded-full bg-muted sm:hidden" />

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Lock className="size-6" />
                        </div>
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                                {propertyName} • {unitName}
                            </span>
                            <h2 className="text-xl font-black tracking-tight text-foreground mt-0.5">
                                {existingHold ? t("Manage Room Hold") : t("Hold Room for Applicant")}
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("Close")}
                        className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("Holding this room stops new online applicants from picking it while you wait for your chosen applicant to send their payment.")}
                </p>

                {existingHold && (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                <Clock className="size-4" />
                                {t("Currently On Hold")}
                            </span>
                            {existingHold.hold_expires_at && (
                                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                    {t("Until")} {new Date(existingHold.hold_expires_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-bold text-foreground">
                            {t("Reserved for:")} {existingHold.held_for_name}
                        </p>
                        {existingHold.hold_note && (
                            <p className="text-xs text-muted-foreground">{existingHold.hold_note}</p>
                        )}
                    </div>
                )}

                <form noValidate onSubmit={handleSubmit} className="space-y-5">
                    {/* Person Name */}
                    <div className="space-y-2">
                        <label htmlFor="hold-for-name" className="block text-sm font-bold text-foreground">
                            {t("Who are you holding this room for?")}
                        </label>
                        <input
                            id="hold-for-name"
                            type="text"
                            maxLength={50}
                            value={heldForName}
                            onChange={(e) => handleNameChange(e.target.value)}
                            onBlur={() => setNameError(validateName(heldForName))}
                            placeholder={t("e.g., Juan Dela Cruz")}
                            className={cn(
                                "w-full h-12 rounded-xl border bg-background px-4 text-base font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                nameError ? "border-red-500" : "border-border"
                            )}
                        />
                        {nameError && (
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                                <AlertCircle className="size-4 shrink-0" />
                                {nameError}
                            </p>
                        )}
                    </div>

                    {/* Hold Duration Presets */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-foreground">
                            {t("How long should we hold the room?")}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {DURATION_OPTIONS.map((opt) => {
                                const active = durationPreset === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setDurationPreset(opt.value)}
                                        className={cn(
                                            "flex flex-col items-start justify-center rounded-xl border p-3.5 text-left transition-all min-h-[60px]",
                                            active
                                                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                                                : "border-border/70 bg-muted/20 text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-sm font-bold">{t(opt.label)}</span>
                                            {active && <CheckCircle2 className="size-4 text-primary shrink-0" />}
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-0.5">
                                            {t(opt.sublabel)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Optional Note */}
                    <div className="space-y-2">
                        <label htmlFor="hold-note" className="block text-sm font-bold text-foreground">
                            {t("Quick Reminder Note (Optional)")}
                        </label>
                        <textarea
                            id="hold-note"
                            rows={2}
                            maxLength={250}
                            value={holdNote}
                            onChange={(e) => setHoldNote(e.target.value)}
                            placeholder={t("e.g., Walk-in student, promised to send GCash deposit by 6 PM")}
                            className="w-full rounded-xl border border-border bg-background p-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                        <div className="flex justify-end">
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {holdNote.length} / 250
                            </span>
                        </div>
                    </div>

                    {/* Notify competing applicants toggle */}
                    {competingApplicantsCount > 0 && (
                        <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={notifyOthers}
                                onChange={(e) => setNotifyOthers(e.target.checked)}
                                className="mt-1 size-5 rounded border-border text-primary focus:ring-primary"
                            />
                            <div className="space-y-0.5">
                                <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                    <Bell className="size-4 text-primary" />
                                    {t("Notify {count} other waiting applicant(s)", { count: competingApplicantsCount })}
                                </span>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t("Sends a polite email letting them know this room is temporarily on hold and keeping them on your backup list.")}
                                </p>
                            </div>
                        </label>
                    )}

                    {submitError && (
                        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{submitError}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                        {existingHold && (
                            <button
                                type="button"
                                disabled={releasing || submitting}
                                onClick={handleReleaseHold}
                                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-500/10 px-5 text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors min-w-[160px]"
                            >
                                <Unlock className="size-4" />
                                {releasing ? t("Releasing...") : t("Release Hold (Make Vacant)")}
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={submitting || releasing}
                            aria-busy={submitting}
                            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all min-w-[170px]"
                        >
                            <Lock className="size-4" />
                            {submitting
                                ? t("Saving Hold...")
                                : existingHold
                                  ? t("Update Room Hold")
                                  : t("Hold Room Now")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
