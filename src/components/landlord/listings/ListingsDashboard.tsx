"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Building2, Eye, Megaphone, PauseCircle, PlayCircle, Search, SquarePen, MapPin, TrendingUp, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type ListingStatus = "published" | "draft" | "paused";
type ListingType = "unit" | "property";

interface ListingItem {
    id: string;
    title: string;
    property: string;
    unit: string;
    type: ListingType;
    rent: number;
    status: ListingStatus;
    views: number;
    leads: number;
    updatedAt: string;
    image: string;
    color: string;
    address: string;
    propertyId: string;
    unitId: string | null;
}

type ListingOptionUnit = {
    id: string;
    name: string;
    status: "vacant" | "occupied" | "maintenance";
    rentAmount: number;
};

type ListingOptionProperty = {
    id: string;
    name: string;
    address: string;
    image: string | null;
    units: ListingOptionUnit[];
};

type ListingsPayload = {
    listings: ListingItem[];
    options: ListingOptionProperty[];
    error?: string;
};

type OperationNotice = {
    type: "success" | "error";
    text: string;
};

const normalizeListingTitle = (title: string) => title.replace(/entire property/gi, "Apartment Listing");

const listingTypeLabel = (type: ListingType) => (type === "unit" ? "Unit Listing" : "Apartment Listing");

const STATUS_META: Record<ListingStatus, { label: string; chip: string; icon: React.ComponentType<{ className?: string }> }> = {
    published: {
        label: "Published",
        chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        icon: PlayCircle,
    },
    draft: {
        label: "Draft",
        chip: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        icon: SquarePen,
    },
    paused: {
        label: "Paused",
        chip: "bg-slate-500/20 text-slate-300 border-slate-500/30",
        icon: PauseCircle,
    },
};

