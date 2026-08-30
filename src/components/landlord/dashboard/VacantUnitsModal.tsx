"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    Building2,
    Search,
    X,
    QrCode,
    UserPlus,
    CheckCircle2,
    Info,
    ArrowRight,
    Copy,
    Check,
    MapPin,
    Eye,
    Layers,
    ShieldCheck,
    Banknote,
    Calendar,
    DoorOpen,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { buildInviteQrUrl } from "@/lib/tenant-intake-invites";

export interface VacantUnitItem {
    id: string;
    name: string;
    rent_amount: number;
    property_id: string;
    property_name: string;
    property_address?: string;
    property_image?: string | null;
    status?: string;
}

interface VacantUnitsModalProps {
    isOpen: boolean;
    onClose: () => void;
    units: VacantUnitItem[];
    onStartWalkIn: (unitId: string) => void;
}

const FALLBACK_PROPERTY_HERO =
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80";

function getUnitBadge(name: string): string {
    const clean = name.trim();
    const unitMatch = clean.match(/^unit\s*(\S+)/i);
    if (unitMatch) {
        const val = unitMatch[1];
        return val.length <= 3 ? val.toUpperCase() : `U${val.slice(0, 2).toUpperCase()}`;
    }
    if (clean.length <= 3) return clean.toUpperCase();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
}

