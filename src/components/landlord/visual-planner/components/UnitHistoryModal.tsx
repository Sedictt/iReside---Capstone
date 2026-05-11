import React, { useState } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { useTheme } from "next-themes";
import { X, CheckCircle2, Clock, Wrench } from "lucide-react";
import { Unit } from "../types";

interface UnitHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    unit: Unit | null;
}

export const UnitHistoryModal = ({
    isOpen,
    onClose,
    unit
}: UnitHistoryModalProps) => {
    const [activeTab, setActiveTab] = useState<"tenants" | "maintenance">("tenants");
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    if (!unit) return null;

    // Mock data for history
    const tenantHistory = [
        { id: '1', name: 'James Wilson', leaseStart: '2025-01-01', leaseEnd: '2026-01-01', rent: 1200, status: 'Completed', avatarBg: 'bg-indigo-500' },
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
                        className="relative w-full max-w-2xl h-[600px] flex flex-col rounded-3xl border border-border bg-card shadow-[0_24px_60px_-30px_rgba(0,0,0,0.3)] overflow-hidden"
                    >
                        <div className="absolute right-6 top-6 z-10">
                            <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-muted text-muted-foreground">
                                <X className="size-6" />
                            </button>
                        </div>

                        <div className="p-8 pb-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <span className="material-icons-round text-2xl">history</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                        Unit {unit.name} History
                                    </h2>
                                    <p className="text-sm font-medium text-muted-foreground">Full audit trail and historical logs</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 mb-4">
                            <div className="flex gap-2 p-1.5 rounded-2xl bg-muted w-fit">
                                <button 
                                    onClick={() => setActiveTab("tenants")}
                                    className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "tenants" ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Tenant History
                                </button>
                                <button 
                                    onClick={() => setActiveTab("maintenance")}
                                    className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "maintenance" ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Maintenance
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                            {activeTab === "tenants" ? (
                                <div className="space-y-4">
                                    {tenantHistory.map((item) => (
                                        <div key={item.id} className="p-4 rounded-2xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-10 rounded-full ${item.avatarBg} flex items-center justify-center text-white font-bold`}>
                                                        {item.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">{item.leaseStart} to {item.leaseEnd}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                                <span className="text-xs text-muted-foreground">Monthly Rent</span>
                                                <span className="font-mono font-bold text-primary">Ã¢â€šÂ±{item.rent.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {maintenanceHistory.map((item) => (
                                        <div key={item.id} className="p-4 rounded-2xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Wrench className="size-4 text-primary" />
                                                    <p className="font-semibold">{item.title}</p>
                                                </div>
                                                <span className="text-xs font-mono text-muted-foreground">{item.date}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                                            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500`}>
                                                    {item.status}
                                                </span>
                                                <span className="font-mono font-bold">Ã¢â€šÂ±{item.cost.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
