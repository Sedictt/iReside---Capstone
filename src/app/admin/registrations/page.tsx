"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    ArrowRight,
    Building2,
    Calendar,
    CheckCircle2,
    CircleDashed,
    ExternalLink,
    FileText,
    Fingerprint,
    LoaderCircle,
    Mail,
    Phone,
    Search,
    ShieldCheck,
    ShieldX,
    StickyNote,
    User,
    X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ApplicationStatus, UserRole } from "@/types/database";
import { cn } from "@/lib/utils";
import { RoleBadge } from "@/components/profile/RoleBadge";

type RegistrationStatus = Extract<ApplicationStatus, "pending" | "reviewing" | "approved" | "rejected" | "withdrawn">;
type IncomingStatus = Extract<RegistrationStatus, "pending" | "reviewing">;

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
    business_permit_url: string | null;
    business_permit_card_url: string | null;
    liveness_document_url: string | null;
    status: RegistrationStatus;
    admin_notes: string | null;
    created_at: string;
    business_name: string | null;
    verification_data: { rows?: ScrapedRow[] } | null;
    verification_checked_at: string | null;
    applicant: {
        id: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
        role: UserRole;
    } | null;
}

interface RegistrationSummary {
    pending: number;
    reviewing: number;
}

interface LiveVerificationResult {
    status: "found" | "not_found" | "error";
    rows: ScrapedRow[];
    checkedAt?: string;
}

const STATUS_META: Record<IncomingStatus, { label: string; icon: LucideIcon; dotClass: string; bgClass: string; textClass: string }> = {
    pending: {
        label: "Pending",
        icon: CircleDashed,
        dotClass: "bg-amber-400",
        bgClass: "border-amber-500/20 bg-amber-500/10",
        textClass: "text-amber-300",
    },
    reviewing: {
        label: "Reviewing",
        icon: Search,
        dotClass: "bg-blue-400",
        bgClass: "border-blue-500/20 bg-blue-500/10",
        textClass: "text-blue-300",
    },
};

const isIncomingStatus = (status: RegistrationStatus): status is IncomingStatus =>
    status === "pending" || status === "reviewing";

const initialBusinessName = (row: RegistrationRow) => row.business_name?.trim() || row.applicant?.full_name?.trim() || "";
const persistedRows = (row: RegistrationRow) => (Array.isArray(row.verification_data?.rows) ? row.verification_data.rows : []);

function KpiCard({ icon: Icon, label, value, accentText }: {
    icon: LucideIcon;
    label: string;
    value: number;
    accentText: string;
}) {
    return (
        <div className="group relative overflow-hidden rounded-[2rem] border border-border/70 bg-card p-6 transition-colors duration-300 hover:border-border hover:bg-muted/20">
            <div className="relative z-10 flex flex-col gap-4">
                <div className={cn("flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] shadow-inner", accentText)}>
                    <Icon className="size-5" strokeWidth={1.5} />
                </div>
                <div>
                    <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/40">{label}</p>
                </div>
            </div>
        </div>
    );
}

