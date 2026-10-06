'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Building2,
    Search,
    UserPlus,
    Copy,
    Check,
    ArrowUpRight,
    Sparkles,
    DoorOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

interface MobileVacantUnitsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    units: VacantUnitItem[];
    onStartWalkIn: (unitId: string) => void;
}

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

export function MobileVacantUnitsDrawer({
    isOpen,
    onClose,
    units,
    onStartWalkIn,
}: MobileVacantUnitsDrawerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('all');
    const [copiedUnitId, setCopiedUnitId] = useState<string | null>(null);

    // Unique properties
    const properties = useMemo(() => {
        const map = new Map<string, string>();
        units.forEach((u) => {
            if (u.property_id && u.property_name) {
                map.set(u.property_id, u.property_name);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [units]);

    const filteredUnits = useMemo(() => {
        return units.filter((u) => {
            const matchesProperty =
                selectedPropertyFilter === 'all' || u.property_id === selectedPropertyFilter;
            const matchesSearch =
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.property_name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesProperty && matchesSearch;
        });
    }, [units, selectedPropertyFilter, searchQuery]);

    const handleCopyLink = async (unit: VacantUnitItem) => {
        try {
            const url = typeof window !== 'undefined'
                ? `${window.location.origin}/apply?unit=${unit.id}`
                : '';
            await navigator.clipboard.writeText(url);
            setCopiedUnitId(unit.id);
            toast.success(`Application link for ${unit.name} copied!`);
            setTimeout(() => setCopiedUnitId(null), 2000);
        } catch {
            toast.error('Failed to copy application link');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-end justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
                    />

                    {/* Sheet Window */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="relative z-10 w-full max-w-lg rounded-t-[2.5rem] border-t border-border/80 bg-card text-card-foreground shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
                    >
                        {/* Drag Handle */}
                        <div className="pt-3 pb-1 shrink-0 flex justify-center">
                            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                        </div>

                        {/* Sheet Header */}
                        <div className="px-5 pt-2 pb-3.5 border-b border-border/50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="size-10 rounded-2xl bg-sky-500/15 text-sky-500 border border-sky-500/20 flex items-center justify-center shrink-0">
                                    <Building2 className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-black text-foreground tracking-tight truncate">
                                            Vacant Units
                                        </h2>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-muted/60 text-foreground tabular-nums">
                                            {units.length} available
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        Units ready for walk-in or resident invites
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="size-9 min-h-[36px] min-w-[36px] rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95 shrink-0"
                                aria-label="Close sheet"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Search & Property Pills */}
                        <div className="px-5 py-2.5 border-b border-border/30 bg-muted/10 shrink-0 space-y-2">
                            <div className="relative flex items-center">
                                <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by unit name or property..."
                                    maxLength={60}
                                    className="w-full rounded-xl bg-background border border-border/60 py-2 pl-10 pr-9 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Property Filter Chips */}
                            {properties.length > 1 && (
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-[10px]">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPropertyFilter('all')}
                                        className={cn(
                                            'px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all',
                                            selectedPropertyFilter === 'all'
                                                ? 'bg-primary text-primary-foreground shadow-2xs'
                                                : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        All ({units.length})
                                    </button>
                                    {properties.map((prop) => (
                                        <button
                                            key={prop.id}
                                            type="button"
                                            onClick={() => setSelectedPropertyFilter(prop.id)}
                                            className={cn(
                                                'px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all truncate max-w-[140px]',
                                                selectedPropertyFilter === prop.id
                                                    ? 'bg-primary text-primary-foreground shadow-2xs'
                                                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            {prop.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 custom-scrollbar-premium">
                            {filteredUnits.length === 0 ? (
                                <div className="rounded-3xl border border-sky-500/20 bg-sky-500/5 dark:bg-sky-500/10 p-7 text-center flex flex-col items-center justify-center my-4">
                                    <div className="size-12 rounded-2xl bg-sky-500/15 text-sky-500 flex items-center justify-center shadow-xs mb-3">
                                        <Sparkles className="size-6" />
                                    </div>
                                    <h3 className="text-sm font-black text-foreground">
                                        {searchQuery ? 'No matching units found' : '100% Occupancy!'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                                        {searchQuery
                                            ? `No vacant units match "${searchQuery}". Try a different keyword.`
                                            : 'All units across your selected property are currently occupied or leased.'}
                                    </p>
                                    <Link
                                        href="/mobile/landlord/properties"
                                        onClick={onClose}
                                        className="mt-4 px-4 py-2 rounded-xl neumorphic-extruded text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5 active:scale-95 transition-all"
                                    >
                                        <span>Manage Properties</span>
                                        <ArrowUpRight className="size-3.5" />
                                    </Link>
                                </div>
                            ) : (
                                filteredUnits.map((unit) => {
                                    const badge = getUnitBadge(unit.name);
                                    const isCopied = copiedUnitId === unit.id;
                                    return (
                                        <div
                                            key={unit.id}
                                            className="p-3.5 rounded-2xl border border-border/60 bg-card hover:bg-muted/20 transition-all flex flex-col gap-3 shadow-2xs"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="size-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-sky-500/20">
                                                        {badge}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-black text-foreground truncate">
                                                            {unit.name}
                                                        </h4>
                                                        <p className="text-[10px] text-muted-foreground truncate">
                                                            {unit.property_name}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <div className="text-xs font-black text-foreground tabular-nums">
                                                        PHP {unit.rent_amount.toLocaleString()}
                                                    </div>
                                                    <span className="text-[9px] font-bold text-muted-foreground">/ month</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyLink(unit)}
                                                    className="py-2 px-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/50 text-[11px] font-bold text-foreground flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                                                >
                                                    {isCopied ? (
                                                        <>
                                                            <Check className="size-3.5 text-emerald-500" />
                                                            <span className="text-emerald-500 font-black">Copied!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="size-3.5 text-muted-foreground" />
                                                            <span>Copy Link</span>
                                                        </>
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onClose();
                                                        onStartWalkIn(unit.id);
                                                    }}
                                                    className="py-2 px-3 rounded-xl neumorphic-primary text-[11px] font-black uppercase tracking-wider text-primary-foreground flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                                                >
                                                    <UserPlus className="size-3.5" />
                                                    <span>Walk-In App</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border/50 bg-card/95 shrink-0 flex items-center justify-between gap-3">
                            <Link
                                href="/mobile/landlord/properties"
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl border border-border/60 bg-muted/30 text-xs font-bold text-muted-foreground hover:text-foreground text-center active:scale-95 transition-all"
                            >
                                All Properties
                            </Link>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl neumorphic-primary text-xs font-black uppercase tracking-wider text-primary-foreground active:scale-95 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
