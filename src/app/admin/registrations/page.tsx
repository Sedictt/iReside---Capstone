"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    BadgeCheck,
    CircleDashed,
    FileCheck,
    FileText,
    LoaderCircle,
    StickyNote,
} from "lucide-react";
import type { ApplicationStatus, UserRole } from "@/types/database";

type RegistrationStatus = Extract<ApplicationStatus, "pending" | "reviewing" | "approved" | "rejected" | "withdrawn">;

interface RegistrationRow {
    id: string;
    profile_id: string;
    phone: string;
    identity_document_url: string | null;
    ownership_document_url: string | null;
    liveness_document_url: string | null;
    status: RegistrationStatus;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
    applicant: {
        id: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
        role: UserRole;
    } | null;
}

interface RegistrationSummary {
    total: number;
    pending: number;
    reviewing: number;
    approved: number;
    rejected: number;
    withdrawn: number;
}

const STATUS_META: Record<Exclude<RegistrationStatus, "withdrawn">, { label: string; color: string; bg: string; border: string }> = {
    pending: { label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.24)" },
    reviewing: { label: "Reviewing", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.24)" },
    approved: { label: "Approved", color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.24)" },
    rejected: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.24)" },
};

const FILTERS = ["all", "pending", "reviewing", "approved", "rejected"] as const;

