"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, m as motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import { useLanguageContext } from "@/context/LanguageContext";
import { LandlordHistoryPanel, type HistoryTabId } from "./LandlordHistoryPanel";

export function openLandlordHistoryDrawer(tab: HistoryTabId = "payments") {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("open-landlord-history-drawer", { detail: { tab } }));
}

export function QuickHistoryDrawer() {
    const { t } = useLanguageContext();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<HistoryTabId>("payments");

    useEffect(() => {
        const handleOpen = (e: Event) => {
            const custom = e as CustomEvent<{ tab?: HistoryTabId }>;
            if (custom.detail?.tab === "actions" || custom.detail?.tab === "payments") {
                setActiveTab(custom.detail.tab);
            }
            setIsOpen(true);
        };
        window.addEventListener("open-landlord-history-drawer", handleOpen);
        return () => window.removeEventListener("open-landlord-history-drawer", handleOpen);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end" role="dialog" aria-modal="true" aria-label={t("Payment & Actions History")}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50"
                    />

                    {/* Drawer / Bottom Sheet */}
                    <motion.div
                        initial={{ opacity: 0, x: 40, y: 20 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: 40, y: 20 }}
                        transition={{ type: "spring", stiffness: 360, damping: 32 }}
                        className="relative z-10 flex w-full max-h-[90vh] sm:max-h-full sm:h-full sm:max-w-2xl flex-col rounded-t-3xl sm:rounded-none sm:rounded-l-3xl border-t sm:border-t-0 sm:border-l border-border bg-background shadow-2xl overflow-hidden"
                    >
                        {/* Mobile drag indicator */}
                        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
                            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-4 sm:px-6 shrink-0">
                            <h2 className="text-lg font-bold text-foreground truncate">
                                {t("Payment & Actions History")}
                            </h2>

                            <div className="flex items-center gap-2 shrink-0">
                                <Link
                                    href={`/landlord/activity?tab=${activeTab}`}
                                    onClick={() => setIsOpen(false)}
                                    className="inline-flex items-center gap-1.5 rounded-xl neumorphic-extruded px-3.5 py-2 text-xs font-bold text-foreground hover:text-primary transition-colors min-h-[44px]"
                                >
                                    <span className="hidden sm:inline">{t("Full Page")}</span>
                                    <ExternalLink className="size-3.5" />
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    aria-label={t("Close history drawer")}
                                    className="flex size-11 items-center justify-center rounded-xl neumorphic-extruded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto overscroll-y-contain p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
                            <LandlordHistoryPanel
                                mode="drawer"
                                initialTab={activeTab}
                                onTabChange={setActiveTab}
                                onNavigate={() => setIsOpen(false)}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
