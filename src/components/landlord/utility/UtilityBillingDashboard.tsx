"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
	BarChart3,
	Calendar,
	Send,
	ShieldCheck,
	CheckCircle2,
	Clock,
	FileText,
	QrCode,
	ChevronRight,
	ExternalLink
} from "lucide-react";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProperty } from "@/context/PropertyContext";
import type { BillingWorkspace, InvoiceListItem } from "@/lib/billing/server";
import { BillingOperationsPanel } from "@/components/landlord/BillingOperationsPanel";
import { InvoiceModal } from "@/components/landlord/invoices/InvoiceModal";
import { OfflineStorage } from "@/lib/offline/offlineStorage";
import { mutationQueue } from "@/lib/offline/mutationQueue";
import { MonthPicker } from "@/components/ui/MonthPicker";

type ReadingDraft = {
	unitId: string;
	unitName: string;
	propertyId: string;
	propertyName: string;
	leaseId: string | null;
	tenantName: string | null;
	occupancyStatus: "occupied" | "vacant" | "maintenance";
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
	unitId?: string;
	utilityType: string;
	billingPeriodStart: string;
	billingPeriodEnd: string;
	previousReading: number;
	currentReading: number;
	note: string;
};

function buildDraftsFromWorkspace(
	workspaceData: BillingWorkspace,
	readingsData: { readings?: any[] },
	allReadings: any[]
): ReadingDraft[] {
	const draftsList: ReadingDraft[] = [];
	const seenUnitIds = new Set<string>();

	// 1. Iterate over all properties and their units
	(workspaceData.properties || []).forEach((property: any) => {
		(property.units || []).forEach((unit: any) => {
			seenUnitIds.add(unit.id);
			const activeLease = (workspaceData.activeLeases || []).find(
				(l: any) => l.unit?.id === unit.id
			);

			const leaseId = activeLease ? activeLease.id : null;
			const isOccupied = !!activeLease;
			const occupancyStatus: "occupied" | "vacant" | "maintenance" = isOccupied
				? "occupied"
				: (unit.status === "maintenance" ? "maintenance" : "vacant");

			const currentWater = (readingsData?.readings || []).find(
				(r: any) => (r.unit_id === unit.id || (leaseId && r.lease_id === leaseId)) && r.utility_type === "water"
			);
			const currentElec = (readingsData?.readings || []).find(
				(r: any) => (r.unit_id === unit.id || (leaseId && r.lease_id === leaseId)) && r.utility_type === "electricity"
			);

			const sortedWater = (allReadings || [])
				.filter((r: any) => (r.unit_id === unit.id || (leaseId && r.lease_id === leaseId)) && r.utility_type === "water")
				.sort((a: any, b: any) => new Date(b.billing_period_end).getTime() - new Date(a.billing_period_end).getTime());
			const sortedElec = (allReadings || [])
				.filter((r: any) => (r.unit_id === unit.id || (leaseId && r.lease_id === leaseId)) && r.utility_type === "electricity")
				.sort((a: any, b: any) => new Date(b.billing_period_end).getTime() - new Date(a.billing_period_end).getTime());

			const propertyWaterConfig = (workspaceData.utilityConfigs || []).find(
				(c: any) => c.property_id === property.id && c.utility_type === "water" && c.unit_id === null
			);
			const unitWaterConfig = (workspaceData.utilityConfigs || []).find(
				(c: any) => c.unit_id === unit.id && c.utility_type === "water"
			);

			const propertyElecConfig = (workspaceData.utilityConfigs || []).find(
				(c: any) => c.property_id === property.id && c.utility_type === "electricity" && c.unit_id === null
			);
			const unitElecConfig = (workspaceData.utilityConfigs || []).find(
				(c: any) => c.unit_id === unit.id && c.utility_type === "electricity"
			);

			draftsList.push({
				unitId: unit.id,
				unitName: unit.name || "Unknown Unit",
				propertyId: property.id || "",
				propertyName: property.name || "",
				leaseId,
				tenantName: activeLease?.tenant?.full_name || null,
				occupancyStatus,
				rentAmount: activeLease?.monthly_rent ?? unit.rent_amount ?? 0,
				water: {
					previous: currentWater ? currentWater.previous_reading : (sortedWater[0]?.current_reading || 0),
					current: currentWater ? currentWater.current_reading.toString() : "",
					exists: !!currentWater,
					rate: unitWaterConfig?.rate_per_unit || propertyWaterConfig?.rate_per_unit || 0
				},
				electricity: {
					previous: currentElec ? currentElec.previous_reading : (sortedElec[0]?.current_reading || 0),
					current: currentElec ? currentElec.current_reading.toString() : "",
					exists: !!currentElec,
					rate: unitElecConfig?.rate_per_unit || propertyElecConfig?.rate_per_unit || 0
				}
			});
		});
	});

	// 2. Include any active lease whose unit might not have been returned in property.units
	(workspaceData.activeLeases || []).forEach((lease: any) => {
		if (lease.unit?.id && !seenUnitIds.has(lease.unit.id)) {
			seenUnitIds.add(lease.unit.id);
			const currentWater = (readingsData?.readings || []).find(
				(r: any) => (r.unit_id === lease.unit.id || r.lease_id === lease.id) && r.utility_type === "water"
			);
			const currentElec = (readingsData?.readings || []).find(
				(r: any) => (r.unit_id === lease.unit.id || r.lease_id === lease.id) && r.utility_type === "electricity"
			);

			const sortedWater = (allReadings || [])
				.filter((r: any) => (r.unit_id === lease.unit.id || r.lease_id === lease.id) && r.utility_type === "water")
				.sort((a: any, b: any) => new Date(b.billing_period_end).getTime() - new Date(a.billing_period_end).getTime());
			const sortedElec = (allReadings || [])
				.filter((r: any) => (r.unit_id === lease.unit.id || r.lease_id === lease.id) && r.utility_type === "electricity")
				.sort((a: any, b: any) => new Date(b.billing_period_end).getTime() - new Date(a.billing_period_end).getTime());

			const propertyWaterConfig = (workspaceData.utilityConfigs || []).find(
				(c: any) => c.property_id === lease.property?.id && c.utility_type === "water" && c.unit_id === null
			);
			const unitWaterConfig = (workspaceData.utilityConfigs || []).find(
				(c: any) => c.unit_id === lease.unit?.id && c.utility_type === "water"
			);

			const propertyElecConfig = (workspaceData.utilityConfigs || []).find(
				(c: any) => c.property_id === lease.property?.id && c.utility_type === "electricity" && c.unit_id === null
			);
			const unitElecConfig = (workspaceData.utilityConfigs || []).find(
				(c: any) => c.unit_id === lease.unit?.id && c.utility_type === "electricity"
			);

			draftsList.push({
				unitId: lease.unit.id,
				unitName: lease.unit.name || "Unknown Unit",
				propertyId: lease.property?.id || "",
				propertyName: lease.property?.name || "",
				leaseId: lease.id,
				tenantName: lease.tenant?.full_name || null,
				occupancyStatus: "occupied",
				rentAmount: lease.monthly_rent || 0,
				water: {
					previous: currentWater ? currentWater.previous_reading : (sortedWater[0]?.current_reading || 0),
					current: currentWater ? currentWater.current_reading.toString() : "",
					exists: !!currentWater,
					rate: unitWaterConfig?.rate_per_unit || propertyWaterConfig?.rate_per_unit || 0
				},
				electricity: {
					previous: currentElec ? currentElec.previous_reading : (sortedElec[0]?.current_reading || 0),
					current: currentElec ? currentElec.current_reading.toString() : "",
					exists: !!currentElec,
					rate: unitElecConfig?.rate_per_unit || propertyElecConfig?.rate_per_unit || 0
				}
			});
		}
	});

	draftsList.sort((a, b) => a.unitName.localeCompare(b.unitName, undefined, { numeric: true, sensitivity: "base" }));
	return draftsList;
}

