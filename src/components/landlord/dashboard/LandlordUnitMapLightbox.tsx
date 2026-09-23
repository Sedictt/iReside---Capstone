"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Map, ArrowRight, Layers, Grid, ShieldCheck } from "lucide-react";
import { useProperty } from "@/context/PropertyContext";
import { cn } from "@/lib/utils";

export function LandlordUnitMapLightbox() {
    const router = useRouter();
    const pathname = usePathname();
    const { properties, loading, setSelectedPropertyId } = useProperty();
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const hasConfiguredMap = properties.some((p) => p.isMapSetupComplete);
    // Display when client mounted, properties loaded, at least 1 property exists, but no unit map configured,
    // and user is NOT already on the unit-map page or property creation wizard
    const isVisible =
        hasMounted &&
        !loading &&
        properties.length > 0 &&
        !hasConfiguredMap &&
        !pathname?.startsWith("/landlord/unit-map") &&
        pathname !== "/landlord/properties/new";

    if (!isVisible) return null;

    const unconfiguredProperty = properties.find((p) => !p.isMapSetupComplete) || properties[0];

    const handleConfigureUnitMap = () => {
        if (unconfiguredProperty) {
            setSelectedPropertyId(unconfiguredProperty.id);
        }
        router.push("/landlord/unit-map");
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unit-map-setup-lightbox-title"
        >
            {/* Dimmed Non-Dismissible Background */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto" />

            {/* Unskippable Unit Map Lightbox Modal */}
            <div
                className={cn(
                    "relative z-[201] w-full max-w-[540px] pointer-events-auto",
                    "rounded-[2.5rem] border border-border/80 bg-card/98 dark:bg-zinc-900/98 backdrop-blur-2xl shadow-2xl",
                    "p-7 sm:p-10",
                    "animate-in zoom-in-95 fade-in duration-400 space-y-6"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Icon */}
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                    <Map className="size-7" />
                </div>

                {/* Headings */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                            Step 2 of Onboarding
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Mandatory Setup
                        </span>
                    </div>
                    <h1 id="unit-map-setup-lightbox-title" className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
                        Configure Your Unit Map
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Your property <span className="font-bold text-foreground">"{unconfiguredProperty?.name || "Primary Property"}"</span> has been registered! Before you can invite residents, collect rent, or assign maintenance tickets, you must place your units on the floor plan.
                    </p>
                </div>

                {/* Features / Steps Overview */}
                <div className="space-y-2.5 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 border border-primary/20">
                            <Layers className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-foreground">
                                1. Floor Level Assignments
                            </h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Review unit distributions per floor or customize multi-story floor assignments.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 border border-primary/20">
                            <Grid className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-foreground">
                                2. Visual Blueprint Generation
                            </h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Generate your 2D interactive architectural blueprint with one-click automatic unit placement.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 border border-primary/20">
                            <ShieldCheck className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-foreground">
                                3. Full Workspace Unlocking
                            </h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Once your unit layout is saved, resident profiles, billing ledgers, and maintenance become fully active.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mandatory CTA Action */}
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={handleConfigureUnitMap}
                        className="group relative w-full flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-6 py-4 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-105 active:scale-98 cursor-pointer"
                    >
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider relative z-10">
                            Configure Unit Map Now
                        </span>
                        <ArrowRight className="size-4 relative z-10 transition-transform group-hover:translate-x-1" />
                    </button>
                    <p className="mt-3 text-center text-[10px] font-medium text-muted-foreground/70">
                        This step cannot be skipped. Units must be spatially configured to manage occupancy and leases.
                    </p>
                </div>
            </div>
        </div>
    );
}