export default function AdminRegistrationsPage() {
    const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
    const [summary, setSummary] = useState<RegistrationSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
    const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadRegistrations = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/admin/registrations");
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.error || "Failed to load registrations.");
            }

            const nextRows = (payload.registrations ?? []) as RegistrationRow[];
            setRegistrations(nextRows);
            setSummary(payload.summary ?? null);
            setDraftNotes(Object.fromEntries(nextRows.map((row) => [row.id, row.admin_notes ?? ""])));
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load registrations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadRegistrations();
    }, []);

    const filtered = useMemo(() => {
        if (filter === "all") return registrations;
        return registrations.filter((registration) => registration.status === filter);
    }, [filter, registrations]);

    const counts = {
        all: summary?.total ?? registrations.length,
        pending: summary?.pending ?? 0,
        reviewing: summary?.reviewing ?? 0,
        approved: summary?.approved ?? 0,
        rejected: summary?.rejected ?? 0,
    };

    const handleStatusChange = async (registration: RegistrationRow, status: Exclude<RegistrationStatus, "withdrawn">) => {
        setSavingId(registration.id);
        setError(null);

        try {
            const response = await fetch(`/api/admin/registrations/${registration.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status,
                    adminNotes: draftNotes[registration.id] ?? "",
                }),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || "Failed to update registration.");
            }

            await loadRegistrations();
        } catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : "Failed to update registration.");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="min-h-screen p-8">
            <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div
                            className="h-7 w-7 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.28)" }}
                        >
                            <FileCheck className="h-4 w-4 text-amber-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Registration Review</h1>
                    </div>
                    <p className="text-sm text-neutral-500 ml-9.5">
                        Approve or reject landlord access, leave internal notes, and promote approved applicants into the landlord portal.
                    </p>
                </div>

                <div
                    className="rounded-2xl px-4 py-3 max-w-md"
                    style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 mb-1">Actual Power</p>
                    <p className="text-sm text-neutral-300">
                        Approval is operational. Once approved, the applicant&apos;s profile role is promoted to <span className="text-white font-semibold">landlord</span>.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {FILTERS.map((status) => {
                    const active = filter === status;
                    const label = status === "all" ? "All" : STATUS_META[status as Exclude<RegistrationStatus, "withdrawn">].label;
                    return (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setFilter(status)}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                            style={
                                active
                                    ? {
                                          background:
                                              status === "all"
                                                  ? "rgba(255,255,255,0.1)"
                                                  : STATUS_META[status as Exclude<RegistrationStatus, "withdrawn">].bg,
                                          border:
                                              status === "all"
                                                  ? "1px solid rgba(255,255,255,0.18)"
                                                  : `1px solid ${STATUS_META[status as Exclude<RegistrationStatus, "withdrawn">].border}`,
                                          color:
                                              status === "all"
                                                  ? "#ffffff"
                                                  : STATUS_META[status as Exclude<RegistrationStatus, "withdrawn">].color,
                                      }
                                    : {
                                          background: "rgba(255,255,255,0.04)",
                                          border: "1px solid rgba(255,255,255,0.07)",
                                          color: "#8a8a8a",
                                      }
                            }
                        >
                            {label} <span className="opacity-70">({counts[status]})</span>
                        </button>
                    );
                })}
            </div>

            {error && (
                <div
                    className="rounded-2xl px-4 py-3 mb-6 text-sm"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)", color: "#fca5a5" }}
                >
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div
                        className="rounded-2xl p-10 text-center text-neutral-500"
                        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                        Loading registration queue...
                    </div>
                ) : filtered.length === 0 ? (
                    <div
                        className="rounded-2xl p-10 text-center"
                        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                        <p className="text-sm text-neutral-400">No registrations in this queue.</p>
                        <p className="text-xs text-neutral-600 mt-1">When landlord verification requests arrive, they will show up here.</p>
                    </div>
                ) : (
                    filtered.map((registration) => {
                        if (registration.status === "withdrawn") return null;

                        const statusMeta = STATUS_META[registration.status];
                        const applicant = registration.applicant;
                        const currentStatus = registration.status as Exclude<RegistrationStatus, "withdrawn">;
                        const isSaving = savingId === registration.id;
                        const noteValue = draftNotes[registration.id] ?? "";
                        const documents = [
                            { label: "Government ID", url: registration.identity_document_url },
                            { label: "Ownership Proof", url: registration.ownership_document_url },
                            { label: "Liveness Proof", url: registration.liveness_document_url },
                        ];

                        return (
                            <div
                                key={registration.id}
                                className="rounded-3xl p-5"
                                style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <h2 className="text-lg font-bold text-white">{applicant?.full_name || "Unknown applicant"}</h2>
                                            <span
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                style={{ background: statusMeta.bg, border: `1px solid ${statusMeta.border}`, color: statusMeta.color }}
                                            >
                                                <CircleDashed className="h-3 w-3" />
                                                {statusMeta.label}
                                            </span>
                                            {applicant?.role === "landlord" && (
                                                <span
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                    style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.22)", color: "#10b981" }}
                                                >
                                                    <BadgeCheck className="h-3 w-3" />
                                                    Already landlord
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 text-sm text-neutral-400 sm:grid-cols-2">
                                            <p>Email: <span className="text-neutral-200">{applicant?.email || "No email"}</span></p>
                                            <p>Phone: <span className="text-neutral-200">{registration.phone}</span></p>
                                            <p>Requested: <span className="text-neutral-200">{new Date(registration.created_at).toLocaleString()}</span></p>
                                            <p>Last update: <span className="text-neutral-200">{new Date(registration.updated_at).toLocaleString()}</span></p>
                                        </div>
                                    </div>

                                    <Link
                                        href="/admin/users"
                                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-neutral-200 transition-colors hover:text-white"
                                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                                    >
                                        <FileCheck className="h-4 w-4" />
                                        Open user directory
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 gap-4 mt-5 xl:grid-cols-[1.2fr_1fr]">
                                    <div
                                        className="rounded-2xl p-4"
                                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 mb-3">Documents</p>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            {documents.map((document) => (
                                                <div
                                                    key={document.label}
                                                    className="rounded-2xl p-3"
                                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FileText className="h-4 w-4 text-neutral-500" />
                                                        <p className="text-sm font-semibold text-white">{document.label}</p>
                                                    </div>
                                                    {document.url ? (
                                                        <a
                                                            href={document.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-sm text-amber-300 hover:text-amber-200 transition-colors"
                                                        >
                                                            View document
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm text-neutral-600">Not provided</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div
                                        className="rounded-2xl p-4"
                                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <StickyNote className="h-4 w-4 text-neutral-500" />
                                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Internal Notes</p>
                                        </div>
                                        <textarea
                                            value={noteValue}
                                            onChange={(event) =>
                                                setDraftNotes((current) => ({
                                                    ...current,
                                                    [registration.id]: event.target.value,
                                                }))
                                            }
                                            rows={6}
                                            placeholder="Record your findings, document gaps, or approval rationale..."
                                            className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none resize-none"
                                            style={{ background: "#090909", border: "1px solid rgba(255,255,255,0.08)" }}
                                        />
                                        <p className="text-xs text-neutral-600 mt-2">Notes stay internal to the admin review workflow.</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-5">
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => void handleStatusChange(registration, "reviewing")}
                                        className="px-3.5 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60"
                                        style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.22)", color: "#60a5fa" }}
                                    >
                                        Mark Reviewing
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSaving || registration.status === "approved"}
                                        onClick={() => void handleStatusChange(registration, "approved")}
                                        className="px-3.5 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60"
                                        style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.22)", color: "#34d399" }}
                                    >
                                        Approve & Promote
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSaving || registration.status === "approved"}
                                        onClick={() => void handleStatusChange(registration, "rejected")}
                                        className="px-3.5 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60"
                                        style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)", color: "#f87171" }}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => void handleStatusChange(registration, currentStatus)}
                                        className="px-3.5 py-2 rounded-xl text-sm font-semibold text-neutral-300 transition-opacity disabled:opacity-60"
                                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                                    >
                                        Save Notes
                                    </button>
                                    {isSaving && (
                                        <span className="inline-flex items-center gap-2 px-3 py-2 text-sm text-neutral-500">
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                            Saving review...
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