export function UtilityBillingDashboard() {
	const searchParams = useSearchParams();
	const { selectedPropertyId: globalPropertyId } = useProperty();
	const [activeTab, setActiveTab] = useState<"readings" | "verify" | "rates" | "history">("readings");
	const [workspace, setWorkspace] = useState<BillingWorkspace | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
	const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
	const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<string | null>(null);

	// Incoming Payments Verification Queue State
	const [pendingInvoices, setPendingInvoices] = useState<InvoiceListItem[]>([]);
	const [loadingPendingInvoices, setLoadingPendingInvoices] = useState(false);
	const [activeVerifyInvoiceId, setActiveVerifyInvoiceId] = useState<string | null>(null);

	// History summary data per month
	type MonthSummary = { totalElec: number; totalWater: number; readingCount: number };
	const [historySummaries, setHistorySummaries] = useState<Record<string, MonthSummary>>({});
	const [historySummariesLoading, setHistorySummariesLoading] = useState(false);
	
	// Sync local property selection with global navbar selector
	useEffect(() => {
		setSelectedPropertyId(globalPropertyId);
	}, [globalPropertyId]);

	// Sync tab from URL search parameters if provided (e.g. ?tab=verify)
	useEffect(() => {
		const tabParam = searchParams.get("tab");
		if (tabParam === "readings" || tabParam === "verify" || tabParam === "rates" || tabParam === "history") {
			setActiveTab(tabParam);
		} else if (tabParam === "payments") {
			setActiveTab("verify");
		}
		const monthParam = searchParams.get("month");
		if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
			setSelectedMonth(monthParam);
		}
	}, [searchParams]);
	
	// Unit Detail View State
	const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
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

					const newDrafts = buildDraftsFromWorkspace(workspaceData, readingsData, allReadings);
					setDrafts(newDrafts);
					return;
				} else {
					console.warn("[UtilityBilling] Live fetch incomplete:", {
						workspaceOk: workspaceRes.ok,
						workspaceStatus: workspaceRes.status,
						readingsOk: readingsRes.ok,
						readingsStatus: readingsRes.status,
					});
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

				const newDrafts = buildDraftsFromWorkspace(workspaceData, readingsData, allReadings);
				setDrafts(newDrafts);
				if (typeof navigator !== "undefined" && !navigator.onLine) {
					toast.info("Offline Mode: Hydrated utility records and tariffs from local cache.");
				}
			} else {
				if (typeof navigator !== "undefined" && !navigator.onLine) {
					toast.error("Offline: No local utility cache found.");
				} else {
					toast.error("Failed to load billing information");
				}
			}
		} catch (err) {
			console.error(err);
			const cachedWorkspace = OfflineStorage.get<BillingWorkspace>("utility_workspace");
			if (cachedWorkspace?.data) {
				setWorkspace(cachedWorkspace.data);
				if (typeof navigator !== "undefined" && !navigator.onLine) {
					toast.info("Loaded cached utility workspace offline.");
				}
			} else {
				toast.error("Failed to load billing information");
			}
		} finally {
			setLoading(false);
		}
	}, [selectedMonth]);

	// Fetch pending verification invoices
	const fetchPendingInvoices = useCallback(async () => {
		try {
			setLoadingPendingInvoices(true);
			const params = new URLSearchParams();
			if (selectedPropertyId && selectedPropertyId !== "all") {
				params.set("propertyId", selectedPropertyId);
			}
			const res = await fetch(`/api/landlord/invoices?${params.toString()}`);
			if (res.ok) {
				const data = await res.json();
				const list: InvoiceListItem[] = data.invoices || [];
				// Filter for invoices awaiting landlord payment review
				const needsReview = list.filter((inv) => inv.status === "under_review" || (inv as any).workflowStatus === "review_ready");
				setPendingInvoices(needsReview);
			}
		} catch (e) {
			console.error("Failed to load verification queue:", e);
		} finally {
			setLoadingPendingInvoices(false);
		}
	}, [selectedPropertyId]);

	useEffect(() => {
		fetchData();
		fetchPendingInvoices();
	}, [fetchData, fetchPendingInvoices]);

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
						readings.forEach((r) => {
							const usage = Math.max(0, (r.current_reading || 0) - (r.previous_reading || 0));
							if (r.utility_type === "electricity") totalElec += usage;
							else if (r.utility_type === "water") totalWater += usage;
						});
						results[m] = { totalElec, totalWater, readingCount: readings.length };
					} catch {
						// ignore per-month error
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
	}, [activeTab]);

	const filteredDrafts = drafts.filter(d => {
		const matchesProperty = selectedPropertyId === "all" || d.propertyId === selectedPropertyId;
		const matchesSearch = d.unitName.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesProperty && matchesSearch;
	});

	// Compute real-time progress & consumption totals
	const readingsSummary = useMemo(() => {
		let recordedCount = 0;
		let totalElecKwh = 0;
		let totalWaterM3 = 0;
		let totalEstimatedUtilRevenue = 0;

		filteredDrafts.forEach((d) => {
			const waterPrev = d.water.previous || 0;
			const waterCurr = parseFloat(d.water.current);
			const hasWater = !isNaN(waterCurr) && waterCurr >= waterPrev;
			const waterUsage = hasWater ? waterCurr - waterPrev : 0;
			const waterCost = waterUsage * (d.water.rate || 0);

			const elecPrev = d.electricity.previous || 0;
			const elecCurr = parseFloat(d.electricity.current);
			const hasElec = !isNaN(elecCurr) && elecCurr >= elecPrev;
			const elecUsage = hasElec ? elecCurr - elecPrev : 0;
			const elecCost = elecUsage * (d.electricity.rate || 0);

			const hasAnyRecorded = (d.water.exists || (d.water.current !== "" && !isNaN(waterCurr))) && 
			                       (d.electricity.exists || (d.electricity.current !== "" && !isNaN(elecCurr)));

			if (hasAnyRecorded) {
				recordedCount += 1;
			}

			totalElecKwh += elecUsage;
			totalWaterM3 += waterUsage;
			totalEstimatedUtilRevenue += waterCost + elecCost;
		});

		return {
			recordedCount,
			totalUnits: filteredDrafts.length,
			totalElecKwh,
			totalWaterM3,
			totalEstimatedUtilRevenue,
		};
	}, [filteredDrafts]);

	const handleSaveReadings = async (postInvoices: boolean = false) => {
		const toSave: ReadingSaveRequest[] = [];
		const [y, m] = selectedMonth.split("-").map(Number);
		const start = `${selectedMonth}-01`;
		const lastDay = new Date(y, m, 0).getDate();
		const end = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

		drafts.forEach(d => {
			const targetId = d.leaseId || d.unitId;
			if (!targetId) return;
			if (d.water.current !== "") {
				const val = parseFloat(d.water.current);
				if (!isNaN(val)) {
					toSave.push({
						leaseId: targetId,
						unitId: d.unitId,
						utilityType: "water",
						billingPeriodStart: start,
						billingPeriodEnd: end,
						previousReading: d.water.previous,
						currentReading: val,
						note: ""
					});
				}
			}
			if (d.electricity.current !== "") {
				const val = parseFloat(d.electricity.current);
				if (!isNaN(val)) {
					toSave.push({
						leaseId: targetId,
						unitId: d.unitId,
						utilityType: "electricity",
						billingPeriodStart: start,
						billingPeriodEnd: end,
						previousReading: d.electricity.previous,
						currentReading: val,
						note: ""
					});
				}
			}
		});

		if (toSave.length === 0) {
			toast.info("No readings entered yet. Enter meter numbers before saving.");
			return;
		}

		// If offline, enqueue and save optimistically
		if (typeof navigator !== "undefined" && !navigator.onLine) {
			mutationQueue.enqueue(
				"SAVE_SUBMETER_READINGS",
				"/api/landlord/utility-readings",
				"POST",
				{ readings: toSave, postInvoices, month: selectedMonth },
				`Recorded ${toSave.length} sub-meter readings offline`
			);

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
				body: JSON.stringify({
					readings: toSave,
					postInvoices,
					month: selectedMonth
				})
			});

			if (!res.ok) {
				const errJson = await res.json().catch(() => ({}));
				throw new Error(errJson.error || `Save failed with status ${res.status}`);
			}
			const json = await res.json();
			
			if (postInvoices) {
				const invoiceResult = json.invoiceResult;
				const created = invoiceResult?.created ?? 0;
				const updated = invoiceResult?.updated ?? 0;
				toast.success(`Saved readings and issued/updated ${created + updated} monthly invoices for tenants!`);
			} else {
				toast.success(`Successfully saved ${toSave.length} submeter readings as draft`);
			}

			// Optimistically mark recorded in local state
			setDrafts(prev => prev.map(d => ({
				...d,
				water: { ...d.water, exists: d.water.current !== "" ? true : d.water.exists },
				electricity: { ...d.electricity, exists: d.electricity.current !== "" ? true : d.electricity.exists },
			})));

			await fetchData();
			await fetchPendingInvoices();
		} catch (err: any) {
			const isNetworkOffline = typeof navigator !== "undefined" && !navigator.onLine;
			if (isNetworkOffline) {
				console.warn("[UtilityBilling] Network offline, enqueuing locally:", err);
				mutationQueue.enqueue(
					"SAVE_SUBMETER_READINGS",
					"/api/landlord/utility-readings",
					"POST",
					{ readings: toSave, postInvoices, month: selectedMonth },
					`Recorded ${toSave.length} sub-meter readings offline`
				);
				setDrafts(prev => prev.map(d => ({
					...d,
					water: { ...d.water, exists: d.water.current !== "" ? true : d.water.exists },
					electricity: { ...d.electricity, exists: d.electricity.current !== "" ? true : d.electricity.exists },
				})));
				toast.success(`Saved ${toSave.length} readings offline! Will sync upon reconnection.`);
			} else {
				console.error("[UtilityBilling] Save error:", err);
				toast.error(err.message || "Failed to save submeter readings");
			}
		} finally {
			setSaving(false);
		}
	};

	const handleSaveSingleUnit = async (targetId: string) => {
		const draft = drafts.find(d => d.unitId === targetId || d.leaseId === targetId);
		if (!draft) return;

		const toSave: ReadingSaveRequest[] = [];
		const [y, m] = selectedMonth.split("-").map(Number);
		const start = `${selectedMonth}-01`;
		const lastDay = new Date(y, m, 0).getDate();
		const end = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;
		const readingLeaseId = draft.leaseId || draft.unitId;

		if (draft.water.current !== "") {
			toSave.push({
				leaseId: readingLeaseId,
				unitId: draft.unitId,
				utilityType: "water",
				billingPeriodStart: start,
				billingPeriodEnd: end,
				previousReading: draft.water.previous,
				currentReading: parseFloat(draft.water.current) || 0,
				note: ""
			});
		}
		if (draft.electricity.current !== "") {
			toSave.push({
				leaseId: readingLeaseId,
				unitId: draft.unitId,
				utilityType: "electricity",
				billingPeriodStart: start,
				billingPeriodEnd: end,
				previousReading: draft.electricity.previous,
				currentReading: parseFloat(draft.electricity.current) || 0,
				note: ""
			});
		}

		if (toSave.length === 0) {
			toast.info("Please enter at least one current reading");
			return;
		}

		try {
			setSaving(true);
			const res = await fetch("/api/landlord/utility-readings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					readings: toSave,
					postInvoices: true,
					month: selectedMonth
				})
			});
			if (!res.ok) {
				const errJson = await res.json().catch(() => ({}));
				throw new Error(errJson.error || `Save failed with status ${res.status}`);
			}
			toast.success(`Saved and billed readings for ${draft.unitName}`);
			await fetchData();
			await fetchPendingInvoices();
			setSelectedUnitId(null);
		} catch (e: any) {
			console.error("[UtilityBilling] Single unit save error:", e);
			toast.error(e.message || "Failed to save unit reading");
		} finally {
			setSaving(false);
		}
	};

	const activeDraft = drafts.find(d => d.unitId === selectedUnitId || (d.leaseId && d.leaseId === selectedUnitId));

	const formattedCycleMonth = useMemo(() => {
		if (!selectedMonth || !selectedMonth.includes("-")) return selectedMonth;
		const [y, m] = selectedMonth.split("-");
		const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
		return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
	}, [selectedMonth]);

	if (loading && !workspace) {
		return (
			<div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
				<Loader2 className="size-10 animate-spin text-primary" />
				<p className="text-sm font-medium text-muted-foreground">Loading utility data...</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col space-y-8 pb-20 w-full">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="space-y-1">
					<div className="flex items-center gap-2.5">
						<span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
							<Zap className="size-3" />
							Billing Cycle
						</span>
						<span className="text-xs font-medium text-muted-foreground">{formattedCycleMonth}</span>
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						Utility & Submeter Billing
					</h1>
					<p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
						Record room submeters, calculate tenant consumption, and issue itemized monthly invoices in one workflow.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					{activeTab === "readings" && (
						<>
							<button 
								onClick={() => handleSaveReadings(false)}
								disabled={saving}
								className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card/60 px-4 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
								title="Save submeter readings without issuing invoices yet"
							>
								<Save className="size-3.5 text-muted-foreground" />
								<span>Save Draft</span>
							</button>

							<button 
								onClick={() => handleSaveReadings(true)}
								disabled={saving}
								className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 cursor-pointer"
								title="Save readings and immediately post itemized invoices to tenants"
							>
								{saving ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
								<span>Post & Bill Invoices</span>
							</button>
						</>
					)}
				</div>
			</div>

			{/* Unified Command Bar */}
			<div className="relative z-30 overflow-visible flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/40 p-2.5 sm:p-3 backdrop-blur-md lg:flex-row lg:items-center lg:justify-between shadow-sm">
				{/* Segmented Pill Tabs */}
				<div className="flex shrink-0 items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none p-1 sm:p-1.5 rounded-xl bg-muted/40 border border-border/50 min-w-max">
					{[
						{ 
							id: "readings", 
							label: "Meter Readings", 
							icon: Zap,
							badge: `${readingsSummary.recordedCount}/${readingsSummary.totalUnits}`
						},
						{ 
							id: "verify", 
							label: "Verify Payments", 
							icon: ShieldCheck,
							badge: pendingInvoices.length > 0 ? pendingInvoices.length.toString() : undefined,
							badgeAlert: pendingInvoices.length > 0
						},
						{ 
							id: "rates", 
							label: "Rate Tariffs", 
							icon: Settings2 
						},
						{ 
							id: "history", 
							label: "Billing Archive", 
							icon: History 
						}
					].map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id as any)}
							className={cn(
								"flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 sm:px-3.5 sm:py-2 text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
								activeTab === tab.id
									? "bg-card text-foreground font-semibold shadow-sm border border-border/80"
									: "text-muted-foreground hover:text-foreground hover:bg-card/40"
							)}
						>
							<tab.icon className={cn("size-3.5 shrink-0", activeTab === tab.id ? "text-primary" : "text-muted-foreground")} />
							<span>{tab.label}</span>
							{tab.badge && (
								<span className={cn(
									"px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold",
									tab.badgeAlert 
										? "bg-amber-500 text-zinc-950 font-bold animate-pulse" 
										: activeTab === tab.id 
											? "bg-primary/15 text-primary" 
											: "bg-muted text-muted-foreground"
								)}>
									{tab.badge}
								</span>
							)}
						</button>
					))}
				</div>

				{/* Search & Cycle Filter */}
				<div className="relative z-30 flex items-center gap-2.5 w-full lg:w-auto lg:justify-end">
					{activeTab === "readings" && (
						<div className="relative flex-1 min-w-[130px] sm:w-56 md:w-64">
							<Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
							<input 
								placeholder="Search unit or room..." 
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="h-9.5 w-full rounded-xl border border-border/70 bg-card/60 pl-8.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
							/>
						</div>
					)}

					<MonthPicker
						value={selectedMonth}
						onChange={(newMonth) => setSelectedMonth(newMonth)}
						className={cn(activeTab !== "readings" && "ml-auto lg:ml-0")}
						align="right"
					/>
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
						className="space-y-6"
					>
						{/* Progress & Live Consumption Dashboard */}
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
							<div className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5 backdrop-blur-sm flex flex-col justify-between">
								<span className="text-[11px] font-semibold text-muted-foreground">Units Logged</span>
								<div className="mt-2 flex items-baseline gap-1.5">
									<span className="text-2xl font-bold font-mono text-foreground">{readingsSummary.recordedCount}</span>
									<span className="text-xs font-medium text-muted-foreground">/ {readingsSummary.totalUnits} Units</span>
								</div>
								<div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
									<div 
										className="h-full bg-primary rounded-full transition-all duration-500"
										style={{ width: `${readingsSummary.totalUnits > 0 ? (readingsSummary.recordedCount / readingsSummary.totalUnits) * 100 : 0}%` }}
									/>
								</div>
							</div>

							<div className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5 backdrop-blur-sm flex flex-col justify-between">
								<span className="text-[11px] font-semibold text-amber-500 flex items-center gap-1.5">
									<Zap className="size-3.5" /> Electricity Recorded
								</span>
								<div className="mt-2 flex items-baseline gap-1.5">
									<span className="text-2xl font-bold font-mono text-foreground">{readingsSummary.totalElecKwh.toFixed(1)}</span>
									<span className="text-xs font-semibold text-muted-foreground">kWh</span>
								</div>
								<span className="text-[10px] text-muted-foreground mt-2">Active cycle usage</span>
							</div>

							<div className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5 backdrop-blur-sm flex flex-col justify-between">
								<span className="text-[11px] font-semibold text-sky-400 flex items-center gap-1.5">
									<Droplets className="size-3.5" /> Water Recorded
								</span>
								<div className="mt-2 flex items-baseline gap-1.5">
									<span className="text-2xl font-bold font-mono text-foreground">{readingsSummary.totalWaterM3.toFixed(1)}</span>
									<span className="text-xs font-semibold text-muted-foreground">m³</span>
								</div>
								<span className="text-[10px] text-muted-foreground mt-2">Active cycle usage</span>
							</div>

							<div className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5 backdrop-blur-sm flex flex-col justify-between">
								<span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1.5">
									<DollarSign className="size-3.5" /> Est. Utility Billing
								</span>
								<div className="mt-2 flex items-baseline gap-1">
									<span className="text-xs font-bold text-muted-foreground">₱</span>
									<span className="text-2xl font-bold font-mono text-foreground">{readingsSummary.totalEstimatedUtilRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
								</div>
								<span className="text-[10px] text-muted-foreground mt-2">Added to tenant invoices</span>
							</div>
						</div>

						{/* Batch Readings Table */}
						<div className="rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm overflow-hidden shadow-sm">
							<div className="overflow-x-auto">
								<table className="w-full text-left border-collapse">
									<thead>
										<tr className="border-b border-border/60 bg-muted/30">
											<th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unit & Base Rent</th>
											<th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Water Reading (m³)</th>
											<th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Electricity Reading (kWh)</th>
											<th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Estimated Total</th>
											<th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border/40">
										{filteredDrafts.length === 0 ? (
											<tr>
												<td colSpan={5} className="px-6 py-20 text-center">
													<div className="flex flex-col items-center gap-3 text-muted-foreground">
														<Building2 className="size-12 opacity-20" />
														<p className="text-sm font-medium">No units found matching your criteria</p>
													</div>
												</td>
											</tr>
										) : filteredDrafts.map((draft) => {
											const waterPrev = draft.water.previous || 0;
											const waterCurr = parseFloat(draft.water.current);
											const hasWater = !isNaN(waterCurr) && waterCurr >= waterPrev;
											const waterUsage = hasWater ? waterCurr - waterPrev : 0;
											const waterCost = waterUsage * (draft.water.rate || 0);

											const elecPrev = draft.electricity.previous || 0;
											const elecCurr = parseFloat(draft.electricity.current);
											const hasElec = !isNaN(elecCurr) && elecCurr >= elecPrev;
											const elecUsage = hasElec ? elecCurr - elecPrev : 0;
											const elecCost = elecUsage * (draft.electricity.rate || 0);

											const totalEst = draft.rentAmount + waterCost + elecCost;
											const isComplete = (draft.water.exists || hasWater) && (draft.electricity.exists || hasElec);

											return (
												<tr key={draft.unitId} className="hover:bg-muted/10 transition-colors">
													{/* Unit Info */}
													<td className="px-6 py-4">
														<div className="flex flex-col gap-0.5">
															<div className="flex items-center gap-2">
																<span className="text-sm font-bold text-foreground">{draft.unitName}</span>
																{draft.occupancyStatus === "occupied" ? (
																	<span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
																		Occupied
																	</span>
																) : (
																	<span className="text-[10px] font-semibold text-muted-foreground/80 bg-muted/60 px-2 py-0.5 rounded-md border border-border">
																		Vacant
																	</span>
																)}
															</div>
															<span className="text-xs text-muted-foreground">
																{draft.occupancyStatus === "occupied" && draft.tenantName ? `${draft.tenantName} • ` : ""}
																Base Rent: ₱{draft.rentAmount.toLocaleString()}
															</span>
														</div>
													</td>
													
													{/* Water Reading Column */}
													<td className="px-6 py-4">
														<div className="flex flex-col items-center gap-1.5">
															<div className="flex items-center justify-center gap-3">
																<div className="text-center">
																	<span className="text-[9px] block text-muted-foreground uppercase font-bold">Prev</span>
																	<span className="font-mono text-xs text-muted-foreground/80 font-medium">{draft.water.previous}</span>
																</div>
																<div className="h-6 w-px bg-border/60" />
																<div className="text-center">
																	<span className="text-[9px] block text-sky-400 uppercase font-bold">Curr</span>
																	{draft.water.exists ? (
																		<span className="font-mono text-xs font-bold text-sky-400">{draft.water.current}</span>
																	) : (
																		<input 
																			type="number" 
																			value={draft.water.current}
																			placeholder="0.0"
																			onChange={(e) => {
																				const newDrafts = [...drafts];
																				const index = drafts.findIndex(d => d.unitId === draft.unitId);
																				newDrafts[index] = { ...newDrafts[index], water: { ...draft.water, current: e.target.value } };
																				setDrafts(newDrafts);
																			}}
																			className="w-24 h-8 rounded-lg border border-border/70 bg-background/80 px-2.5 py-1 text-center font-mono text-xs font-semibold text-sky-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all"
																		/>
																	)}
																</div>
															</div>
															{hasWater && waterUsage > 0 && (
																<span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">
																	+{waterUsage.toFixed(1)} m³ (₱{waterCost.toFixed(2)})
																</span>
															)}
														</div>
													</td>

													{/* Electricity Reading Column */}
													<td className="px-6 py-4">
														<div className="flex flex-col items-center gap-1.5">
															<div className="flex items-center justify-center gap-3">
																<div className="text-center">
																	<span className="text-[9px] block text-muted-foreground uppercase font-bold">Prev</span>
																	<span className="font-mono text-xs text-muted-foreground/80 font-medium">{draft.electricity.previous}</span>
																</div>
																<div className="h-6 w-px bg-border/60" />
																<div className="text-center">
																	<span className="text-[9px] block text-amber-400 uppercase font-bold">Curr</span>
																	{draft.electricity.exists ? (
																		<span className="font-mono text-xs font-bold text-amber-400">{draft.electricity.current}</span>
																	) : (
																		<input 
																			type="number" 
																			value={draft.electricity.current}
																			placeholder="0.0"
																			onChange={(e) => {
																				const newDrafts = [...drafts];
																				const index = drafts.findIndex(d => d.unitId === draft.unitId);
																				newDrafts[index] = { ...newDrafts[index], electricity: { ...draft.electricity, current: e.target.value } };
																				setDrafts(newDrafts);
																			}}
																			className="w-24 h-8 rounded-lg border border-border/70 bg-background/80 px-2.5 py-1 text-center font-mono text-xs font-semibold text-amber-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
																		/>
																	)}
																</div>
															</div>
															{hasElec && elecUsage > 0 && (
																<span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
																	+{elecUsage.toFixed(1)} kWh (₱{elecCost.toFixed(2)})
																</span>
															)}
														</div>
													</td>

													{/* Total Estimated Calculation */}
													<td className="px-6 py-4 text-center">
														<div className="flex flex-col items-center">
															<span className="text-sm font-bold text-foreground font-mono">
																₱{(draft.occupancyStatus === "occupied" ? totalEst : (waterCost + elecCost)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
															</span>
															{draft.occupancyStatus === "occupied" ? (
																(waterCost > 0 || elecCost > 0) && (
																	<span className="text-[10px] text-muted-foreground font-medium">
																		Util: +₱{(waterCost + elecCost).toFixed(2)}
																	</span>
																)
															) : (
																<span className="text-[10px] text-muted-foreground font-medium">
																	Submeter Only (Vacant)
																</span>
															)}
														</div>
													</td>

													{/* Row Status & Quick Edit */}
													<td className="px-6 py-4 text-right">
														<div className="flex items-center justify-end gap-2">
															{isComplete ? (
																<span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20" title="Both readings recorded for this cycle">
																	<Check className="size-3" /> Ready
																</span>
															) : (
																<span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/50" title="Pending meter readings">
																	Pending
																</span>
															)}
															<button 
																onClick={() => setSelectedUnitId(draft.unitId)}
																className="inline-flex items-center justify-center size-8 rounded-lg border border-border text-muted-foreground transition-all hover:bg-muted hover:text-foreground cursor-pointer"
																title="Inspect or adjust unit details"
															>
																<Edit3 className="size-3.5" />
															</button>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					</motion.div>
				)}

				{/* Verify Payments Queue Tab */}
				{(activeTab === "verify") && (
					<motion.div 
						key="verify"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="space-y-6"
					>
						{/* Tab Header Banner */}
						<div className="rounded-2xl border border-border/50 bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<h2 className="text-xl font-black text-foreground">Payment Verification Queue</h2>
									<span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
										{pendingInvoices.length} Awaiting Review
									</span>
								</div>
								<p className="text-xs text-muted-foreground">
									Inspect tenant-uploaded GCash screenshots, verify reference numbers, and issue official receipts in one click.
								</p>
							</div>

							<Link 
								href="/landlord/settings?category=Finance"
								className="shrink-0 flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
							>
								<QrCode className="size-3.5 text-primary" />
								<span>Configure Receiving QR</span>
								<ArrowUpRight className="size-3" />
							</Link>
						</div>

						{loadingPendingInvoices ? (
							<div className="flex h-48 items-center justify-center">
								<Loader2 className="size-8 animate-spin text-primary" />
							</div>
						) : pendingInvoices.length === 0 ? (
							<div className="rounded-3xl border border-dashed border-border/80 bg-muted/5 p-12 text-center flex flex-col items-center justify-center space-y-4">
								<div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
									<CheckCircle2 className="size-7" />
								</div>
								<div className="space-y-1">
									<h3 className="text-lg font-black text-foreground">All Caught Up!</h3>
									<p className="text-xs text-muted-foreground max-w-sm mx-auto">
										There are no tenant payments currently awaiting verification. Incoming GCash transaction proofs will appear here automatically.
									</p>
								</div>
								<Link 
									href="/landlord/invoices" 
									className="mt-2 text-xs font-bold text-primary hover:underline flex items-center gap-1"
								>
									<span>View Full Finance Ledger</span>
									<ChevronRight className="size-3" />
								</Link>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{pendingInvoices.map((inv) => (
									<div 
										key={inv.id}
										className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 hover:border-primary/40 transition-all shadow-sm"
									>
										<div className="flex items-start justify-between gap-3">
											<div>
												<span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
													{inv.invoiceNumber}
												</span>
												<h4 className="text-base font-black text-foreground mt-0.5">{inv.tenant}</h4>
												<p className="text-xs text-muted-foreground">{inv.unit} • {inv.property}</p>
											</div>
											<div className="text-right">
												<span className="text-lg font-black text-foreground font-mono">
													₱{inv.amount.toLocaleString()}
												</span>
												<span className="block text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full mt-1">
													Needs Verification
												</span>
											</div>
										</div>

										<div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
											<div className="flex items-center gap-2">
												<span className="text-muted-foreground">Method:</span>
												<span className="font-bold text-foreground capitalize">{inv.paymentMethod || "GCash"}</span>
												{inv.referenceNumber && (
													<span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded text-foreground font-bold">
														Ref: {inv.referenceNumber}
													</span>
												)}
											</div>

											<button
												onClick={() => setActiveVerifyInvoiceId(inv.id)}
												className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm cursor-pointer"
											>
												<ShieldCheck className="size-3.5" />
												<span>Review & Confirm</span>
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</motion.div>
				)}

				{/* Rates Tab */}
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

				{/* History Tab */}
				{activeTab === "history" && (
					<motion.div 
						key="history"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="space-y-12"
					>
						{/* Hero Header */}
						<div className="relative overflow-hidden rounded-[2.5rem] neumorphic-panel p-8 md:p-10">
							<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
								<div className="space-y-2">
									<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
										<BarChart3 className="size-3" />
										Billing Archives
									</div>
									<h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Audit Trail & Consumption History</h3>
									<p className="text-xs md:text-sm text-muted-foreground max-w-md leading-relaxed font-medium">
										Review past billing cycles, inspect historical consumption logs, and track utility recovery rates across your portfolio.
									</p>
								</div>
								<div className="flex items-center gap-3">
									<Link 
										href="/landlord/invoices?tab=ledger"
										className="h-11 px-5 rounded-2xl bg-foreground text-background text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
									>
										<span>Full Financial Ledger</span>
										<ArrowUpRight className="size-3.5" />
									</Link>
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<div className="flex items-center gap-4 px-2 mb-2">
								<span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 whitespace-nowrap">Cycle Logs</span>
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
											className="group relative w-full grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-5 rounded-2xl neumorphic-panel hover:border-primary/40 hover:bg-primary/[0.01] active:scale-[0.99] text-left transition-all cursor-pointer"
										>
											{/* Date Block */}
											<div className="md:col-span-3 flex items-center gap-4">
												<div className="size-14 flex items-center justify-center rounded-xl neumorphic-inset group-hover:border-primary/20 group-hover:bg-primary/5 transition-all shrink-0">
													<div className="text-center">
														<p className="text-[9px] font-black uppercase leading-none text-muted-foreground group-hover:text-primary transition-colors">{monthLabel}</p>
														<p className="text-lg font-black mt-0.5 text-foreground">{yearLabel}</p>
													</div>
												</div>
												<div>
													<h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
														{reportTitle}
													</h4>
													<span className={cn(
														"inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider mt-1",
														isCurrentMonth 
															? "bg-blue-500/10 text-blue-600" 
															: hasData 
																? "bg-emerald-500/10 text-emerald-600" 
																: "bg-muted text-muted-foreground"
													)}>
														{isCurrentMonth ? "Active Cycle" : hasData ? "Closed" : "No Readings"}
													</span>
												</div>
											</div>

											{/* Metrics */}
											<div className="md:col-span-7 flex items-center gap-8">
												<div>
													<span className="text-[9px] font-bold text-muted-foreground uppercase block">Electricity</span>
													<span className="text-xs font-black text-foreground font-mono">
														{historySummariesLoading ? "..." : `${totalElec.toFixed(1)} kWh`}
													</span>
												</div>
												<div>
													<span className="text-[9px] font-bold text-muted-foreground uppercase block">Water</span>
													<span className="text-xs font-black text-foreground font-mono">
														{historySummariesLoading ? "..." : `${totalWater.toFixed(1)} m³`}
													</span>
												</div>
												<div>
													<span className="text-[9px] font-bold text-muted-foreground uppercase block">Units Logged</span>
													<span className="text-xs font-black text-foreground font-mono">
														{historySummariesLoading ? "..." : `${readingCount} records`}
													</span>
												</div>
											</div>

											{/* Action Arrow */}
											<div className="md:col-span-2 flex justify-end">
												<div className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-all">
													<ChevronRight className="size-4" />
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

			{/* Unit Detail Modal */}
			<UnitDetailModal 
				isOpen={!!selectedUnitId} 
				onClose={() => setSelectedUnitId(null)} 
				draft={activeDraft} 
				onUpdate={(patch) => {
					if (!selectedUnitId) return;
					const newDrafts = [...drafts];
					const idx = newDrafts.findIndex(d => d.unitId === selectedUnitId || (d.leaseId && d.leaseId === selectedUnitId));
					if (idx !== -1) {
						newDrafts[idx] = { ...newDrafts[idx], ...patch };
						setDrafts(newDrafts);
					}
				}}
				onSave={() => {
					if (selectedUnitId) {
						handleSaveSingleUnit(selectedUnitId);
					}
				}}
				saving={saving}
			/>

			{/* History Audit Breakdown Modal */}
			<AuditDetailModal 
				isOpen={!!selectedHistoryMonth} 
				onClose={() => setSelectedHistoryMonth(null)} 
				month={selectedHistoryMonth} 
			/>

			{/* Verification Invoice Modal */}
			{activeVerifyInvoiceId && (
				<InvoiceModal 
					invoiceId={activeVerifyInvoiceId}
					onClose={() => setActiveVerifyInvoiceId(null)}
					onUpdated={() => {
						fetchPendingInvoices();
						fetchData();
					}}
				/>
			)}
		</div>
	);
}

function UnitDetailModal({ 
	isOpen, 
	onClose, 
	draft, 
	onUpdate,
	onSave,
	saving
}: { 
	isOpen: boolean;
	onClose: () => void;
	draft?: ReadingDraft;
	onUpdate: (p: Partial<ReadingDraft>) => void;
	onSave?: () => void;
	saving?: boolean;
}) {
	if (!draft) return null;

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10">
					<motion.div 
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-black/50 backdrop-blur-sm"
						onClick={onClose}
					/>
					<motion.div 
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						className="relative h-full max-h-[85vh] w-full max-w-2xl overflow-hidden neumorphic-panel flex flex-col rounded-3xl dark:bg-[#1E1E1E]"
					>
						{/* Modal Header */}
						<div className="flex items-center justify-between border-b border-border/40 p-6 md:px-8">
							<div className="flex items-center gap-4">
								<div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
									<Building2 className="size-6" />
								</div>
								<div>
									<h2 className="text-xl font-black text-foreground">{draft.unitName}</h2>
									<p className="text-xs text-muted-foreground">Unit Billing & Submeter Profile</p>
								</div>
							</div>
							<button 
								onClick={onClose} 
								className="size-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted transition-all"
							>
								<X className="size-5" />
							</button>
						</div>

						{/* Modal Content */}
						<div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="rounded-2xl neumorphic-inset p-5">
									<span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Base Monthly Rent</span>
									<div className="flex items-baseline gap-1.5">
										<span className="text-lg font-black text-muted-foreground">₱</span>
										<input 
											type="number" 
											value={draft.rentAmount}
											onChange={(e) => onUpdate({ rentAmount: parseFloat(e.target.value) || 0 })}
											className="bg-transparent text-2xl font-black text-foreground outline-none w-full focus:text-primary font-mono"
										/>
									</div>
								</div>
								<div className={`rounded-2xl p-5 flex flex-col justify-center ${
									draft.occupancyStatus === "occupied"
										? "bg-emerald-500/[0.05] border border-emerald-500/20"
										: "bg-muted/40 border border-border"
								}`}>
									<div className="flex items-center gap-2">
										<div className={`size-2 rounded-full ${draft.occupancyStatus === "occupied" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/60"}`} />
										<span className={`text-[10px] font-black uppercase tracking-wider ${draft.occupancyStatus === "occupied" ? "text-emerald-600" : "text-muted-foreground"}`}>
											{draft.occupancyStatus === "occupied" ? "Lease Status" : "Unit Status"}
										</span>
									</div>
									<span className="text-base font-black text-foreground mt-1">
										{draft.occupancyStatus === "occupied"
											? (draft.tenantName ? `Active Tenant: ${draft.tenantName}` : "Active Tenant Occupancy")
											: "Vacant Unit (No Active Tenant)"}
									</span>
								</div>
							</div>

							<ResourceSection 
								type="water"
								label="Water Submeter"
								icon={Droplets}
								colorClass="sky"
								draft={draft.water}
								onUpdate={(patch) => onUpdate({ water: { ...draft.water, ...patch } })}
							/>

							<ResourceSection 
								type="electricity"
								label="Electricity Submeter"
								icon={Zap}
								colorClass="amber"
								draft={draft.electricity}
								onUpdate={(patch) => onUpdate({ electricity: { ...draft.electricity, ...patch } })}
							/>
						</div>

						{/* Modal Footer */}
						<div className="border-t border-border p-6 md:px-8 neumorphic-inset flex items-center gap-3">
							<button
								type="button"
								onClick={onClose}
								className="flex-1 py-3.5 rounded-2xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-all"
							>
								Cancel
							</button>
							<button 
								type="button"
								onClick={onSave || onClose}
								disabled={saving}
								className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 cursor-pointer"
							>
								{saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
								<span>Save & Bill This Unit</span>
							</button>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}

function ResourceSection({ 
	label, 
	icon: Icon, 
	colorClass, 
	draft, 
	onUpdate 
}: { 
	type: string;
	label: string; 
	icon: React.ElementType; 
	colorClass: string;
	draft: {
		previous: number;
		current: string;
		exists: boolean;
		rate: number;
	};
	onUpdate: (patch: Partial<{
		previous: number;
		current: string;
		exists: boolean;
		rate: number;
	}>) => void;
}) {
	const isSky = colorClass === "sky";
	const bgClass = isSky ? "dark:border-sky-500/10" : "dark:border-amber-500/10";
	const accentClass = isSky ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400";

	const prev = draft.previous || 0;
	const curr = parseFloat(draft.current);
	const hasValidDelta = !isNaN(curr) && curr >= prev;
	const usage = hasValidDelta ? curr - prev : 0;
	const cost = usage * (draft.rate || 0);

	return (
		<div className="space-y-3">
			<div className={cn("flex items-center justify-between", accentClass)}>
				<div className="flex items-center gap-2">
					<Icon className="size-4" />
					<h3 className="text-xs font-black uppercase tracking-wider">{label}</h3>
				</div>
				{hasValidDelta && usage > 0 && (
					<span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded text-foreground">
						+{usage.toFixed(1)} {isSky ? "m³" : "kWh"} = ₱{cost.toFixed(2)}
					</span>
				)}
			</div>
			<div className={cn("grid grid-cols-1 md:grid-cols-5 gap-4 rounded-2xl neumorphic-panel p-5 overflow-hidden border border-border/40", bgClass)}>
				<div className="md:col-span-3 space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Previous</label>
							<input 
								type="number" 
								value={draft.previous}
								onChange={(e) => onUpdate({ previous: parseFloat(e.target.value) || 0 })}
								className="w-full rounded-xl neumorphic-panel px-3 py-2 text-xs font-mono font-bold outline-none focus:border-primary"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Current</label>
							<input 
								type="number" 
								value={draft.current}
								placeholder="Enter reading..."
								onChange={(e) => onUpdate({ current: e.target.value })}
								className={cn("w-full rounded-xl neumorphic-panel px-3 py-2 text-xs font-mono font-black outline-none focus:border-primary", accentClass)}
							/>
						</div>
					</div>
				</div>

				<div className="md:col-span-2 flex flex-col justify-center">
					<div className="text-center p-3 rounded-xl neumorphic-panel border border-border/40">
						<span className={cn("text-[9px] font-black uppercase tracking-widest block opacity-80", accentClass)}>Tariff Rate</span>
						<div className="flex items-center justify-center gap-1 mt-1">
							<span className="text-sm font-black text-muted-foreground">₱</span>
							<input 
								type="number" 
								value={draft.rate}
								step="0.01"
								onChange={(e) => onUpdate({ rate: parseFloat(e.target.value) || 0 })}
								className="w-16 bg-transparent text-center text-lg font-black font-mono tracking-tight outline-none focus:text-primary"
							/>
							<span className="text-[10px] font-bold text-muted-foreground">{isSky ? "/ m³" : "/ kWh"}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function AuditDetailModal({ isOpen, onClose, month }: { isOpen: boolean; onClose: () => void; month: string | null }) {
	type AuditRecord = {
		unit_name: string;
		tenant_name: string;
		utility_type: string;
		previous_reading: number;
		current_reading: number;
		usage: number;
		billed_rate: number;
		computed_charge: number;
		entered_at: string;
	};

	const [loading, setLoading] = useState(false);
	const [records, setRecords] = useState<AuditRecord[]>([]);

	useEffect(() => {
		if (!isOpen || !month) return;
		let alive = true;
		const load = async () => {
			setLoading(true);
			try {
				const res = await fetch(`/api/landlord/utility-readings?month=${month}`);
				if (!res.ok) throw new Error();
				const json = await res.json();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const mapped: AuditRecord[] = (json.readings || []).map((r: any) => ({
					unit_name: r.unit?.name || r.unit_id || "Unknown Unit",
					tenant_name: r.lease?.tenant?.full_name || "Unknown Tenant",
					utility_type: r.utility_type,
					previous_reading: r.previous_reading,
					current_reading: r.current_reading,
					usage: Math.max(0, (r.current_reading || 0) - (r.previous_reading || 0)),
					billed_rate: r.billed_rate || 0,
					computed_charge: r.computed_charge || 0,
					entered_at: r.entered_at || r.created_at,
				}));
				if (alive) setRecords(mapped);
			} catch (e) {
				console.error(e);
			} finally {
				if (alive) setLoading(false);
			}
		};
		load();
		return () => { alive = false; };
	}, [isOpen, month]);

	if (!isOpen || !month) return null;

	const [y, m] = month.split("-").map(Number);
	const dateObj = new Date(y, m - 1);
	const monthFormatted = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });

	let totalElec = 0;
	let totalWater = 0;
	let totalCost = 0;
	records.forEach((r) => {
		if (r.utility_type === "electricity") totalElec += r.usage;
		else if (r.utility_type === "water") totalWater += r.usage;
		totalCost += r.computed_charge;
	});

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10">
				<motion.div 
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="absolute inset-0 bg-black/60 backdrop-blur-sm"
					onClick={onClose}
				/>
				<motion.div 
					initial={{ opacity: 0, scale: 0.95, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 20 }}
					className="relative h-full max-h-[85vh] w-full max-w-4xl overflow-hidden neumorphic-panel flex flex-col rounded-3xl"
				>
					{/* Modal Header */}
					<div className="flex items-center justify-between border-b border-border p-6 md:px-8">
						<div className="flex items-center gap-4">
							<div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
								<History className="size-6" />
							</div>
							<div>
								<h2 className="text-xl font-black text-foreground">{monthFormatted} Breakdown</h2>
								<p className="text-xs text-muted-foreground">Historical Audit Record</p>
							</div>
						</div>
						<button 
							onClick={onClose} 
							className="size-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted transition-all"
						>
							<X className="size-5" />
						</button>
					</div>

					{/* Modal Content */}
					<div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
						{/* Summary Stats */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="rounded-2xl neumorphic-panel p-5">
								<span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Electricity</span>
								<div className="mt-2 flex items-baseline gap-2">
									<span className="text-2xl font-black text-amber-500 font-mono">{totalElec.toFixed(1)}</span>
									<span className="text-xs font-black text-muted-foreground">kWh</span>
								</div>
							</div>
							<div className="rounded-2xl neumorphic-panel p-5">
								<span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Water</span>
								<div className="mt-2 flex items-baseline gap-2">
									<span className="text-2xl font-black text-sky-500 font-mono">{totalWater.toFixed(1)}</span>
									<span className="text-xs font-black text-muted-foreground">m³</span>
								</div>
							</div>
							<div className="rounded-2xl neumorphic-panel p-5">
								<span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Billed</span>
								<div className="mt-2 flex items-baseline gap-1">
									<span className="text-xs font-black text-muted-foreground">₱</span>
									<span className="text-2xl font-black text-foreground font-mono">{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
								</div>
							</div>
						</div>

						{/* Breakdown Table */}
						{loading ? (
							<div className="flex h-48 items-center justify-center">
								<Loader2 className="size-8 animate-spin text-primary" />
							</div>
						) : (
							<div className="rounded-2xl neumorphic-panel overflow-hidden border border-border">
								<table className="w-full text-left border-collapse text-xs">
									<thead>
										<tr className="border-b border-border bg-muted/20">
											<th className="px-6 py-4 font-bold text-muted-foreground">Unit</th>
											<th className="px-6 py-4 font-bold text-muted-foreground">Type</th>
											<th className="px-6 py-4 font-bold text-muted-foreground text-center">Prev</th>
											<th className="px-6 py-4 font-bold text-muted-foreground text-center">Curr</th>
											<th className="px-6 py-4 font-bold text-muted-foreground text-center">Usage</th>
											<th className="px-6 py-4 font-bold text-muted-foreground text-right">Charge</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border font-mono">
										{records.length === 0 ? (
											<tr>
												<td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-sans">
													No utility readings recorded for this cycle.
												</td>
											</tr>
										) : records.map((r, idx) => (
											<tr key={idx} className="hover:bg-muted/10">
												<td className="px-6 py-3 font-sans font-bold text-foreground">{r.unit_name}</td>
												<td className="px-6 py-3 font-sans capitalize">
													{r.utility_type === "water" ? (
														<span className="text-sky-600 font-bold">Water</span>
													) : (
														<span className="text-amber-600 font-bold">Electric</span>
													)}
												</td>
												<td className="px-6 py-3 text-center text-muted-foreground">{r.previous_reading}</td>
												<td className="px-6 py-3 text-center text-foreground font-bold">{r.current_reading}</td>
												<td className="px-6 py-3 text-center text-foreground font-bold">{r.usage.toFixed(1)}</td>
												<td className="px-6 py-3 text-right text-foreground font-bold">₱{r.computed_charge.toFixed(2)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>

					{/* Modal Footer */}
					<div className="border-t border-border p-6 md:px-8 neumorphic-inset flex justify-end">
						<button 
							onClick={onClose}
							className="px-6 py-3 rounded-2xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-all"
						>
							Close
						</button>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
}
