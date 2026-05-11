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
                    "group flex h-12 items-center rounded-2xl border border-white/10 bg-card/40 transition-all hover:bg-card/60 hover:ring-1 hover:ring-primary/20",
                    isCollapsed ? "w-12 justify-center px-0" : "w-full gap-3 px-4 overflow-hidden",
                    isOpen && "bg-card/80 ring-1 ring-primary/40"
                )}
                title={isCollapsed ? (selectedPropertyId === 'all' ? 'All Properties' : selectedProperty?.name) : undefined}
            >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {selectedPropertyId === 'all' ? (
                        <LayoutGrid className="size-4.5" />
                    ) : (
                        <Building2 className="size-4.5" />
                    )}
                </div>
                
                {!isCollapsed && (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                            {selectedPropertyId === 'all' ? 'All Properties' : (selectedProperty?.name || 'Loading...')}
                        </span>
                        <ChevronDown className={cn(
                            "size-4 text-muted-foreground transition-transform duration-300",
                            isOpen && "rotate-180"
                        )} />
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full z-[200] mt-2 w-72 overflow-hidden rounded-[2rem] border border-white/10 bg-card/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                    <div className="relative mb-2 px-2 pt-2">
                        <Search className="absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                        <input
                            type="text"
                            placeholder="Search properties..."
                            className="h-10 w-full rounded-xl border border-white/5 bg-white/5 pl-10 pr-4 text-xs font-medium focus:border-primary/20 focus:outline-none focus:ring-1 focus:ring-primary/20"
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
                                        "group flex w-full items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/5",
                                        selectedPropertyId === 'all' && "bg-primary/5"
                                    )}
                                >
                                    <div className={cn(
                                        "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                                        selectedPropertyId === 'all' ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground/60 group-hover:text-foreground"
                                    )}>
                                        <LayoutGrid className="size-5" />
                                    </div>
                                    <div className="flex flex-1 flex-col items-start overflow-hidden">
                                        <span className="text-sm font-semibold text-foreground">All Properties</span>
                                        <span className="text-[10px] font-medium text-muted-foreground/60">See every property together</span>
                                    </div>
                                    {selectedPropertyId === 'all' && (
                                        <Check className="size-4 text-primary" />
                                    )}
                                </button>

                                <div className="my-2 h-px bg-white/5" />
                            </>
                        )}

                        <div className="px-2 py-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40">Your Properties</p>
                        </div>

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
                                        "group flex w-full items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/5",
                                        selectedPropertyId === property.id && "bg-primary/5"
                                    )}
                                >
                                    <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-white/10">
                                        {property.image ? (
                                            <Image src={property.image} alt={property.name} fill sizes="40px" className="object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-white/5 text-muted-foreground/40">
                                                <Building2 className="size-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col items-start overflow-hidden">
                                        <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {property.name}
                                        </span>
                                        <span className="truncate text-[10px] font-medium text-muted-foreground/60">
                                            {property.address}
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
            )}
        </div>
    )
}


