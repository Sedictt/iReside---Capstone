"use client";

import { useState, useEffect, useMemo } from "react";
import {
    ArrowRightLeft,
    CheckCircle2,
    AlertCircle,
    X,
    Users,
    Building2,
    Send,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";
import { isUnitOccupied, isUnitOnHold, isUnitLockedForIntake, type WalkInUnit } from "@/lib/application-intake";

export interface CompetingApplicantItem {
    id: string;
    name: string;
    email: string;
    status: string;
    source?: string;
}

interface ResolveCompetingApplicantsModalProps {
    isOpen: boolean;
    onClose: () => void;
    takenUnitId: string;
    takenUnitName: string;
    propertyName: string;
    propertyId: string | null;
    winnerName?: string;
    competingApplicants: CompetingApplicantItem[];
    availableUnits: WalkInUnit[];
    onResolved: () => void;
}

export function ResolveCompetingApplicantsModal({
    isOpen,
    onClose,
    takenUnitId,
    takenUnitName,
    propertyName,
    propertyId,
    winnerName,
    competingApplicants,
    availableUnits,
    onResolved,
}: ResolveCompetingApplicantsModalProps) {
    const { t } = useLanguageContext();

    const candidateUnits = useMemo(() => {
        return availableUnits.filter(
            (u) =>
                u.id !== takenUnitId &&
                (!propertyId || u.property_id === propertyId) &&
                !isUnitOccupied(u) &&
                !isUnitOnHold(u) &&
                !isUnitLockedForIntake(u)
        );
    }, [availableUnits, takenUnitId, propertyId]);

    const [selectedTargetUnits, setSelectedTargetUnits] = useState<Record<string, string>>({});
    const [customNotes, setCustomNotes] = useState<Record<string, string>>({});
    const [resolvedMap, setResolvedMap] = useState<
        Record<string, { action: "reassigned" | "declined"; detail: string }>
    >({});
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [errorMap, setErrorMap] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            const initialUnits: Record<string, string> = {};
            const defaultUnitId = candidateUnits[0]?.id ?? "";
            competingApplicants.forEach((app) => {
                initialUnits[app.id] = defaultUnitId;
            });
            setSelectedTargetUnits(initialUnits);
            setCustomNotes({});
            setResolvedMap({});
            setErrorMap({});
            setLoadingId(null);
        }
    }, [isOpen, competingApplicants, candidateUnits]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleReassign = async (applicant: CompetingApplicantItem) => {
        const targetUnitId = selectedTargetUnits[applicant.id];
        if (!targetUnitId) {
            setErrorMap((prev) => ({
                ...prev,
                [applicant.id]: t("Please select a vacant room to offer."),
            }));
            return;
        }

        setErrorMap((prev) => {
            const copy = { ...prev };
            delete copy[applicant.id];
            return copy;
        });
        setLoadingId(applicant.id);

        try {
            const res = await fetch(`/api/landlord/applications/${applicant.id}/reassign-unit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    target_unit_id: targetUnitId,
                    landlord_note:
                        customNotes[applicant.id]?.trim() ||
                        `Hi ${applicant.name}, ${takenUnitName} was just taken, so we reserved a spot for your application in another available room!`,
                    notify_applicant: true,
                }),
            });
            const data = (await res.json()) as any;
            if (!res.ok) {
                throw new Error(data.error || "Failed to move applicant to the selected room.");
            }

            setResolvedMap((prev) => ({
                ...prev,
                [applicant.id]: {
                    action: "reassigned",
                    detail: t("Moved to {unit} & notified by email", { unit: data.new_unit_name || "new room" }),
                },
            }));
            onResolved();
        } catch (err: any) {
            setErrorMap((prev) => ({
                ...prev,
                [applicant.id]: err.message || "Could not move applicant.",
            }));
        } finally {
            setLoadingId(null);
        }
    };

    const handlePoliteDecline = async (applicant: CompetingApplicantItem) => {
        setErrorMap((prev) => {
            const copy = { ...prev };
            delete copy[applicant.id];
            return copy;
        });
        setLoadingId(applicant.id);

        try {
            const reason =
                customNotes[applicant.id]?.trim() ||
                `Thank you for applying for ${takenUnitName} at ${propertyName}. This room has just been leased to another applicant. We appreciate your interest!`;

            const res = await fetch(`/api/landlord/applications/${applicant.id}/actions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "rejected",
                    rejection_reason: reason.slice(0, 250),
                }),
            });
            const data = (await res.json()) as any;
            if (!res.ok) {
                throw new Error(data.error || "Failed to decline application.");
            }

            setResolvedMap((prev) => ({
                ...prev,
                [applicant.id]: {
                    action: "declined",
                    detail: t("Politely declined & notified"),
                },
            }));
            onResolved();
        } catch (err: any) {
            setErrorMap((prev) => ({
                ...prev,
                [applicant.id]: err.message || "Could not decline application.",
            }));
        } finally {
            setLoadingId(null);
        }
    };

    const allHandled =
        competingApplicants.length > 0 &&
        competingApplicants.every((a) => Boolean(resolvedMap[a.id]));

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-card border border-border/60 shadow-xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto overscroll-contain space-y-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto h-1.5 w-12 rounded-full bg-muted sm:hidden" />

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                            <Users className="size-6" />
                        </div>
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                                {propertyName} • {takenUnitName}
                            </span>
                            <h2 className="text-xl font-black tracking-tight text-foreground mt-0.5">
                                {competingApplicants.length === 1
                                    ? t("Offer Another Room to This Applicant")
                                    : t("Other Applicants Waiting for {unit}", { unit: takenUnitName })}
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
                    {winnerName
                        ? t(
                              "{unit} is now assigned to {winner}. You can move the other waiting applicant(s) to another vacant room in 1 click (their uploaded IDs and details stay intact), or send a polite notice.",
                              { unit: takenUnitName, winner: winnerName }
                          )
                        : t(
                              "Move this applicant to another vacant room in 1 click without asking them to re-upload their IDs, or send a polite decline notice."
                          )}
                </p>

                {/* Applicant List */}
                <div className="space-y-4">
                    {competingApplicants.map((applicant) => {
                        const resolved = resolvedMap[applicant.id];
                        const isBusy = loadingId === applicant.id;
                        const err = errorMap[applicant.id];
                        const chosenUnitId = selectedTargetUnits[applicant.id] || "";
                        const chosenUnit = candidateUnits.find((u) => u.id === chosenUnitId);
                        const noteValue = customNotes[applicant.id] || "";

                        return (
                            <div
                                key={applicant.id}
                                className="rounded-2xl border border-border/70 bg-muted/20 p-5 space-y-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-bold text-foreground">
                                                {applicant.name}
                                            </span>
                                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                                                {applicant.source === "invite_link"
                                                    ? t("Online Invite")
                                                    : t("Walk-in")}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {applicant.email || t("No email provided")}
                                        </p>
                                    </div>

                                    {resolved && (
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                                                resolved.action === "reassigned"
                                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                                    : "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300"
                                            )}
                                        >
                                            <CheckCircle2 className="size-4" />
                                            {resolved.detail}
                                        </span>
                                    )}
                                </div>

                                {!resolved && (
                                    <div className="space-y-4 pt-1">
                                        {candidateUnits.length > 0 ? (
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor={`target-unit-${applicant.id}`}
                                                    className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                                >
                                                    {t("Select Vacant Room to Recommend")}
                                                </label>
                                                <select
                                                    id={`target-unit-${applicant.id}`}
                                                    value={chosenUnitId}
                                                    onChange={(e) =>
                                                        setSelectedTargetUnits((prev) => ({
                                                            ...prev,
                                                            [applicant.id]: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                >
                                                    {candidateUnits.map((unit) => (
                                                        <option key={unit.id} value={unit.id}>
                                                            {unit.name} — ₱{unit.rent_amount.toLocaleString()}/mo (Vacant)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                                <Building2 className="size-4 shrink-0" />
                                                <span>
                                                    {t("No other vacant rooms are currently available in this property.")}
                                                </span>
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor={`note-${applicant.id}`}
                                                className="block text-xs font-bold text-muted-foreground"
                                            >
                                                {t("Optional Note to Applicant (We pre-wrote a friendly message for you)")}
                                            </label>
                                            <textarea
                                                id={`note-${applicant.id}`}
                                                rows={2}
                                                maxLength={250}
                                                value={noteValue}
                                                onChange={(e) =>
                                                    setCustomNotes((prev) => ({
                                                        ...prev,
                                                        [applicant.id]: e.target.value,
                                                    }))
                                                }
                                                placeholder={t(
                                                    "Leave blank to send our standard polite recommendation or decline message..."
                                                )}
                                                className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            />
                                            <div className="flex justify-end">
                                                <span className="text-xs text-muted-foreground tabular-nums">
                                                    {noteValue.length} / 250
                                                </span>
                                            </div>
                                        </div>

                                        {err && (
                                            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                                                <AlertCircle className="size-4 shrink-0" />
                                                <span>{err}</span>
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                            {candidateUnits.length > 0 && (
                                                <button
                                                    type="button"
                                                    disabled={isBusy}
                                                    onClick={() => handleReassign(applicant)}
                                                    className="flex-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
                                                >
                                                    <ArrowRightLeft className="size-4 shrink-0" />
                                                    {isBusy
                                                        ? t("Moving...")
                                                        : t("Move to {unit} & Notify", {
                                                              unit: chosenUnit?.name || t("Selected Room"),
                                                          })}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                disabled={isBusy}
                                                onClick={() => handlePoliteDecline(applicant)}
                                                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 transition-colors"
                                            >
                                                <XCircle className="size-4 shrink-0" />
                                                {isBusy ? t("Sending...") : t("Politely Decline")}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end pt-2 border-t border-border/60">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-12 items-center justify-center rounded-xl bg-muted px-6 text-sm font-bold text-foreground hover:bg-muted/80 transition-colors"
                    >
                        {allHandled ? t("Done") : t("Decide Later")}
                    </button>
                </div>
            </div>
        </div>
    );
}
