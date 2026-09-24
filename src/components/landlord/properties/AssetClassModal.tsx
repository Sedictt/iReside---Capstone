"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    X,
    Check,
    Building2,
    Home,
    Shield,
    Users,
    Clock,
    FileText,
    Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AssetClassOption {
    id: "apartment" | "dormitory" | "boarding_house";
    label: string;
    summary: string;
    leaseType: string;
    occupancy: string;
    rules: string;
    bestFor: string;
    tip: string;
    icon: React.ComponentType<{ className?: string }>;
}

export const ASSET_CLASS_OPTIONS: AssetClassOption[] = [
    {
        id: "apartment",
        label: "Apartment",
        summary: "Independent, self-contained residential units for private living with standard residential leases.",
        leaseType: "Entire private unit (Studio, 1BR, 2BR, etc.)",
        occupancy: "Up to 5 occupants per unit",
        rules: "No curfew, open guest policy, standard nighttime quiet hours",
        bestFor: "Apartment complexes, condominiums, townhouses, and private families or professionals",
        tip: "Best if tenants have their own private kitchen and bathroom, living with complete independence.",
        icon: Building2
    },
    {
        id: "dormitory",
        label: "Dormitory",
        summary: "Shared-room student or workforce accommodations with community governance and house rules.",
        leaseType: "Per-bed space or shared room lease",
        occupancy: "Up to 4 occupants per room",
        rules: "Enforceable nightly curfew, visitor cutoff hours, designated study quiet hours",
        bestFor: "Student housing, university dorms, vocational quarters, and company staff residences",
        tip: "Best if your property requires structured check-in curfews and visitor restrictions for community safety.",
        icon: Shield
    },
    {
        id: "boarding_house",
        label: "Boarding House",
        summary: "Private individual bedroom rentals within a shared house with communal living and kitchen spaces.",
        leaseType: "Individual private room rental",
        occupancy: "Up to 2 occupants per room",
        rules: "Flexible curfew, communal kitchen and shared common-room guidelines",
        bestFor: "Single-room rentals, transient lodgings, and budget-friendly co-living spaces",
        tip: "Best if tenants have private bedrooms but share common bathrooms, dining areas, or kitchens.",
        icon: Users
    }
];

export interface AssetClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedClass: string;
    onSelectClass?: (classId: "apartment" | "dormitory" | "boarding_house") => void;
    initialClassId?: string;
}

export function AssetClassModal({
    isOpen,
    onClose,
    selectedClass,
    onSelectClass,
    initialClassId
}: AssetClassModalProps) {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"apartment" | "dormitory" | "boarding_house">("apartment");

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const defaultId = (initialClassId || selectedClass || "apartment") as "apartment" | "dormitory" | "boarding_house";
            setActiveTab(defaultId);
        }
    }, [isOpen, initialClassId, selectedClass]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!mounted) return null;

    const currentOption = ASSET_CLASS_OPTIONS.find((c) => c.id === activeTab) || ASSET_CLASS_OPTIONS[0];
    const isCurrentSelected = selectedClass === currentOption.id;
    const IconComponent = currentOption.icon;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* Modal Window */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 8 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="asset-class-guide-title"
                        className="relative z-10 w-full max-w-2xl rounded-3xl bg-card text-card-foreground border border-border/80 shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 border-b border-border/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                        <Home className="size-5" />
                                    </div>
                                    <div>
                                        <h3
                                            id="asset-class-guide-title"
                                            className="text-lg font-bold text-foreground tracking-tight"
                                        >
                                            Property Types
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Compare how each property type sets up leases and building rules.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                                    aria-label="Close dialog"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Segmented Tab Navigation */}
                            <div className="grid grid-cols-3 gap-1.5 mt-4 p-1 rounded-xl bg-muted/50 border border-border/40">
                                {ASSET_CLASS_OPTIONS.map((opt) => {
                                    const isActive = opt.id === activeTab;
                                    const isChosen = opt.id === selectedClass;

                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setActiveTab(opt.id)}
                                            className={cn(
                                                "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                                isActive
                                                    ? "bg-card text-foreground shadow-sm font-bold border border-border/50"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                                            )}
                                        >
                                            <span className="truncate">{opt.label}</span>
                                            {isChosen && (
                                                <span className="size-1.5 rounded-full bg-primary shrink-0" title="Currently selected" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content Body - Clean & Scannable */}
                        <div className="p-6 space-y-5">
                            {/* Summary sentence */}
                            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/50">
                                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                    <IconComponent className="size-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-foreground leading-relaxed">
                                        {currentOption.summary}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                                        {currentOption.tip}
                                    </p>
                                </div>
                            </div>

                            {/* Key Attributes 2x2 Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Lease Structure
                                    </span>
                                    <p className="text-xs font-medium text-foreground">
                                        {currentOption.leaseType}
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Default Occupancy
                                    </span>
                                    <p className="text-xs font-medium text-foreground">
                                        {currentOption.occupancy}
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Curfew & House Rules
                                    </span>
                                    <p className="text-xs font-medium text-foreground">
                                        {currentOption.rules}
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Best Suited For
                                    </span>
                                    <p className="text-xs font-medium text-foreground leading-relaxed">
                                        {currentOption.bestFor}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                {isCurrentSelected ? (
                                    <>
                                        <div className="size-2 rounded-full bg-primary" />
                                        <span>Currently selected</span>
                                    </>
                                ) : (
                                    <span className="text-[11px]">Click Select to apply</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                                {onSelectClass && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelectClass(currentOption.id);
                                            onClose();
                                        }}
                                        disabled={isCurrentSelected}
                                        className={cn(
                                            "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                            isCurrentSelected
                                                ? "bg-primary/15 text-primary border border-primary/30 cursor-default"
                                                : "bg-primary text-black hover:opacity-90 active:scale-95"
                                        )}
                                    >
                                        {isCurrentSelected ? (
                                            <>
                                                <Check className="size-3.5" />
                                                <span>Selected</span>
                                            </>
                                        ) : (
                                            <span>Select {currentOption.label}</span>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
