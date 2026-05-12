"use client";

import React, { useState } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { useTheme } from "next-themes";
import { X } from "lucide-react";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { Unit } from "../types";

interface UnitHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    unit: Unit | null;
}

export function UnitHistoryModal({
    isOpen,
    onClose,
    unit
}: UnitHistoryModalProps) {
    const [activeTab, setActiveTab] = useState<"tenants" | "maintenance">("tenants");
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    if (!unit) return null;

    // Mock data for history
    const tenantHistory = [
        { id: '1', name: 'James Wilson', leaseStart: '2025-01-01', leaseEnd: '2026-01-01', rent: 1200, status: 'Completed', avatarBg: 'bg-primary' },
        { id: '2', name: 'Elena Rodriguez', leaseStart: '2024-01-01', leaseEnd: '2025-01-01', rent: 1150, status: 'Completed', avatarBg: 'bg-emerald-500' },
        { id: '3', name: 'Marcus Chen', leaseStart: '2023-01-01', leaseEnd: '2024-01-01', rent: 1100, status: 'Terminated Early', avatarBg: 'bg-rose-500' },
    ];

    const maintenanceHistory = [
        { id: 'm1', title: 'AC Filter Replacement', date: '2026-02-15', status: 'Completed', cost: 45, description: 'Routine filter change and system cleaning.' },
        { id: 'm2', title: 'Leaky Faucet Repair', date: '2025-11-20', status: 'Completed', cost: 80, description: 'Kitchen sink faucet replacement due to persistent drip.' },
        { id: 'm3', title: 'Wall Repainting', date: '2025-01-05', status: 'Completed', cost: 350, description: 'Full room repainting before new tenant move-in.' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/60 backdrop-blur-md" 
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full max-w-2xl h-[600px] flex flex-col rounded-3xl border border-border bg-card shadow-[0_24px_60px_-30px_rgba(0,0,0,0.3)] overflow-hidden`}
                    >
                        <div className="absolute right-6 top-6 z-10">
                            <button onClick={onClose} className={`rounded-full p-2 transition-colors hover:bg-muted text-muted-foreground`}>
                                <X className="size-6" />
                            </button>
                        </div>

                        <div className="p-8 pb-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <span className="material-icons-round text-2xl">history</span>
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-bold tracking-tight text-foreground`}>
                                        Unit {unit.name} History
                                    </h2>
                                    <p className={`text-sm font-medium text-muted-foreground`}>Full audit trail and historical logs</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 mb-4">
                            <div className="flex gap-2 p-1.5 rounded-2xl bg-muted w-fit">
                                <button 
                                    onClick={() => setActiveTab("tenants")}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "tenants" ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Tenants
                                </button>
                                <button 
                                    onClick={() => setActiveTab("maintenance")}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "maintenance" ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Maintenance
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar-premium">
                            <div className="space-y-4">
                                {activeTab === "tenants" ? (
                                    tenantHistory.map((item) => (
                                        <div key={item.id} className={`flex items-center gap-4 p-5 rounded-2xl border border-border bg-muted/30 transition-colors hover:bg-muted/50`}>
                                            <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold ${item.avatarBg}`}>
                                                {item.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-sm font-bold text-foreground`}>{item.name}</p>
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                                                        item.status === 'Completed' 
                                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-bold text-muted-foreground mt-1">
                                                    <ClientOnlyDate date={item.leaseStart} /> &mdash; <ClientOnlyDate date={item.leaseEnd} />
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xs font-bold text-foreground`}>₱{item.rent.toLocaleString()}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground">Monthly Rent</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    maintenanceHistory.map((item) => (
                                        <div key={item.id} className={`flex items-center gap-4 p-5 rounded-2xl border border-border bg-muted/30 transition-colors hover:bg-muted/50`}>
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                <span className="material-icons-round text-xl">engineering</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-sm font-bold text-foreground`}>{item.title}</p>
                                                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-bold text-muted-foreground mt-1"><ClientOnlyDate date={item.date} /> &bull; {item.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xs font-bold text-foreground`}>₱{item.cost.toLocaleString()}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground">Cost</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="p-8 border-t border-border bg-muted/20">
                            <button 
                                onClick={onClose}
                                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/20"
                            >
                                Close History View
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
