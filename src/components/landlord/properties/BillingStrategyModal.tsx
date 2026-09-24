"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    X,
    Check,
    Wallet,
    Gauge,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface BillingStrategyOption {
    id: string;
    label: string;
    summary: string;
    invoicing: string;
    meterLogging: string;
    bestFor: string;
    advantage: string;
    tip: string;
    icon: React.ComponentType<{ className?: string }>;
}

export const BILLING_STRATEGY_OPTIONS: BillingStrategyOption[] = [
    {
        id: "fixed_charge",
        label: "Bundled Utilities",
        summary: "Water and electricity are included directly in the rent. Tenants pay a flat monthly rate with no meter readings.",
        invoicing: "Single flat rent invoice without utility line items",
        meterLogging: "No meter reading or sub-meter logging required",
        bestFor: "High-end rentals, units without sub-meters, and hassle-free flat rate leases",
        advantage: "Zero monthly admin effort; tenants have 100% predictable expenses",
        tip: "Best if your units do not have separate sub-meters installed.",
        icon: Wallet
    },
    {
        id: "individual_meter",
        label: "Metered Consumption",
        summary: "Tenants pay strictly for their monthly water and electricity consumption based on sub-meter readings.",
        invoicing: "Itemized invoice: Base Rent + Electricity (kWh) + Water (m³)",
        meterLogging: "Requires recording sub-meter readings each billing cycle",
        bestFor: "Apartments, condos, and rooms with dedicated sub-meters and air conditioning",
        advantage: "Fair pay-per-use billing that prevents landlords from absorbing high utility spikes",
        tip: "Best if units have individual sub-meters and you want fair, usage-based billing.",
        icon: Gauge
    },
    {
        id: "equal_per_head",
        label: "Hybrid Strategy",
        summary: "Combines a fixed base rent with shared utility expenses divided equally or proportionally among tenants.",
        invoicing: "Base rent plus itemized shared common-area or master-meter utility share",
        meterLogging: "Only the master meter or shared expense total is recorded",
        bestFor: "Dormitories, student housing, and co-living with shared kitchens or common amenities",
        advantage: "Fairly recovers common-area electricity and water without needing sub-meters for every room",
        tip: "Best for communal properties where multiple tenants share facilities under one master meter.",
        icon: Users
    }
];

export interface BillingStrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedStrategy: string;
    onSelectStrategy?: (strategyId: string) => void;
    initialStrategyId?: string;
}

export function BillingStrategyModal({
    isOpen,
    onClose,
    selectedStrategy,
    onSelectStrategy,
    initialStrategyId
}: BillingStrategyModalProps) {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("fixed_charge");

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialStrategyId || selectedStrategy || "fixed_charge");
        }
    }, [isOpen, initialStrategyId, selectedStrategy]);

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

    const currentOption = BILLING_STRATEGY_OPTIONS.find((s) => s.id === activeTab) || BILLING_STRATEGY_OPTIONS[0];
    const isCurrentSelected = selectedStrategy === currentOption.id;
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
                        aria-labelledby="billing-strategy-guide-title"
                        className="relative z-10 w-full max-w-2xl rounded-3xl bg-card text-card-foreground border border-border/80 shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 border-b border-border/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                        <Wallet className="size-5" />
                                    </div>
                                    <div>
                                        <h3
                                            id="billing-strategy-guide-title"
                                            className="text-lg font-bold text-foreground tracking-tight"
                                        >
                                            Utility Billing Strategies
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Choose how water and electricity are billed to your residents.
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
                                {BILLING_STRATEGY_OPTIONS.map((opt) => {
                                    const isActive = opt.id === activeTab;
                                    const isChosen = opt.id === selectedStrategy;

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
                                        Tenant Invoicing
                                    </span>
                                    <p className="text-xs font-medium text-foreground">
                                        {currentOption.invoicing}
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Meter Logging
                                    </span>
                                    <p className="text-xs font-medium text-foreground">
                                        {currentOption.meterLogging}
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

                                <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Key Advantage
                                    </span>
                                    <p className="text-xs font-medium text-foreground leading-relaxed">
                                        {currentOption.advantage}
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
                                {onSelectStrategy && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelectStrategy(currentOption.id);
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
