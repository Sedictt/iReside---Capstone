"use client";

import Image from "next/image";
import Link from "next/link";
import { m as motion } from "framer-motion";
import { ArrowRight, Building2, Home, MapPin, Megaphone, Sparkles } from "lucide-react";
import { useProperty } from "@/context/PropertyContext";

export function CommunityPropertyGate() {
    const { properties, setSelectedPropertyId, loading } = useProperty();

    if (loading && properties.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-background to-emerald-100/40 px-6 text-foreground dark:from-[#06070b] dark:via-[#0d1118] dark:to-[#08221a]">
                <div className="rounded-3xl border border-border/60 bg-card/80 px-8 py-6 text-center shadow-xl backdrop-blur">
                    <p className="text-sm font-medium text-muted-foreground">Loading your properties...</p>
                </div>
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-background to-emerald-100/40 px-6 text-foreground dark:from-[#06070b] dark:via-[#0d1118] dark:to-[#08221a]">
                <div className="w-full max-w-xl rounded-3xl border border-border/60 bg-card/85 p-8 shadow-2xl backdrop-blur">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Building2 className="size-3.5" />
                        Community Hub
                    </div>
                    <h1 className="text-3xl font-display text-foreground">Set up a property first</h1>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Community Hub opens per property so residents only see posts from their own community.
                    </p>
                    <Link
                        href="/landlord/properties"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                    >
                        Go to Properties
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-background to-emerald-100/40 text-foreground dark:from-[#06070b] dark:via-[#0d1118] dark:to-[#08221a]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -left-24 size-72 rounded-full bg-emerald-500/20 blur-3xl dark:bg-emerald-400/20" />
                <div className="absolute top-24 right-0 size-80 rounded-full bg-sky-500/20 blur-3xl dark:bg-sky-400/20" />
                <div className="absolute bottom-0 left-1/3 size-72 rounded-full bg-primary/20 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-12 lg:px-10 lg:py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="mb-10 max-w-3xl"
                >
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
                        <Sparkles className="size-3.5 text-emerald-500" />
                        Choose a Property
                    </div>
                    <h1 className="text-4xl font-display leading-tight text-foreground md:text-6xl">
                        Pick the community you want to manage
                    </h1>
                    <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                        To protect privacy, Community Hub opens one property at a time. Select any property below to continue.
                    </p>
                </motion.div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {properties.map((property, index) => {
                        const occupiedUnits = property.units.filter((unit) => unit.status?.toLowerCase() === "occupied").length;
                        const unitCount = property.units.length;

                        return (
                            <motion.button
                                key={property.id}
                                type="button"
                                initial={{ opacity: 0, y: 28 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: Math.min(index * 0.08, 0.32) }}
                                onClick={() => setSelectedPropertyId(property.id)}
                                className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 text-left shadow-[0_18px_50px_-20px_rgba(16,24,40,0.55)] backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_-24px_rgba(16,24,40,0.7)] dark:border-white/10 dark:bg-white/[0.03]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/12 via-transparent to-sky-500/10 opacity-80 transition-opacity group-hover:opacity-100" />
                                <div className="relative h-40 overflow-hidden">
                                    {property.image ? (
                                        <Image
                                                src={property.image}
                                                alt={property.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-500/20 via-sky-500/10 to-primary/20">
                                            <Building2 className="size-10 text-emerald-700/70 dark:text-emerald-200/80" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent dark:from-[#0b1117]/95" />
                                    <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur">
                                        <Megaphone className="size-3.5" />
                                        Community
                                    </div>
                                </div>

                                <div className="relative space-y-4 p-5">
                                    <div>
                                        <h2 className="line-clamp-1 text-xl font-display text-foreground">{property.name}</h2>
                                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <MapPin className="size-3.5" />
                                            <span className="line-clamp-1">{property.address || "Address unavailable"}</span>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Units</p>
                                            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-foreground">
                                                <Home className="size-3.5 text-emerald-500" />
                                                {unitCount}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Occupied</p>
                                            <p className="mt-1 text-sm font-semibold text-foreground">{occupiedUnits}</p>
                                        </div>
                                    </div>

                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform duration-300 group-hover:translate-x-1">
                                        Open this property
                                        <ArrowRight className="size-4" />
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

