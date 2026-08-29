'use client'

import Image from 'next/image'
import { useProperty } from '@/context/PropertyContext'
import { cn } from '@/lib/utils'
import { 
    ChevronDown, 
    Building2, 
    Check, 
    LayoutGrid,
    Search
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function PropertySelector({ isCollapsed = false }: { isCollapsed?: boolean }) {
    const { properties, selectedPropertyId, setSelectedPropertyId, selectedProperty, loading } = useProperty()
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredProperties = properties.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading && properties.length === 0) {
        return (
            <div className="h-12 w-48 animate-pulse rounded-2xl bg-white/5" />
        )
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "group flex h-14 items-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/40",
                    isCollapsed 
                        ? "size-11 justify-center rounded-xl mx-auto neumorphic-extruded" 
                        : "w-full gap-3 px-4 rounded-2xl neumorphic-extruded hover:scale-[1.02]",
                    isOpen && !isCollapsed && "neumorphic-inset"
                )}
                title={isCollapsed ? (selectedPropertyId === 'all' ? 'All Properties' : selectedProperty?.name) : undefined}
            >
                <div className={cn(
                    "flex shrink-0 items-center justify-center rounded-xl transition-all",
                    isCollapsed ? "size-7" : "size-10",
                    isOpen ? "neumorphic-inset-card" : "neumorphic-inset-card"
                )}>
                    {selectedPropertyId === 'all' ? (
                        <LayoutGrid className={cn(isCollapsed ? "size-4" : "size-5")} />
                    ) : (
                        <Building2 className={cn(isCollapsed ? "size-4" : "size-5")} />
                    )}
                </div>
                
                {!isCollapsed && (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate text-[11px] font-black uppercase tracking-widest text-foreground">
                            {selectedPropertyId === 'all' 
                                ? 'All Properties' 
                                : (selectedProperty?.name || (loading ? 'Loading…' : (properties.length > 0 ? properties[0].name : 'Select Property')))}
                        </span>
                        <ChevronDown className={cn(
                            "size-4 text-muted-foreground transition-transform duration-300 ml-auto",
                            isOpen && "rotate-180"
                        )} />
                    </div>
                )}
            </button>

            {isOpen && (
                <div className={cn(
                    "absolute z-[200] mt-3 overflow-hidden rounded-[2.5rem] neumorphic-panel p-2 animate-in fade-in zoom-in-95 duration-200 origin-top-left",
                    isCollapsed ? "left-full top-0 ml-4 w-72" : "left-0 right-0 top-full w-full"
                )}>
                    <div className="relative mb-2 px-2 pt-2">
                        <Search className="absolute left-6 top-1/2 mt-1 size-4 -translate-y-1/2 text-muted-foreground/40" />
                        <input
                            type="text"
                            placeholder="Search properties…"
                            className="h-11 w-full rounded-2xl border-none text-[11px] font-black uppercase tracking-wider pl-10 pr-4 focus:outline-none neumorphic-inset"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="custom-scrollbar-premium max-h-[320px] overflow-y-auto pr-1">
                        {properties.length > 1 && (
                            <>
                                <button
                                    onClick={() => {
                                        setSelectedPropertyId('all')
                                        setIsOpen(false)
                                    }}
                                    className={cn(
                                        "group flex w-full items-center gap-3 rounded-2xl p-3 px-4 transition-all mb-2",
                                        selectedPropertyId === 'all' ? "neumorphic-inset" : "neumorphic-extruded hover:scale-[1.01]"
                                    )}
                                >
                                    <div className={cn(
                                        "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                                        selectedPropertyId === 'all' ? "neumorphic-inset-card text-primary" : "neumorphic-inset-card text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        <LayoutGrid className="size-5" />
                                    </div>
                                    <div className="flex flex-1 flex-col items-start overflow-hidden">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-foreground">All Properties</span>
                                    </div>
                                    {selectedPropertyId === 'all' && (
                                        <Check className="size-4 text-primary" />
                                    )}
                                </button>
                            </>
                        )}

                        <div className="px-3 py-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Your Properties</p>
                        </div>

                        <div className="space-y-1.5 p-1">
                            {filteredProperties.length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className="text-xs font-medium text-muted-foreground/40 italic">No properties found</p>
                                </div>
                            ) : (
                                filteredProperties.map((property) => (
                                    <button
                                        key={property.id}
                                        onClick={() => {
                                            setSelectedPropertyId(property.id)
                                            setIsOpen(false)
                                        }}
                                        className={cn(
                                            "group flex w-full items-center gap-3 rounded-2xl p-3 px-4 transition-all",
                                            selectedPropertyId === property.id ? "neumorphic-inset" : "neumorphic-extruded hover:scale-[1.01]"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex size-10 shrink-0 items-center justify-center rounded-xl overflow-hidden",
                                            selectedPropertyId === property.id ? "neumorphic-inset-card" : "neumorphic-inset-card"
                                        )}>
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
                                                <Building2 className="size-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col items-start overflow-hidden">
                                            <span className="truncate text-[11px] font-black uppercase tracking-widest text-foreground">
                                                {property.name}
                                            </span>
                                        </div>
                                        {selectedPropertyId === property.id && (
                                            <Check className="size-4 text-primary" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