export default function AdminRegistrationsPage() {
    const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
    const [summary, setSummary] = useState<RegistrationSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [businessNames, setBusinessNames] = useState<Record<string, string>>({});
    const [verificationResults, setVerificationResults] = useState<Record<string, LiveVerificationResult>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const loadRegistrations = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/registrations?t=${Date.now()}`);
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error || "Failed to load registrations.");
            const rows = (payload.registrations ?? []) as RegistrationRow[];
            setRegistrations(rows);
            setSummary(payload.summary ?? null);
            setNotes(Object.fromEntries(rows.map((row) => [row.id, row.admin_notes ?? ""])));
            setBusinessNames(Object.fromEntries(rows.map((row) => [row.id, initialBusinessName(row)])));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load registrations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadRegistrations();
    }, []);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const incoming = useMemo(
        () => registrations.filter((row): row is RegistrationRow & { status: IncomingStatus } => isIncomingStatus(row.status)),
        [registrations]
    );

    const selected = useMemo(() => incoming.find((row) => row.id === selectedId) ?? null, [incoming, selectedId]);

    useEffect(() => {
        if (selectedId && !selected) setSelectedId(null);
    }, [selected, selectedId]);

    useEffect(() => {
        if (!selectedId) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setSelectedId(null);
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [selectedId]);

    const updateStatus = async (row: RegistrationRow, status: IncomingStatus | "approved" | "rejected") => {
        setSavingId(row.id);
        setError(null);
        try {
            const response = await fetch(`/api/admin/registrations/${row.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, adminNotes: notes[row.id] ?? "" }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error || "Failed to update registration.");
            await loadRegistrations();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update registration.");
        } finally {
            setSavingId(null);
        }
    };

    const verifyBusiness = async (row: RegistrationRow) => {
        const businessName = (businessNames[row.id] || "").trim();
        if (!businessName) {
            setError("Business name is required for verification.");
            return;
        }
        setVerifyingId(row.id);
        setError(null);
        try {
            const response = await fetch(`/api/admin/registrations/${row.id}/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessName }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error || "Failed to run verification.");
            setVerificationResults((current) => ({ ...current, [row.id]: payload.verification as LiveVerificationResult }));
            await loadRegistrations();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to run verification.");
        } finally {
            setVerifyingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-12">
            {!selected && (
                <>
                    {/* ─── Hero Header ─── */}
                    <section className="relative overflow-hidden rounded-[2.5rem] border border-border/70 bg-card p-8 md:p-12">
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-3 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-amber-300/80">
                                    <span className="relative flex size-2">
                                        <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
                                    </span>
                                    Registration Queue
                                </div>
                                <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl lg:leading-[1.1]">
                                    Incoming Landlord Registrations
                                </h1>
                                <p className="max-w-2xl text-base font-medium leading-relaxed text-white/50">
                                    Review and verify prospective landlords. Click any applicant to open the full verification modal with business legitimacy check, document review, and approval controls.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <KpiCard icon={CircleDashed} label="Pending Review" value={summary?.pending ?? 0} accentText="text-amber-400" />
                                <KpiCard icon={Search} label="Under Review" value={summary?.reviewing ?? 0} accentText="text-blue-400" />
                                <KpiCard icon={ArrowRight} label="Incoming Total" value={incoming.length} accentText="text-primary" />
                            </div>
                        </div>
                    </section>

                    {/* ─── Error Banner ─── */}
                    {error && (
                        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
                            <ShieldX className="size-5 shrink-0 text-red-400" />
                            <p className="text-sm font-semibold text-red-300">{error}</p>
                        </div>
                    )}

                    {/* ─── Registration Queue ─── */}
                    <section className="relative overflow-hidden rounded-[2.5rem] border border-border/70 bg-card p-6 md:p-8">

                        <div className="relative z-10">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-lg font-semibold tracking-wide text-white/80">Applicant Queue</h2>
                                <span className="text-xs font-bold uppercase tracking-widest text-white/30">{incoming.length} record{incoming.length !== 1 ? "s" : ""}</span>
                            </div>

                            {loading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
                                    ))}
                                </div>
                            ) : incoming.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] px-6 py-20 text-center">
                                    <div className="flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                                        <CheckCircle2 className="size-8 text-primary" />
                                    </div>
                                    <p className="mt-5 text-lg font-bold text-white">All clear</p>
                                    <p className="mt-1 text-sm text-white/40">No incoming registrations to review.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {incoming.map((row) => {
                                        const meta = STATUS_META[row.status];
                                        const StatusIcon = meta.icon;
                                        return (
                                            <button
                                                key={row.id}
                                                type="button"
                                                onClick={() => setSelectedId(row.id)}
                                                className={cn(
                                                    "group relative grid w-full grid-cols-1 gap-4 overflow-hidden rounded-2xl border border-border/70 bg-background px-5 py-4 text-left transition-colors duration-200",
                                                    "hover:border-primary/25 hover:bg-muted/30",
                                                    "md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_auto_auto]"
                                                )}
                                            >
                                                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/0 to-primary/0 opacity-0 transition-opacity duration-500 group-hover:from-primary/5 group-hover:to-transparent group-hover:opacity-100" />

                                                <div className="relative min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                                                            <User className="size-4 text-white/50" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex min-w-0 items-center gap-2">
                                                                <p className="truncate text-base font-bold text-white">{row.applicant?.full_name || "Unknown applicant"}</p>
                                                                <RoleBadge role={row.applicant?.role ?? null} />
                                                            </div>
                                                            <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-white/40">
                                                                <Mail className="size-3 shrink-0" />
                                                                {row.applicant?.email || "No email"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative min-w-0" suppressHydrationWarning>
                                                    <p className="truncate text-sm font-medium text-white/70">{row.business_name || "No business name"}</p>
                                                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/35">
                                                        <Calendar className="size-3 shrink-0" />
                                                        <span suppressHydrationWarning>{new Date(row.created_at).toLocaleDateString()}</span>
                                                    </p>
                                                </div>

                                                <span className={cn(
                                                    "relative inline-flex items-center gap-1.5 self-center rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest",
                                                    meta.dotClass, meta.bgClass, meta.textClass
                                                )}>
                                                    <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
                                                    <StatusIcon className="size-3" />
                                                    {meta.label}
                                                </span>

                                                <span className="relative hidden items-center text-white/20 transition-colors group-hover:text-primary md:flex">
                                                    <ArrowRight className="size-4" />
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </>
            )}

            {/* ─── Verification Modal ─── */}
            {mounted && selected && createPortal(
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4"
                >
                    <button type="button" className="absolute inset-0" onClick={() => setSelectedId(null)} aria-label="Close modal" />

                    <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl transform-gpu flex-col overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#111114] shadow-2xl [contain:layout_paint_style]">

                        {/* ─── Modal Header ─── */}
                        <div className="relative z-10 shrink-0 border-b border-white/[0.06] bg-[#131316] px-7 py-6">
                            <div className="relative flex items-center justify-between gap-4">
                                <div className="flex items-center gap-5">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                                            <User className="size-7 text-primary" />
                                        </div>
                                        <span className={cn(
                                            "absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-[#111114]",
                                            selected.status === "pending" ? "bg-amber-400" : "bg-blue-400"
                                        )} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">Prospective Landlord</p>
                                        <div className="mt-1 flex items-center gap-3">
                                            <h2 className="text-2xl font-semibold tracking-tight text-white">{selected.applicant?.full_name || "Unknown applicant"}</h2>
                                            <RoleBadge role={selected.applicant?.role ?? null} className="text-[9px]" />
                                        </div>
                                        <div className="mt-2 flex items-center gap-3" suppressHydrationWarning>
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                                                STATUS_META[selected.status].bgClass,
                                                STATUS_META[selected.status].textClass
                                            )}>
                                                <span className={cn("size-1.5 rounded-full", STATUS_META[selected.status].dotClass)} />
                                                {STATUS_META[selected.status].label}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[11px] text-white/30" suppressHydrationWarning>
                                                <Calendar className="size-3" />
                                                <span suppressHydrationWarning>Applied {new Date(selected.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                    onClick={() => setSelectedId(null)}
                                    aria-label="Close modal"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </div>

                        {/* ─── Modal Body ─── */}
                        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain [contain:content]">
                            <div className="space-y-6 p-7">
                                {/* Applicant Profile Band */}
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                                            <Mail className="size-4 text-white/35" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Email Address</p>
                                            <p className="truncate text-sm font-semibold text-white/80">{selected.applicant?.email || "No email"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                                            <Phone className="size-4 text-white/35" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Phone Number</p>
                                            <p className="text-sm font-semibold text-white/80">{selected.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ─── Business Legitimacy Check ─── */}
                                <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0C0C0F]/60 p-6">

                                    <div className="relative z-10">
                                        <div className="mb-5 flex items-center gap-3">
                                            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                                                <Building2 className="size-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white/85">Business Legitimacy Check</p>
                                                <p className="text-[11px] text-white/30">Cross-reference with Valenzuela City Business Directory</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                                            <input
                                                type="text"
                                                value={businessNames[selected.id] || ""}
                                                onChange={(e) => setBusinessNames((cur) => ({ ...cur, [selected.id]: e.target.value }))}
                                                placeholder="Enter business name to verify..."
                                                className="rounded-xl border border-white/10 bg-[#0A0A0D] px-4 py-3 text-sm text-white placeholder:text-white/15 focus:border-primary/30 focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => void verifyBusiness(selected)}
                                                disabled={verifyingId === selected.id}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/15 px-5 py-3 text-xs font-bold text-primary transition-colors hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50"
                                            >
                                                {verifyingId === selected.id ? (
                                                    <><LoaderCircle className="size-3.5 animate-spin" />Verifying</>
                                                ) : (
                                                    <><ShieldCheck className="size-3.5" />Verify</>
                                                )}
                                            </button>
                                            <a
                                                href={`https://bd.valenzuela.gov.ph/?business_name=${encodeURIComponent(businessNames[selected.id] || selected.business_name || "")}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-xs font-bold text-white/50 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white/75"
                                            >
                                                <ExternalLink className="size-3.5" />Open Directory
                                            </a>
                                        </div>

                                        {(() => {
                                            const rows = verificationResults[selected.id]?.rows ?? persistedRows(selected);
                                            const liveStatus = verificationResults[selected.id]?.status;
                                            if (!rows.length && !liveStatus) {
                                                return (
                                                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.01] px-4 py-3.5">
                                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-amber-500/15 bg-amber-500/5">
                                                            <ShieldX className="size-3.5 text-amber-400/50" />
                                                        </div>
                                                        <p className="text-xs font-medium text-white/35">No verification run yet. Click <strong className="text-primary/70">Verify</strong> to check this business against the city directory.</p>
                                                    </div>
                                                );
                                            }
                                            if (liveStatus === "not_found") {
                                                return (
                                                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-500/15 bg-red-500/5 px-4 py-3.5">
                                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10">
                                                            <ShieldX className="size-3.5 text-red-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-red-300/80">Business not found in directory</p>
                                                            <p className="text-[11px] text-red-300/40">Verify manually or request additional ownership documents from the applicant.</p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            if (liveStatus === "error") {
                                                return (
                                                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-500/15 bg-red-500/5 px-4 py-3.5">
                                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10">
                                                            <ShieldX className="size-3.5 text-red-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-red-300/80">Verification service error</p>
                                                            <p className="text-[11px] text-red-300/40">The directory may be unavailable. Try again or verify manually.</p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            if (!rows.length) return null;
                                            return (
                                                <div className="mt-5">
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <div className="flex size-6 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10">
                                                            <CheckCircle2 className="size-3 text-emerald-400" />
                                                        </div>
                                                        <p className="text-xs font-bold text-emerald-300/70">Match found in directory</p>
                                                    </div>
                                                    <div className="overflow-hidden overflow-x-auto rounded-xl border border-white/[0.06]">
                                                        <table className="w-full min-w-[560px] text-xs">
                                                            <thead className="bg-white/[0.02]">
                                                                <tr className="text-white/30">
                                                                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Business Name</th>
                                                                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">District</th>
                                                                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Barangay</th>
                                                                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Industry</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {rows.map((r, i) => (
                                                                    <tr key={`${r.businessName}-${i}`} className="border-t border-white/[0.04] text-white/55">
                                                                        <td className="px-4 py-3 font-semibold text-white/90">{r.businessName}</td>
                                                                        <td className="px-4 py-3">{r.district}</td>
                                                                        <td className="px-4 py-3">{r.barangay}</td>
                                                                        <td className="px-4 py-3">{r.industry}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </section>

                                {/* ─── Submitted Documents ─── */}
                                <section className="rounded-2xl border border-white/[0.06] bg-[#0C0C0F]/60 p-6">
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                                            <FileText className="size-4 text-white/35" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white/85">Submitted Documents</p>
                                            <p className="text-[11px] text-white/30">Review identity, ownership, and liveness proofs</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="col-span-full mb-2 rounded-lg bg-black/40 p-2 text-[8px] font-mono text-white/30">
                                            DEBUG: ID={selected.identity_document_url ? 'OK' : 'NULL'} | PERMIT={selected.business_permit_url ? 'OK' : 'NULL'} | CARD={selected.business_permit_card_url ? 'OK' : 'NULL'} | OWNER={selected.ownership_document_url ? 'OK' : 'NULL'}
                                        </div>
                                        {[
                                            { label: "Government ID", sublabel: "Identity verification", icon: Fingerprint, url: selected.identity_document_url },
                                            { label: "Business Permit", sublabel: "Paper permit copy", icon: Building2, url: selected.business_permit_url },
                                            { label: "Permit Card", sublabel: "Official permit card", icon: Building2, url: selected.business_permit_card_url },
                                            { label: "Ownership Proof", sublabel: "Property title / deed", icon: FileText, url: selected.ownership_document_url },
                                            { label: "Liveness Proof", sublabel: "Selfie video check", icon: User, url: selected.liveness_document_url },
                                        ].map((doc) => (
                                            <div
                                                key={doc.label}
                                                className={cn(
                                                    "relative flex flex-col items-center gap-3 rounded-2xl border p-5 text-center",
                                                    doc.url
                                                        ? "border-primary/12 bg-primary/[0.03]"
                                                        : "border-red-500/12 bg-red-500/[0.03]"
                                                )}
                                            >
                                                {doc.url ? (
                                                    <div className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border border-[#111114] bg-emerald-500">
                                                        <CheckCircle2 className="size-3 text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border border-[#111114] bg-red-500">
                                                        <X className="size-3 text-white" />
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "flex size-12 items-center justify-center rounded-2xl border",
                                                    doc.url
                                                        ? "border-primary/15 bg-primary/10"
                                                        : "border-red-500/15 bg-red-500/10"
                                                )}>
                                                    <doc.icon className={cn("size-5", doc.url ? "text-primary/70" : "text-red-400/60")} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white/75">{doc.label}</p>
                                                    <p className="mt-0.5 text-[10px] text-white/25">{doc.sublabel}</p>
                                                </div>
                                                {doc.url ? (
                                                    <a
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/5 px-3 py-1.5 text-[10px] font-bold text-primary/60"
                                                    >
                                                        View <ExternalLink className="size-2.5" />
                                                    </a>
                                                ) : (
                                                    <span className="mt-1 inline-flex items-center gap-1 rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-1.5 text-[10px] font-bold text-red-400/50">Not uploaded</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* ─── Admin Notes ─── */}
                                <section className="rounded-2xl border border-white/[0.06] bg-[#0C0C0F]/60 p-6">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-xl border border-amber-500/15 bg-amber-500/5">
                                            <StickyNote className="size-4 text-amber-400/50" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white/85">Admin Notes</p>
                                            <p className="text-[11px] text-white/30">Internal review notes — not visible to the applicant</p>
                                        </div>
                                    </div>
                                    <textarea
                                        value={notes[selected.id] ?? ""}
                                        onChange={(e) => setNotes((cur) => ({ ...cur, [selected.id]: e.target.value }))}
                                        rows={4}
                                        placeholder="Add review notes, observations, or follow-up items..."
                                        className="w-full resize-none rounded-xl border border-white/10 bg-[#0A0A0D] p-4 text-sm leading-relaxed text-white placeholder:text-white/15 focus:border-amber-500/25 focus:outline-none"
                                    />
                                </section>
                            </div>
                        </div>

                        {/* ─── Modal Footer ─── */}
                        <div className="relative z-10 shrink-0 border-t border-white/[0.06] bg-[#131316] px-7 py-4">
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    {savingId === selected.id && (
                                        <span className="inline-flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-bold text-primary/70">
                                            <LoaderCircle className="size-3 animate-spin" />
                                            Saving changes
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => void updateStatus(selected, selected.status)}
                                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                                    >
                                        Save Notes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void updateStatus(selected, "reviewing")}
                                        className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-xs font-bold text-blue-300/80 transition-colors hover:bg-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                                    >
                                        Mark Reviewing
                                    </button>
                                    <div className="h-6 w-px bg-white/10" />
                                    <button
                                        type="button"
                                        onClick={() => void updateStatus(selected, "approved")}
                                        className="rounded-xl border border-primary/25 bg-primary/15 px-5 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void updateStatus(selected, "rejected")}
                                        className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-xs font-bold text-red-300/80 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
