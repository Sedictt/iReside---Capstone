"use client";

import { useEffect, useState, useCallback } from "react";
import { 
 Zap, 
 Droplets, 
 Search, 
 Save, 
 History, 
 Settings2, 
 Loader2,
 Building2,
 AlertCircle,
 Edit3,
 X,
 Camera,
 DollarSign,
 Check,
 ArrowUpRight,
 Trash2,
 BarChart3
} from "lucide-react";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProperty } from "@/context/PropertyContext";
import type { BillingWorkspace } from "@/lib/billing/server";
import { BillingOperationsPanel } from "@/components/landlord/BillingOperationsPanel";
import { OfflineStorage } from "@/lib/offline/offlineStorage";
import { mutationQueue } from "@/lib/offline/mutationQueue";

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

type ReadingSaveRequest = {
 leaseId: string;
 utilityType: string;
 billingPeriodStart: string;
 billingPeriodEnd: string;
 previousReading: number;
 currentReading: number;
 note: string;
};

export function UtilityBillingDashboard() {
 const { selectedPropertyId: globalPropertyId } = useProperty();
 const [activeTab, setActiveTab] = useState<"readings" | "rates" | "payments" | "history">("readings");
 const [workspace, setWorkspace] = useState<BillingWorkspace | null>(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
 const [selectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
 const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<string | null>(null);

 // History summary data per month
 type MonthSummary = { totalElec: number; totalWater: number; readingCount: number };
 const [historySummaries, setHistorySummaries] = useState<Record<string, MonthSummary>>({});
 const [historySummariesLoading, setHistorySummariesLoading] = useState(false);
 
 // Sync local property selection with global navbar selector
 useEffect(() => {
 setSelectedPropertyId(globalPropertyId);
 }, [globalPropertyId]);
 
 // Unit Detail View State
 const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
 const [isApplyAllOpen, setIsApplyAllOpen] = useState(false);
 
 const [drafts, setDrafts] = useState<ReadingDraft[]>([]);

 	const fetchData = useCallback(async () => {
		try {
			setLoading(true);

			// Attempt live fetch if online
			if (typeof navigator !== "undefined" && navigator.onLine) {
				const [workspaceRes, readingsRes] = await Promise.all([
					fetch("/api/landlord/payment-settings"),
					fetch(`/api/landlord/utility-readings?month=${selectedMonth}`)
				]);

				if (workspaceRes.ok && readingsRes.ok) {
					const workspaceData = await workspaceRes.json();
					const readingsData = await readingsRes.json();
					setWorkspace(workspaceData);

					const latestRes = await fetch("/api/landlord/utility-readings");
					const latestData = latestRes.ok ? await latestRes.json() : { readings: [] };
					const allReadings = latestData.readings || [];

					// Cache snapshots locally for offline use
					OfflineStorage.set("utility_workspace", workspaceData, null, "utility");
					OfflineStorage.set(`utility_readings_${selectedMonth}`, readingsData, null, "utility");
					OfflineStorage.set("utility_all_readings", latestData, null, "utility");

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const newDrafts: ReadingDraft[] = (workspaceData.activeLeases || []).map((lease: any) => {
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

						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const propertyWaterConfig = (workspaceData.utilityConfigs || []).find((c: any) => c.property_id === lease.property?.id && c.utility_type === "water" && c.unit_id === null);
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const unitWaterConfig = (workspaceData.utilityConfigs || []).find((c: any) => c.unit_id === lease.unit?.id && c.utility_type === "water");

						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const propertyElecConfig = (workspaceData.utilityConfigs || []).find((c: any) => c.property_id === lease.property?.id && c.utility_type === "electricity" && c.unit_id === null);
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const unitElecConfig = (workspaceData.utilityConfigs || []).find((c: any) => c.unit_id === lease.unit?.id && c.utility_type === "electricity");

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
					return;
				}
			}

			// Offline Fallback Hydration
			const cachedWorkspace = OfflineStorage.get<BillingWorkspace>("utility_workspace");
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const cachedReadings = OfflineStorage.get<any>(`utility_readings_${selectedMonth}`);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const cachedAllReadings = OfflineStorage.get<any>("utility_all_readings");

			if (cachedWorkspace?.data) {
				const workspaceData = cachedWorkspace.data;
				const readingsData = cachedReadings?.data || { readings: [] };
				const allReadings = cachedAllReadings?.data?.readings || [];

				setWorkspace(workspaceData);

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const newDrafts: ReadingDraft[] = (workspaceData.activeLeases || []).map((lease: any) => {
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

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const propertyWaterConfig = (workspaceData.utilityConfigs || []).find((c: any) => c.property_id === lease.property?.id && c.utility_type === "water" && c.unit_id === null);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const unitWaterConfig = (workspaceData.utilityConfigs || []).find((c: any) => c.unit_id === lease.unit?.id && c.utility_type === "water");

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const propertyElecConfig = (workspaceData.utilityConfigs || []).find((c: any) => c.property_id === lease.property?.id && c.utility_type === "electricity" && c.unit_id === null);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const unitElecConfig = (workspaceData.utilityConfigs || []).find((c: any) => c.unit_id === lease.unit?.id && c.utility_type === "electricity");

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
				toast.info("Offline Mode: Hydrated utility records and tariffs from local cache.");
			} else {
				toast.error("Failed to load billing information");
			}
		} catch (err) {
			console.error(err);
			// Fall back to cache on fetch error
			const cachedWorkspace = OfflineStorage.get<BillingWorkspace>("utility_workspace");
			if (cachedWorkspace?.data) {
				setWorkspace(cachedWorkspace.data);
				toast.info("Loaded cached utility workspace offline.");
			} else {
				toast.error("Failed to load billing information");
			}
		} finally {
			setLoading(false);
		}
	}, [selectedMonth]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Fetch history summaries when history tab is active
	useEffect(() => {
		if (activeTab !== "history") return;
		let alive = true;
		const fetchSummaries = async () => {
			setHistorySummariesLoading(true);
			const months: string[] = [];
			for (let i = 0; i < 9; i++) {
				const d = new Date();
				d.setDate(1);
				d.setMonth(d.getMonth() - i);
				months.push(d.toISOString().slice(0, 7));
			}
			const results: Record<string, MonthSummary> = {};
			await Promise.all(
				months.map(async (m) => {
					try {
						const res = await fetch(`/api/landlord/utility-readings?month=${m}`);
						if (!res.ok) return;
						const json = await res.json();
						const readings: { utility_type: string; previous_reading: number; current_reading: number }[] = json.readings || [];
						let totalElec = 0;
						let totalWater = 0;
						for (const r of readings) {
							const usage = r.current_reading - r.previous_reading;
							if (r.utility_type === "electricity") totalElec += usage;
							else if (r.utility_type === "water") totalWater += usage;
						}
						results[m] = { totalElec, totalWater, readingCount: readings.length };
					} catch {
						results[m] = { totalElec: 0, totalWater: 0, readingCount: 0 };
					}
				})
			);
			if (alive) {
				setHistorySummaries(results);
				setHistorySummariesLoading(false);
			}
		};
		fetchSummaries();
		return () => { alive = false; };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab]);

	const filteredDrafts = drafts.filter(d => {
		const matchesProperty = selectedPropertyId === "all" || d.propertyId === selectedPropertyId;
		const matchesSearch = d.unitName.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesProperty && matchesSearch;
	});

	const handleSaveReadings = async () => {
		const toSave: ReadingSaveRequest[] = [];
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

		// If offline, enqueue and save optimistically
		if (typeof navigator !== "undefined" && !navigator.onLine) {
			mutationQueue.enqueue(
				"SAVE_SUBMETER_READINGS",
				"/api/landlord/utility-readings",
				"POST",
				{ readings: toSave },
				`Recorded ${toSave.length} sub-meter readings offline`
			);

			// Mark drafts as locally saved
			setDrafts(prev => prev.map(d => ({
				...d,
				water: { ...d.water, exists: d.water.current !== "" ? true : d.water.exists },
				electricity: { ...d.electricity, exists: d.electricity.current !== "" ? true : d.electricity.exists },
			})));

			toast.success(`Saved ${toSave.length} readings locally! They will sync automatically when reconnected.`);
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
			console.warn("[UtilityBilling] Online save failed, enqueuing offline:", err);
			// Enqueue offline fallback
			mutationQueue.enqueue(
				"SAVE_SUBMETER_READINGS",
				"/api/landlord/utility-readings",
				"POST",
				{ readings: toSave },
				`Recorded ${toSave.length} sub-meter readings offline`
			);
			setDrafts(prev => prev.map(d => ({
				...d,
				water: { ...d.water, exists: d.water.current !== "" ? true : d.water.exists },
				electricity: { ...d.electricity, exists: d.electricity.current !== "" ? true : d.electricity.exists },
			})));
			toast.success(`Saved ${toSave.length} readings offline! Will sync upon reconnection.`);
		} finally {
			setSaving(false);
		}
	};

    const handleApplyToAll = async () => {
        toast.success("Applying property defaults to all units...");
        setIsApplyAllOpen(false);
    };

    const activeDraft = drafts.find(d => d.leaseId === selectedLeaseId);

    if (loading && !workspace) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
                <Loader2 className="size-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Loading utility data...</p>
            </div>
        );
    }

    return (
    <div className="flex flex-col space-y-6 pb-20 max-w-7xl mx-auto px-4 md:px-8">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                    Utility Billing
                </h1>
                <p className="text-sm font-medium text-neutral-400">
                    Centralized command for meter readings, billing strategies, and automated recovery.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {activeTab === "readings" && (
                    <button 
                        onClick={handleSaveReadings}
                        disabled={saving}
                        className="flex h-11 items-center gap-2 rounded-2xl bg-primary px-6 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Save All Readings
                    </button>
                )}
            </div>
        </div>

        {/* Unified Command Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border border-white/5 neumorphic-panel p-3 md:p-4 rounded-3xl backdrop-blur-xl xl:flex-row">
            {/* Segmented Pill Tabs */}
            <div className="flex items-center gap-1 rounded-2xl neumorphic-extruded p-1 w-full sm:w-auto overflow-x-auto">
                {[
                    { id: "readings", label: "Meter Readings", icon: Zap },
                    { id: "rates", label: "Billing Settings", icon: Settings2 },
                    { id: "payments", label: "GCash Payments", icon: DollarSign },
                    { id: "history", label: "History", icon: History }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                            activeTab === tab.id
                                ? "neumorphic-panel text-white ring-1 ring-border shadow-sm"
                                : "text-neutral-400 hover:neumorphic-inset hover:text-white"
                        )}
                    >
                        <tab.icon className={cn("size-3.5", activeTab === tab.id ? "text-primary" : "text-neutral-400")} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search & Cycle Info */}
            <div className="flex w-full items-center gap-3 xl:w-auto">
                {activeTab === "readings" && (
                    <div className="relative flex-1 xl:w-72">
                        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                        <input 
                            placeholder="Search units or tenants..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 w-full rounded-2xl neumorphic-extruded pl-10 pr-4 text-xs font-black text-white focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-neutral-500"
                        />
                    </div>
                )}

                <div className="flex h-11 items-center gap-2 rounded-2xl neumorphic-extruded px-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 shrink-0">
                    Latest Cycle
                </div>
            </div>
        </div>

 {/* Content Area */}
 <AnimatePresence mode="wait">
 {activeTab === "readings" && (
 <motion.div 
 key="readings"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-4"
 >
 <div className="rounded-2xl neumorphic-panel overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-white/5 neumorphic-inset dark:bg-white/[0.02]">
 <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Unit</th>
 <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground text-center">Water Readings</th>
 <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground text-center">Electricity Readings</th>
 <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredDrafts.length === 0 ? (
 <tr>
 <td colSpan={4} className="px-6 py-20 text-center">
 <div className="flex flex-col items-center gap-3 text-muted-foreground">
 <Building2 className="size-12 opacity-20" />
 <p className="text-sm font-medium">No units found matching your criteria</p>
 </div>
 </td>
 </tr>
 ) : filteredDrafts.map((draft) => (
 <tr key={draft.leaseId} className="hover:neumorphic-inset/5 transition-colors">
 <td className="px-6 py-5">
 <div className="flex flex-col">
 <span className="text-base font-black text-foreground">{draft.unitName}</span>
 <span className="text-xs text-muted-foreground">₱{draft.rentAmount.toLocaleString()} / month</span>
 </div>
 </td>
 
 <td className="px-6 py-5">
 <div className="flex items-center justify-center gap-4">
 <div className="text-center">
 <span className="text-[10px] block text-muted-foreground uppercase font-black mb-0.5">Prev</span>
 <span className="font-mono text-sm text-muted-foreground/60">{draft.water.previous}</span>
 </div>
 <div className="h-8 w-px bg-border" />
 <div className="text-center">
 <span className="text-[10px] block text-sky-600 uppercase font-black mb-0.5">Current</span>
 {draft.water.exists ? (
 <span className="font-mono text-sm font-black text-sky-600">{draft.water.current}</span>
 ) : (
 <input 
 type="number" 
 value={draft.water.current}
 placeholder="----"
 onChange={(e) => {
 const newDrafts = [...drafts];
 const index = drafts.findIndex(d => d.leaseId === draft.leaseId);
 newDrafts[index] = { ...newDrafts[index], water: { ...draft.water, current: e.target.value } };
 setDrafts(newDrafts);
 }}
 className="w-16 neumorphic-inset dark:bg-white/[0.05] rounded-md px-2 py-1 text-center font-mono text-sm font-black text-sky-600 dark:text-sky-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
 />
 )}
 </div>
 </div>
 </td>

 <td className="px-6 py-5">
 <div className="flex items-center justify-center gap-4">
 <div className="text-center">
 <span className="text-[10px] block text-muted-foreground uppercase font-black mb-0.5">Prev</span>
 <span className="font-mono text-sm text-muted-foreground/60">{draft.electricity.previous}</span>
 </div>
 <div className="h-8 w-px bg-border" />
 <div className="text-center">
 <span className="text-[10px] block text-amber-600 uppercase font-black mb-0.5">Current</span>
 {draft.electricity.exists ? (
 <span className="font-mono text-sm font-black text-amber-600">{draft.electricity.current}</span>
 ) : (
 <input 
 type="number" 
 value={draft.electricity.current}
 placeholder="----"
 onChange={(e) => {
 const newDrafts = [...drafts];
 const index = drafts.findIndex(d => d.leaseId === draft.leaseId);
 newDrafts[index] = { ...newDrafts[index], electricity: { ...draft.electricity, current: e.target.value } };
 setDrafts(newDrafts);
 }}
 className="w-16 neumorphic-inset dark:bg-white/[0.05] rounded-md px-2 py-1 text-center font-mono text-sm font-black text-amber-600 dark:text-amber-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
 />
 )}
 </div>
 </div>
 </td>

 <td className="px-6 py-5 text-right">
 <div className="flex items-center justify-end gap-3">
 {(draft.water.exists || draft.water.current) && (draft.electricity.exists || draft.electricity.current) && (
 <div className="size-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
 <Check className="size-3.5" />
 </div>
 )}
 <button 
 onClick={() => setSelectedLeaseId(draft.leaseId)}
 className="inline-flex items-center justify-center size-9 rounded-lg neumorphic-panel text-muted-foreground transition-all hover:border-primary hover:text-primary "
 >
 <Edit3 className="size-4" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </motion.div>
 )}

 {activeTab === "rates" && (
 <motion.div 
 key="rates"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 >
 <BillingOperationsPanel propertyId={selectedPropertyId} viewMode="rates" />
 </motion.div>
 )}

 {activeTab === "payments" && (
 <motion.div 
 key="payments"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 >
 <BillingOperationsPanel propertyId={selectedPropertyId} viewMode="gcash" />
 </motion.div>
 )}

 {activeTab === "history" && (
 <motion.div 
 key="history"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-12"
 >
 {/* Hero Header */}
 <div className="relative overflow-hidden rounded-[2.5rem] neumorphic-panel p-10 dark:bg-white/[0.01]">
 <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
 <History className="size-48 -rotate-12" />
 </div>
 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
 <div className="space-y-3">
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
 <BarChart3 className="size-3" />
 Billing Archives
 </div>
 <h3 className="text-3xl font-black text-foreground tracking-tight">Audit Trail & History</h3>
 <p className="text-sm text-muted-foreground max-w-md leading-relaxed font-medium">
 Review past billing cycles, verify consumption reports, and monitor collection recovery performance across your portfolio.
 </p>
 </div>
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
 <div className="relative group min-w-[300px]">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
 <input 
 placeholder="Search month, year or status..."
 className="w-full pl-11 pr-4 py-3.5 rounded-2xl neumorphic-inset dark:bg-white/[0.03] text-sm font-black outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
 />
 </div>
 <button className="h-12 px-6 rounded-2xl bg-foreground text-background text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-foreground/10 active:scale-95">
 Export History
 </button>
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <div className="flex items-center gap-4 px-2 mb-4">
 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 whitespace-nowrap">Audit Trail History</span>
 <div className="h-px flex-1 bg-border/40" />
 </div>

 <div className="space-y-3">
 {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
 const d = new Date();
 d.setDate(1);
 d.setMonth(d.getMonth() - i);
 const monthStr = d.toISOString().slice(0, 7);
 const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
 const yearLabel = d.getFullYear().toString();
 const reportTitle = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
 const summary = historySummaries[monthStr];
 const totalElec = summary?.totalElec ?? 0;
 const totalWater = summary?.totalWater ?? 0;
 const readingCount = summary?.readingCount ?? 0;
 const hasData = readingCount > 0;
 const isCurrentMonth = i === 0;

 return (
 <button 
 key={monthStr}
 onClick={() => setSelectedHistoryMonth(monthStr)}
 className="group relative w-full grid grid-cols-1 md:grid-cols-12 items-center gap-6 p-6 rounded-[2rem] neumorphic-panel hover:border-primary/40 hover:bg-primary/[0.01] hover:shadow-primary/5 active:scale-[0.99] text-left dark:bg-white/[0.01] transition-all"
 >
 {/* Date Block */}
 <div className="md:col-span-2 flex md:flex-col items-center md:items-start gap-4">
 <div className="size-16 flex items-center justify-center rounded-2xl neumorphic-inset group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
 <div className="text-center">
 <p className="text-[10px] font-black uppercase leading-none text-muted-foreground group-hover:text-primary transition-colors">{monthLabel}</p>
 <p className="text-xl font-black mt-1 text-foreground">{yearLabel}</p>
 </div>
 </div>
 <div className="md:hidden h-8 w-px bg-border" />
 <div className={cn(
 "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border whitespace-nowrap",
 isCurrentMonth 
 ? "bg-blue-500/10 text-blue-600 border-blue-500/10" 
 : hasData 
 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/10" 
 : "neumorphic-inset text-muted-foreground/40 border-border"
 )}>
 {isCurrentMonth ? "In Progress" : hasData ? "Cycle Closed" : "No Data"}
 </div>
 </div>

 {/* Report Title & Metrics */}
 <div className="md:col-span-6 space-y-3">
 <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
 {reportTitle} Report
 </h4>
 <div className="flex flex-wrap gap-6">
 <div className="flex items-center gap-2">
 <div className="size-6 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
 <Zap className="size-3" />
 </div>
 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
 {historySummariesLoading ? "--" : totalElec.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
 <span className="opacity-40">kWh</span>
 </span>
 </div>
 <div className="flex items-center gap-2">
 <div className="size-6 flex items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
 <Droplets className="size-3" />
 </div>
 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
 {historySummariesLoading ? "--" : totalWater.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
 <span className="opacity-40">m³</span>
 </span>
 </div>
 </div>
 </div>

 {/* Status & Actions */}
 <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-10">
 <div className="text-right space-y-2 flex-1 md:flex-initial">
 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Readings Logged</p>
 <div className="flex items-center justify-end gap-3">
 <span className="text-[10px] font-black text-foreground">
 {historySummariesLoading ? "--" : `${readingCount} reading${readingCount !== 1 ? "s" : ""}`}
 </span>
 </div>
 </div>
 <div className="size-12 flex items-center justify-center rounded-2xl neumorphic-inset text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:shadow-primary/20 transition-all">
 <ArrowUpRight className="size-5" />
 </div>
 </div>
 </button>
 );
 })}
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* History Detail Modal */}
 <HistoryDetailModal 
 month={selectedHistoryMonth} 
 isOpen={!!selectedHistoryMonth} 
 onClose={() => setSelectedHistoryMonth(null)} 
 />

 {/* Unit Detail Modal */}
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

 {/* Apply All Confirmation */}
 <AnimatePresence>
 {isApplyAllOpen && (
 <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="w-full max-w-md rounded-3xl neumorphic-panel p-8 "
 >
 <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
 <AlertCircle className="size-8" />
 </div>
 <div className="space-y-2 mb-8">
 <h3 className="text-xl font-black text-foreground">Apply Property Defaults?</h3>
 <p className="text-sm text-muted-foreground leading-relaxed">
 This will overwrite all individual unit settings with the property-wide default rates. This action cannot be undone.
 </p>
 </div>
 <div className="flex gap-3">
 <button 
 onClick={() => setIsApplyAllOpen(false)}
 className="flex-1 rounded-xl py-3 text-sm font-black text-muted-foreground hover:neumorphic-inset transition-all"
 >
 Cancel
 </button>
 <button 
 onClick={handleApplyToAll}
 className="flex-1 rounded-xl bg-amber-600 py-3 text-sm font-black text-white hover:bg-amber-700 active:scale-95 transition-all"
 >
 Apply to All
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}

function HistoryDetailModal({ month, isOpen, onClose }: { month: string | null, isOpen: boolean, onClose: () => void }) {
 const [data, setData] = useState<{
 unit_name?: string;
 utility_type: string;
 previous_reading: number;
 current_reading: number;
 }[]>([]);
 const [loading, setLoading] = useState(false);

 useEffect(() => {
 if (isOpen && month) {
 const fetchHistory = async () => {
 try {
 setLoading(true);
 const res = await fetch(`/api/landlord/utility-readings?month=${month}`);
 const json = await res.json();
 setData(json.readings || []);
 } catch (error) {
 console.error("Failed to fetch history readings:", error);
 } finally {
 setLoading(false);
 }
 };
 fetchHistory();
 }
 }, [isOpen, month]);

 if (!isOpen) return null;

 return (
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/40 backdrop-blur-sm"
 onClick={onClose}
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="relative h-full max-h-[85vh] w-full max-w-4xl overflow-hidden neumorphic-panel flex flex-col rounded-[2.5rem] dark:bg-[#121212]"
 >
 {/* Header */}
 <div className="flex items-center justify-between border-b border-white/5/50 p-8">
 <div>
 <h2 className="text-2xl font-black text-foreground">
 {month ? <ClientOnlyDate date={month + "-01"} format={{ month: 'long', year: 'numeric' }} /> : ""} Archive
 </h2>
 <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1">Detailed Consumption Audit</p>
 </div>
 <button 
 onClick={onClose} 
 className="size-12 flex items-center justify-center rounded-2xl neumorphic-inset text-muted-foreground hover:bg-red-500 hover:text-white transition-all "
 >
 <X className="size-5" />
 </button>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-8 space-y-8">
 {loading ? (
 <div className="flex flex-col items-center justify-center py-20 space-y-4">
 <Loader2 className="size-8 animate-spin text-primary" />
 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Retrieving archive data...</p>
 </div>
 ) : (
 <div className="space-y-8">
 {(() => {
 let totalElec = 0;
 let totalWater = 0;
 for (const r of data) {
 const usage = r.current_reading - r.previous_reading;
 if (r.utility_type === "electricity") totalElec += usage;
 else if (r.utility_type === "water") totalWater += usage;
 }
 return (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="p-8 rounded-3xl neumorphic-panel transition-all hover:neumorphic-inset">
 <div className="flex items-center gap-3 text-amber-500 mb-4">
 <Zap className="size-5" />
 <span className="text-[10px] font-black uppercase tracking-widest">Total Electricity</span>
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-4xl font-black text-foreground tracking-tight">{totalElec.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
 <span className="text-xs font-black text-muted-foreground uppercase">kWh</span>
 </div>
 </div>
 <div className="p-8 rounded-3xl neumorphic-panel transition-all hover:neumorphic-inset">
 <div className="flex items-center gap-3 text-sky-500 mb-4">
 <Droplets className="size-5" />
 <span className="text-[10px] font-black uppercase tracking-widest">Total Water</span>
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-4xl font-black text-foreground tracking-tight">{totalWater.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
 <span className="text-xs font-black text-muted-foreground uppercase">m³</span>
 </div>
 </div>
 </div>
 );
 })()}

 <div className="rounded-[2rem] overflow-hidden neumorphic-panel">
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead className="neumorphic-inset border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
 <tr>
 <th className="px-8 py-5">Unit</th>
 <th className="px-8 py-5">Utility</th>
 <th className="px-8 py-5">Previous</th>
 <th className="px-8 py-5">Current</th>
 <th className="px-8 py-5">Consumption</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border/50">
 {data.length > 0 ? data.map((reading, idx) => (
 <tr key={`${reading.unit_name || 'unknown'}-${reading.utility_type}`} className="hover:neumorphic-inset/10 transition-colors group">
 <td className="px-8 py-5 text-sm font-black text-foreground group-hover:text-primary transition-colors">{reading.unit_name || "N/A"}</td>
 <td className="px-8 py-5 capitalize text-[10px] font-black text-muted-foreground tracking-widest">
 <div className="flex items-center gap-2.5">
 {reading.utility_type === 'water' ? (
 <div className="size-6 flex items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
 <Droplets className="size-3" />
 </div>
 ) : (
 <div className="size-6 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
 <Zap className="size-3" />
 </div>
 )}
 {reading.utility_type}
 </div>
 </td>
 <td className="px-8 py-5 text-sm font-mono text-muted-foreground">{reading.previous_reading}</td>
 <td className="px-8 py-5 text-sm font-mono font-black text-foreground">{reading.current_reading}</td>
 <td className="px-8 py-5">
 <div className="flex items-center gap-2">
 <span className="text-sm font-mono font-black text-primary">
 {(reading.current_reading - reading.previous_reading).toFixed(2)}
 </span>
 <span className="text-[10px] font-black text-muted-foreground/40 uppercase">{reading.utility_type === 'water' ? 'm³' : 'kWh'}</span>
 </div>
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={5} className="px-8 py-20 text-center">
 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No records found for this cycle</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="border-t border-border/50 p-8 neumorphic-inset">
 <button 
 onClick={onClose}
 className="w-full py-4 rounded-2xl bg-foreground text-background text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
 >
 Close Audit View
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
}

function UnitDetailModal({ isOpen, onClose, draft, onUpdate }: { isOpen: boolean, onClose: () => void, draft?: ReadingDraft, onUpdate: (p: Partial<ReadingDraft>) => void }) {
 if (!draft) return null;

 return (
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/40 backdrop-blur-sm"
 onClick={onClose}
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="relative h-full max-h-[85vh] w-full max-w-2xl overflow-hidden neumorphic-panel flex flex-col rounded-3xl dark:bg-[#1E1E1E]"
 >
 {/* Modal Header */}
 <div className="flex items-center justify-between border-b border-white/5 p-6 md:px-8">
 <div className="flex items-center gap-4">
 <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
 <Building2 className="size-6" />
 </div>
 <div>
 <h2 className="text-xl font-black text-foreground">{draft.unitName}</h2>
 <p className="text-xs text-muted-foreground">Unit Billing Profile</p>
 </div>
 </div>
 <button 
 onClick={onClose} 
 className="size-10 flex items-center justify-center rounded-xl neumorphic-inset text-muted-foreground hover:bg-red-50 hover:text-white transition-all"
 >
 <X className="size-5" />
 </button>
 </div>

 {/* Modal Content */}
 <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
 {/* Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="rounded-2xl neumorphic-inset p-6 transition-all hover:border-primary/30 dark:bg-white/[0.02]">
 <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-2">Base Monthly Rent</span>
 <div className="flex items-baseline gap-2">
 <span className="text-xl font-black text-muted-foreground/40">₱</span>
 <input 
 type="number" 
 value={draft.rentAmount}
 onChange={(e) => onUpdate({ rentAmount: parseFloat(e.target.value) })}
 className="bg-transparent text-2xl font-black text-foreground outline-none w-full focus:text-primary"
 />
 </div>
 </div>
 <div className="rounded-2xl bg-emerald-500/[0.03] p-6 flex flex-col justify-center dark:border-emerald-500/10">
 <div className="flex items-center gap-2">
 <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
 <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-500/80">Account Status</span>
 </div>
 <span className="text-lg font-black text-foreground mt-1">Active Lease</span>
 </div>
 </div>

 <ResourceSection 
 type="water"
 label="Water Meter"
 icon={Droplets}
 colorClass="sky"
 draft={draft.water}
 onUpdate={(patch) => onUpdate({ water: { ...draft.water, ...patch } })}
 />

 <ResourceSection 
 type="electricity"
 label="Electricity Meter"
 icon={Zap}
 colorClass="amber"
 draft={draft.electricity}
 onUpdate={(patch) => onUpdate({ electricity: { ...draft.electricity, ...patch } })}
 />

 {/* Additional Charges */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <DollarSign className="size-4 text-primary" />
 <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Service Add-ons</h3>
 </div>
 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Optional Charges</span>
 </div>
 <div className="rounded-2xl neumorphic-panel overflow-hidden dark:bg-white/[0.01]">
 <div className="divide-y divide-border">
 {[
 { label: "Internet Fiber", cost: 1500 },
 { label: "Sanitation & Trash", cost: 150 },
 ].map((service) => (
 <div key={service.label} className="flex items-center justify-between group p-5 hover:neumorphic-inset/30 transition-colors">
 <div className="flex items-center gap-3">
 <div className="size-2 rounded-full bg-primary/40" />
 <span className="text-sm font-black text-foreground">{service.label}</span>
 </div>
 <div className="flex items-center gap-4">
 <span className="font-mono text-sm font-black text-primary">₱{service.cost.toLocaleString()}</span>
 <button className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
 <Trash2 className="size-3.5" />
 </button>
 </div>
 </div>
 ))}
 </div>
 <button className="w-full py-4 border-t border-border neumorphic-inset text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:neumorphic-inset hover:text-primary transition-all">
 + Append Supplemental Charge
 </button>
 </div>
 </div>
 </div>

 {/* Modal Footer */}
 <div className="border-t border-border p-6 md:px-8 neumorphic-inset">
 <button 
 onClick={onClose}
 className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-black text-white shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.01] active:scale-95"
 >
 <Check className="size-4" />
 Save All Changes
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
}

function ResourceSection({ label, icon: Icon, colorClass, draft, onUpdate }: { 
 type: string,
 label: string, 
 icon: React.ElementType, 
 colorClass: string,
 draft: {
 previous: number;
 current: string;
 exists: boolean;
 rate: number;
 },
 onUpdate: (patch: Partial<{
 previous: number;
 current: string;
 exists: boolean;
 rate: number;
 }>) => void
}) {
 const isSky = colorClass === "sky";
 const bgClass = isSky ? "dark:border-sky-500/10" : "dark:border-amber-500/10";
 const borderClass = isSky ? "border-sky-200" : "border-amber-200";
 const accentClass = isSky ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400";

 return (
 <div className="space-y-4">
 <div className={cn("flex items-center gap-2", accentClass)}>
 <Icon className="size-5" />
 <h3 className="text-sm font-black uppercase tracking-wider">{label}</h3>
 </div>
 <div className={cn("grid grid-cols-1 md:grid-cols-5 gap-6 rounded-3xl neumorphic-panel p-6 overflow-hidden", bgClass)}>
 <div className="md:col-span-3 space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block pl-1">Previous</label>
 <div className="flex items-center gap-2">
 <input 
 type="number" 
 value={draft.previous}
 onChange={(e) => onUpdate({ previous: parseFloat(e.target.value) })}
 className="w-full rounded-xl neumorphic-panel px-4 py-3 text-sm font-black outline-none focus:border-primary "
 />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block pl-1">Current</label>
 <div className="flex items-center gap-2">
 <input 
 type="number" 
 value={draft.current}
 placeholder="Enter reading..."
 onChange={(e) => onUpdate({ current: e.target.value })}
 className={cn("w-full rounded-xl neumorphic-panel px-4 py-3 text-sm font-black outline-none focus:border-primary ", accentClass)}
 />
 </div>
 </div>
 </div>
 
 <div className="flex items-center gap-3">
 <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl neumorphic-panel text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all ">
 <Camera className="size-3.5" />
 Upload Photo Proof
 </button>
 </div>
 </div>

 <div className="md:col-span-2 flex flex-col justify-center">
 <div className={cn("text-center p-6 rounded-2xl neumorphic-panel")}>
 <span className={cn("text-[10px] font-black uppercase tracking-widest mb-2 block opacity-80", accentClass)}>Rate per Unit</span>
 <div className="flex items-center justify-center gap-2">
 <span className="text-lg font-black text-muted-foreground/40">₱</span>
 <input 
 type="number" 
 value={draft.rate}
 step="0.01"
 onChange={(e) => onUpdate({ rate: parseFloat(e.target.value) })}
 className="w-20 bg-transparent text-center text-3xl font-black tracking-tight outline-none focus:text-primary"
 />
 <span className="text-[10px] font-black text-muted-foreground/40 mt-2">{isSky ? "/ m³" : "/ kWh"}</span>
 </div>
 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-2">Unit Override</p>
 </div>
 </div>
 </div>
 </div>
 );
}

