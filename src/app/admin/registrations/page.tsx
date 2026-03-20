"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, Eye, Clock, RefreshCw } from "lucide-react";
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

const STATUS_BADGE: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    reviewing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    withdrawn: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
};

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

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Landlord Registrations</h1>
                    <p className="text-neutral-400 text-sm mt-1">Review and approve landlord verification requests</p>
                </div>
                <button onClick={load} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {(["all", "pending", "reviewing", "approved", "rejected"] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors border ${
                            filter === s
                                ? "bg-rose-600/20 text-rose-400 border-rose-500/30"
                                : "bg-white/5 text-neutral-400 border-white/10 hover:text-white"
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-neutral-500 text-sm">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500 text-sm">No registrations found.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left">
                                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-widest">Applicant</th>
                                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-widest">Phone</th>
                                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-widest">Status</th>
                                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-widest">Submitted</th>
                                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((reg) => (
                                <tr key={reg.id} className="hover:bg-white/[0.03] transition-colors">
                                    <td className="px-5 py-4">
                                        <p className="font-medium text-white">{reg.profile?.full_name ?? "—"}</p>
                                        <p className="text-neutral-500 text-xs">{reg.profile?.email ?? "—"}</p>
                                    </td>
                                    <td className="px-5 py-4 text-neutral-300">{reg.phone}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_BADGE[reg.status] ?? ""}`}>
                                            {reg.status === "pending" && <Clock className="h-3 w-3" />}
                                            {reg.status === "approved" && <CheckCircle className="h-3 w-3" />}
                                            {reg.status === "rejected" && <XCircle className="h-3 w-3" />}
                                            {reg.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-neutral-400 text-xs">
                                        {new Date(reg.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => { setSelected(reg); setNotes(reg.admin_notes ?? ""); }}
                                            className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                                        >
                                            <Eye className="h-3.5 w-3.5" /> Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Review Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5">
                        <div>
                            <h2 className="text-lg font-bold text-white">Review Registration</h2>
                            <p className="text-neutral-400 text-sm">{selected.profile?.full_name} — {selected.profile?.email}</p>
                        </div>

                        {/* Documents */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Documents</p>
                            {[
                                { label: "Identity Document", url: selected.identity_document_url },
                                { label: "Ownership Document", url: selected.ownership_document_url },
                                { label: "Liveness Video", url: selected.liveness_document_url },
                            ].map(({ label, url }) => (
                                <div key={label} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2.5">
                                    <span className="text-sm text-neutral-300">{label}</span>
                                    {url ? (
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">View</a>
                                    ) : (
                                        <span className="text-xs text-neutral-600">Not provided</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Admin Notes */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Admin Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Add notes for this applicant..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-white/20"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => handleAction("reviewing")}
                                disabled={actionLoading || selected.status === "reviewing"}
                                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 disabled:opacity-40 transition-colors"
                            >
                                Mark Reviewing
                            </button>
                            <button
                                onClick={() => handleAction("approved")}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 disabled:opacity-40 transition-colors"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => handleAction("rejected")}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 disabled:opacity-40 transition-colors"
                            >
                                Reject
                            </button>
                        </div>

                        <button
                            onClick={() => { setSelected(null); setNotes(""); }}
                            className="w-full py-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
