'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useProperty } from '@/context/PropertyContext'
import { cn } from '@/lib/utils'
import { 
    ChevronDown, 
    Building2, 
    Check, 
    LayoutGrid,
    Search,
    Plus
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function PropertySelector({ className }: { className?: string } = {}) {
    const { properties, selectedPropertyId, setSelectedPropertyId, selectedProperty, loading } = useProperty()
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [hasMounted, setHasMounted] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setHasMounted(true)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    const filteredProperties = properties.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (!hasMounted || (loading && properties.length === 0)) {
        return (
            <div className="h-12 w-full animate-pulse rounded-xl bg-muted/30" />
        )
    }

    // When there is only 1 property (or 0), render as a static label instead of a dropdown
    if (properties.length <= 1) {
        const singleProperty = properties[0];
        const propertyDisplayName = singleProperty?.name || (loading ? 'Loading…' : 'No Property');

        return (
            <div
                className="flex h-12 w-full items-center gap-2.5 px-3 rounded-xl border border-border/60 bg-muted/20 select-none"
                aria-label={`Current Property: ${propertyDisplayName}`}
            >
                <div className="flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary size-8">
                    <Building2 className="size-4" />
                </div>
                
                <div className="flex min-w-0 flex-1 flex-col items-start leading-tight text-left">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                        Property
                    </span>
                    <span className="truncate text-xs font-bold text-foreground mt-0.5">
                        {propertyDisplayName}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "group flex h-12 w-full items-center gap-2.5 px-3 rounded-xl border border-border/70 bg-card hover:bg-muted/50 shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer",
                    isOpen && "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                )}
            >
                <div className="flex shrink-0 items-center justify-center rounded-lg transition-colors bg-primary/10 text-primary size-8">
                    {selectedPropertyId === 'all' ? (
                        <LayoutGrid className="size-4" />
                    ) : (
                        <Building2 className="size-4" />
                    )}
                </div>
                
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 flex-col items-start leading-tight text-left">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                            Property
                        </span>
                        <span className="truncate text-xs font-bold text-foreground mt-0.5">
                            {selectedPropertyId === 'all' 
                                ? 'All Properties' 
                                : (selectedProperty?.name || (loading ? 'Loading…' : (properties.length > 0 ? properties[0].name : 'Select Property')))}
                        </span>
                    </div>
                    <ChevronDown className={cn(
                        "size-3.5 text-muted-foreground transition-transform duration-200 ml-auto shrink-0",
                        isOpen && "rotate-180"
                    )} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-[200] mt-2 left-0 right-0 top-full w-full overflow-hidden rounded-2xl border border-border/80 bg-popover/95 backdrop-blur-xl glass-premium shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150 origin-top-left">
                    <div className="relative mb-2 px-1 pt-1">
                        <Search className="absolute left-3.5 top-1/2 mt-0.5 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                        <input maxLength={60}
                            type="text"
                            placeholder="Search properties…"
                            className="h-9 w-full rounded-xl border border-border/60 bg-muted/30 text-xs font-medium pl-8 pr-3 focus:outline-none focus:border-primary/50 focus:bg-background transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>

                    <div className="custom-scrollbar-premium max-h-[280px] overflow-y-auto pr-1">
                        {properties.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedPropertyId('all')
                                    setIsOpen(false)
                                }}
                                className={cn(
                                    "group flex w-full items-center gap-2.5 rounded-xl p-2 px-2.5 transition-colors mb-1 cursor-pointer text-left",
                                    selectedPropertyId === 'all' 
                                        ? "bg-primary/10 text-primary font-bold border border-primary/20" 
                                        : "hover:bg-muted/60 text-foreground"
                                )}
                            >
                                <div className={cn(
                                    "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                                    selectedPropertyId === 'all' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
                                )}>
                                    <LayoutGrid className="size-4" />
                                </div>
                                <div className="flex flex-1 flex-col items-start overflow-hidden">
                                    <span className="text-xs font-bold tracking-tight">All Properties</span>
                                </div>
                                {selectedPropertyId === 'all' && (
                                    <Check className="size-3.5 text-primary shrink-0" />
                                )}
                            </button>
                        )}

                        <div className="px-2.5 py-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Your Properties</p>
                        </div>

                        <div className="space-y-0.5">
                            {filteredProperties.length === 0 ? (
                                <div className="p-6 text-center">
                                    <p className="text-xs font-medium text-muted-foreground/60 italic">No properties found</p>
                                </div>
                            ) : (
                                filteredProperties.map((property) => (
                                    <button
                                        type="button"
                                        key={property.id}
                                        onClick={() => {
                                            setSelectedPropertyId(property.id)
                                            setIsOpen(false)
                                        }}
                                        className={cn(
                                            "group flex w-full items-center gap-2.5 rounded-xl p-2 px-2.5 transition-colors cursor-pointer text-left",
                                            selectedPropertyId === property.id 
                                                ? "bg-primary/10 text-primary font-bold border border-primary/20" 
                                                : "hover:bg-muted/60 text-foreground"
                                        )}
                                    >
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-muted/60 text-muted-foreground">
                                            {property.image ? (
                                                <div className="relative size-full">
                                                    <Image
                                                        src={property.image}
                                                        alt={property.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <Building2 className="size-4" />
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col items-start overflow-hidden min-w-0">
                                            <span className="truncate text-xs font-semibold text-foreground group-hover:text-foreground">
                                                {property.name}
                                            </span>
                                        </div>
                                        {selectedPropertyId === property.id && (
                                            <Check className="size-3.5 text-primary shrink-0" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="mt-2 pt-2 border-t border-border/60">
                            <Link
                                href="/landlord/properties/new"
                                onClick={() => setIsOpen(false)}
                                className="group flex w-full items-center gap-2.5 rounded-xl p-2 px-2.5 transition-colors text-primary hover:bg-primary/10 text-xs font-bold"
                            >
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:scale-105 transition-transform">
                                    <Plus className="size-3.5" />
                                </div>
                                <span className="truncate">Add New Property</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


