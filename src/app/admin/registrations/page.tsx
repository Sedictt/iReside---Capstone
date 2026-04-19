"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    BadgeCheck,
    CircleDashed,
    ExternalLink,
    FileCheck,
    FileText,
    LoaderCircle,
    Search,
    ShieldCheck,
    ShieldX,
    StickyNote,
    Building2,
    Calendar,
    Mail,
    CheckCircle2,
    XCircle,
    FileSignature,
    UserCircle,
    Phone,
    MapPin,
    Factory,
} from "lucide-react";
import type { ApplicationStatus, UserRole } from "@/types/database";
import { cn } from "@/lib/utils";

type RegistrationStatus = Extract<ApplicationStatus, "pending" | "reviewing" | "approved" | "rejected" | "withdrawn">;

interface ScrapedRow {
    businessName: string;
    district: string;
    barangay: string;
    industry: string;
}

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
    business_name: string | null;
    business_address: string | null;
    verification_status: string | null;
    verification_data: { rows?: ScrapedRow[] } | null;
    verification_checked_at: string | null;
    verification_notes: string | null;
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

const STATUS_META: Record<Exclude<RegistrationStatus, "withdrawn">, { label: string; colorClass: string; bgClass: string; borderClass: string; icon: any }> = {
    pending: { label: "Pending", colorClass: "text-amber-400", bgClass: "bg-amber-500/10", borderClass: "border-amber-500/20", icon: CircleDashed },
    reviewing: { label: "Reviewing", colorClass: "text-blue-400", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/20", icon: Search },
    approved: { label: "Approved", colorClass: "text-primary", bgClass: "bg-primary/20", borderClass: "border-primary/20", icon: CheckCircle2 },
    rejected: { label: "Rejected", colorClass: "text-red-400", bgClass: "bg-red-500/10", borderClass: "border-red-500/20", icon: XCircle },
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
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [verificationResults, setVerificationResults] = useState<Record<string, { status: string; rows: ScrapedRow[]; error?: string; checkedAt?: string }>>({});
    const [businessNameInput, setBusinessNameInput] = useState<Record<string, string>>({});

    const loadRegistrations = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/admin/registrations");
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error || "Failed to load registrations.");
            const nextRows = (payload.registrations ?? []) as RegistrationRow[];
            setRegistrations(nextRows);
            setSummary(payload.summary ?? null);
            setDraftNotes(Object.fromEntries(nextRows.map((row) => [row.id, row.admin_notes ?? ""])));
            setBusinessNameInput(Object.fromEntries(nextRows.map((row) => [row.id, row.business_name ?? ""])));
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
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, adminNotes: draftNotes[registration.id] ?? "" }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error || "Failed to update registration.");
            await loadRegistrations();
        } catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : "Failed to update registration.");
        } finally {
            setSavingId(null);
        }
    };

    const handleVerifyBusiness = async (registration: RegistrationRow) => {
        setVerifyingId(registration.id);
        setError(null);
        try {
            const businessName = businessNameInput[registration.id]?.trim();
            if (!businessName) throw new Error("Business name is required for verification.");

            const response = await fetch(`/api/admin/registrations/${registration.id}/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessName }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error || "Failed to run verification.");

            setVerificationResults((current) => ({
                ...current,
                [registration.id]: payload.verification,
            }));
            await loadRegistrations();
        } catch (verifyError) {
            setError(verifyError instanceof Error ? verifyError.message : "Failed to run verification.");
        } finally {
            setVerifyingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-12">
            {/* Header */}
            <section className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0F0F12]/80 p-8 shadow-2xl shadow-black/5 dark:shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:p-10">
                <div className="pointer-events-none absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.03] mix-blend-overlay" />
                <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/20 blur-[100px]" />

                <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-4">
                        <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/20 px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-primary/80 shadow-md shadow-primary/10 dark:shadow-[0_0_20px_rgba(109,152,56,0.2)]">
                            <FileSignature className="h-3.5 w-3.5" />
                            Registration Portal
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                            Landlord Approvals
                        </h1>
                        <p className="text-base font-medium leading-relaxed text-white/50">
                            Review, verify, and approve incoming landlord applications. Secure the platform access boundary.
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-3">
                        {FILTERS.map((status) => {
                            const active = filter === status;
                            const label = status === "all" ? "All Queue" : STATUS_META[status as Exclude<RegistrationStatus, "withdrawn">].label;
                            const count = counts[status];

                            return (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={cn(
                                        "relative flex h-12 items-center justify-center rounded-2xl border px-5 font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2",
                                        active
                                            ? status === "all"
                                                ? "border-primary/20 bg-primary/20 text-primary shadow-md shadow-primary/10 dark:shadow-[0_0_20px_rgba(109,152,56,0.2)] focus-visible:ring-primary"
                                                : cn("bg-black/40 shadow-inner", STATUS_META[status as Exclude<RegistrationStatus, "withdrawn">].borderClass, STATUS_META[status as Exclude<RegistrationStatus, "withdrawn">].colorClass)
                                            : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.06] hover:text-white"
                                    )}
                                >
                                    <span className="capitalize">{label}</span>
                                    <span className="ml-2 rounded-md bg-black/30 px-2 py-0.5 text-[10px] text-white/40">
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm font-semibold text-red-400 shadow-md shadow-red-500/10 dark:shadow-[0_0_20px_rgba(239,68,68,0.15)] flex items-center gap-3">
                    <ShieldX className="h-5 w-5" />
                    {error}
                </div>
            )}

            <div className="space-y-6">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-[2.5rem] border border-white/5 bg-[#0F0F12]/80 p-8 shadow-lg shadow-black/5 dark:shadow-[0_0_40px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
                            <div className="h-6 w-1/4 rounded bg-white/5 mb-4" />
                            <div className="h-4 w-1/3 rounded bg-white/5" />
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-white/5 bg-[#0F0F12]/80 px-8 py-20 text-center shadow-xl shadow-black/5 dark:shadow-[0_0_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
                        <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10">
                            <CheckCircle2 className="h-10 w-10 text-primary/20" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Inbox Zero</h3>
                        <p className="text-zinc-500 max-w-sm">No registrations match this filter currently. All cleared out!</p>
                    </div>
                ) : (
                    filtered.map((registration) => {
                        if (registration.status === "withdrawn") return null;

                        const statusMeta = STATUS_META[registration.status];
                        const StatusIcon = statusMeta.icon;
                        const applicant = registration.applicant;
                        const currentStatus = registration.status as Exclude<RegistrationStatus, "withdrawn">;
                        const isSaving = savingId === registration.id;
                        const noteValue = draftNotes[registration.id] ?? "";

                        // Rows: prefer live verification result, then fall back to persisted data
                        const liveResult = verificationResults[registration.id];
                        const scrapedRows: ScrapedRow[] =
                            liveResult?.rows ??
                            registration.verification_data?.rows ??
                            [];
                        const hasVerificationData = scrapedRows.length > 0 || !!liveResult;
                        const lastChecked = liveResult?.checkedAt ?? registration.verification_checked_at;

                        const documents = [
                            { label: "Government ID", url: registration.identity_document_url },
                            { label: "Ownership Proof", url: registration.ownership_document_url },
                            { label: "Liveness Proof", url: registration.liveness_document_url },
                        ];

                        return (
                            <div
                                key={registration.id}
                                className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0F0F12]/80 p-8 shadow-xl shadow-black/5 dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 hover:border-white/10"
                            >
                                <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />

                                {/* Applicant Header */}
                                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-8">
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            {applicant?.avatar_url ? (
                                                <img src={applicant.avatar_url} alt="" className="h-12 w-12 rounded-full border border-white/10 shadow-lg object-cover" />
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white shadow-inner">
                                                    <UserCircle className="h-6 w-6 opacity-60" />
                                                </div>
                                            )}

                                            <div className="flex flex-col">
                                                <h2 className="text-xl font-bold text-white">{applicant?.full_name || "Unknown applicant"}</h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-inner", statusMeta.bgClass, statusMeta.borderClass, statusMeta.colorClass)}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {statusMeta.label}
                                                    </span>
                                                    {applicant?.role === "landlord" && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/20 bg-primary/20 text-primary shadow-inner">
                                                            <BadgeCheck className="h-3 w-3" />
                                                            Existing Landlord
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm font-medium text-white/50">
                                            <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner hover:text-white transition-colors"><Mail className="h-4 w-4 text-white/30" /> {applicant?.email || "No email"}</span>
                                            <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner hover:text-white transition-colors"><Phone className="h-4 w-4 text-white/30" /> {registration.phone}</span>
                                            <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner"><Calendar className="h-4 w-4 text-white/30" /> Authored: {new Date(registration.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <Link
                                        href="/admin/users"
                                        className="inline-flex items-center gap-2 rounded-xl bg-white/[0.02] border border-white/10 px-4 py-2.5 text-sm font-bold text-white/70 shadow-inner transition-all hover:bg-white/[0.06] hover:text-white active:scale-95"
                                    >
                                        <FileCheck className="h-4 w-4 text-primary" />
                                        User Directory
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                                    {/* Business Verification Block */}
                                    <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-inner relative overflow-hidden lg:col-span-2">
                                        <div className={cn("flex flex-col gap-6", hasVerificationData ? "lg:flex-row lg:items-start lg:gap-8" : "")}>
                                            <div className={cn("flex flex-col", hasVerificationData ? "lg:w-[35%]" : "lg:max-w-md")}>
                                                <div className="flex items-center gap-2 mb-4 text-white/70">
                                                    <Building2 className="h-4 w-4 text-primary" />
                                                    <h3 className="text-xs font-extrabold uppercase tracking-widest">Business Identity</h3>
                                                </div>

                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Formal Business Name"
                                                        value={businessNameInput[registration.id] || ""}
                                                        onChange={(e) => setBusinessNameInput((current) => ({ ...current, [registration.id]: e.target.value }))}
                                                        className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm font-medium text-white placeholder-white/30 shadow-inner transition-all focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    />

                                                    <div className="flex gap-2 pt-1">
                                                        <button
                                                            type="button"
                                                            disabled={verifyingId === registration.id}
                                                            onClick={() => void handleVerifyBusiness(registration)}
                                                            className="flex-1 rounded-xl bg-primary/20 border border-primary/20 px-4 py-2.5 text-xs font-bold text-primary shadow-sm shadow-primary/10 dark:shadow-[0_0_15px_rgba(109,152,56,0.2)] transition-all hover:bg-primary/30 disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
                                                        >
                                                            {verifyingId === registration.id ? (
                                                                <><LoaderCircle className="h-4 w-4 animate-spin" /> Searching VLINK...</>
                                                            ) : (
                                                                <><ShieldCheck className="h-4 w-4" /> Run Verification</>
                                                            )}
                                                        </button>
                                                        <a
                                                            href={`https://bd.valenzuela.gov.ph/?business_name=${encodeURIComponent(businessNameInput[registration.id] || registration.business_name || "")}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white/50 transition-all hover:bg-white/10 hover:text-white shrink-0"
                                                            title="Open VLINK in browser"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* VLINK Results Table */}
                                            {hasVerificationData && (
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                                                            VLINK Results
                                                        </p>
                                                        {lastChecked && (
                                                            <p className="text-[10px] text-white/30">
                                                                {new Date(lastChecked).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {scrapedRows.length === 0 ? (
                                                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-400 flex items-center gap-2">
                                                            <ShieldX className="h-4 w-4 shrink-0" />
                                                            No businesses found in Valenzuela City directory.
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-xl border border-white/10 overflow-hidden">
                                                            <div className="overflow-x-auto">
                                                            <table className="w-full min-w-[640px] text-xs">
                                                                <thead>
                                                                    <tr className="border-b border-white/10 bg-white/5">
                                                                        <th className="px-3 py-2 text-left font-bold text-white/50 uppercase tracking-wider">Business Name</th>
                                                                        <th className="px-3 py-2 text-left font-bold text-white/50 uppercase tracking-wider">District</th>
                                                                        <th className="px-3 py-2 text-left font-bold text-white/50 uppercase tracking-wider">Barangay</th>
                                                                        <th className="px-3 py-2 text-left font-bold text-white/50 uppercase tracking-wider">Industry</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {scrapedRows.map((row, i) => (
                                                                        <tr
                                                                            key={i}
                                                                            className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                                                                        >
                                                                            <td className="px-3 py-2.5 font-semibold text-white">{row.businessName}</td>
                                                                            <td className="px-3 py-2.5 text-white/50">
                                                                                <span className="block sm:hidden text-[10px] uppercase tracking-wider text-white/30 mb-1">District</span>
                                                                                {row.district}
                                                                            </td>
                                                                            <td className="px-3 py-2.5 text-white/50">
                                                                                <span className="block sm:hidden text-[10px] uppercase tracking-wider text-white/30 mb-1">Barangay</span>
                                                                                <span className="flex items-center gap-1">
                                                                                    <MapPin className="h-3 w-3 text-white/30" />
                                                                                    {row.barangay}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-3 py-2.5 text-white/40">
                                                                                <span className="block sm:hidden text-[10px] uppercase tracking-wider text-white/30 mb-1">Industry</span>
                                                                                <span className="flex items-center gap-1">
                                                                                    <Factory className="h-3 w-3 text-white/20" />
                                                                                    {row.industry}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                            </div>
                                                            <div className="px-3 py-2 border-t border-white/5 bg-white/[0.02] text-[10px] text-white/30">
                                                                Showing {scrapedRows.length} result{scrapedRows.length !== 1 ? "s" : ""} from bd.valenzuela.gov.ph
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Document Filings */}
                                    <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-inner">
                                        <div className="flex items-center gap-2 mb-4 text-white/70">
                                            <FileText className="h-4 w-4 text-purple-400" />
                                            <h3 className="text-xs font-extrabold uppercase tracking-widest">Document Filings</h3>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {documents.map((doc) => (
                                                <div key={doc.label} className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/10">
                                                    <span className="text-sm font-semibold text-white/80">{doc.label}</span>
                                                    {doc.url ? (
                                                        <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80">
                                                            View <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs font-medium text-white/30">Missing</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Admin Notes */}
                                    <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-inner flex flex-col">
                                        <div className="flex items-center gap-2 mb-4 text-white/70">
                                            <StickyNote className="h-4 w-4 text-amber-400" />
                                            <h3 className="text-xs font-extrabold uppercase tracking-widest">Review Notes</h3>
                                        </div>
                                        <textarea
                                            value={noteValue}
                                            onChange={(e) => setDraftNotes((cur) => ({ ...cur, [registration.id]: e.target.value }))}
                                            rows={5}
                                            placeholder="Confidential admin remarks..."
                                            className="flex-1 w-full resize-none rounded-xl border border-white/10 bg-[#0A0A0A] p-4 text-sm font-medium text-white placeholder-white/30 shadow-inner transition-all focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                        />
                                    </div>
                                </div>

                                {/* Action Bar */}
                                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-6">
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            disabled={isSaving}
                                            onClick={() => void handleStatusChange(registration, "reviewing")}
                                            className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-2.5 text-sm font-bold text-blue-400 shadow-sm shadow-blue-500/10 dark:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all hover:bg-blue-500/20 disabled:pointer-events-none disabled:opacity-50"
                                        >
                                            Mark In Review
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isSaving || registration.status === "approved"}
                                            onClick={() => void handleStatusChange(registration, "approved")}
                                            className="rounded-xl border border-primary/20 bg-primary/20 px-5 py-2.5 text-sm font-bold text-primary shadow-sm shadow-primary/10 dark:shadow-[0_0_15px_rgba(109,152,56,0.2)] transition-all hover:bg-primary/30 disabled:pointer-events-none disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Approve & Grant Landlord Access
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isSaving || registration.status === "approved"}
                                            onClick={() => void handleStatusChange(registration, "rejected")}
                                            className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-400 shadow-sm shadow-red-500/10 dark:shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all hover:bg-red-500/20 disabled:pointer-events-none disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {isSaving && (
                                            <span className="inline-flex items-center gap-2 text-xs font-bold text-primary animate-pulse">
                                                <LoaderCircle className="h-4 w-4 animate-spin" /> Committing...
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            disabled={isSaving}
                                            onClick={() => void handleStatusChange(registration, currentStatus)}
                                            className="rounded-xl bg-white/5 border border-white/10 px-6 py-2.5 text-sm font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-50 shadow-inner"
                                        >
                                            Save Notes Only
                                        </button>
                                    </div>
                                </div>

                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
