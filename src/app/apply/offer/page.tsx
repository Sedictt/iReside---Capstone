"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    AlertCircle,
    ArrowRightLeft,
    Building2,
    CheckCircle2,
    Loader2,
    XCircle,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme-toggle";

interface OfferDetails {
    applicationId: string;
    applicantName: string;
    propertyName: string;
    propertyAddress: string | null;
    previousUnitName: string;
    offeredUnitId: string;
    offeredUnitName: string;
    offeredMonthlyRent: number;
    landlordNote: string | null;
    offeredAt: string | null;
    offerStatus: "pending" | "accepted" | "cancelled";
    respondedAt: string | null;
    applicationStatus: string;
    unitStillAvailable: boolean;
    unavailableReason: string | null;
}

function OfferResponseContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token")?.trim() ?? "";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [offer, setOffer] = useState<OfferDetails | null>(null);
    const [submitting, setSubmitting] = useState<"accept" | "cancel" | null>(null);
    const [confirmingCancel, setConfirmingCancel] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        async function loadOffer() {
            if (!token) {
                setError("Missing room offer link token.");
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`/api/apply/offer?token=${encodeURIComponent(token)}`);
                const data = (await res.json()) as any;
                if (!active) return;
                if (!res.ok) {
                    setError(data.error || "Unable to load this room offer.");
                } else {
                    setOffer(data as OfferDetails);
                }
            } catch {
                if (active) setError("Unable to reach the server. Please try again.");
            } finally {
                if (active) setLoading(false);
            }
        }
        void loadOffer();
        return () => {
            active = false;
        };
    }, [token]);

    const handleDecision = async (decision: "accept" | "cancel") => {
        if (!token || submitting) return;
        setActionError(null);
        setSubmitting(decision);
        try {
            const res = await fetch("/api/apply/offer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, decision }),
            });
            const data = (await res.json()) as any;
            if (!res.ok) {
                throw new Error(data.error || "Could not save your response.");
            }
            setOffer((prev) =>
                prev
                    ? {
                          ...prev,
                          offerStatus: data.offer_status,
                          applicationStatus: data.application_status,
                          respondedAt: new Date().toISOString(),
                      }
                    : prev
            );
            setConfirmingCancel(false);
        } catch (err: any) {
            setActionError(err.message || "Could not save your response. Please try again.");
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <header className="sticky top-0 z-30 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <Logo className="size-8" />
                        <span className="text-lg font-black tracking-tight">iReside</span>
                    </Link>
                    <ThemeToggle />
                </div>
            </header>

            <main className="mx-auto max-w-xl px-4 py-10 sm:py-14">
                {loading && (
                    <div className="rounded-3xl border border-border/60 bg-card p-8 text-center shadow-sm space-y-3">
                        <Loader2 className="mx-auto size-8 animate-spin text-primary" />
                        <p className="text-sm font-semibold text-muted-foreground">
                            Loading your room offer...
                        </p>
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-3xl border border-red-500/30 bg-card p-8 text-center shadow-sm space-y-4">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
                            <AlertCircle className="size-6" />
                        </div>
                        <h1 className="text-xl font-black tracking-tight">Room Offer Unavailable</h1>
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <Link
                            href="/apply"
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Back to Applications
                        </Link>
                    </div>
                )}

                {!loading && offer && (
                    <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm space-y-6">
                        <div className="flex items-start gap-3.5">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                                <Building2 className="size-6" />
                            </div>
                            <div>
                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                                    {offer.propertyName}
                                </span>
                                <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">
                                    {offer.offerStatus === "accepted"
                                        ? `You Accepted ${offer.offeredUnitName}`
                                        : offer.offerStatus === "cancelled"
                                        ? "Application Cancelled"
                                        : `Would You Like ${offer.offeredUnitName} Instead?`}
                                </h1>
                            </div>
                        </div>

                        {offer.offerStatus === "accepted" && (
                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2">
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                                    <CheckCircle2 className="size-5 shrink-0" />
                                    <span>Your application has been moved to {offer.offeredUnitName}.</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    All of your submitted details and uploaded IDs were carried over automatically. Your landlord will follow up with the next steps.
                                </p>
                            </div>
                        )}

                        {offer.offerStatus === "cancelled" && (
                            <div className="rounded-2xl border border-border bg-muted/40 p-5 space-y-2">
                                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                                    <XCircle className="size-5 shrink-0 text-muted-foreground" />
                                    <span>Your application has been withdrawn.</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    We let the landlord know that you decided not to switch rooms. Thank you for considering {offer.propertyName}.
                                </p>
                            </div>
                        )}

                        {offer.offerStatus === "pending" && (
                            <>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Hi <span className="font-semibold text-foreground">{offer.applicantName}</span>,{" "}
                                    <span className="font-semibold text-foreground">{offer.previousUnitName}</span> was just leased to another applicant. Your landlord is offering you{" "}
                                    <span className="font-semibold text-foreground">{offer.offeredUnitName}</span> instead—you can choose to switch your existing application over (no re-uploading needed) or cancel your application.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-1">
                                        <span className="text-xs font-bold text-muted-foreground">
                                            Original Room
                                        </span>
                                        <p className="text-base font-bold text-muted-foreground line-through">
                                            {offer.previousUnitName}
                                        </p>
                                        <span className="inline-block text-xs font-semibold text-amber-700 dark:text-amber-300">
                                            No longer available
                                        </span>
                                    </div>
                                    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-1">
                                        <span className="text-xs font-bold text-primary">
                                            Offered Room
                                        </span>
                                        <p className="text-base font-black text-foreground">
                                            {offer.offeredUnitName}
                                        </p>
                                        <span className="inline-block text-xs font-bold text-foreground tabular-nums">
                                            ₱{offer.offeredMonthlyRent.toLocaleString()} / month
                                        </span>
                                    </div>
                                </div>

                                {offer.landlordNote && (
                                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Note from Landlord
                                        </span>
                                        <p className="text-sm text-foreground leading-relaxed">
                                            {offer.landlordNote}
                                        </p>
                                    </div>
                                )}

                                {!offer.unitStillAvailable && (
                                    <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                                        <AlertCircle className="size-4 shrink-0" />
                                        <span>
                                            {offer.unavailableReason || "This room is no longer available."} You can still cancel your application below or contact your landlord.
                                        </span>
                                    </div>
                                )}

                                {actionError && (
                                    <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400">
                                        <AlertCircle className="size-4 shrink-0" />
                                        <span>{actionError}</span>
                                    </div>
                                )}

                                {!confirmingCancel ? (
                                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                        <button
                                            type="button"
                                            disabled={!offer.unitStillAvailable || submitting !== null}
                                            onClick={() => void handleDecision("accept")}
                                            className="flex-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
                                        >
                                            {submitting === "accept" ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <ArrowRightLeft className="size-4 shrink-0" />
                                            )}
                                            {submitting === "accept"
                                                ? "Accepting..."
                                                : `Accept ${offer.offeredUnitName}`}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={submitting !== null}
                                            onClick={() => setConfirmingCancel(true)}
                                            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-bold text-foreground hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 transition-colors cursor-pointer"
                                        >
                                            <XCircle className="size-4 shrink-0" />
                                            Cancel My Application
                                        </button>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                                        <p className="text-sm font-bold text-foreground">
                                            Cancel your application?
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            This will withdraw your application for {offer.propertyName} and decline {offer.offeredUnitName}.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-2.5">
                                            <button
                                                type="button"
                                                disabled={submitting !== null}
                                                onClick={() => void handleDecision("cancel")}
                                                className="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50 transition-colors cursor-pointer"
                                            >
                                                {submitting === "cancel" && (
                                                    <Loader2 className="size-4 animate-spin" />
                                                )}
                                                {submitting === "cancel"
                                                    ? "Cancelling..."
                                                    : "Yes, Cancel Application"}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={submitting !== null}
                                                onClick={() => setConfirmingCancel(false)}
                                                className="flex h-11 items-center justify-center rounded-xl bg-muted px-4 text-sm font-bold text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                                            >
                                                Keep Looking
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function ApplyOfferPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-primary" />
                </div>
            }
        >
            <OfferResponseContent />
        </Suspense>
    );
}
