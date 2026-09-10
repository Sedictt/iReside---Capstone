"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    X,
    TrendingUp,
    Building2,
    Users,
    Wrench,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    ReceiptText,
    ExternalLink,
    Compass
} from "lucide-react";

interface IrisDeepInsightsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBackToSummary?: () => void;
    stats: {
        primaryKpis: any[];
        extendedKpis: any[];
        operationalSnapshot: any;
        financialChart: any;
    };
    analysis?: {
        summary: string;
        goodThings: string[];
        toLookOutFor: string[];
    } | null;
    landlordFirstName?: string | null;
}

export function IrisDeepInsightsModal({
    isOpen,
    onClose,
    onBackToSummary,
    stats,
    analysis,
    landlordFirstName,
}: IrisDeepInsightsModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Keyboard Escape to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Extract metrics safely
    const metrics = useMemo(() => {
        const primary = Array.isArray(stats?.primaryKpis) ? stats.primaryKpis : [];
        const extended = Array.isArray(stats?.extendedKpis) ? stats.extendedKpis : [];
        const combined = [...primary, ...extended];

        const findKpi = (query: string) =>
            combined.find(
                (kpi) =>
                    typeof kpi?.title === "string" &&
                    kpi.title.toLowerCase().includes(query.toLowerCase())
            );

        const earningsKpi = findKpi("earning");
        const occupancyKpi = findKpi("occupancy");
        const tenantsKpi = findKpi("tenant");
        const pendingKpi = findKpi("pending");
        const collectionKpi = findKpi("collection");
        const maintenanceKpi = findKpi("maintenance");
        const turnoverKpi = findKpi("turnover");
        const efficiencyKpi = findKpi("resolution") || findKpi("speed");

        // Parse operational snapshot metrics
        const snapshotMetrics = Array.isArray(stats?.operationalSnapshot?.metrics)
            ? stats.operationalSnapshot.metrics
            : [];

        const findSnapshotMetric = (query: string) =>
            snapshotMetrics.find(
                (m: any) =>
                    typeof m?.label === "string" &&
                    m.label.toLowerCase().includes(query.toLowerCase())
            );

        const occupiedMetric = findSnapshotMetric("occupied");
        const urgentMetric = findSnapshotMetric("urgent");
        const renewalsMetric = findSnapshotMetric("renewals");
        const outstandingMetric = findSnapshotMetric("outstanding");

        const earningsValue = earningsKpi?.value || "₱0";
        const occupancyValue = occupancyKpi?.value || "0%";
        const tenantsCount = tenantsKpi?.value || "0";
        const pendingIssuesCount = pendingKpi?.value || "0";
        const collectionRate = collectionKpi?.value || "100%";
        const maintenanceCost = maintenanceKpi?.value || "₱0";
        const turnoverRate = turnoverKpi?.value || "0%";
        const resolutionSpeed = efficiencyKpi?.value || "1-2 Days";

        const parseNum = (val: string) => {
            const parsed = parseFloat(val.replace(/[^0-9.-]/g, ""));
            return isNaN(parsed) ? 0 : parsed;
        };

        const numericOccupancy = parseNum(occupancyValue);
        const numericPending = parseNum(pendingIssuesCount);
        const numericCollection = parseNum(collectionRate);

        return {
            earningsValue,
            occupancyValue,
            tenantsCount,
            pendingIssuesCount,
            collectionRate,
            maintenanceCost,
            turnoverRate,
            resolutionSpeed,
            numericOccupancy,
            numericPending,
            numericCollection,
            occupiedUnits: occupiedMetric?.value || `${tenantsCount} occupied`,
            urgentIssues: urgentMetric?.value || pendingIssuesCount,
            renewalsSoon: renewalsMetric?.value || "0",
            outstandingRent: outstandingMetric?.value || "₱0",
        };
    }, [stats]);

    const firstName = landlordFirstName?.trim() || "Landlord";

    if (!mounted || typeof window === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 overflow-hidden">
                    {/* Fullscreen Dimmed Backdrop (Covers entire screen edge-to-edge, dimmed only, no blur) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/85"
                        onClick={onClose}
                    />

                    {/* Dialog Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative z-10 w-full max-w-4xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col rounded-[2.5rem] border border-white/10 bg-card text-foreground shadow-2xl overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="deep-insights-title"
                    >
                        {/* Background subtle radial highlight without heavy filter blur */}
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 size-96 rounded-full bg-primary/5 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 size-96 rounded-full bg-emerald-500/5 pointer-events-none" />

                        {/* Top Navigation & Header */}
                        <div className="relative z-10 shrink-0 border-b border-white/10 px-6 sm:px-8 py-5 flex items-center justify-between gap-4 bg-card">
                            <div className="flex items-center gap-3">
                                {onBackToSummary && (
                                    <button
                                        type="button"
                                        onClick={onBackToSummary}
                                        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors pr-2 border-r border-white/10"
                                        aria-label="Back to quick summary"
                                    >
                                        <ArrowLeft className="size-4" />
                                        <span className="hidden sm:inline">Overview</span>
                                    </button>
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-primary" />
                                        <h2 id="deep-insights-title" className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                            Deep Portfolio Insights
                                        </h2>
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                        Actionable operational breakdown and forward guidance for {firstName}.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-2xl p-2.5 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all active:scale-95"
                                aria-label="Close modal"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="relative z-10 flex-1 min-h-0 p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar-premium">
                            {/* Summary Banner if available */}
                            {analysis?.summary && (
                                <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 relative overflow-hidden">
                                    <div className="flex items-start gap-4">
                                        <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <Compass className="size-5 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-primary">Executive Summary</h3>
                                            <p className="text-sm font-semibold leading-relaxed text-foreground/90">
                                                {analysis.summary}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 4 Health Pillars Scorecard */}
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 mb-4 flex items-center gap-2">
                                    <span>Core Operational Pillars</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Pillar 1: Cash Flow */}
                                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] dark:bg-card/40 p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Cash Flow</span>
                                            <TrendingUp className="size-4 text-emerald-400" />
                                        </div>
                                        <div className="text-xl font-black text-foreground">{metrics.earningsValue}</div>
                                        <div className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                                            <span>Collection:</span>
                                            <span className="font-bold text-foreground">{metrics.collectionRate}</span>
                                        </div>
                                    </div>

                                    {/* Pillar 2: Occupancy */}
                                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] dark:bg-card/40 p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Occupancy</span>
                                            <Building2 className="size-4 text-sky-400" />
                                        </div>
                                        <div className="text-xl font-black text-foreground">{metrics.occupancyValue}</div>
                                        <div className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                                            <span>Units Occupied:</span>
                                            <span className="font-bold text-foreground">{metrics.occupiedUnits}</span>
                                        </div>
                                    </div>

                                    {/* Pillar 3: Residents */}
                                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] dark:bg-card/40 p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Tenants</span>
                                            <Users className="size-4 text-indigo-400" />
                                        </div>
                                        <div className="text-xl font-black text-foreground">{metrics.tenantsCount}</div>
                                        <div className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                                            <span>Renewals Soon:</span>
                                            <span className="font-bold text-foreground">{metrics.renewalsSoon}</span>
                                        </div>
                                    </div>

                                    {/* Pillar 4: Operations */}
                                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] dark:bg-card/40 p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Maintenance</span>
                                            <Wrench className="size-4 text-amber-400" />
                                        </div>
                                        <div className="text-xl font-black text-foreground">{metrics.pendingIssuesCount} Open</div>
                                        <div className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                                            <span>Avg Speed:</span>
                                            <span className="font-bold text-foreground">{metrics.resolutionSpeed}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Analytical Breakdown */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                                    <span>Strategic Portfolio Diagnosis</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Financial Health */}
                                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] dark:bg-card/40 p-6 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                                <TrendingUp className="size-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-foreground">Revenue & Collections</h4>
                                                <p className="text-[10px] font-medium text-muted-foreground">Invoicing health & payment flow</p>
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                                            {metrics.numericCollection >= 90
                                                ? `Collection efficiency is strong at ${metrics.collectionRate}. Inflows remain stable, supporting routine maintenance and operating margins.`
                                                : `Collection rate is currently at ${metrics.collectionRate}. Prioritize following up on outstanding balances to maintain predictable cash reserves.`}
                                        </p>
                                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Outstanding Balance:</span>
                                            <span className="font-black text-foreground">{metrics.outstandingRent}</span>
                                        </div>
                                    </div>

                                    {/* Occupancy Optimization */}
                                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] dark:bg-card/40 p-6 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                                                <Building2 className="size-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-foreground">Occupancy & Retention</h4>
                                                <p className="text-[10px] font-medium text-muted-foreground">Unit fill rate and lease lifecycle</p>
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                                            {metrics.numericOccupancy >= 85
                                                ? `Occupancy is optimal at ${metrics.occupancyValue}. Focus on tenant satisfaction and proactively discussing lease extensions for upcoming renewals.`
                                                : `Occupancy stands at ${metrics.occupancyValue}. Filling vacant units will unlock additional monthly revenue and lower per-unit operating costs.`}
                                        </p>
                                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Upcoming Renewals:</span>
                                            <span className="font-black text-foreground">{metrics.renewalsSoon} within 30 days</span>
                                        </div>
                                    </div>

                                    {/* Maintenance & Facility */}
                                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] dark:bg-card/40 p-6 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                                                <Wrench className="size-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-foreground">Facility & Maintenance</h4>
                                                <p className="text-[10px] font-medium text-muted-foreground">Ticket resolution and property upkeep</p>
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                                            {metrics.numericPending === 0
                                                ? `Zero pending maintenance issues recorded. Quick resolution prevents minor issues from escalating into costly repairs.`
                                                : `There are ${metrics.pendingIssuesCount} pending maintenance items. Resolving these quickly directly boosts tenant retention and keeps turnover low.`}
                                        </p>
                                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Recent Maintenance Spend:</span>
                                            <span className="font-black text-foreground">{metrics.maintenanceCost}</span>
                                        </div>
                                    </div>

                                    {/* Key Observations */}
                                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] dark:bg-card/40 p-6 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <ReceiptText className="size-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-foreground">Key Observations</h4>
                                                <p className="text-[10px] font-medium text-muted-foreground">What to keep doing and what to address</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 pt-1">
                                            {analysis?.goodThings && analysis.goodThings.length > 0 && (
                                                <div className="flex items-start gap-2 text-xs font-medium text-emerald-400/90">
                                                    <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
                                                    <span>{analysis.goodThings[0]}</span>
                                                </div>
                                            )}
                                            {analysis?.toLookOutFor && analysis.toLookOutFor.length > 0 && (
                                                <div className="flex items-start gap-2 text-xs font-medium text-amber-400/90">
                                                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                                                    <span>{analysis.toLookOutFor[0]}</span>
                                                </div>
                                            )}
                                            {(!analysis?.goodThings || analysis.goodThings.length === 0) && (
                                                <p className="text-xs text-muted-foreground">
                                                    Data snapshot is synchronized. Refresh analytics to get up-to-the-minute evaluation.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actionable Next Moves */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">
                                        Recommended Next Moves
                                    </h3>
                                    <Link
                                        href="/landlord/dashboard"
                                        onClick={onClose}
                                        className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                                    >
                                        <span>Command Center</span>
                                        <ExternalLink className="size-3" />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Link
                                        href="/landlord/invoices?tab=invoices&status=overdue"
                                        onClick={onClose}
                                        className="rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-primary/5 hover:border-primary/20 p-4 transition-all group flex flex-col justify-between"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                                                Review Invoices & Dues
                                            </p>
                                            <p className="text-[10px] font-medium text-muted-foreground">
                                                Check overdue payments, send reminders, or record incoming rent.
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary">
                                            <span>Open Invoices</span>
                                            <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>

                                    <Link
                                        href="/landlord/properties"
                                        onClick={onClose}
                                        className="rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-primary/5 hover:border-primary/20 p-4 transition-all group flex flex-col justify-between"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                                                Manage Units & Listings
                                            </p>
                                            <p className="text-[10px] font-medium text-muted-foreground">
                                                Optimize occupancy, review vacancies, and adjust unit pricing.
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary">
                                            <span>Open Properties</span>
                                            <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>

                                    <Link
                                        href="/landlord/invoices?tab=expenses"
                                        onClick={onClose}
                                        className="rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-primary/5 hover:border-primary/20 p-4 transition-all group flex flex-col justify-between"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                                                Log Expenses & Repairs
                                            </p>
                                            <p className="text-[10px] font-medium text-muted-foreground">
                                                Track ongoing property maintenance costs and preventive upkeep.
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary">
                                            <span>Open Expenses</span>
                                            <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="relative z-10 shrink-0 border-t border-white/10 px-6 sm:px-8 py-4 bg-card flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                iReside Portfolio Intelligence
                            </span>
                            <div className="flex items-center gap-3">
                                {onBackToSummary && (
                                    <button
                                        type="button"
                                        onClick={onBackToSummary}
                                        className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                                    >
                                        Overview
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl bg-primary px-5 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
