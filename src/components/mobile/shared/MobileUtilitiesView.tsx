'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Zap,
    Droplets,
    Search,
    RefreshCw,
    X,
    ChevronLeft,
    ChevronRight,
    Check,
    Plus,
    Building2,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    DollarSign,
    Save,
    Sparkles,
    SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UnitItem {
    id: string;
    name: string;
    status: string;
    rentAmount?: number | null;
}

interface PropertyItem {
    id: string;
    name: string;
    address: string;
    units: UnitItem[];
}

interface UtilityReadingRow {
    id: string;
    lease_id?: string;
    unit_id?: string;
    utility_type: 'water' | 'electricity';
    billing_period_start: string;
    billing_period_end: string;
    previous_reading: number;
    current_reading: number;
    consumption?: number;
    created_at: string;
}

export function MobileUtilitiesView() {
    const router = useRouter();
    const { profile } = useAuth();
    const { selectedPropertyId } = useProperty();
    const role = (profile?.role as 'tenant' | 'landlord') || 'landlord';
    const isLandlord = role === 'landlord';

    // Current month in YYYY-MM
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const [properties, setProperties] = useState<PropertyItem[]>([]);
    const [readings, setReadings] = useState<UtilityReadingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'logged'>('all');

    // Drawer state for recording a submeter reading
    const [recordingUnit, setRecordingUnit] = useState<{ unit: UnitItem; property: PropertyItem } | null>(null);
    const [utilityType, setUtilityType] = useState<'electricity' | 'water'>('electricity');
    const [prevReading, setPrevReading] = useState<number>(0);
    const [currReading, setCurrReading] = useState<string>('');
    const [readingNotes, setReadingNotes] = useState<string>('');
    const [submittingReading, setSubmittingReading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [unitsRes, readingsRes] = await Promise.all([
                fetch('/api/landlord/property-units'),
                fetch(`/api/landlord/utility-readings?month=${selectedMonth}`)
            ]);

            const unitsData = unitsRes.ok ? await unitsRes.json() : { properties: [] };
            const readingsData = readingsRes.ok ? await readingsRes.json() : { readings: [] };

            setProperties(Array.isArray(unitsData.properties) ? unitsData.properties : []);
            setReadings(Array.isArray(readingsData.readings) ? readingsData.readings : []);
        } catch (err) {
            console.error('Error fetching utility data:', err);
            toast.error('Failed to load utility submeter data');
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Month Navigation Helpers
    const changeMonth = (delta: number) => {
        triggerHaptic('light');
        const [yStr, mStr] = selectedMonth.split('-');
        let y = parseInt(yStr, 10);
        let m = parseInt(mStr, 10) + delta;
        if (m < 1) { m = 12; y -= 1; }
        if (m > 12) { m = 1; y += 1; }
        setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
    };

    const formattedMonthName = useMemo(() => {
        const [yStr, mStr] = selectedMonth.split('-');
        const date = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }, [selectedMonth]);

    // Flatten all units with their corresponding readings
    const unitsRoster = useMemo(() => {
        let list: Array<{
            unit: UnitItem;
            property: PropertyItem;
            elecReading?: UtilityReadingRow;
            waterReading?: UtilityReadingRow;
            isLogged: boolean;
        }> = [];

        const filteredProps = selectedPropertyId && selectedPropertyId !== 'all'
            ? properties.filter(p => p.id === selectedPropertyId)
            : properties;

        filteredProps.forEach(property => {
            (property.units || []).forEach(unit => {
                const elec = readings.find(r => r.unit_id === unit.id && r.utility_type === 'electricity');
                const water = readings.find(r => r.unit_id === unit.id && r.utility_type === 'water');
                const isLogged = !!elec && !!water;

                list.push({
                    unit,
                    property,
                    elecReading: elec,
                    waterReading: water,
                    isLogged,
                });
            });
        });

        if (activeTab === 'pending') {
            list = list.filter(item => !item.isLogged);
        } else if (activeTab === 'logged') {
            list = list.filter(item => item.isLogged);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(item => 
                item.unit.name.toLowerCase().includes(q) || 
                item.property.name.toLowerCase().includes(q)
            );
        }

        return list;
    }, [properties, readings, selectedPropertyId, activeTab, searchQuery]);

    // Metrics calculation
    const metrics = useMemo(() => {
        let totalUnits = 0;
        let loggedCount = 0;
        let totalElecKwh = 0;
        let totalWaterM3 = 0;

        unitsRoster.forEach(item => {
            totalUnits += 1;
            if (item.isLogged) loggedCount += 1;
            if (item.elecReading) {
                totalElecKwh += Math.max(0, item.elecReading.current_reading - item.elecReading.previous_reading);
            }
            if (item.waterReading) {
                totalWaterM3 += Math.max(0, item.waterReading.current_reading - item.waterReading.previous_reading);
            }
        });

        return { totalUnits, loggedCount, totalElecKwh, totalWaterM3 };
    }, [unitsRoster]);

    // Open Record Drawer for a unit
    const openRecordDrawer = (unit: UnitItem, property: PropertyItem, preferredType: 'electricity' | 'water') => {
        triggerHaptic('light');
        setRecordingUnit({ unit, property });
        setUtilityType(preferredType);

        // Find existing or previous reading
        const existing = readings.find(r => r.unit_id === unit.id && r.utility_type === preferredType);
        if (existing) {
            setPrevReading(existing.previous_reading || 0);
            setCurrReading(String(existing.current_reading || ''));
        } else {
            setPrevReading(0);
            setCurrReading('');
        }
        setReadingNotes('');
    };

    // Submit Reading
    const handleSaveReading = async () => {
        if (!recordingUnit) return;
        const currentVal = parseFloat(currReading);
        if (isNaN(currentVal) || currentVal < prevReading) {
            toast.error('Current reading must be equal to or greater than previous reading.');
            return;
        }

        setSubmittingReading(true);
        triggerHaptic('medium');

        try {
            const [yStr, mStr] = selectedMonth.split('-');
            const y = parseInt(yStr, 10);
            const m = parseInt(mStr, 10);
            const lastDay = new Date(y, m, 0).getDate();

            const res = await fetch('/api/landlord/utility-readings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    unitId: recordingUnit.unit.id,
                    leaseId: recordingUnit.unit.id, // Fallback scope
                    utilityType: utilityType,
                    billingPeriodStart: `${selectedMonth}-01`,
                    billingPeriodEnd: `${selectedMonth}-${String(lastDay).padStart(2, '0')}`,
                    previousReading: prevReading,
                    currentReading: currentVal,
                    note: readingNotes.trim() || undefined,
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to save utility reading');
            }

            toast.success(`${utilityType === 'electricity' ? 'Electric' : 'Water'} reading logged for Unit ${recordingUnit.unit.name}!`);
            setRecordingUnit(null);
            fetchData();
        } catch (err: any) {
            console.error('Error saving reading:', err);
            toast.error(err.message || 'Failed to record reading');
        } finally {
            setSubmittingReading(false);
        }
    };

    return (
        <PullToRefresh onRefresh={fetchData}>
            <div className="flex flex-col gap-3.5 p-4 pb-24">
                {/* Scope & Refresh */}
                <div className="flex items-center justify-between gap-2">
                    {isLandlord ? (
                        <MobilePropertySelector className="flex-1" />
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                            <Zap className="size-4 text-amber-500" />
                            <span>My Utility Consumption</span>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            fetchData();
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-2xs"
                        aria-label="Refresh readings"
                    >
                        <RefreshCw className={cn("size-4", loading && "animate-spin text-primary")} />
                    </button>
                </div>

                {/* Billing Month Picker Bar */}
                <div className="p-3 rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-2xs">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground active:scale-90 transition-all"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="size-4" />
                    </button>

                    <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-primary" />
                        <span className="text-xs font-black text-foreground">
                            {formattedMonthName}
                        </span>
                    </div>

                    <button
                        onClick={() => changeMonth(1)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground active:scale-90 transition-all"
                        aria-label="Next month"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Progress</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-lg font-black text-foreground">{metrics.loggedCount}</span>
                            <span className="text-[10px] text-muted-foreground">/{metrics.totalUnits} units</span>
                        </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <Zap className="size-3 fill-amber-500" />
                            Electricity
                        </span>
                        <div className="flex items-baseline gap-0.5 mt-0.5">
                            <span className="text-lg font-black text-foreground">{metrics.totalElecKwh.toLocaleString()}</span>
                            <span className="text-[10px] text-muted-foreground">kWh</span>
                        </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                            <Droplets className="size-3 fill-blue-500" />
                            Water
                        </span>
                        <div className="flex items-baseline gap-0.5 mt-0.5">
                            <span className="text-lg font-black text-foreground">{metrics.totalWaterM3.toLocaleString()}</span>
                            <span className="text-[10px] text-muted-foreground">m³</span>
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
                        placeholder="Search unit number or property..."
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

                {/* Filter Navigation Tabs */}
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
                        All Units ({unitsRoster.length})
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('pending');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'pending'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Needs Reading
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('logged');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'logged'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Completed
                    </button>
                </div>

                {/* Submeter Units Roster */}
                <div className="space-y-3">
                    {unitsRoster.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col items-center gap-2.5">
                            <Zap className="size-10 text-muted-foreground/40 stroke-1" />
                            <h4 className="text-sm font-bold text-foreground">No Units Found</h4>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                {searchQuery ? 'No units match your search query.' : 'No units configured for this building.'}
                            </p>
                        </div>
                    ) : (
                        unitsRoster.map(({ unit, property, elecReading, waterReading, isLogged }) => {
                            const elecDiff = elecReading 
                                ? Math.max(0, elecReading.current_reading - elecReading.previous_reading) 
                                : null;
                            const waterDiff = waterReading 
                                ? Math.max(0, waterReading.current_reading - waterReading.previous_reading) 
                                : null;

                            return (
                                <div
                                    key={unit.id}
                                    className="rounded-2xl p-4 bg-card border border-slate-200 dark:border-white/10 shadow-xs transition-all flex flex-col gap-3"
                                >
                                    {/* Unit Header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                                                <Building2 className="size-3" />
                                                <span>{property.name}</span>
                                            </div>
                                            <h3 className="text-sm font-black text-foreground mt-0.5">
                                                Unit {unit.name}
                                            </h3>
                                        </div>

                                        <span className={cn(
                                            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                            isLogged
                                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                        )}>
                                            {isLogged ? 'Logged' : 'Pending Meter'}
                                        </span>
                                    </div>

                                    {/* Dual Utility Meters Cards */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {/* Electricity Card */}
                                        <div 
                                            onClick={() => openRecordDrawer(unit, property, 'electricity')}
                                            className={cn(
                                                "p-3 rounded-xl border flex flex-col justify-between cursor-pointer active:scale-97 transition-all",
                                                elecReading
                                                    ? "bg-amber-500/5 border-amber-500/20"
                                                    : "bg-slate-50 dark:bg-white/5 border-dashed border-slate-300 dark:border-white/15"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
                                                    <Zap className="size-3 fill-amber-500" />
                                                    Electric
                                                </span>
                                                {elecReading && <CheckCircle2 className="size-3 text-emerald-500" />}
                                            </div>

                                            {elecReading ? (
                                                <div className="mt-2">
                                                    <div className="text-sm font-black text-foreground">
                                                        {elecReading.current_reading} <span className="text-[10px] font-normal text-muted-foreground">kWh</span>
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        Usage: +{elecDiff} kWh
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                                                    <Plus className="size-3" />
                                                    Tap to log
                                                </div>
                                            )}
                                        </div>

                                        {/* Water Card */}
                                        <div 
                                            onClick={() => openRecordDrawer(unit, property, 'water')}
                                            className={cn(
                                                "p-3 rounded-xl border flex flex-col justify-between cursor-pointer active:scale-97 transition-all",
                                                waterReading
                                                    ? "bg-blue-500/5 border-blue-500/20"
                                                    : "bg-slate-50 dark:bg-white/5 border-dashed border-slate-300 dark:border-white/15"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1">
                                                    <Droplets className="size-3 fill-blue-500" />
                                                    Water
                                                </span>
                                                {waterReading && <CheckCircle2 className="size-3 text-emerald-500" />}
                                            </div>

                                            {waterReading ? (
                                                <div className="mt-2">
                                                    <div className="text-sm font-black text-foreground">
                                                        {waterReading.current_reading} <span className="text-[10px] font-normal text-muted-foreground">m³</span>
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        Usage: +{waterDiff} m³
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                                                    <Plus className="size-3" />
                                                    Tap to log
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* RECORD READING BOTTOM DRAWER */}
                {recordingUnit && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                        <div className="w-full sm:max-w-md max-h-[85vh] bg-background rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-bottom duration-200">
                            {/* Drawer Header */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                                        <span>Meter Logging</span>
                                    </div>
                                    <h3 className="text-base font-black text-foreground mt-0.5">
                                        Unit {recordingUnit.unit.name} • {recordingUnit.property.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Billing Period: {formattedMonthName}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setRecordingUnit(null)}
                                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Utility Type Switcher */}
                            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setUtilityType('electricity');
                                    }}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5",
                                        utilityType === 'electricity' 
                                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs" 
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <Zap className="size-3.5 fill-amber-500" />
                                    Electricity (kWh)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setUtilityType('water');
                                    }}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5",
                                        utilityType === 'water' 
                                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 shadow-xs" 
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <Droplets className="size-3.5 fill-blue-500" />
                                    Water (m³)
                                </button>
                            </div>

                            {/* Previous Reading vs Current Reading Input */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Previous Reading:</span>
                                    <span className="font-bold text-foreground">
                                        {prevReading} {utilityType === 'electricity' ? 'kWh' : 'm³'}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground block">
                                        Current Submeter Reading:
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={currReading}
                                        onChange={(e) => setCurrReading(e.target.value)}
                                        placeholder={`Enter ${utilityType === 'electricity' ? 'kWh' : 'm³'} value`}
                                        className="w-full p-3 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-base font-black text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                                    />
                                </div>

                                {currReading && parseFloat(currReading) >= prevReading && (
                                    <div className="pt-2 border-t border-slate-200/40 dark:border-white/5 flex justify-between items-center text-xs">
                                        <span className="font-semibold text-muted-foreground">Calculated Consumption:</span>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                                            +{(parseFloat(currReading) - prevReading).toFixed(1)} {utilityType === 'electricity' ? 'kWh' : 'm³'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Notes Input */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground block">
                                    Notes / Observation (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={readingNotes}
                                    onChange={(e) => setReadingNotes(e.target.value)}
                                    placeholder="e.g., Submeter dial replaced or tenant inspected"
                                    className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    onClick={() => setRecordingUnit(null)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-98 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={submittingReading || !currReading}
                                    onClick={handleSaveReading}
                                    className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-40"
                                >
                                    {submittingReading ? (
                                        <RefreshCw className="size-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="size-4" />
                                            Record Reading
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
}
