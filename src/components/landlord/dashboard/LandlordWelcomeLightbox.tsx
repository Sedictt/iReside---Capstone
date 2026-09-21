"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Building2, ArrowRight, Grid, Wallet, ShieldCheck } from "lucide-react";
import { useProperty } from "@/context/PropertyContext";
import { cn } from "@/lib/utils";

export function LandlordWelcomeLightbox() {
    const router = useRouter();
    const pathname = usePathname();
    const { properties, loading } = useProperty();
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Only display when client mounted, property loading is complete, landlord has zero properties,
    // and the user is NOT actively on the property creation wizard page
    const isVisible = hasMounted && !loading && properties.length === 0 && pathname !== "/landlord/properties/new";

    if (!isVisible) return null;

    const handleCreateProperty = () => {
        router.push("/landlord/properties/new");
    };

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="property-setup-lightbox-title"
        >
            {/* Dimmed Non-Dismissible Background */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto" />

            {/* Unskippable Property Setup Lightbox Modal */}
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
                    <Building2 className="size-7" />
                </div>

                {/* Headings */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                            First Step Required
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Mandatory Setup
                        </span>
                    </div>
                    <h1 id="property-setup-lightbox-title" className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
                        Set Up Your First Property
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Welcome to iReside. To start configuring units, recording payments, and inviting tenants, you must register your primary property into the system.
                    </p>
                </div>

                {/* Features / Steps Overview */}
                <div className="space-y-2.5 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 border border-primary/20">
                            <Grid className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-foreground">
                                1. Architecture & Units
                            </h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Define building floors, total units count, and automated room numbering schemes.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 border border-primary/20">
                            <Wallet className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-foreground">
                                2. Rental Pricing & Utilities
                            </h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Set default monthly rent rates, security deposit rules, and utility billing allocations.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 border border-primary/20">
                            <ShieldCheck className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-foreground">
                                3. Governance & Lease Rules
                            </h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Add house rules and select whether to auto-generate standard lease agreements.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mandatory CTA Action */}
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={handleCreateProperty}
                        className="group relative w-full flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-6 py-4 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-105 active:scale-98 cursor-pointer"
                    >
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider relative z-10">
                            Create Property Now
                        </span>
                        <ArrowRight className="size-4 relative z-10 transition-transform group-hover:translate-x-1" />
                    </button>
                    <p className="mt-3 text-center text-[10px] font-medium text-muted-foreground/70">
                        This step cannot be skipped. All operations require an active property profile.
                    </p>
                </div>
            </div>
        </div>
    );
}
