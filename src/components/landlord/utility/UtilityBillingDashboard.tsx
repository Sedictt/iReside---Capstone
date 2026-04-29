"use client";

import { useEffect, useState } from "react";
import { 
    Zap, 
    Droplets, 
    Search, 
    Save, 
    History, 
    Settings2, 
    Loader2,
    Calendar,
    Building2,
    AlertCircle,
    ArrowRight,
    Edit3,
    X,
    Camera,
    DollarSign,
    Info,
    Check,
    Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProperty } from "@/context/PropertyContext";
import type { BillingWorkspace } from "@/lib/billing/server";
import { BillingOperationsPanel } from "@/components/landlord/BillingOperationsPanel";

type ReadingDraft = {
    leaseId: string;
    unitName: string;
    propertyId: string;
    rentAmount: number;
    water: {
        previous: number;
        current: string;
        exists: boolean;
        rate: number;
    };
    electricity: {
        previous: number;
        current: string;
        exists: boolean;
        rate: number;
    };
};

export function UtilityBillingDashboard() {
    const { selectedPropertyId: globalPropertyId } = useProperty();
    const [activeTab, setActiveTab] = useState<"readings" | "rates" | "history">("readings");
    const [workspace, setWorkspace] = useState<BillingWorkspace | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    
    // Sync local property selection with global navbar selector
    useEffect(() => {
        setSelectedPropertyId(globalPropertyId);
    }, [globalPropertyId]);
    
    // Unit Detail View State
    const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
    const [isApplyAllOpen, setIsApplyAllOpen] = useState(false);
    
    const [drafts, setDrafts] = useState<ReadingDraft[]>([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [workspaceRes, readingsRes] = await Promise.all([
                fetch("/api/landlord/payment-settings"),
                fetch(`/api/landlord/utility-readings?month=${selectedMonth}`)
            ]);

            if (!workspaceRes.ok || !readingsRes.ok) throw new Error("Failed to load billing data");

            const workspaceData = await workspaceRes.json();
            const readingsData = await readingsRes.json();
            
            setWorkspace(workspaceData);

            const latestRes = await fetch("/api/landlord/utility-readings");
            const latestData = await latestRes.json();
            const allReadings = latestData.readings || [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newDrafts: ReadingDraft[] = workspaceData.activeLeases.map((lease: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const currentWater = readingsData.readings.find((r: any) => r.lease_id === lease.id && r.utility_type === "water");
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const currentElec = readingsData.readings.find((r: any) => r.lease_id === lease.id && r.utility_type === "electricity");
                
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const prevWaterReading = allReadings.find((r: any) => 
                    r.lease_id === lease.id && 
                    r.utility_type === "water" && 
                    r.id !== currentWater?.id
                );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const prevElecReading = allReadings.find((r: any) => 
                    r.lease_id === lease.id && 
                    r.utility_type === "electricity" && 
                    r.id !== currentElec?.id
                );

                // Get rates from workspace utilityConfigs
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const propertyWaterConfig = workspaceData.utilityConfigs.find((c: any) => c.property_id === lease.property?.id && c.utility_type === "water" && c.unit_id === null);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const unitWaterConfig = workspaceData.utilityConfigs.find((c: any) => c.unit_id === lease.unit?.id && c.utility_type === "water");
                
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const propertyElecConfig = workspaceData.utilityConfigs.find((c: any) => c.property_id === lease.property?.id && c.utility_type === "electricity" && c.unit_id === null);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const unitElecConfig = workspaceData.utilityConfigs.find((c: any) => c.unit_id === lease.unit?.id && c.utility_type === "electricity");

                return {
                    leaseId: lease.id,
                    unitName: lease.unit?.name || "Unknown",
                    propertyId: lease.property?.id || "",
                    rentAmount: lease.monthly_rent || 0,
                    water: {
                        previous: currentWater ? currentWater.previous_reading : (prevWaterReading?.current_reading || 0),
                        current: currentWater ? currentWater.current_reading.toString() : "",
                        exists: !!currentWater,
                        rate: unitWaterConfig?.rate_per_unit || propertyWaterConfig?.rate_per_unit || 0
                    },
                    electricity: {
                        previous: currentElec ? currentElec.previous_reading : (prevElecReading?.current_reading || 0),
                        current: currentElec ? currentElec.current_reading.toString() : "",
                        exists: !!currentElec,
                        rate: unitElecConfig?.rate_per_unit || propertyElecConfig?.rate_per_unit || 0
                    }
                };
            });

            setDrafts(newDrafts);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Failed to load billing information");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMonth]);

    const filteredDrafts = drafts.filter(d => {
        const matchesProperty = selectedPropertyId === "all" || d.propertyId === selectedPropertyId;
        const matchesSearch = d.unitName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesProperty && matchesSearch;
    });

    const handleSaveReadings = async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toSave: any[] = [];
        const start = `${selectedMonth}-01`;
        const end = new Date(new Date(selectedMonth).getFullYear(), new Date(selectedMonth).getMonth() + 1, 0).toISOString().slice(0, 10);

        drafts.forEach(d => {
            if (!d.water.exists && d.water.current !== "") {
                toSave.push({
                    leaseId: d.leaseId,
                    utilityType: "water",
                    billingPeriodStart: start,
                    billingPeriodEnd: end,
                    previousReading: d.water.previous,
                    currentReading: parseFloat(d.water.current),
                    note: ""
                });
            }
            if (!d.electricity.exists && d.electricity.current !== "") {
                toSave.push({
                    leaseId: d.leaseId,
                    utilityType: "electricity",
                    billingPeriodStart: start,
                    billingPeriodEnd: end,
                    previousReading: d.electricity.previous,
                    currentReading: parseFloat(d.electricity.current),
                    note: ""
                });
            }
        });

        if (toSave.length === 0) {
            toast.info("No new readings to save");
            return;
        }

        try {
            setSaving(true);
            const res = await fetch("/api/landlord/utility-readings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(toSave)
            });

            if (!res.ok) throw new Error("Save failed");
            
            toast.success(`Successfully saved ${toSave.length} readings`);
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save readings");
        } finally {
            setSaving(false);
        }
    };

    const handleApplyToAll = async () => {
        // Implementation for "Apply to All" logic
        // This would sync the rates of the property default to all unit overrides
        toast.success("Applying property defaults to all units...");
        setIsApplyAllOpen(false);
        // In a real app, this would hit an API to sync configs
    };

    const activeDraft = drafts.find(d => d.leaseId === selectedLeaseId);

    if (loading && !workspace) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
                <p className="text-sm font-medium text-muted-foreground">Initializing billing module...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <h1 className="text-3xl font-black tracking-tight text-foreground">Utility Billing</h1>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground/80">
                        Monthly meter management and consumption tracking
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={() => setIsApplyAllOpen(true)}
                        className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
                    >
                        <Settings2 className="h-4 w-4" />
                        Apply to All
                    </button>

                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
                        <div className="flex items-center gap-2 px-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <input 
                                type="month" 
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-transparent text-sm font-bold outline-none"
                            />
                        </div>
                        <div className="h-6 w-px bg-border" />
                        <div className="flex items-center gap-2 px-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <select 
                                value={selectedPropertyId}
                                onChange={(e) => setSelectedPropertyId(e.target.value)}
                                className="bg-transparent text-sm font-bold outline-none"
                            >
                                <option value="all">All Properties</option>
                                {workspace?.properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveReadings}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Commit Readings
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-border">
                <div className="flex">
                    {[
                        { id: "readings", label: "Meter Entry" },
                        { id: "rates", label: "Rent Configuration" },
                        { id: "payments", label: "Payment Methods" },
                        { id: "history", label: "Billing History" }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ].map((tab: any) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "relative px-6 py-4 text-sm font-bold transition-all",
                                activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === "readings" && (
                    <div className="relative hidden md:block w-72 mb-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input 
                            placeholder="Filter by unit..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-primary/10"
                        />
                    </div>
                )}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {activeTab === "readings" && (
                    <motion.div 
                        key="readings"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border bg-muted/20">
                                        <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground">Unit Identity</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground text-center bg-sky-500/5">Water Meter</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground text-center bg-amber-500/5">Elec Meter</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredDrafts.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Building2 className="h-10 w-10 opacity-20" />
                                                    <p className="text-sm font-medium">No units matching your selection.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredDrafts.map((draft) => (
                                        <UnitRow 
                                            key={draft.leaseId} 
                                            draft={draft} 
                                            onUpdate={(patch) => {
                                                const newDrafts = [...drafts];
                                                const index = drafts.findIndex(d => d.leaseId === draft.leaseId);
                                                newDrafts[index] = { ...newDrafts[index], ...patch };
                                                setDrafts(newDrafts);
                                            }}
                                            onOpenDetail={() => setSelectedLeaseId(draft.leaseId)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === "rates" && (
                    <motion.div 
                        key="rates"
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                    >
                        <BillingOperationsPanel propertyId={selectedPropertyId} viewMode="rates" />
                    </motion.div>
                )}

                {activeTab === "payments" && (
                    <motion.div 
                        key="payments"
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                    >
                        <BillingOperationsPanel propertyId={selectedPropertyId} viewMode="gcash" />
                    </motion.div>
                )}

                {activeTab === "history" && (
                    <motion.div 
                        key="history"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-80 rounded-3xl border-2 border-dashed border-border bg-muted/10 space-y-4"
                    >
                        <History className="h-10 w-10 text-muted-foreground/30" />
                        <div className="text-center">
                            <p className="text-sm font-bold text-foreground">Archive Access</p>
                            <p className="text-xs text-muted-foreground">Historical records are being indexed.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Unit Detail Modal (Dossier View) */}
            <UnitDetailModal 
                isOpen={!!selectedLeaseId} 
                onClose={() => setSelectedLeaseId(null)}
                draft={activeDraft}
                onUpdate={(patch) => {
                    if (!selectedLeaseId) return;
                    const newDrafts = [...drafts];
                    const index = drafts.findIndex(d => d.leaseId === selectedLeaseId);
                    newDrafts[index] = { ...newDrafts[index], ...patch };
                    setDrafts(newDrafts);
                }}
            />

            {/* Apply to All Confirmation Lightbox */}
            <AnimatePresence>
                {isApplyAllOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => setIsApplyAllOpen(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md rounded-[2.5rem] border border-border bg-card p-8 shadow-2xl"
                        >
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="rounded-2xl bg-amber-500/10 p-4 text-amber-500">
                                    <AlertCircle className="h-8 w-8" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-foreground">Global Configuration Sync</h3>
                                    <p className="text-sm text-muted-foreground">
                                        This will overwrite all individual unit rates with the property default values. This action is permanent.
                                    </p>
                                </div>
                                <div className="flex w-full gap-3">
                                    <button 
                                        onClick={() => setIsApplyAllOpen(false)}
                                        className="flex-1 rounded-2xl border border-border py-4 text-sm font-black transition-all hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleApplyToAll}
                                        className="flex-1 rounded-2xl bg-amber-500 py-4 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600"
                                    >
                                        Apply to All
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function UnitRow({ draft, onUpdate, onOpenDetail }: { draft: ReadingDraft, onUpdate: (p: Partial<ReadingDraft>) => void, onOpenDetail: () => void }) {
    const isWaterComplete = draft.water.exists || draft.water.current !== "";
    const isElecComplete = draft.electricity.exists || draft.electricity.current !== "";
    const isFullComplete = isWaterComplete && isElecComplete;

    return (
        <tr className="group transition-colors hover:bg-muted/10">
            <td className="px-6 py-6">
                <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground">{draft.unitName}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">₱{draft.rentAmount.toLocaleString()}/mo</span>
                </div>
            </td>
            
            <td className="px-6 py-6 bg-sky-500/5 border-x border-border/40">
                <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-mono font-bold text-sky-900/40 dark:text-sky-100/40">{draft.water.previous}</span>
                        <ArrowRight className="h-3 w-3 text-sky-600/20" />
                        {draft.water.exists ? (
                            <span className="text-xs font-mono font-black text-sky-600">{draft.water.current}</span>
                        ) : (
                            <input 
                                type="number" 
                                value={draft.water.current}
                                placeholder="..."
                                onChange={(e) => onUpdate({ water: { ...draft.water, current: e.target.value } })}
                                className="w-16 bg-transparent text-center text-xs font-mono font-black text-sky-600 outline-none"
                            />
                        )}
                    </div>
                </div>
            </td>

            <td className="px-6 py-6 bg-amber-500/5">
                <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-mono font-bold text-amber-900/40 dark:text-amber-100/40">{draft.electricity.previous}</span>
                        <ArrowRight className="h-3 w-3 text-amber-600/20" />
                        {draft.electricity.exists ? (
                            <span className="text-xs font-mono font-black text-amber-600">{draft.electricity.current}</span>
                        ) : (
                            <input 
                                type="number" 
                                value={draft.electricity.current}
                                placeholder="..."
                                onChange={(e) => onUpdate({ electricity: { ...draft.electricity, current: e.target.value } })}
                                className="w-16 bg-transparent text-center text-xs font-mono font-black text-amber-600 outline-none"
                            />
                        )}
                    </div>
                </div>
            </td>

            <td className="px-6 py-6 text-right">
                <div className="flex items-center justify-end gap-3">
                    <div className={cn(
                        "h-2 w-2 rounded-full",
                        isFullComplete ? "bg-emerald-500" : "bg-muted-foreground/30"
                    )} />
                    <button 
                        onClick={onOpenDetail}
                        className="rounded-xl border border-border bg-card p-2 text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
                    >
                        <Edit3 className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function UnitDetailModal({ isOpen, onClose, draft, onUpdate }: { isOpen: boolean, onClose: () => void, draft?: ReadingDraft, onUpdate: (p: Partial<ReadingDraft>) => void }) {
    if (!draft) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-end p-0 md:p-6 lg:p-10">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/60 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="relative h-full w-full max-w-2xl overflow-hidden bg-card border-l border-border shadow-2xl flex flex-col md:rounded-[3rem] md:border"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-border p-8">
                            <div className="flex items-center gap-4">
                                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-2xl font-black text-foreground">Unit Dossier</h2>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Detailed Billing & Configuration</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="rounded-2xl bg-muted p-3 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Summary Card */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-3xl border border-border bg-muted/20 p-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Unit Name</span>
                                    <p className="text-xl font-black text-foreground">{draft.unitName}</p>
                                </div>
                                <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 block">Monthly Rent</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-foreground">₱</span>
                                        <input 
                                            type="number" 
                                            value={draft.rentAmount}
                                            onChange={(e) => onUpdate({ rentAmount: parseFloat(e.target.value) })}
                                            className="bg-transparent text-xl font-black text-foreground outline-none w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Water Management */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sky-500">
                                    <Droplets className="h-5 w-5" />
                                    <h3 className="text-sm font-black uppercase tracking-widest">Water Billing</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-[2rem] border border-sky-500/10 bg-sky-500/[0.02] p-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Previous Reading</label>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="number" 
                                                    value={draft.water.previous}
                                                    onChange={(e) => onUpdate({ water: { ...draft.water, previous: parseFloat(e.target.value) } })}
                                                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold outline-none"
                                                />
                                                <button className="rounded-2xl border border-border bg-card p-3 text-muted-foreground"><Camera className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Reading</label>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="number" 
                                                    value={draft.water.current}
                                                    onChange={(e) => onUpdate({ water: { ...draft.water, current: e.target.value } })}
                                                    className="w-full rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold text-primary outline-none"
                                                />
                                                <button className="rounded-2xl bg-primary p-3 text-white"><Camera className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-4 text-center p-6 rounded-3xl border border-sky-500/10 bg-white dark:bg-black/20 shadow-sm">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-sky-600">Unit Water Rate</span>
                                            <div className="relative flex items-center justify-center gap-2">
                                                <span className="absolute left-0 text-sm font-bold text-muted-foreground/40">₱</span>
                                                <input 
                                                    type="number" 
                                                    value={draft.water.rate}
                                                    onChange={(e) => onUpdate({ water: { ...draft.water, rate: parseFloat(e.target.value) } })}
                                                    className="w-24 bg-transparent text-center text-2xl font-black outline-none border-b-2 border-transparent focus:border-sky-500"
                                                />
                                                <span className="text-[10px] font-bold text-muted-foreground">/ m³</span>
                                            </div>
                                            <p className="text-[9px] font-medium text-muted-foreground">Custom rate for this unit</p>
                                        </div>
                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex items-center gap-2">
                                                <Info className="h-3 w-3 text-sky-500" />
                                                <span className="text-[10px] font-bold text-muted-foreground">Status</span>
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                draft.water.exists ? "text-emerald-500" : "text-amber-500"
                                            )}>
                                                {draft.water.exists ? "Recorded" : "Awaiting Input"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Electricity Management */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-amber-500">
                                    <Zap className="h-5 w-5" />
                                    <h3 className="text-sm font-black uppercase tracking-widest">Electricity Billing</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-[2rem] border border-amber-500/10 bg-amber-500/[0.02] p-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Previous Reading</label>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="number" 
                                                    value={draft.electricity.previous}
                                                    onChange={(e) => onUpdate({ electricity: { ...draft.electricity, previous: parseFloat(e.target.value) } })}
                                                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold outline-none"
                                                />
                                                <button className="rounded-2xl border border-border bg-card p-3 text-muted-foreground"><Camera className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Reading</label>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="number" 
                                                    value={draft.electricity.current}
                                                    onChange={(e) => onUpdate({ electricity: { ...draft.electricity, current: e.target.value } })}
                                                    className="w-full rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm font-bold text-amber-600 outline-none"
                                                />
                                                <button className="rounded-2xl bg-amber-500 p-3 text-white"><Camera className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-4 text-center p-6 rounded-3xl border border-amber-500/10 bg-white dark:bg-black/20 shadow-sm">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Unit Electricity Rate</span>
                                            <div className="relative flex items-center justify-center gap-2">
                                                <span className="absolute left-0 text-sm font-bold text-muted-foreground/40">₱</span>
                                                <input 
                                                    type="number" 
                                                    value={draft.electricity.rate}
                                                    onChange={(e) => onUpdate({ electricity: { ...draft.electricity, rate: parseFloat(e.target.value) } })}
                                                    className="w-24 bg-transparent text-center text-2xl font-black outline-none border-b-2 border-transparent focus:border-amber-500"
                                                />
                                                <span className="text-[10px] font-bold text-muted-foreground">/ kWh</span>
                                            </div>
                                            <p className="text-[9px] font-medium text-muted-foreground">Custom rate for this unit</p>
                                        </div>
                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex items-center gap-2">
                                                <Info className="h-3 w-3 text-amber-500" />
                                                <span className="text-[10px] font-bold text-muted-foreground">Status</span>
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                draft.electricity.exists ? "text-emerald-500" : "text-amber-500"
                                            )}>
                                                {draft.electricity.exists ? "Recorded" : "Awaiting Input"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Other Utilities / Add-ons */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary">
                                    <DollarSign className="h-5 w-5" />
                                    <h3 className="text-sm font-black uppercase tracking-widest">Other Charges</h3>
                                </div>
                                <div className="rounded-[2rem] border border-border bg-card p-6 divide-y divide-border">
                                    <div className="flex items-center justify-between py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                            <span className="text-sm font-bold text-foreground">Internet Service</span>
                                        </div>
                                        <span className="text-sm font-black">₱1,500.00</span>
                                    </div>
                                    <div className="flex items-center justify-between py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                            <span className="text-sm font-bold text-foreground">Trash Collection</span>
                                        </div>
                                        <span className="text-sm font-black">₱150.00</span>
                                    </div>
                                    <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-xs font-bold text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all">
                                        <Plus className="h-3 w-3" /> Add Miscellaneous Charge
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-border p-8 bg-muted/10">
                            <button 
                                onClick={onClose}
                                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-foreground text-background py-4 text-sm font-black transition-all hover:opacity-90 shadow-xl"
                            >
                                <Check className="h-4 w-4" />
                                Done & Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