export function ListingsDashboard() {
    const searchParams = useSearchParams();
    const preferredPropertyId = searchParams.get("propertyId");

    const [listings, setListings] = useState<ListingItem[]>([]);
    const [listingOptions, setListingOptions] = useState<ListingOptionProperty[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<OperationNotice | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<ListingItem | null>(null);
    const [hasShortcutAutoOpened, setHasShortcutAutoOpened] = useState(false);

    // Edit state
    const [editTitle, setEditTitle] = useState("");
    const [editRent, setEditRent] = useState("");
    const [editStatus, setEditStatus] = useState<ListingStatus>("draft");

    const [query, setQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<"all" | ListingStatus>("all");
    const [typeFilter, setTypeFilter] = useState<"all" | ListingType>("all");
    const [createScope, setCreateScope] = useState<ListingType>("property");
    const [createPropertyId, setCreatePropertyId] = useState("");
    const [createUnitId, setCreateUnitId] = useState("");
    const [createStatus, setCreateStatus] = useState<ListingStatus>("draft");
    const [createRent, setCreateRent] = useState("");
    const [createTitle, setCreateTitle] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);

    useEffect(() => {
        if (!notice) return;

        const timeout = window.setTimeout(() => {
            setNotice(null);
        }, 4500);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [notice]);

    useEffect(() => {
        const controller = new AbortController();

        const loadListings = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/landlord/listings", {
                    method: "GET",
                    signal: controller.signal,
                    cache: "no-store",
                });

                const payload = (await response.json()) as ListingsPayload;
                if (!response.ok) {
                    throw new Error(payload.error || "Failed to load listings.");
                }

                setListings(payload.listings ?? []);
                setListingOptions(payload.options ?? []);

                const hasPreferred = preferredPropertyId && (payload.options ?? []).some((option) => option.id === preferredPropertyId);
                const firstPropertyId = payload.options?.[0]?.id ?? "";
                const chosenPropertyId = hasPreferred ? preferredPropertyId! : firstPropertyId;
                setCreatePropertyId(chosenPropertyId);
                setCreateUnitId("");
            } catch (loadError) {
                if ((loadError as Error).name === "AbortError") return;
                setError(loadError instanceof Error ? loadError.message : "Failed to load listings.");
            } finally {
                setIsLoading(false);
            }
        };

        void loadListings();

        return () => {
            controller.abort();
        };
    }, [reloadKey, preferredPropertyId]);

    useEffect(() => {
        if (!preferredPropertyId) {
            setHasShortcutAutoOpened(false);
            return;
        }

        if (hasShortcutAutoOpened) return;

        const propertyExists = listingOptions.some((option) => option.id === preferredPropertyId);
        if (!propertyExists) return;

        setCreatePropertyId(preferredPropertyId);
        setIsCreateOpen(true);
        setHasShortcutAutoOpened(true);
    }, [preferredPropertyId, listingOptions, hasShortcutAutoOpened]);

    const selectedProperty = listingOptions.find((property) => property.id === createPropertyId) ?? null;
    const availableUnits = (selectedProperty?.units ?? []).filter((unit) => unit.status === "vacant");

    useEffect(() => {
        if (createScope !== "unit") {
            setCreateUnitId("");
            return;
        }

        if (!availableUnits.some((unit) => unit.id === createUnitId)) {
            setCreateUnitId(availableUnits[0]?.id ?? "");
        }
    }, [createScope, createUnitId, availableUnits]);

    useEffect(() => {
        if (!selectedProperty) {
            setCreateRent("");
            return;
        }

        if (createScope === "property") {
            const firstVacantUnitRent = selectedProperty.units.find((unit) => unit.status === "vacant")?.rentAmount ?? 0;
            setCreateRent(firstVacantUnitRent > 0 ? String(firstVacantUnitRent) : "");
            return;
        }

        const selectedUnit = selectedProperty.units.find((unit) => unit.id === createUnitId);
        setCreateRent(selectedUnit && selectedUnit.rentAmount > 0 ? String(selectedUnit.rentAmount) : "");
    }, [selectedProperty, createScope, createUnitId]);

    const filteredListings = useMemo(() => {
        return listings.filter((item) => {
            const matchesStatus = activeFilter === "all" || item.status === activeFilter;
            const matchesType = typeFilter === "all" || item.type === typeFilter;
            const q = query.trim().toLowerCase();
            const matchesQuery =
                q.length === 0 ||
                item.title.toLowerCase().includes(q) ||
                item.property.toLowerCase().includes(q) ||
                item.unit.toLowerCase().includes(q);

            return matchesStatus && matchesType && matchesQuery;
        });
    }, [activeFilter, typeFilter, query, listings]);

    const handleCreateListing = async () => {
        if (!createPropertyId) {
            setCreateError("Select a property before creating a listing.");
            return;
        }

        if (createScope === "unit" && !createUnitId) {
            setCreateError("Select a vacant unit to create a unit listing.");
            return;
        }

        const rentAmount = Number(createRent || 0);
        if (!Number.isFinite(rentAmount) || rentAmount < 0) {
            setCreateError("Rent amount must be a valid non-negative number.");
            return;
        }

        setIsSaving(true);
        setCreateError(null);
        setNotice(null);

        try {
            const response = await fetch("/api/landlord/listings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scope: createScope,
                    propertyId: createPropertyId,
                    unitId: createScope === "unit" ? createUnitId : null,
                    title: createTitle.trim() || undefined,
                    rentAmount,
                    status: createStatus,
                }),
            });

            const payload = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(payload.error || "Failed to create listing.");
            }

            setIsCreateOpen(false);
            setCreateTitle("");
            setCreateError(null);
            setNotice({ type: "success", text: "Listing saved successfully." });
            setReloadKey((value) => value + 1);
        } catch (createError) {
            setCreateError(createError instanceof Error ? createError.message : "Failed to create listing.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (listing: ListingItem) => {
        setEditingListing(listing);
        setEditTitle(listing.title);
        setEditRent(String(listing.rent));
        setEditStatus(listing.status);
        setEditError(null);
        setIsEditOpen(true);
    };

    const handleUpdateListing = async () => {
        if (!editingListing) return;

        const rentAmount = Number(editRent || 0);
        if (!Number.isFinite(rentAmount) || rentAmount < 0) {
            setEditError("Rent amount must be a valid non-negative number.");
            return;
        }

        setIsSaving(true);
        setEditError(null);
        setNotice(null);

        try {
            const response = await fetch(`/api/landlord/listings/${editingListing.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: editTitle.trim() || undefined,
                    rentAmount,
                    status: editStatus,
                }),
            });

            const payload = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(payload.error || "Failed to update listing.");
            }

            setIsEditOpen(false);
            setEditingListing(null);
            setNotice({ type: "success", text: "Listing changes saved." });
            setReloadKey((value) => value + 1);
        } catch (updateError) {
            setEditError(updateError instanceof Error ? updateError.message : "Failed to update listing.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteListing = async () => {
        if (!editingListing) return;
        if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return;

        setIsSaving(true);
        setEditError(null);
        setNotice(null);

        try {
            const response = await fetch(`/api/landlord/listings/${editingListing.id}`, {
                method: "DELETE",
            });

            const payload = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(payload.error || "Failed to delete listing.");
            }

            setIsEditOpen(false);
            setEditingListing(null);
            setNotice({ type: "success", text: "Listing deleted successfully." });
            setReloadKey((value) => value + 1);
        } catch (deleteError) {
            setEditError(deleteError instanceof Error ? deleteError.message : "Failed to delete listing.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-8 space-y-6">
            <section className="rounded-3xl border border-white/5 bg-[#111] p-8 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                            <Megaphone className="h-3.5 w-3.5 text-primary" />
                            Listings Hub
                        </div>
                        <h1 className="mt-4 text-4xl font-black tracking-tight text-white">My Listings</h1>
                        <p className="mt-2 text-neutral-400">Track published, draft, and paused listings from one command center.</p>
                    </div>
                    <Link
                        href="#"
                        onClick={(event) => {
                            event.preventDefault();
                            setIsCreateOpen(true);
                        }}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-black hover:bg-primary/90 transition-colors"
                    >
                        <Building2 className="h-4 w-4" />
                        New Listing
                    </Link>
                </div>
            </section>

            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            )}

            {notice && (
                <div
                    className={cn(
                        "rounded-xl px-4 py-3 text-sm border",
                        notice.type === "success"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                            : "border-red-500/30 bg-red-500/10 text-red-200"
                    )}
                >
                    {notice.text}
                </div>
            )}

            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-[#111] px-3">
                    <Search className="h-4 w-4 text-neutral-500" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search listing, property, or unit"
                        className="h-11 w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                        {(["all", "unit", "property"] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={cn(
                                    "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                                    typeFilter === type ? "bg-primary text-black" : "text-neutral-400 hover:text-white"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        {(["all", "published", "draft", "paused"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveFilter(tab)}
                                className={cn(
                                    "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                    activeFilter === tab ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-6">
                {isLoading && (
                    <div className="rounded-2xl border border-white/10 bg-[#111] p-10 text-center">
                        <h3 className="text-lg font-semibold text-white">Loading listings...</h3>
                        <p className="mt-2 text-sm text-neutral-400">Pulling your latest listing records from the database.</p>
                    </div>
                )}

                {!isLoading && filteredListings.map((listing) => {
                    const meta = STATUS_META[listing.status];
                    const StatusIcon = meta.icon;

                    return (
                        <div key={listing.id} className="group relative bg-[#111] border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all duration-500">
                            {/* Ambient Glow */}
                            <div className={cn("absolute top-0 left-0 w-full h-32 bg-gradient-to-b opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-40", listing.color)} />

                            <div className="flex flex-col lg:flex-row relative z-10">
                                {/* Left Image Section */}
                                <div className="lg:w-[380px] shrink-0 min-h-[200px] h-[240px] lg:h-auto relative overflow-hidden">
                                    <Image
                                        src={listing.image}
                                        alt={listing.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#111] via-[#111]/80 lg:via-[#111]/60 to-transparent" />

                                    <div className="absolute top-6 left-6">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border",
                                            listing.status === "published"
                                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                                                : listing.status === "paused"
                                                    ? "bg-slate-500/20 text-slate-400 border-slate-500/20"
                                                    : "bg-amber-500/20 text-amber-400 border-amber-500/20"
                                        )}>
                                            <span className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                listing.status === "published" ? "animate-pulse bg-emerald-400" : listing.status === "paused" ? "bg-slate-400" : "bg-amber-400"
                                            )} />
                                            {meta.label}
                                        </div>
                                    </div>

                                    <div className="absolute bottom-6 left-6 pr-6">
                                        <div className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md mb-2">
                                            {listingTypeLabel(listing.type)}
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{normalizeListingTitle(listing.title)}</h3>
                                        <div className="flex items-center text-neutral-300 text-sm gap-1.5">
                                            <MapPin className="h-4 w-4" />
                                            <span>{listing.address}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Content Section */}
                                <div className="flex-1 p-6 lg:p-8 flex items-center">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 w-full">
                                        <div className="flex flex-wrap items-center gap-6 lg:gap-8">
                                            
                                            {/* Rent */}
                                            <div>
                                                <p className="text-sm text-neutral-400 font-medium">Monthly Rent</p>
                                                <p className="text-white text-xl font-bold">
                                                    ₱{listing.rent.toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="w-px h-12 bg-white/10 hidden sm:block" />

                                            {/* Views */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500/10">
                                                    <Eye className="h-5 w-5 text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-neutral-400 font-medium">Views</p>
                                                    <p className="text-lg font-bold text-white">
                                                        {listing.views}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Leads */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10">
                                                    <TrendingUp className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-neutral-400 font-medium">Leads</p>
                                                    <p className="text-lg font-bold text-white">
                                                        {listing.leads}
                                                    </p>
                                                </div>
                                            </div>

                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3 w-full lg:w-auto self-end lg:self-auto">
                                            <button 
                                                onClick={() => handleEditClick(listing)}
                                                className="flex-1 lg:flex-none h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/5 flex items-center justify-center gap-2"
                                            >
                                                <Settings className="h-4 w-4" />
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {!isLoading && filteredListings.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-[#111] p-10 text-center">
                        <h3 className="text-lg font-semibold text-white">No listings found</h3>
                        <p className="mt-2 text-sm text-neutral-400">Try another filter or create a listing for a property or specific unit.</p>
                    </div>
                )}
            </section>

            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        onClick={() => setIsCreateOpen(false)}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#111] p-8 space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-white">Create Listing</h2>
                            <p className="text-sm text-neutral-400 mt-1">Choose whether to create an apartment listing (tenants pick units) or a direct unit listing.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {(["property", "unit"] as const).map((scope) => (
                                <button
                                    key={scope}
                                    type="button"
                                    onClick={() => setCreateScope(scope)}
                                    className={cn(
                                        "h-11 rounded-xl border text-sm font-semibold transition-colors",
                                        createScope === scope
                                            ? "border-primary/40 bg-primary/15 text-primary"
                                            : "border-white/10 bg-white/5 text-neutral-300 hover:text-white"
                                    )}
                                >
                                    {scope === "property" ? "Apartment Listing" : "Unit Listing"}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Property</label>
                                <select
                                    value={createPropertyId}
                                    onChange={(event) => setCreatePropertyId(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-3 text-sm text-white focus:outline-none focus:border-white/30"
                                >
                                    {listingOptions.map((property) => (
                                        <option key={property.id} value={property.id}>
                                            {property.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {createScope === "unit" && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Unit (vacant only)</label>
                                    <select
                                        value={createUnitId}
                                        onChange={(event) => setCreateUnitId(event.target.value)}
                                        className="h-11 w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-3 text-sm text-white focus:outline-none focus:border-white/30"
                                    >
                                        {availableUnits.map((unit) => (
                                            <option key={unit.id} value={unit.id}>
                                                {unit.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Listing Title (optional)</label>
                                <input
                                    value={createTitle}
                                    onChange={(event) => setCreateTitle(event.target.value)}
                                    placeholder="Auto-generated if empty"
                                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Monthly Rent</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={createRent}
                                    onChange={(event) => setCreateRent(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 max-w-xs">
                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Initial Status</label>
                            <select
                                value={createStatus}
                                onChange={(event) => setCreateStatus(event.target.value as ListingStatus)}
                                className="h-11 w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-3 text-sm text-white focus:outline-none focus:border-white/30"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="paused">Paused</option>
                            </select>
                        </div>

                        {createError && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {createError}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="h-11 px-5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={handleCreateListing}
                                className="h-11 px-5 rounded-xl bg-primary text-black text-sm font-bold hover:bg-primary/90 disabled:opacity-70"
                            >
                                {isSaving ? "Creating..." : "Create Listing"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditOpen && editingListing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        onClick={() => setIsEditOpen(false)}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#111] p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-white">Edit Listing</h2>
                                <p className="text-sm text-neutral-400 mt-1">Update price, title, or status for this listing.</p>
                            </div>
                            <button
                                onClick={handleDeleteListing}
                                className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
                            >
                                Delete Listing
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Listing Title</label>
                                <input
                                    value={editTitle}
                                    onChange={(event) => setEditTitle(event.target.value)}
                                    placeholder="e.g. Spacious Studio in Makati"
                                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Monthly Rent</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editRent}
                                    onChange={(event) => setEditRent(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-3 text-sm text-white focus:outline-none focus:border-white/30"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 max-w-xs">
                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Status</label>
                            <select
                                value={editStatus}
                                onChange={(event) => setEditStatus(event.target.value as ListingStatus)}
                                className="h-11 w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-3 text-sm text-white focus:outline-none focus:border-white/30"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="paused">Paused</option>
                            </select>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-neutral-400" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Linked to</p>
                                    <p className="text-sm font-medium text-white">{editingListing.property} • {editingListing.unit}</p>
                                </div>
                            </div>
                        </div>

                        {editError && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {editError}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsEditOpen(false)}
                                className="h-11 px-5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={handleUpdateListing}
                                className="h-11 px-5 rounded-xl bg-primary text-black text-sm font-bold hover:bg-primary/90 disabled:opacity-70"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
