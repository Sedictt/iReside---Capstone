'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useProperty } from '@/context/PropertyContext';
import { cn } from '@/lib/utils';
import { 
    ChevronDown, 
    Building2, 
    Check, 
    LayoutGrid,
    Search,
    X
} from 'lucide-react';

export function MobilePropertySelector({ className }: { className?: string }) {
    const { properties, selectedPropertyId, setSelectedPropertyId, selectedProperty, loading } = useProperty();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const filteredProperties = properties.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.address && p.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const isAll = !selectedPropertyId || selectedPropertyId === 'all';
    const currentName = isAll ? 'ALL PROPERTIES' : (selectedProperty?.name?.toUpperCase() || 'ALL PROPERTIES');

    if (loading && properties.length === 0) {
        return (
            <div className={cn("h-14 w-full animate-pulse rounded-[1.75rem] bg-primary/5 border border-primary/20", className)} />
        );
    }

    return (
        <div className={cn("relative w-full", isOpen ? "z-[60]" : "z-10", className)} ref={containerRef}>
            {/* Trigger Button Matching Desktop Screenshot Exactly */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "group flex w-full items-center justify-between p-2.5 sm:p-3 rounded-[1.75rem] transition-all cursor-pointer text-left focus:outline-none",
                    "border-2 border-primary/40 bg-primary/5 dark:bg-primary/10",
                    isOpen && "border-primary shadow-sm"
                )}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {/* Left Icon: Rounded Squircle */}
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 overflow-hidden">
                        {isAll ? (
                            <LayoutGrid className="size-6 text-white" />
                        ) : selectedProperty?.image ? (
                            <div className="relative size-full">
                                <Image 
                                    src={selectedProperty.image} 
                                    alt={selectedProperty.name} 
                                    fill 
                                    sizes="44px" 
                                    className="object-cover" 
                                />
                            </div>
                        ) : (
                            <Building2 className="size-6 text-white" />
                        )}
                    </div>

                    {/* Text block */}
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                            PROPERTY
                        </span>
                        <span className="text-[12px] font-black uppercase tracking-widest text-foreground truncate mt-0.5">
                            {currentName}
                        </span>
                    </div>
                </div>

                {/* Right Chevron */}
                <div className="flex size-7 items-center justify-center shrink-0 text-primary transition-transform duration-300">
                    <ChevronDown className={cn("size-5 stroke-[2.5] transition-transform duration-300", isOpen && "rotate-180")} />
                </div>
            </button>

            {/* Dropdown Menu Matching Desktop Neumorphic Panel */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-2.5 z-[200] overflow-hidden rounded-[2.5rem] neumorphic-panel p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
                    {/* Search Properties Bar with Neumorphic Inset */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="SEARCH PROPERTIES…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-12 w-full rounded-2xl border-none text-[11px] font-black uppercase tracking-wider pl-11 pr-8 focus:outline-none neumorphic-inset placeholder:text-muted-foreground/40 text-foreground"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/50 hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Scrollable list of properties */}
                    <div className="custom-scrollbar-premium max-h-[300px] overflow-y-auto space-y-2 p-1 pr-1.5">
                        {/* All Properties Item with Inset / Extruded Neumorphic styling */}
                        {properties.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedPropertyId('all');
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "group flex w-full items-center gap-3 rounded-2xl p-3 px-4 transition-all text-left cursor-pointer",
                                    isAll ? "neumorphic-inset" : "neumorphic-extruded hover:scale-[1.01]"
                                )}
                            >
                                <div className={cn(
                                    "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                                    isAll ? "neumorphic-inset-card text-primary" : "neumorphic-inset-card text-muted-foreground group-hover:text-foreground"
                                )}>
                                    <LayoutGrid className="size-5" />
                                </div>
                                <div className="flex flex-1 flex-col items-start overflow-hidden">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground">
                                        ALL PROPERTIES
                                    </span>
                                </div>
                                {isAll && (
                                    <Check className="size-4 stroke-[2.5] text-primary ml-auto" />
                                )}
                            </button>
                        )}

                        {/* Section Header: YOUR PROPERTIES */}
                        <div className="px-3 pt-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                                YOUR PROPERTIES
                            </p>
                        </div>

                        {/* Properties list */}
                        {filteredProperties.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-xs font-medium text-muted-foreground/40 italic">No properties found</p>
                            </div>
                        ) : (
                            filteredProperties.map((property) => {
                                const isSelected = selectedPropertyId === property.id;
                                return (
                                    <button
                                        key={property.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedPropertyId(property.id);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "group flex w-full items-center gap-3 rounded-2xl p-3 px-4 transition-all text-left cursor-pointer",
                                            isSelected ? "neumorphic-inset" : "neumorphic-extruded hover:scale-[1.01]"
                                        )}
                                    >
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl overflow-hidden neumorphic-inset-card">
                                            {property.image ? (
                                                <div className="relative size-full">
                                                    <Image
                                                        src={property.image}
                                                        alt={property.name}
                                                        fill
                                                        sizes="40px"
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <Building2 className="size-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col items-start overflow-hidden">
                                            <span className="truncate text-[11px] font-black uppercase tracking-widest text-foreground">
                                                {property.name}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <Check className="size-4 stroke-[2.5] text-primary ml-auto" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
