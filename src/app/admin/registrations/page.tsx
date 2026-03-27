"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    CheckCircle, XCircle, Eye, Clock, RefreshCw,
    ClipboardList, FileText, ExternalLink, AlertCircle,
    ChevronRight, X,
} from "lucide-react";
import type { ApplicationStatus } from "@/types/database";

interface Registration {
    id: string;
    phone: string;
    status: ApplicationStatus;
    admin_notes: string | null;
    created_at: string;
    identity_document_url: string | null;
    ownership_document_url: string | null;
    liveness_document_url: string | null;
    profile: {
        id: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
    } | null;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
    pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", icon: Clock, label: "Pending" },
    reviewing: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", icon: Eye, label: "Reviewing" },
    approved: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", icon: CheckCircle, label: "Approved" },
    rejected: { color: "#f43f5e", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.2)", icon: XCircle, label: "Rejected" },
    withdrawn: { color: "#737373", bg: "rgba(115,115,115,0.1)", border: "rgba(115,115,115,0.2)", icon: AlertCircle, label: "Withdrawn" },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.withdrawn;
    const Icon = cfg.icon;
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
    const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    if (url) return <img src={url} alt={name} className="h-9 w-9 rounded-full object-cover shrink-0" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />;
    return (
        <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {initials}
        </div>
    );
}

export default function AdminRegistrationsPage() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Registration | null>(null);
    const [notes, setNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [filter, setFilter] = useState<ApplicationStatus | "all">("all");

    const load = useCallback(() => {
        setLoading(true);
        fetch("/api/admin/registrations")
            .then((r) => r.json())
            .then(({ registrations }) => setRegistrations(registrations ?? []))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAction = async (status: ApplicationStatus) => {
        if (!selected) return;
        setActionLoading(true);
        await fetch(`/api/admin/registrations/${selected.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, admin_notes: notes }),
        });
        setActionLoading(false);
        setSelected(null);
        setNotes("");
        load();
    };

    const filtered = filter === "all" ? registrations : registrations.filter((r) => r.status === filter);

    const counts = {
        all: registrations.length,
        pending: registrations.filter((r) => r.status === "pending").length,
        reviewing: registrations.filter((r) => r.status === "reviewing").length,
        approved: registrations.filter((r) => r.status === "approved").length,
        rejected: registrations.filter((r) => r.status === "rejected").length,
    };

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)" }}>
                            <ClipboardList className="h-4 w-4 text-amber-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Registrations</h1>
                    </div>
                    <p className="text-sm text-neutral-500 ml-9.5">Review and approve landlord verification requests</p>
                </div>
                <button
                    onClick={load}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {(["all", "pending", "reviewing", "approved", "rejected"] as const).map((s) => {
                    const active = filter === s;
                    const cfg = s !== "all" ? STATUS_CONFIG[s] : null;
                    return (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200"
                            style={active ? {
                                background: cfg ? cfg.bg : "rgba(255,255,255,0.1)",
                                border: `1px solid ${cfg ? cfg.border : "rgba(255,255,255,0.2)"}`,
                                color: cfg ? cfg.color : "#ffffff",
                            } : {
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                color: "#737373",
                            }}
                        >
                            {s} <span className="opacity-60">({counts[s] ?? 0})</span>
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600">Applicant</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600 w-32">Phone</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600 w-28">Status</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600 w-28">Submitted</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600 w-20 text-right">Action</p>
                </div>

                {loading ? (
                    <div className="py-16 flex flex-col items-center gap-3">
                        <div className="h-8 w-8 rounded-full border-2 border-neutral-800 border-t-neutral-500 animate-spin" />
                        <p className="text-sm text-neutral-600">Loading registrations...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-2">
                        <ClipboardList className="h-8 w-8 text-neutral-700" />
                        <p className="text-sm text-neutral-500">No registrations found</p>
                        <p className="text-xs text-neutral-700">Try a different filter</p>
                    </div>
                ) : (
                    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        {filtered.map((reg) => (
                            <div key={reg.id}
                                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 transition-colors duration-150"
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                {/* Applicant */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar name={reg.profile?.full_name ?? "?"} url={reg.profile?.avatar_url ?? null} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{reg.profile?.full_name ?? "—"}</p>
                                        <p className="text-xs text-neutral-500 truncate">{reg.profile?.email ?? "—"}</p>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="w-32">
                                    <p className="text-sm text-neutral-400">{reg.phone}</p>
                                </div>

                                {/* Status */}
                                <div className="w-28">
                                    <StatusBadge status={reg.status} />
                                </div>

                                {/* Date */}
                                <div className="w-28">
                                    <p className="text-xs text-neutral-500">
                                        {new Date(reg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                </div>

                                {/* Action */}
                                <div className="w-20 flex justify-end">
                                    <button
                                        onClick={() => { setSelected(reg); setNotes(reg.admin_notes ?? ""); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white transition-all duration-200"
                                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                        Review
                                        <ChevronRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {selected && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
                    onClick={(e) => { if (e.target === e.currentTarget) { setSelected(null); setNotes(""); } }}>
                    <div className="w-full max-w-lg rounded-2xl overflow-hidden"
                        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>

                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-5"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                            <div className="flex items-center gap-3">
                                <Avatar name={selected.profile?.full_name ?? "?"} url={selected.profile?.avatar_url ?? null} />
                                <div>
                                    <p className="text-sm font-bold text-white">{selected.profile?.full_name ?? "Unknown"}</p>
                                    <p className="text-xs text-neutral-500">{selected.profile?.email ?? "—"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={selected.status} />
                                <button
                                    onClick={() => { setSelected(null); setNotes(""); }}
                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
                                    style={{ background: "rgba(255,255,255,0.05)" }}>
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Documents */}
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600 mb-3">Submitted Documents</p>
                                <div className="space-y-2">
                                    {[
                                        { label: "Identity Document", url: selected.identity_document_url, icon: FileText },
                                        { label: "Ownership Document", url: selected.ownership_document_url, icon: FileText },
                                        { label: "Liveness Video", url: selected.liveness_document_url, icon: FileText },
                                    ].map(({ label, url, icon: Icon }) => (
                                        <div key={label}
                                            className="flex items-center justify-between px-4 py-3 rounded-xl"
                                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="h-4 w-4 text-neutral-600" />
                                                <span className="text-sm text-neutral-300">{label}</span>
                                            </div>
                                            {url ? (
                                                <a href={url} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                                                    View <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-neutral-700">Not provided</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Admin Notes */}
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600 mb-2">Admin Notes</p>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Add notes for this applicant..."
                                    className="w-full px-4 py-3 text-sm text-white placeholder-neutral-700 rounded-xl resize-none focus:outline-none transition-all duration-200"
                                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)")}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                                />
                            </div>

                            {/* Action buttons */}
                            <div className="grid grid-cols-3 gap-2.5">
                                <button
                                    onClick={() => handleAction("reviewing")}
                                    disabled={actionLoading || selected.status === "reviewing"}
                                    className="py-2.5 rounded-xl text-xs font-bold transition-all duration-200 disabled:opacity-40"
                                    style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", color: "#3b82f6" }}>
                                    Mark Reviewing
                                </button>
                                <button
                                    onClick={() => handleAction("approved")}
                                    disabled={actionLoading}
                                    className="py-2.5 rounded-xl text-xs font-bold transition-all duration-200 disabled:opacity-40"
                                    style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleAction("rejected")}
                                    disabled={actionLoading}
                                    className="py-2.5 rounded-xl text-xs font-bold transition-all duration-200 disabled:opacity-40"
                                    style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.25)", color: "#f43f5e" }}>
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
}