export function VacantUnitsModal({
    isOpen,
    onClose,
    units,
    onStartWalkIn,
}: VacantUnitsModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc">("name");
    const [activeQrUnit, setActiveQrUnit] = useState<VacantUnitItem | null>(null);
    const [previewUnit, setPreviewUnit] = useState<VacantUnitItem | null>(null);
    const [copiedUnitId, setCopiedUnitId] = useState<string | null>(null);
    const [resolvedTokens, setResolvedTokens] = useState<Record<string, string>>({});
    const [loadingTokenUnitId, setLoadingTokenUnitId] = useState<string | null>(null);

    // Extract unique properties for filter pills
    const properties = useMemo(() => {
        const map = new Map<string, string>();
        units.forEach((u) => {
            if (u.property_id && u.property_name) {
                map.set(u.property_id, u.property_name);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [units]);

    // Filter and sort vacant units
    const filteredUnits = useMemo(() => {
        let result = units.filter((u) => {
            const matchesSearch =
                u.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                u.property_name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                (u.property_address ?? "").toLowerCase().includes(searchQuery.toLowerCase().trim());
            const matchesProperty =
                selectedPropertyFilter === "all" || u.property_id === selectedPropertyFilter;
            return matchesSearch && matchesProperty;
        });

        result.sort((a, b) => {
            if (sortBy === "price_asc") return a.rent_amount - b.rent_amount;
            if (sortBy === "price_desc") return b.rent_amount - a.rent_amount;
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
        });

        return result;
    }, [units, searchQuery, selectedPropertyFilter, sortBy]);

    // Resolve or fetch token for a unit
    const resolveUnitToken = async (unitId: string): Promise<string> => {
        if (resolvedTokens[unitId]) return resolvedTokens[unitId];

        try {
            const res = await fetch(`/api/invites/resolve?unitId=${encodeURIComponent(unitId)}`);
            const data = await res.json();
            if (data.ok && data.token) {
                setResolvedTokens((prev) => ({ ...prev, [unitId]: data.token }));
                return data.token;
            }
        } catch {}

        return "";
    };

    const getUnitDirectUrl = (unitId: string) => {
        if (typeof window === "undefined") return "";
        const token = resolvedTokens[unitId];
        if (token) {
            return `${window.location.origin}/apply/${token}`;
        }
        return `${window.location.origin}/apply?unit=${unitId}`;
    };

    const handleCopyLink = async (unit: VacantUnitItem) => {
        setLoadingTokenUnitId(unit.id);
        try {
            const token = await resolveUnitToken(unit.id);
            const url = token
                ? `${window.location.origin}/apply/${token}`
                : `${window.location.origin}/apply?unit=${unit.id}`;

            await navigator.clipboard.writeText(url);
            setCopiedUnitId(unit.id);
            toast.success(`Direct application link for ${unit.name} copied!`);
            setTimeout(() => setCopiedUnitId(null), 2000);
        } catch {
            toast.error("Failed to copy link");
        } finally {
            setLoadingTokenUnitId(null);
        }
    };

    const handleOpenQr = async (unit: VacantUnitItem) => {
        setActiveQrUnit(unit);
        if (!resolvedTokens[unit.id]) {
            void resolveUnitToken(unit.id);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-6">
            {/* Backdrop (solid translucent black without GPU-heavy blur filter) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 transition-opacity"
            />

            {/* Modal Container (solid bg-card, zero blur overhead for maximum 60fps responsiveness) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="relative z-10 w-full max-w-6xl max-h-[92vh] flex flex-col rounded-[2rem] sm:rounded-[2.5rem] border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden will-change-transform"
            >
                {/* Top Header */}
                <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-border/60 bg-muted/20">
                    <div className="flex items-center gap-3.5 sm:gap-4">
                        <div className="size-11 rounded-2xl neumorphic-inset-card text-primary flex items-center justify-center shrink-0">
                            <Building2 className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                    Vacant Units Directory
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-black">
                                    {units.length} {units.length === 1 ? "Unit" : "Units"} Available
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Select a vacant unit to start an instant walk-in application, preview unit details, or share a direct link.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="size-10 rounded-2xl neumorphic-extruded text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                        title="Close Directory"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Filter Controls & Property Pills */}
                <div className="p-4 sm:px-8 sm:py-4 border-b border-border/40 bg-muted/10 space-y-3">
                    {/* Property Filter Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button
                            type="button"
                            onClick={() => setSelectedPropertyFilter("all")}
                            className={cn(
                                "px-4 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer",
                                selectedPropertyFilter === "all"
                                    ? "neumorphic-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]"
                                    : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                            )}
                        >
                            All Properties ({units.length})
                        </button>
                        {properties.map((p) => {
                            const count = units.filter((u) => u.property_id === p.id).length;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setSelectedPropertyFilter(p.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer",
                                        selectedPropertyFilter === p.id
                                            ? "neumorphic-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]"
                                            : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {p.name} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* Search & Sort Bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                        <div className="relative w-full sm:flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by unit name or location..."
                                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm text-foreground bg-input/40 border border-border/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground"
                            />
                        </div>

                        <select
                            value={sortBy}
                            onChange={(e: any) => setSortBy(e.target.value)}
                            className="px-3.5 py-2.5 text-xs font-bold text-foreground bg-card border border-border/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer w-full sm:w-auto neumorphic-inset-card"
                        >
                            <option value="name">Sort by Unit Name</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                        </select>
                    </div>
                </div>

                {/* Horizontal Units Row List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-3 custom-scrollbar-premium">
                    {filteredUnits.length === 0 ? (
                        <div className="py-16 text-center border border-dashed border-border/80 rounded-3xl space-y-3 bg-muted/5">
                            <div className="size-14 rounded-2xl neumorphic-inset-card text-primary mx-auto flex items-center justify-center">
                                <Building2 className="size-7" />
                            </div>
                            <h3 className="text-base font-black text-foreground">
                                {units.length === 0 ? "100% Occupancy Reached!" : "No units match your search"}
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                {units.length === 0
                                    ? "All rental units across your portfolio currently have active tenants."
                                    : "Try adjusting your search query or selecting a different property filter."}
                            </p>
                        </div>
                    ) : (
                        filteredUnits.map((unit) => {
                            const badge = getUnitBadge(unit.name);
                            const isCopyingThis = loadingTokenUnitId === unit.id;

                            return (
                                <div
                                    key={unit.id}
                                    className="group relative flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:px-6 sm:py-4 rounded-2xl sm:rounded-3xl border border-border/60 bg-card hover:border-primary/40 neumorphic-extruded transition-all duration-200 gap-4"
                                >
                                    {/* Left: Unit Avatar & Name (Clickable for Quick Preview) */}
                                    <div 
                                        onClick={() => setPreviewUnit(unit)}
                                        className="flex items-center gap-4 min-w-[220px] cursor-pointer"
                                        title="Click to view full unit preview"
                                    >
                                        <div className="size-12 rounded-full neumorphic-inset-card text-primary font-black text-sm flex items-center justify-center shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
                                            {badge}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                                                    {unit.name}
                                                </h3>
                                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                                                    Ready for Move-In
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                <MapPin className="size-3 text-primary shrink-0" />
                                                <span className="truncate">{unit.property_name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Occupancy Type */}
                                    <div className="hidden md:block text-xs font-semibold text-muted-foreground text-center min-w-[160px]">
                                        Single Occupant / Family
                                    </div>

                                    {/* Middle: Status */}
                                    <div className="hidden md:block text-xs font-semibold text-muted-foreground text-center min-w-[120px]">
                                        Active Listing
                                    </div>

                                    {/* Monthly Rent */}
                                    <div className="text-left lg:text-center min-w-[120px]">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block">
                                            Monthly Rent
                                        </span>
                                        <span className="text-lg font-black text-foreground">
                                            ₱{unit.rent_amount.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewUnit(unit)}
                                            className="size-10 rounded-2xl neumorphic-extruded text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                            title="Quick Preview Unit"
                                        >
                                            <Eye className="size-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                onClose();
                                                onStartWalkIn(unit.id);
                                            }}
                                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl neumorphic-primary text-primary-foreground text-xs font-black transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <UserPlus className="size-3.5 font-black" />
                                            <span>Start Walk-In Application</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenQr(unit)}
                                            className="size-10 rounded-2xl neumorphic-extruded text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                            title="View QR Code for Applicant's Phone"
                                        >
                                            <QrCode className="size-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleCopyLink(unit)}
                                            disabled={isCopyingThis}
                                            className="size-10 rounded-2xl neumorphic-extruded text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                            title="Copy Direct Application Link"
                                        >
                                            {isCopyingThis ? (
                                                <Loader2 className="size-4 animate-spin text-primary" />
                                            ) : copiedUnitId === unit.id ? (
                                                <Check className="size-4 text-emerald-500 font-bold" />
                                            ) : (
                                                <Copy className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Tip */}
                <div className="flex items-center justify-between px-6 sm:px-8 py-3.5 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <Info className="size-3.5 text-primary" />
                        Click <strong>Quick Preview (Eye)</strong> to inspect unit photos and details, or <strong>Start Walk-In Application</strong> to onboard immediately.
                    </span>
                    <button
                        onClick={onClose}
                        className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                        Close Directory
                    </button>
                </div>
            </motion.div>

            {/* Quick Preview Modal (High-performance solid rendering without blur filters) */}
            <AnimatePresence>
                {previewUnit && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-6 bg-black/70">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="relative w-full max-w-2xl rounded-[2rem] sm:rounded-[2.5rem] border border-border bg-card text-card-foreground shadow-2xl overflow-hidden will-change-transform"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setPreviewUnit(null)}
                                className="absolute top-5 right-5 z-20 size-9 rounded-2xl bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md"
                            >
                                <X className="size-4" />
                            </button>

                            {/* Hero Image / Banner */}
                            <div className="relative h-48 sm:h-56 w-full bg-slate-900 overflow-hidden">
                                <Image
                                    src={previewUnit.property_image || FALLBACK_PROPERTY_HERO}
                                    alt={previewUnit.name}
                                    fill
                                    className="object-cover opacity-85"
                                    sizes="(max-width: 768px) 100vw, 672px"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />

                                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
                                    <div>
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider mb-1.5 inline-block shadow-md">
                                            Ready for Move-In
                                        </span>
                                        <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                                            {previewUnit.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                            <MapPin className="size-3.5 text-primary shrink-0" />
                                            <span>{previewUnit.property_name}</span>
                                            {previewUnit.property_address && (
                                                <span className="opacity-80">• {previewUnit.property_address}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0 bg-card px-3.5 py-2 rounded-2xl border border-border/60 shadow-md">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block">
                                            Monthly Rent
                                        </span>
                                        <span className="text-xl font-black text-primary">
                                            ₱{previewUnit.rent_amount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details & Specifications Grid */}
                            <div className="p-6 sm:p-8 space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div className="p-3.5 rounded-2xl neumorphic-inset-card border border-border/40 space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Building2 className="size-3.5 text-primary" />
                                            <span>Occupancy</span>
                                        </div>
                                        <p className="text-sm font-black text-foreground">Single / Family</p>
                                    </div>

                                    <div className="p-3.5 rounded-2xl neumorphic-inset-card border border-border/40 space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <DoorOpen className="size-3.5 text-emerald-500" />
                                            <span>Listing Status</span>
                                        </div>
                                        <p className="text-sm font-black text-foreground">Active Listing</p>
                                    </div>

                                    <div className="p-3.5 rounded-2xl neumorphic-inset-card border border-border/40 space-y-1 col-span-2 sm:col-span-1">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Banknote className="size-3.5 text-amber-500" />
                                            <span>Security Deposit</span>
                                        </div>
                                        <p className="text-sm font-black text-foreground">Standard 1-Mo</p>
                                    </div>
                                </div>

                                {/* Application Fast-Track Action Bar */}
                                <div className="space-y-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const unitId = previewUnit.id;
                                            setPreviewUnit(null);
                                            onClose();
                                            onStartWalkIn(unitId);
                                        }}
                                        className="w-full py-3.5 px-6 rounded-2xl neumorphic-primary text-primary-foreground text-sm font-black transition-all shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <UserPlus className="size-4" />
                                        <span>Start Walk-In Application for {previewUnit.name}</span>
                                    </button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const u = previewUnit;
                                                setPreviewUnit(null);
                                                handleOpenQr(u);
                                            }}
                                            className="py-2.5 px-4 rounded-2xl neumorphic-extruded text-muted-foreground hover:text-foreground text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <QrCode className="size-3.5" />
                                            <span>Show QR Code</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleCopyLink(previewUnit)}
                                            className="py-2.5 px-4 rounded-2xl neumorphic-extruded text-muted-foreground hover:text-foreground text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            {copiedUnitId === previewUnit.id ? (
                                                <>
                                                    <Check className="size-3.5 text-emerald-500" />
                                                    <span>Link Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="size-3.5" />
                                                    <span>Copy Direct Link</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Instant QR Code Popover Modal (Solid high-performance rendering) */}
            <AnimatePresence>
                {activeQrUnit && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="w-full max-w-sm rounded-3xl border border-border bg-card text-card-foreground p-6 shadow-2xl space-y-4 text-center will-change-transform"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-primary">Scan to Apply</span>
                                <button
                                    onClick={() => setActiveQrUnit(null)}
                                    className="size-7 rounded-xl neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-foreground">{activeQrUnit.name}</h3>
                                <p className="text-xs text-muted-foreground">{activeQrUnit.property_name} • ₱{activeQrUnit.rent_amount.toLocaleString()}/mo</p>
                            </div>

                            <div className="p-4 bg-white rounded-2xl shadow-inner border border-border/80 mx-auto w-fit">
                                <Image
                                    src={buildInviteQrUrl(getUnitDirectUrl(activeQrUnit.id))}
                                    alt="Apply QR code"
                                    width={180}
                                    height={180}
                                    className="rounded-xl"
                                />
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Let the walk-in applicant scan this QR code with their phone camera to open the application directly on their device.
                            </p>

                            <button
                                onClick={() => handleCopyLink(activeQrUnit)}
                                className="w-full py-3 rounded-2xl neumorphic-primary text-primary-foreground text-xs font-black transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                                <Copy className="size-3.5" />
                                <span>Copy Link Instead</span>
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
