"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
}

const MOCK_LISTINGS: ListingItem[] = [
    {
        id: "LST-001",
        title: "Sunset Heights - Unit 108",
        property: "Sunset Heights Complex",
        unit: "Unit 108",
        type: "unit",
        rent: 25000,
        status: "published",
        views: 128,
        leads: 14,
        updatedAt: "2h ago",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80",
        color: "from-emerald-500/20 to-emerald-500/0",
        address: "123 Skyline Avenue, Metro Manila",
    },
    {
        id: "LST-002",
        title: "Sunset Heights - Unit 204",
        property: "Sunset Heights Complex",
        unit: "Unit 204",
        type: "unit",
        rent: 22000,
        status: "draft",
        views: 0,
        leads: 0,
        updatedAt: "1d ago",
        image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1200&auto=format&fit=crop&q=80",
        color: "from-amber-500/20 to-amber-500/0",
        address: "123 Skyline Avenue, Metro Manila",
    },
    {
        id: "LST-003",
        title: "Grand View Residences - 3B",
        property: "Grand View Residences",
        unit: "3B",
        type: "unit",
        rent: 32000,
        status: "paused",
        views: 304,
        leads: 29,
        updatedAt: "3d ago",
        image: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1200&auto=format&fit=crop&q=80",
        color: "from-slate-500/20 to-slate-500/0",
        address: "45 Greenfield Subd, Quezon City",
    },
    {
        id: "LST-004",
        title: "Oasis Villa",
        property: "Oasis Villa",
        unit: "Entire Property",
        type: "property",
        rent: 150000,
        status: "published",
        views: 89,
        leads: 5,
        updatedAt: "12h ago",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80",
        color: "from-emerald-500/20 to-emerald-500/0",
        address: "88 Palm Drive, Taguig City",
    },
];

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
    const [query, setQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<"all" | ListingStatus>("all");
    const [typeFilter, setTypeFilter] = useState<"all" | ListingType>("all");

    const filteredListings = useMemo(() => {
        return MOCK_LISTINGS.filter((item) => {
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
    }, [activeFilter, typeFilter, query]);

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
                        href="/landlord/unit-map"
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-black hover:bg-primary/90 transition-colors"
                    >
                        <Building2 className="h-4 w-4" />
                        Create From Unit Map
                    </Link>
                </div>
            </section>

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
                {filteredListings.map((listing) => {
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
                                            {listing.type === "unit" ? "Unit" : "Entire Property"}
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{listing.title}</h3>
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
                                            <Link 
                                                href={`/landlord/properties/new?id=${listing.id}&mode=edit`}
                                                className="flex-1 lg:flex-none h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/5 flex items-center justify-center gap-2"
                                            >
                                                <Settings className="h-4 w-4" />
                                                Edit
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredListings.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-[#111] p-10 text-center">
                        <h3 className="text-lg font-semibold text-white">No listings found</h3>
                        <p className="mt-2 text-sm text-neutral-400">Try another filter or create a listing from the unit map wizard.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
