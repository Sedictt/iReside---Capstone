'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Building2,
    MapPin,
    Home,
    Search,
    ChevronDown,
    ChevronRight,
    RefreshCw,
    X,
    CheckCircle2,
    AlertTriangle,
    Wrench,
    Share2,
    Key,
    Layers,
    TrendingUp,
    Sparkles,
    Check,
    Users
} from 'lucide-react';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PropertyUnitItem {
    id: string;
    name: string;
    status: 'occupied' | 'vacant' | 'maintenance';
    rentAmount?: number | null;
    hasOngoingApplication?: boolean;
}

interface PropertyCardData {
    id: string;
    name: string;
    address: string;
    type?: string;
    image?: string | null;
    status: 'Performing' | 'Stable' | 'Attention Required';
    metrics: {
        occupied: number;
        total: number;
        maintenance: number;
    };
    units?: PropertyUnitItem[];
}

export function LandlordPropertiesView() {
    const router = useRouter();

    const [properties, setProperties] = useState<PropertyCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'vacant' | 'full'>('all');
    
    // Expanded property accordion state
    const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);

    const fetchProperties = useCallback(async () => {
        try {
            setLoading(true);
            const [overviewRes, unitsRes] = await Promise.all([
                fetch('/api/landlord/properties/overview'),
                fetch('/api/landlord/property-units')
            ]);

            const overviewData = overviewRes.ok ? await overviewRes.json() : { properties: [] };
            const unitsData = unitsRes.ok ? await unitsRes.json() : { properties: [] };

            const unitsMap = new Map<string, PropertyUnitItem[]>();
            if (Array.isArray(unitsData.properties)) {
                unitsData.properties.forEach((p: any) => {
                    unitsMap.set(p.id, p.units || []);
                });
            }

            const merged: PropertyCardData[] = (overviewData.properties || []).map((p: any) => ({
                ...p,
                units: unitsMap.get(p.id) || []
            }));

            setProperties(merged);
        } catch (err) {
            console.error('Error fetching landlord properties:', err);
            toast.error('Failed to load properties');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    const formatCurrency = (amt?: number | null) => {
        if (typeof amt !== 'number') return '₱0.00';
        return `₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
    };

    // Calculate Portfolio Summary Metrics
    const portfolioMetrics = useMemo(() => {
        const totalBuildings = properties.length;
        let totalUnits = 0;
        let totalOccupied = 0;
        let totalMaintenance = 0;

        properties.forEach(p => {
            totalUnits += p.metrics?.total || 0;
            totalOccupied += p.metrics?.occupied || 0;
            totalMaintenance += p.metrics?.maintenance || 0;
        });

        const totalVacant = Math.max(0, totalUnits - totalOccupied - totalMaintenance);
        const overallOccupancy = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;

        return { totalBuildings, totalUnits, totalOccupied, totalVacant, overallOccupancy };
    }, [properties]);

    // Filter properties based on tab & search
    const filteredProperties = useMemo(() => {
        let list = properties;

        if (activeTab === 'vacant') {
            list = list.filter(p => {
                const vacantCount = (p.metrics?.total || 0) - (p.metrics?.occupied || 0) - (p.metrics?.maintenance || 0);
                return vacantCount > 0;
            });
        } else if (activeTab === 'full') {
            list = list.filter(p => {
                const total = p.metrics?.total || 0;
                const occ = p.metrics?.occupied || 0;
                return total > 0 && occ >= total;
            });
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => {
                const nameMatch = p.name.toLowerCase().includes(q);
                const addressMatch = p.address.toLowerCase().includes(q);
                const unitMatch = (p.units || []).some(u => u.name.toLowerCase().includes(q));
                return nameMatch || addressMatch || unitMatch;
            });
        }

        return list;
    }, [properties, activeTab, searchQuery]);

    const togglePropertyAccordion = (id: string) => {
        triggerHaptic('light');
        setExpandedPropertyId(prev => prev === id ? null : id);
    };

    const copyInviteLink = (e: React.MouseEvent, propName: string, unitName: string) => {
        e.stopPropagation();
        triggerHaptic('medium');
        const url = `${window.location.origin}/apply`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url);
            toast.success(`Application link copied for ${propName} - Unit ${unitName}!`);
        } else {
            toast.info('Application link: /apply');
        }
    };

    return (
        <PullToRefresh onRefresh={fetchProperties}>
            <div className="flex flex-col gap-3.5 p-4 pb-20">
                {/* Header Title & Refresh Button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-black text-foreground">Property Portfolio</h2>
                        <p className="text-xs text-muted-foreground">Building & unit availability status</p>
                    </div>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            fetchProperties();
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-2xs"
                        aria-label="Refresh properties"
                    >
                        <RefreshCw className={cn("size-4", loading && "animate-spin text-primary")} />
                    </button>
                </div>

                {/* Portfolio Summary Metrics Bar */}
                <div className="grid grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Properties</span>
                        <span className="text-lg font-black text-foreground mt-0.5">{portfolioMetrics.totalBuildings}</span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Units</span>
                        <span className="text-lg font-black text-foreground mt-0.5">{portfolioMetrics.totalUnits}</span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Occupancy</span>
                        <span className="text-lg font-black text-foreground mt-0.5">{portfolioMetrics.overallOccupancy}%</span>
                    </div>

                    <div 
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('vacant');
                        }}
                        className={cn(
                            "p-2.5 rounded-2xl border flex flex-col justify-between cursor-pointer active:scale-97 transition-all",
                            portfolioMetrics.totalVacant > 0
                                ? "bg-blue-500/10 border-blue-500/30"
                                : "bg-card border-slate-200 dark:border-white/10"
                        )}
                    >
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Vacant</span>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-black text-foreground mt-0.5">{portfolioMetrics.totalVacant}</span>
                            {portfolioMetrics.totalVacant > 0 && (
                                <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search property, address, or unit..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('all');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'all'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        All ({properties.length})
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('vacant');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center relative",
                            activeTab === 'vacant'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Has Vacancies
                        {portfolioMetrics.totalVacant > 0 && (
                            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-500 text-white text-[9px] font-black">
                                {portfolioMetrics.totalVacant}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('full');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'full'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        100% Full
                    </button>
                </div>

                {/* Property Cards List */}
                <div className="space-y-3.5">
                    {filteredProperties.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col items-center gap-2.5">
                            <Building2 className="size-10 text-muted-foreground/40 stroke-1" />
                            <h4 className="text-sm font-bold text-foreground">No Properties Found</h4>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                {searchQuery ? 'No buildings or units match your search criteria.' : 'No properties found in this category.'}
                            </p>
                        </div>
                    ) : (
                        filteredProperties.map((property) => {
                            const isExpanded = expandedPropertyId === property.id;
                            const total = property.metrics?.total || 0;
                            const occupied = property.metrics?.occupied || 0;
                            const maintenance = property.metrics?.maintenance || 0;
                            const vacant = Math.max(0, total - occupied - maintenance);
                            const occupancyPercent = total > 0 ? Math.round((occupied / total) * 100) : 0;
                            const units = property.units || [];

                            return (
                                <div
                                    key={property.id}
                                    className="rounded-2xl bg-card border border-slate-200 dark:border-white/10 shadow-xs overflow-hidden transition-all"
                                >
                                    {/* Property Header Cover Banner */}
                                    <div 
                                        onClick={() => togglePropertyAccordion(property.id)}
                                        className="cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="h-28 w-full relative bg-slate-900">
                                            {property.image ? (
                                                <Image
                                                    src={property.image}
                                                    alt={property.name}
                                                    fill
                                                    className="object-cover opacity-80"
                                                    sizes="(max-width: 768px) 100vw, 500px"
                                                />
                                            ) : (
                                                <div className="size-full bg-gradient-to-br from-primary/30 to-slate-900 flex items-center justify-center">
                                                    <Building2 className="size-10 text-white/40" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                                            {/* Top Status Badge */}
                                            <div className="absolute top-2.5 right-2.5">
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs",
                                                    property.status === 'Performing'
                                                        ? "bg-emerald-500/80 text-white"
                                                        : property.status === 'Stable'
                                                        ? "bg-blue-500/80 text-white"
                                                        : "bg-amber-500/80 text-white"
                                                )}>
                                                    {property.status}
                                                </span>
                                            </div>

                                            {/* Bottom Text Over Image */}
                                            <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                                                <div>
                                                    <h3 className="text-base font-black text-white leading-tight drop-shadow-xs">
                                                        {property.name}
                                                    </h3>
                                                    <p className="text-[11px] text-white/80 flex items-center gap-1 mt-0.5">
                                                        <MapPin className="size-3 shrink-0" />
                                                        <span className="truncate max-w-[220px]">{property.address}</span>
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1 text-white text-xs font-bold bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">
                                                    <span>{occupancyPercent}%</span>
                                                    <ChevronDown className={cn("size-3.5 transition-transform", isExpanded && "rotate-180")} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Occupancy Progress Bar */}
                                    <div className="p-3.5 space-y-2.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[11px] font-semibold text-muted-foreground">
                                                Unit Occupancy ({occupied}/{total})
                                            </span>
                                            <div className="flex items-center gap-2 text-[10px] font-bold">
                                                <span className="text-emerald-600 dark:text-emerald-400">{occupied} Occupied</span>
                                                <span>•</span>
                                                <span className="text-blue-600 dark:text-blue-400">{vacant} Vacant</span>
                                                {maintenance > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-amber-600 dark:text-amber-400">{maintenance} Repairs</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden flex">
                                            <div 
                                                className="h-full bg-emerald-500 transition-all duration-300"
                                                style={{ width: `${occupancyPercent}%` }}
                                            />
                                            {maintenance > 0 && (
                                                <div 
                                                    className="h-full bg-amber-500"
                                                    style={{ width: `${total > 0 ? (maintenance / total) * 100 : 0}%` }}
                                                />
                                            )}
                                        </div>

                                        {/* Toggle Action & Quick Counts */}
                                        <div className="flex items-center justify-between pt-1">
                                            <button
                                                onClick={() => togglePropertyAccordion(property.id)}
                                                className="text-xs font-bold text-primary flex items-center gap-1 active:scale-95 transition-all"
                                            >
                                                {isExpanded ? 'Hide Units' : `View All ${units.length || total} Units`}
                                                <ChevronRight className={cn("size-3.5 transition-transform", isExpanded && "rotate-90")} />
                                            </button>

                                            <div className="flex items-center gap-1.5">
                                                <Link
                                                    href="/mobile/landlord/tenants"
                                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground text-[11px] font-semibold flex items-center gap-1"
                                                >
                                                    <Users className="size-3" />
                                                    Tenants
                                                </Link>
                                                <Link
                                                    href="/mobile/landlord/leases"
                                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground text-[11px] font-semibold flex items-center gap-1"
                                                >
                                                    <Key className="size-3" />
                                                    Leases
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Unit Directory Roster */}
                                    {isExpanded && (
                                        <div className="p-3.5 pt-0 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] space-y-2 animate-in slide-in-from-top-2 duration-150">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pt-2">
                                                Units Directory ({units.length})
                                            </div>

                                            {units.length === 0 ? (
                                                <div className="p-4 text-center text-xs text-muted-foreground">
                                                    No individual units configured for this building.
                                                </div>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {units.map((unit) => {
                                                        const isOccupied = unit.status === 'occupied';
                                                        const isVacant = unit.status === 'vacant';
                                                        const isMaint = unit.status === 'maintenance';

                                                        return (
                                                            <div
                                                                key={unit.id}
                                                                className="p-2.5 rounded-xl bg-card border border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className={cn(
                                                                        "size-2.5 rounded-full shrink-0",
                                                                        isOccupied ? "bg-emerald-500" : isVacant ? "bg-blue-500" : "bg-amber-500"
                                                                    )} />
                                                                    <div>
                                                                        <span className="font-bold text-foreground">
                                                                            Unit {unit.name}
                                                                        </span>
                                                                        {unit.rentAmount ? (
                                                                            <span className="text-muted-foreground ml-2 text-[11px]">
                                                                                {formatCurrency(unit.rentAmount)}/mo
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase",
                                                                        isOccupied
                                                                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                                            : isVacant
                                                                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                                                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                                                    )}>
                                                                        {unit.status}
                                                                    </span>

                                                                    {isVacant && (
                                                                        <button
                                                                            onClick={(e) => copyInviteLink(e, property.name, unit.name)}
                                                                            className="p-1 rounded-md text-muted-foreground hover:text-foreground active:scale-95"
                                                                            title="Copy Application Link"
                                                                        >
                                                                            <Share2 className="size-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </PullToRefresh>
    );
}
