"use client";

import { useMemo, useState } from "react";
import { Building2, Calendar, ChevronDown, Copy, DoorClosed, DoorOpen, History, Link2, MapPin, QrCode, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

type InviteMode = "property" | "unit";

type UnitOption = {
    id: string;
    name: string;
    rent_amount: number;
    property_id: string;
    property_name: string;
    status?: string;
};

type InviteListItem = {
    id: string;
    mode: InviteMode;
    status: string;
    propertyId: string;
    propertyName: string;
    unitId: string | null;
    unitName: string | null;
    expiresAt: string | null;
    useCount: number;
    maxUses: number;
    lastUsedAt: string | null;
    createdAt: string;
    shareUrl: string;
    qrUrl: string;
};

export function TenantInviteManager({
    availableUnits,
    invites,
    onRefresh,
}: {
    availableUnits: UnitOption[];
    invites: InviteListItem[];
    onRefresh: () => void;
}) {
    const [mode, setMode] = useState<InviteMode>("property");
    const [propertyId, setPropertyId] = useState("");
    const [unitId, setUnitId] = useState("");
    const [expiresAt, setExpiresAt] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        const tz = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tz).toISOString().slice(0, 16);
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [freshInvite, setFreshInvite] = useState<InviteListItem | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const properties = useMemo(() => {
        const map = new Map<string, { id: string; name: string }>();
        for (const unit of availableUnits) {
            map.set(unit.property_id, {
                id: unit.property_id,
                name: unit.property_name,
            });
        }
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [availableUnits]);

    const propertyUnits = useMemo(
        () =>
            availableUnits
                .filter((unit) => unit.property_id === propertyId && (unit.status ?? "vacant") === "vacant")
                .sort((a, b) => a.name.localeCompare(b.name)),
        [availableUnits, propertyId]
    );

    const createInvite = async () => {
        setSubmitting(true);
        setError(null);
        setFreshInvite(null);
        try {
            const response = await fetch("/api/landlord/invites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode,
                    propertyId,
                    unitId: mode === "unit" ? unitId : null,
                    expiresAt: expiresAt || null,
                }),
            });
            const payload = (await response.json()) as { error?: string; invite?: InviteListItem };
            if (!response.ok || !payload.invite) {
                throw new Error(payload.error || "Failed to create invite.");
            }
            setFreshInvite(payload.invite);
            onRefresh();
        } catch (createError) {
            setError(createError instanceof Error ? createError.message : "Failed to create invite.");
        } finally {
            setSubmitting(false);
        }
    };

    const revokeInvite = async (id: string) => {
        try {
            const response = await fetch(`/api/landlord/invites/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "revoked" }),
            });
            if (!response.ok) {
                throw new Error("Failed to revoke invite.");
            }
            onRefresh();
        } catch (revokeError) {
            setError(revokeError instanceof Error ? revokeError.message : "Failed to revoke invite.");
        }
    };

    const copyLink = async (url: string) => {
        await navigator.clipboard.writeText(url);
    };

    return (
        <section className="mb-10 relative overflow-hidden rounded-[2.5rem] border border-border bg-card/60 p-6 shadow-sm backdrop-blur-3xl xl:p-8">
            <div className="absolute inset-x-0 -top-40 -z-10 h-72 rounded-[100%] bg-primary/5 blur-3xl pointer-events-none" />

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
                        <QrCode className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Invite-Based Intake</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl text-balance">
                        Private Links & QR Codes
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                        Generate exclusive invite links or scannable QR codes. Allow future tenants to apply for your properties without opening public registration.
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex h-12 items-center gap-2 rounded-2xl border px-5 text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-muted active:scale-95 ${
                            showHistory 
                                ? "border-primary bg-primary/5 text-primary" 
                                : "border-border bg-background text-foreground"
                        }`}
                    >
                        <History className="h-4 w-4" />
                        {showHistory ? "Hide History" : `History (${invites.length})`}
                    </button>
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="inline-flex h-12 items-center gap-2 rounded-2xl border border-border bg-background px-5 text-xs font-black uppercase tracking-[0.2em] text-foreground transition-all hover:bg-muted active:scale-95"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-500">
                    {error}
                </div>
            )}

            <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_400px]">
                <div className="flex flex-col rounded-[2rem] border border-border bg-background/50 p-6 shadow-sm xl:p-8">
                    <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-border/50 pb-6 md:flex-row md:items-center">
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Generator Settings</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Configure the scope and expiration of your invite.</p>
                        </div>
                        
                        {/* Scope Toggle */}
                        <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode("property");
                                    setUnitId("");
                                }}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                                    mode === "property" 
                                    ? "bg-primary text-primary-foreground shadow-md" 
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                }`}
                            >
                                <Building2 className="h-4 w-4" />
                                Property
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode("unit");
                                    setUnitId("");
                                }}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                                    mode === "unit" 
                                    ? "bg-primary text-primary-foreground shadow-md" 
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                }`}
                            >
                                <DoorClosed className="h-4 w-4" />
                                Unit
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="group space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors group-focus-within:text-primary">
                                Select Property
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <MapPin className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                </div>
                                <select
                                    value={propertyId}
                                    onChange={(event) => {
                                        setPropertyId(event.target.value);
                                        setUnitId("");
                                    }}
                                    className="h-12 w-full appearance-none rounded-xl border border-border bg-card pl-10 pr-10 text-sm font-bold text-foreground shadow-sm outline-none transition-all hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary"
                                >
                                    <option value="" disabled>Choose a property...</option>
                                    {properties.map((property) => (
                                        <option key={property.id} value={property.id}>
                                            {property.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        {mode === "unit" && (
                            <div className="group space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors group-focus-within:text-primary">
                                    Select Vacant Unit
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <DoorOpen className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <select
                                        value={unitId}
                                        onChange={(event) => setUnitId(event.target.value)}
                                        className="h-12 w-full appearance-none rounded-xl border border-border bg-card pl-10 pr-10 text-sm font-bold text-foreground shadow-sm outline-none transition-all hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                                        disabled={!propertyId}
                                    >
                                        <option value="" disabled>
                                            {!propertyId ? "Select a property first" : "Choose a unit..."}
                                        </option>
                                        {propertyUnits.map((unit) => (
                                            <option key={unit.id} value={unit.id}>
                                                {unit.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="group space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors group-focus-within:text-primary">
                                    Expires at
                                </label>
                            </div>
                            <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <Calendar className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                </div>
                                <input
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(event) => setExpiresAt(event.target.value)}
                                    required
                                    className="h-12 w-full appearance-none bg-transparent pl-10 pr-4 text-sm font-bold text-foreground outline-none transition-colors 
                                    [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                {[
                                    { label: "+1 Day", days: 1 },
                                    { label: "+7 Days", days: 7 },
                                    { label: "+30 Days", days: 30 },
                                ].map((preset) => (
                                    <button
                                        key={preset.days}
                                        type="button"
                                        onClick={() => {
                                            const d = new Date();
                                            d.setDate(d.getDate() + preset.days);
                                            const tz = d.getTimezoneOffset() * 60000;
                                            setExpiresAt(new Date(d.getTime() - tz).toISOString().slice(0, 16));
                                        }}
                                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground active:scale-95"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            type="button"
                            onClick={createInvite}
                            disabled={submitting || !propertyId || (mode === "unit" && !unitId) || !expiresAt}
                            className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-black text-primary-foreground shadow-[0_8px_16px_-6px_rgba(var(--primary-rgb),0.4)] transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                        >
                            <Link2 className="h-5 w-5" />
                            {submitting ? "Generating..." : "Generate Invite"}
                        </button>
                    </div>
                </div>

                <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-primary/20 bg-primary/5 p-6 text-center xl:p-8">
                    {freshInvite ? (
                        <div className="flex w-full flex-col items-center animate-in fade-in zoom-in duration-500">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Generated Invite</span>
                            </div>
                            <div className="relative mb-6 rounded-3xl border-2 border-border bg-white p-3 shadow-xl">
                                <img src={freshInvite.qrUrl} alt="Invite QR code" className="h-44 w-44 rounded-xl" />
                            </div>
                            <div className="mb-6 w-full rounded-2xl border border-border bg-background p-4 text-left">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Share URL</p>
                                <p className="text-sm font-medium text-foreground break-all">{freshInvite.shareUrl}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => void copyLink(freshInvite.shareUrl)}
                                className="inline-flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-xs font-black uppercase tracking-[0.2em] text-background transition-transform hover:scale-[1.02] active:scale-95"
                            >
                                <Copy className="h-4 w-4" />
                                Copy Link
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center opacity-60">
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-dashed border-border bg-background">
                                <QrCode className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                                Configure settings and generate <br /> to preview QR code and link here.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {showHistory && (
                <div className="mt-8 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Recent Invites History
                        </h3>
                    </div>
                    <div className="grid gap-4">
                        {invites.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-border bg-background/40 py-12 text-center text-sm font-medium text-muted-foreground">
                                <Link2 className="mb-3 h-8 w-8 opacity-20" />
                                No tenant invite links have been created yet.
                            </div>
                        ) : (
                            invites.map((invite) => (
                                <div key={invite.id} className="group relative flex flex-col gap-4 overflow-hidden rounded-[1.5rem] border border-border bg-background/60 p-5 transition-colors hover:bg-card lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted group-hover:bg-primary/10 transition-colors">
                                            <QrCode className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
                                                    {invite.mode === "unit" ? "Unit Invite" : "Property Invite"}
                                                </span>
                                                <span className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${invite.status === "active" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                                                    {invite.status}
                                                </span>
                                            </div>
                                            <p className="text-base font-bold text-foreground">
                                                {invite.propertyName}
                                                {invite.unitName ? <span className="font-normal text-muted-foreground"> • {invite.unitName}</span> : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <a
                                            href={invite.qrUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-muted"
                                        >
                                            <QrCode className="h-4 w-4" />
                                            View QR
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => void copyLink(invite.shareUrl)}
                                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-muted"
                                        >
                                            <Copy className="h-4 w-4" />
                                            Copy URL
                                        </button>
                                        {invite.status === "active" && (
                                            <button
                                                type="button"
                                                onClick={() => void revokeInvite(invite.id)}
                                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 text-xs font-bold uppercase tracking-wider text-red-600 transition-colors hover:bg-red-500/10"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Revoke
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
