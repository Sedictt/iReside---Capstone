"use client";

import { useProperty } from "@/context/PropertyContext";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { 
    Building2, 
    MapPin, 
    Users, 
    ArrowRight, 
    Search, 
    ChevronRight,
    Home,
    MessageSquare,
    ShieldCheck,
    SearchX,
    LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PropertySelectorHubProps {
    title?: string;
    description?: string;
    buttonText?: string;
    icon?: React.ReactNode;
    badgeText?: string;
}

export function PropertySelectorHub({
    title = "Community Hub",
    description = "Access the exclusive community hub for this property. Manage resident interactions, announcements, and feedback.",
    buttonText = "Enter Community Hub",
    icon = <LayoutGrid className="size-6" />,
    badgeText = "Property Feed"
}: PropertySelectorHubProps) {
    const { properties, setSelectedPropertyId, loading } = useProperty();
    const [searchQuery, setSearchQuery] = useState("");
    const [activePropertyIndex, setActivePropertyIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);

    const filteredProperties = useMemo(() => {
        return properties.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [properties, searchQuery]);

    const activeProperty = filteredProperties[activePropertyIndex] || null;

    useGSAP(() => {
        if (activeProperty) {
            // Animate stage elements when property changes
            gsap.fromTo(".property-stage-content", 
                { opacity: 0, x: 20 },
                { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
            );
            
            gsap.fromTo(".property-background-image",
                { scale: 1.1, opacity: 0 },
                { scale: 1, opacity: 0.3, duration: 1.2, ease: "expo.out" }
            );
        }
    }, [activeProperty?.id]);

    if (loading && properties.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-16 animate-pulse rounded-2xl bg-primary/20 flex items-center justify-center">
                        <ShieldCheck className="size-8 text-primary" />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing Portfolio</p>
                </div>
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
                <div className="mb-8 flex size-24 items-center justify-center rounded-[2rem] border border-white/5 bg-card/40 shadow-2xl backdrop-blur-xl">
                    <Building2 className="size-10 text-primary" />
                </div>
                <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">No properties detected</h1>
                <p className="mb-10 max-w-md text-sm font-medium text-muted-foreground/80 leading-relaxed">
                    The Community Hub requires a specific property context. Please register a property to begin managing its residents and discussions.
                </p>
                <Link 
                    href="/landlord/properties"
                    className="group flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-all hover:scale-[1.02] active:scale-95"
                >
                    Initialize First Property
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative flex h-screen w-full flex-col overflow-hidden bg-[#0a0a0a] text-foreground md:flex-row">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                {activeProperty?.image && (
                    <img 
                        key={activeProperty.id}
                        src={activeProperty.image} 
                        alt="" 
                        className="property-background-image absolute inset-0 h-full w-full object-cover opacity-20 blur-md grayscale transition-all duration-1000"
                    />
                )}
                <div className="absolute inset-0 bg-[#0a0a0a]/80" />
            </div>

            {/* Sidebar / List View */}
            <aside className="relative z-20 flex w-full flex-col border-b border-white/5 bg-card/40 backdrop-blur-2xl md:w-[420px] md:border-b-0 md:border-r">
                <div className="flex flex-col gap-6 p-8">
                    <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            {icon}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Portfolio Selection</p>
                        </div>
                    </div>

                    <div className="group relative">
                        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40 transition-colors group-focus-within:text-primary" />
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setActivePropertyIndex(0);
                            }}
                            placeholder="Find property..."
                            className="h-12 w-full rounded-2xl border border-white/5 bg-white/5 pl-12 pr-4 text-sm font-bold text-foreground placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                    </div>
                </div>

                <div className="custom-scrollbar-premium flex-1 overflow-y-auto px-4 pb-8">
                    <div className="space-y-2">
                        {filteredProperties.map((property, idx) => (
                            <button
                                key={property.id}
                                onClick={() => setActivePropertyIndex(idx)}
                                className={cn(
                                    "group relative flex w-full items-center gap-4 rounded-[1.25rem] p-4 transition-all duration-300",
                                    activePropertyIndex === idx 
                                        ? "bg-primary/10 ring-1 ring-primary/20" 
                                        : "hover:bg-white/5"
                                )}
                            >
                                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
                                    {property.image ? (
                                        <img src={property.image} className="h-full w-full object-cover" alt="" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                                            <Building2 className="size-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col items-start text-left">
                                    <span className={cn(
                                        "truncate text-sm font-semibold transition-colors",
                                        activePropertyIndex === idx ? "text-primary" : "text-foreground/90 group-hover:text-foreground"
                                    )}>
                                        {property.name}
                                    </span>
                                    <span className="truncate text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">
                                        {property.address}
                                    </span>
                                </div>
                                <ChevronRight className={cn(
                                    "size-4 text-muted-foreground/20 transition-all",
                                    activePropertyIndex === idx ? "text-primary opacity-100" : "group-hover:translate-x-1 group-hover:opacity-100"
                                )} />
                            </button>
                        ))}

                        {filteredProperties.length === 0 && (
                            <div className="py-12 text-center">
                                <SearchX className="mx-auto size-10 text-muted-foreground/20" />
                                <p className="mt-4 text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">No matches found</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-white/5 p-6">
                    <Link href="/landlord/dashboard" className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors hover:text-foreground">
                        Exit Selection
                    </Link>
                </div>
            </aside>

            {/* Main Stage */}
            <main ref={stageRef} className="relative z-10 flex flex-1 items-center justify-center p-6 md:p-12 lg:p-20">
                <AnimatePresence mode="wait">
                    {activeProperty && (
                        <motion.div 
                            key={activeProperty.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="relative w-full max-w-4xl"
                        >
                            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-card/60 p-1 shadow-2xl backdrop-blur-3xl">
                                <div className="grid lg:grid-cols-[1fr_360px]">
                                    {/* Preview Side */}
                                    <div className="relative hidden h-[500px] overflow-hidden rounded-[2.25rem] lg:block">
                                        {activeProperty.image ? (
                                            <img 
                                                src={activeProperty.image} 
                                                className="h-full w-full object-cover" 
                                                alt={activeProperty.name} 
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                                                <Building2 className="size-20 text-white/10" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                        
                                        <div className="absolute bottom-8 left-8 right-8">
                                            <div className="flex items-center gap-4 text-white">
                                                <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                                                    <MapPin className="size-6" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Verified Location</span>
                                                    <span className="text-sm font-bold tracking-tight">{activeProperty.address}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Side */}
                                    <div className="flex flex-col p-10">
                                        <div className="mb-auto">
                                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                                                <MessageSquare className="size-3" />
                                                {badgeText}
                                            </div>
                                            <h1 className="property-stage-content text-4xl font-semibold tracking-tight text-foreground">
                                                {activeProperty.name}
                                            </h1>
                                            <p className="property-stage-content mt-4 text-sm font-medium text-muted-foreground/80 leading-relaxed">
                                                {description}
                                            </p>

                                            <div className="mt-8 grid grid-cols-2 gap-4">
                                                <div className="property-stage-content flex flex-col gap-1 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Units</span>
                                                    <div className="flex items-center gap-2">
                                                        <Home className="size-4 text-primary" />
                                                        <span className="text-lg font-semibold">{activeProperty.units?.length || 0}</span>
                                                    </div>
                                                </div>
                                                <div className="property-stage-content flex flex-col gap-1 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Residents</span>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="size-4 text-emerald-400" />
                                                        <span className="text-lg font-semibold">
                                                            {activeProperty.units?.filter(u => u.status === 'occupied').length || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="property-stage-content mt-12">
                                            <button 
                                                onClick={() => setSelectedPropertyId(activeProperty.id)}
                                                className="group flex w-full items-center justify-between rounded-2xl bg-primary p-5 text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                                            >
                                                {buttonText}
                                                <div className="flex size-8 items-center justify-center rounded-xl bg-white/20 transition-transform group-hover:translate-x-1">
                                                    <ArrowRight className="size-5" />
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
