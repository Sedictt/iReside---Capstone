"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
	ExternalLink,
	ArrowRight,
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	Compass,
	Layers
} from "lucide-react";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FieldError, fieldErrorClass } from "@/components/ui/field-error";
import { parseNumericInput } from "@/lib/validation/rules";
import { currentReadingRule } from "@/lib/validation/schemas/billing.schema";

type ReadingDraftCell = { previous: number; current: string; exists?: boolean };

/** Inline error for a not-yet-recorded meter reading (blank = not entered, which is allowed). */
function readingCellError(cell: ReadingDraftCell, label: string) {
	if (cell.exists) return undefined;
	return currentReadingRule(cell.current, cell.previous, { label, required: false });
}
import { useProperty } from "@/context/PropertyContext";
import { useLanguageContext } from "@/context/LanguageContext";
import { tr } from "@/hooks/useLanguage";
import { useLandlordSetup } from "@/hooks/useLandlordSetup";
import type { BillingWorkspace, InvoiceListItem } from "@/lib/billing/server";
import { BillingOperationsPanel } from "@/components/landlord/BillingOperationsPanel";
import { InvoiceModal } from "@/components/landlord/invoices/InvoiceModal";
import { OfflineStorage } from "@/lib/offline/offlineStorage";
import { mutationQueue } from "@/lib/offline/mutationQueue";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { UtilityBillingOnboardingModal } from "@/components/landlord/utility/UtilityBillingOnboardingModal";
import { UtilityBillingTourSpotlight } from "@/components/landlord/utility/UtilityBillingTourSpotlight";
import { UtilityBillingCompletionModal } from "@/components/landlord/utility/UtilityBillingCompletionModal";
import { paymentMethodLabel } from "@/lib/billing/payment-methods";

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

function getPreviousMonthString(monthStr: string): string {
	const [yearStr, monthStrPart] = monthStr.split("-");
	const year = parseInt(yearStr, 10);
	const month = parseInt(monthStrPart, 10);
	if (month === 1) {
		return `${year - 1}-12`;
	}
	return `${year}-${String(month - 1).padStart(2, "0")}`;
}

function resolvePreviousReading({
	targetMonth,
	unitId,
	leaseId,
	utilityType,
	allReadings,
	monthlyDrafts,
}: {
	targetMonth: string;
	unitId: string;
	leaseId: string | null;
	utilityType: "water" | "electricity";
	allReadings: any[];
	monthlyDrafts: Record<string, ReadingDraft[]>;
}): number {
	// 1. Check in-memory drafts for prior months (iterating backwards from previous month)
	let checkMonth = targetMonth;
	for (let i = 0; i < 12; i++) {
		checkMonth = getPreviousMonthString(checkMonth);
		const draftsForMonth = monthlyDrafts[checkMonth];
		if (draftsForMonth) {
			const d = draftsForMonth.find(
				(item) => item.unitId === unitId || (leaseId && item.leaseId === leaseId)
			);
			if (d) {
				const util = utilityType === "water" ? d.water : d.electricity;
				const parsed = parseFloat(util.current);
				if (!isNaN(parsed) && parsed >= 0 && util.current.trim() !== "") {
					return parsed;
				}
			}
		}
	}

	// 2. Look in recorded readings strictly before targetMonth (chronological)
	const priorReadings = (allReadings || [])
		.filter((r: any) => {
			const matchesUnit = r.unit_id === unitId || (leaseId && r.lease_id === leaseId);
			const matchesType = r.utility_type === utilityType;
			const periodStartMonth = (r.billing_period_start || "").slice(0, 7);
			return matchesUnit && matchesType && periodStartMonth < targetMonth;
		})
		.sort((a: any, b: any) => {
			const timeA = new Date(a.billing_period_end || a.billing_period_start || a.created_at).getTime();
			const timeB = new Date(b.billing_period_end || b.billing_period_start || b.created_at).getTime();
			return timeB - timeA; // Most recent prior reading first
		});

	if (priorReadings.length > 0) {
		return Number(priorReadings[0].current_reading) || 0;
	}

	return 0;
}

function resolveUtilityItem({
	targetMonth,
	unitId,
	leaseId,
	utilityType,
	readingsData,
	allReadings,
	monthlyDrafts,
	rate,
}: {
	targetMonth: string;
	unitId: string;
	leaseId: string | null;
	utilityType: "water" | "electricity";
	readingsData: { readings?: any[] };
	allReadings: any[];
	monthlyDrafts: Record<string, ReadingDraft[]>;
	rate: number;
}) {
	const currentReading = (readingsData?.readings || []).find(
		(r: any) => (r.unit_id === unitId || (leaseId && r.lease_id === leaseId)) && r.utility_type === utilityType
	);

	const existingDraft = monthlyDrafts[targetMonth]?.find(
		(d) => d.unitId === unitId || (leaseId && d.leaseId === leaseId)
	);
	const existingUtil = utilityType === "water" ? existingDraft?.water : existingDraft?.electricity;

	const resolvedPrior = resolvePreviousReading({
		targetMonth,
		unitId,
		leaseId,
		utilityType,
		allReadings,
		monthlyDrafts,
	});

	if (currentReading) {
		const recordedPrev = Number(currentReading.previous_reading) || 0;
		return {
			previous: recordedPrev > 0 ? recordedPrev : (resolvedPrior || 0),
			current: currentReading.current_reading !== undefined && currentReading.current_reading !== null 
				? currentReading.current_reading.toString() 
				: (existingUtil?.current || ""),
			exists: true,
			rate,
		};
	}

	return {
		previous: existingUtil && existingUtil.previous !== undefined && existingUtil.previous !== 0 && resolvedPrior === 0
			? existingUtil.previous
			: resolvedPrior,
		current: existingUtil?.current || "",
		exists: false,
		rate,
	};
}

function buildDraftsFromWorkspace(
	workspaceData: BillingWorkspace,
	readingsData: { readings?: any[] },
	allReadings: any[],
	targetMonth: string,
	monthlyDrafts: Record<string, ReadingDraft[]> = {}
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

			const waterRate = unitWaterConfig?.rate_per_unit || propertyWaterConfig?.rate_per_unit || 0;
			const elecRate = unitElecConfig?.rate_per_unit || propertyElecConfig?.rate_per_unit || 0;

			draftsList.push({
				unitId: unit.id,
				unitName: unit.name || tr("Unknown Unit"),
				propertyId: property.id || "",
				propertyName: property.name || "",
				leaseId,
				tenantName: activeLease?.tenant?.full_name || null,
				occupancyStatus,
				rentAmount: activeLease?.monthly_rent ?? unit.rent_amount ?? 0,
				water: resolveUtilityItem({
					targetMonth,
					unitId: unit.id,
					leaseId,
					utilityType: "water",
					readingsData,
					allReadings,
					monthlyDrafts,
					rate: waterRate,
				}),
				electricity: resolveUtilityItem({
					targetMonth,
					unitId: unit.id,
					leaseId,
					utilityType: "electricity",
					readingsData,
					allReadings,
					monthlyDrafts,
					rate: elecRate,
				}),
			});
		});
	});

	// 2. Include any active lease whose unit might not have been returned in property.units
	(workspaceData.activeLeases || []).forEach((lease: any) => {
		if (lease.unit?.id && !seenUnitIds.has(lease.unit.id)) {
			seenUnitIds.add(lease.unit.id);

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

			const waterRate = unitWaterConfig?.rate_per_unit || propertyWaterConfig?.rate_per_unit || 0;
			const elecRate = unitElecConfig?.rate_per_unit || propertyElecConfig?.rate_per_unit || 0;

			draftsList.push({
				unitId: lease.unit.id,
				unitName: lease.unit.name || tr("Unknown Unit"),
				propertyId: lease.property?.id || "",
				propertyName: lease.property?.name || "",
				leaseId: lease.id,
				tenantName: lease.tenant?.full_name || null,
				occupancyStatus: "occupied",
				rentAmount: lease.monthly_rent || 0,
				water: resolveUtilityItem({
					targetMonth,
					unitId: lease.unit.id,
					leaseId: lease.id,
					utilityType: "water",
					readingsData,
					allReadings,
					monthlyDrafts,
					rate: waterRate,
				}),
				electricity: resolveUtilityItem({
					targetMonth,
					unitId: lease.unit.id,
					leaseId: lease.id,
					utilityType: "electricity",
					readingsData,
					allReadings,
					monthlyDrafts,
					rate: elecRate,
				}),
			});
		}
	});

	draftsList.sort((a, b) => a.unitName.localeCompare(b.unitName, undefined, { numeric: true, sensitivity: "base" }));
	return draftsList;
}

export function UtilityBillingDashboard() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { t, locale } = useLanguageContext();
	const { selectedPropertyId: globalPropertyId, properties, updateSetupStep } = useProperty();
	const setup = useLandlordSetup();
	const [activeTab, setActiveTab] = useState<"readings" | "verify" | "rates" | "history">("readings");
	const [workspace, setWorkspace] = useState<BillingWorkspace | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	/** Reading cells (`${unitId}:water|electricity`) the user has left, so errors only show after blur. */
	const [touchedReadings, setTouchedReadings] = useState<Record<string, boolean>>({});
	const touchReading = (key: string) => setTouchedReadings((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<"all" | "occupied" | "vacant" | "needs_reading" | "recorded">("occupied");
	/** Senior-friendly default: guide one room at a time with paginated unit navigation. */
	const [viewMode, setViewMode] = useState<"guided" | "list">("guided");
	const [guidedRoomIndex, setGuidedRoomIndex] = useState(0);
	const [listPage, setListPage] = useState(0);
	const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("saved");
	const [isConfirmSendOpen, setIsConfirmSendOpen] = useState(false);
	const [liveErrorAnnouncement, setLiveErrorAnnouncement] = useState("");
	const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
	const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
	const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<string | null>(null);

	// Incoming Payments Verification Queue State
	const [pendingInvoices, setPendingInvoices] = useState<InvoiceListItem[]>([]);
	const [loadingPendingInvoices, setLoadingPendingInvoices] = useState(false);
	const [activeVerifyInvoiceId, setActiveVerifyInvoiceId] = useState<string | null>(null);
	const [isRatesDirty, setIsRatesDirty] = useState(false);

	// History summary data per month
	type MonthSummary = { totalElec: number; totalWater: number; readingCount: number };
	const [historySummaries, setHistorySummaries] = useState<Record<string, MonthSummary>>({});
	const [historySummariesLoading, setHistorySummariesLoading] = useState(false);

	// --- Onboarding & Guided Tour State ---
	// Determines whether the setup greeting has been dismissed for THIS visit (resets on remount)
	const [dismissedThisVisit, setDismissedThisVisit] = useState(false);
	const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
	const [isTourOpen, setIsTourOpen] = useState(false);
	const [tourStepIndex, setTourStepIndex] = useState(0);
	const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

	// Persist the billing rails completion state
	const activePropertyId = (selectedPropertyId && selectedPropertyId !== "all")
		? selectedPropertyId
		: (properties[0]?.id || "default");

	// Billing step state from the shared setup resolver (DB payment destination / rates, tenants, persisted choices)
	const billingStep = setup.steps.find((step) => step.id === "billing");
	const isBillingStepPending = billingStep?.complete === false;
	const isBillingStepDeferred = Boolean(billingStep?.deferred);

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
	const monthlyDraftsRef = useRef<Record<string, ReadingDraft[]>>({});
	const allReadingsRef = useRef<any[]>([]);

	// Hydrate in-memory drafts cache from offline storage on mount
	useEffect(() => {
		try {
			const cached = OfflineStorage.get<Record<string, ReadingDraft[]>>("utility_monthly_drafts")?.data;
			if (cached && typeof cached === "object") {
				monthlyDraftsRef.current = cached;
			}
		} catch (e) {
			console.warn("Failed to load cached monthly drafts", e);
		}
	}, []);

	// --- Onboarding greeting ---
	// Show the orientation modal only while the billing step is known to be incomplete and has not
	// been postponed. Unknown state (loading / failed request) never opens it; a postponed step
	// shows the inline reminder banner instead of interrupting.
	useEffect(() => {
		if (!isBillingStepPending || isBillingStepDeferred || dismissedThisVisit) {
			setIsOnboardingModalOpen(false);
			return;
		}
		const timer = setTimeout(() => {
			setIsOnboardingModalOpen(true);
		}, 600);
		return () => clearTimeout(timer);
	}, [isBillingStepPending, isBillingStepDeferred, dismissedThisVisit]);

	// Helper to update both state and monthly draft cache with reassuring auto-save feedback
	const updateDraftsAndCache = useCallback((newDrafts: ReadingDraft[]) => {
		setDrafts(newDrafts);
		monthlyDraftsRef.current[selectedMonth] = newDrafts;
		setAutoSaveStatus("saving");
		if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
		autosaveTimerRef.current = setTimeout(() => {
			setAutoSaveStatus("saved");
		}, 400);
		try {
			OfflineStorage.set("utility_monthly_drafts", monthlyDraftsRef.current, null, "utility");
		} catch (e) {
			// Storage quota safety
		}
	}, [selectedMonth]);

	const sanitizeMeterInput = useCallback((raw: string): string => {
		const stripped = raw.replace(/[^0-9.]/g, "");
		const parts = stripped.split(".");
		const normalized = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : stripped;
		return normalized.slice(0, 10);
	}, []);

	const handleMeterValueChange = useCallback((unitId: string, utilityType: "water" | "electricity", rawValue: string) => {
		const cleaned = sanitizeMeterInput(rawValue);
		const index = drafts.findIndex((d) => d.unitId === unitId);
		if (index === -1) return;
		const target = drafts[index];
		const updatedCell = {
			...target[utilityType],
			current: cleaned,
			exists: false,
		};
		const newDrafts = [...drafts];
		newDrafts[index] = {
			...target,
			[utilityType]: updatedCell,
		};
		updateDraftsAndCache(newDrafts);

		const label = utilityType === "water" ? "Water reading" : "Electricity reading";
		if (!readingCellError(updatedCell, label)) {
			if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
			setLiveErrorAnnouncement("");
		}
	}, [drafts, sanitizeMeterInput, updateDraftsAndCache]);

	const handleMeterFieldBlur = useCallback((draft: ReadingDraft, utilityType: "water" | "electricity") => {
		const key = `${draft.unitId}:${utilityType}`;
		touchReading(key);
		const cell = draft[utilityType];
		const label = utilityType === "water" ? "Water reading" : "Electricity reading";
		const err = readingCellError(cell, label);
		if (err) {
			if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
			setLiveErrorAnnouncement("");
			announceTimerRef.current = setTimeout(() => {
				setLiveErrorAnnouncement(`${draft.unitName} ${label}: ${err}`);
			}, 500);
		}
	}, []);

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);

			// Attempt live fetch if online
			if (typeof navigator !== "undefined" && navigator.onLine) {
				const [workspaceRes, readingsRes] = await Promise.all([
					fetch("/api/landlord/payment-settings", { cache: "no-store" }),
					fetch(`/api/landlord/utility-readings?month=${selectedMonth}&_t=${Date.now()}`, { cache: "no-store" })
				]);

				if (workspaceRes.ok && readingsRes.ok) {
					const workspaceData = await workspaceRes.json();
					const readingsData = await readingsRes.json();
					setWorkspace(workspaceData);

					const latestRes = await fetch(`/api/landlord/utility-readings?_t=${Date.now()}`, { cache: "no-store" });
					const latestData = latestRes.ok ? await latestRes.json() : { readings: [] };
					const allReadings = latestData.readings || [];
					allReadingsRef.current = allReadings;

					// Cache snapshots locally for offline use
					OfflineStorage.set("utility_workspace", workspaceData, null, "utility");
					OfflineStorage.set(`utility_readings_${selectedMonth}`, readingsData, null, "utility");
					OfflineStorage.set("utility_all_readings", latestData, null, "utility");

					const newDrafts = buildDraftsFromWorkspace(
						workspaceData,
						readingsData,
						allReadings,
						selectedMonth,
						monthlyDraftsRef.current
					);
					setDrafts(newDrafts);
					monthlyDraftsRef.current[selectedMonth] = newDrafts;
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
				allReadingsRef.current = allReadings;

				setWorkspace(workspaceData);

				const newDrafts = buildDraftsFromWorkspace(
					workspaceData,
					readingsData,
					allReadings,
					selectedMonth,
					monthlyDraftsRef.current
				);
				setDrafts(newDrafts);
				monthlyDraftsRef.current[selectedMonth] = newDrafts;
				if (typeof navigator !== "undefined" && !navigator.onLine) {
					toast.info(t("Offline Mode: Hydrated utility records and rates from local cache."));
				}
			} else {
				if (typeof navigator !== "undefined" && !navigator.onLine) {
					toast.error(t("Offline: No local utility cache found."));
				} else {
					toast.error(t("Failed to load billing information"));
				}
			}
		} catch (err) {
			console.error(err);
			const cachedWorkspace = OfflineStorage.get<BillingWorkspace>("utility_workspace");
			if (cachedWorkspace?.data) {
				setWorkspace(cachedWorkspace.data);
				if (typeof navigator !== "undefined" && !navigator.onLine) {
					toast.info(t("Loaded cached utility workspace offline."));
				}
			} else {
				toast.error(t("Failed to load billing information"));
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

	// Compute filter pill counts for current property scope
	const filterCounts = useMemo(() => {
		const propertyDrafts = drafts.filter(d => selectedPropertyId === "all" || d.propertyId === selectedPropertyId);
		let occupied = 0;
		let vacant = 0;
		let needsReading = 0;
		let recorded = 0;

		propertyDrafts.forEach(d => {
			const isOccupied = d.occupancyStatus === "occupied";
			if (isOccupied) occupied++;
			else vacant++;

			const waterPrev = d.water.previous || 0;
			const waterCurr = parseFloat(d.water.current);
			const hasWater = !isNaN(waterCurr) && waterCurr >= waterPrev;
			const elecPrev = d.electricity.previous || 0;
			const elecCurr = parseFloat(d.electricity.current);
			const hasElec = !isNaN(elecCurr) && elecCurr >= elecPrev;
			const isComplete = (d.water.exists || hasWater) && (d.electricity.exists || hasElec);

			if (isComplete) recorded++;
			else needsReading++;
		});

		return {
			all: propertyDrafts.length,
			occupied,
			vacant,
			needsReading,
			recorded,
		};
	}, [drafts, selectedPropertyId]);

	const filteredDrafts = useMemo(() => {
		const hasAnyOccupiedInScope = filterCounts.occupied > 0;
		return drafts.filter(d => {
			const matchesProperty = selectedPropertyId === "all" || d.propertyId === selectedPropertyId;
			const query = searchQuery.toLowerCase().trim();
			const matchesSearch = !query || 
				d.unitName.toLowerCase().includes(query) || 
				(d.tenantName && d.tenantName.toLowerCase().includes(query));

			if (!matchesProperty || !matchesSearch) return false;

			const isOccupied = d.occupancyStatus === "occupied";
			const waterPrev = d.water.previous || 0;
			const waterCurr = parseFloat(d.water.current);
			const hasWater = !isNaN(waterCurr) && waterCurr >= waterPrev;
			const elecPrev = d.electricity.previous || 0;
			const elecCurr = parseFloat(d.electricity.current);
			const hasElec = !isNaN(elecCurr) && elecCurr >= elecPrev;
			const isComplete = (d.water.exists || hasWater) && (d.electricity.exists || hasElec);

			if (filterStatus === "occupied") return hasAnyOccupiedInScope ? isOccupied : true;
			if (filterStatus === "vacant") return !isOccupied;
			if (filterStatus === "needs_reading") return (hasAnyOccupiedInScope ? isOccupied : true) && !isComplete;
			if (filterStatus === "recorded") return (hasAnyOccupiedInScope ? isOccupied : true) && isComplete;
			return true;
		});
	}, [drafts, selectedPropertyId, searchQuery, filterStatus, filterCounts.occupied]);

	const ROOMS_PER_PAGE = 5;

	// Keep guidedRoomIndex and listPage safely clamped when filteredDrafts changes
	useEffect(() => {
		if (guidedRoomIndex >= filteredDrafts.length) {
			setGuidedRoomIndex(Math.max(0, filteredDrafts.length - 1));
		}
		const maxListPage = Math.max(0, Math.ceil(filteredDrafts.length / ROOMS_PER_PAGE) - 1);
		if (listPage > maxListPage) {
			setListPage(maxListPage);
		}
	}, [filteredDrafts.length, guidedRoomIndex, listPage]);

	// Compute real-time progress & consumption totals
	const readingsSummary = useMemo(() => {
		let recordedCount = 0;
		let totalElecKwh = 0;
		let totalWaterM3 = 0;
		let totalEstimatedUtilRevenue = 0;
		let grandTotalEstimated = 0;
		const readyDrafts: ReadingDraft[] = [];
		const missingOccupiedDrafts: ReadingDraft[] = [];

		filteredDrafts.forEach((d) => {
			const waterPrev = d.water.previous || 0;
			const waterCurr = parseFloat(d.water.current);
			const hasWater = d.water.exists || (!isNaN(waterCurr) && waterCurr >= waterPrev && d.water.current.trim() !== "");
			const waterUsage = !isNaN(waterCurr) && waterCurr >= waterPrev ? waterCurr - waterPrev : 0;
			const waterCost = waterUsage * (d.water.rate || 0);

			const elecPrev = d.electricity.previous || 0;
			const elecCurr = parseFloat(d.electricity.current);
			const hasElec = d.electricity.exists || (!isNaN(elecCurr) && elecCurr >= elecPrev && d.electricity.current.trim() !== "");
			const elecUsage = !isNaN(elecCurr) && elecCurr >= elecPrev ? elecCurr - elecPrev : 0;
			const elecCost = elecUsage * (d.electricity.rate || 0);

			const isReady = hasWater && hasElec;

			if (isReady) {
				recordedCount += 1;
				readyDrafts.push(d);
			} else if (d.occupancyStatus === "occupied") {
				missingOccupiedDrafts.push(d);
			}

			totalElecKwh += elecUsage;
			totalWaterM3 += waterUsage;
			totalEstimatedUtilRevenue += waterCost + elecCost;
			grandTotalEstimated += (d.occupancyStatus === "occupied" ? d.rentAmount : 0) + waterCost + elecCost;
		});

		return {
			recordedCount,
			totalUnits: filteredDrafts.length,
			totalElecKwh,
			totalWaterM3,
			totalEstimatedUtilRevenue,
			grandTotalEstimated,
			readyDrafts,
			missingOccupiedDrafts,
		};
	}, [filteredDrafts]);

	// --- Onboarding Handlers ---

	/** Rates or GCash were saved to the database: the billing step is genuinely complete. */
	const handleBillingSaved = () => {
		setIsOnboardingModalOpen(false);
		setIsTourOpen(false);
		setDismissedThisVisit(true);
		setIsCompletionModalOpen(true);
	};

	/**
	 * "Next: Add Tenants" / "Complete Step". Completion only ever comes from saved billing data;
	 * moving on without saving postpones the step (navigation unlocked, dashboard reminder stays).
	 */
	const handleCompleteOnboardingStep = () => {
		if (!isBillingStepPending) {
			handleBillingSaved();
			return;
		}
		try {
			window.localStorage.setItem("ireside.billing_rails_delayed", "true");
			if (activePropertyId && activePropertyId !== "default") {
				window.localStorage.setItem(`ireside.billing_rails_delayed.${activePropertyId}`, "true");
			}
			window.dispatchEvent(new Event("billing-rails-delayed-changed"));
		} catch {}
		void updateSetupStep("billing", "defer");
		setIsOnboardingModalOpen(false);
		setIsTourOpen(false);
		setDismissedThisVisit(true);
		toast.info(t("Billing setup postponed. Save your rates or GCash details anytime to finish this step."));
		router.push("/landlord/tenants");
	};

	const handleProceedToTenantsFromBilling = () => {
		setIsCompletionModalOpen(false);
		router.push("/landlord/tenants");
	};

	const handleContinueExploringBilling = () => {
		setIsCompletionModalOpen(false);
		toast.info(t("You can continue exploring your utility billing workspace. Next up: Configure your tenants."));
	};

	const handleReturnToDashboardFromBilling = () => {
		setIsCompletionModalOpen(false);
		router.push("/landlord/dashboard");
	};

	const handleDismissOnboarding = () => {
		setIsOnboardingModalOpen(false);
		setDismissedThisVisit(true);
	};

	const handleStartTour = () => {
		setIsOnboardingModalOpen(false);
		setDismissedThisVisit(true);
		setTourStepIndex(0);
		setIsTourOpen(true);
	};

	const handleTourNext = () => setTourStepIndex((i) => Math.min(i + 1, 2));
	const handleTourPrev = () => setTourStepIndex((i) => Math.max(i - 1, 0));
	const handleTourClose = () => {
		setIsTourOpen(false);
		setDismissedThisVisit(true);
	};

	// Auto-switch active tab to match current tour step's target
	const TOUR_TAB_MAP: Record<number, "readings" | "rates"> = {
		0: "rates",
		1: "readings",
		2: "readings",
	};
	useEffect(() => {
		if (!isTourOpen) return;
		const targetTab = TOUR_TAB_MAP[tourStepIndex];
		if (targetTab) setActiveTab(targetTab);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tourStepIndex, isTourOpen]);

	// Smooth scroll to top when tour opens or steps advance so target buttons are visible
	useEffect(() => {
		if (isTourOpen) {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [isTourOpen, tourStepIndex]);

	const handleSaveReadings = async (postInvoices: boolean = false) => {
		const toSave: ReadingSaveRequest[] = [];
		const [y, m] = selectedMonth.split("-").map(Number);
		const start = `${selectedMonth}-01`;
		const lastDay = new Date(y, m, 0).getDate();
		const end = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

		const invalidKeys: string[] = [];
		drafts.forEach(d => {
			if (readingCellError(d.water, "Water reading")) invalidKeys.push(`${d.unitId}:water`);
			if (readingCellError(d.electricity, "Electricity reading")) invalidKeys.push(`${d.unitId}:electricity`);
		});
		if (invalidKeys.length > 0) {
			setIsConfirmSendOpen(false);
			setTouchedReadings((prev) => ({ ...prev, ...Object.fromEntries(invalidKeys.map((key) => [key, true])) }));
			const [firstUnitId, firstType] = invalidKeys[0].split(":");
			const invalidRoomIdx = filteredDrafts.findIndex((d) => d.unitId === firstUnitId);
			if (invalidRoomIdx !== -1 && viewMode === "guided") {
				setGuidedRoomIndex(invalidRoomIdx);
			}
			setTimeout(() => {
				const el = document.getElementById(`reading-input-${firstUnitId}-${firstType}`);
				el?.focus();
			}, 60);
			toast.error(t("Fix the highlighted meter readings before saving."));
			return;
		}

		drafts.forEach(d => {
			const targetId = d.leaseId || d.unitId;
			if (!targetId) return;
			if (d.water.current !== "") {
				const val = parseNumericInput(d.water.current) as number;
				if (Number.isFinite(val)) {
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
				const val = parseNumericInput(d.electricity.current) as number;
				if (Number.isFinite(val)) {
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
			toast.info(t("No readings entered yet. Enter meter numbers before saving."));
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

			const updated = drafts.map(d => ({
				...d,
				water: { ...d.water, exists: d.water.current !== "" ? true : d.water.exists },
				electricity: { ...d.electricity, exists: d.electricity.current !== "" ? true : d.electricity.exists },
			}));
			updateDraftsAndCache(updated);

			toast.success(t("Saved {count} readings locally! They will sync automatically when reconnected.", { count: toSave.length }));
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
				throw new Error(errJson.error || t("Save failed with status {status}", { status: res.status }));

			}
			const json = await res.json();
			
			if (postInvoices) {
				const invoiceResult = json.invoiceResult;
				const created = invoiceResult?.created ?? 0;
				const updated = invoiceResult?.updated ?? 0;
				toast.success(t("Saved readings and issued/updated {count} monthly invoices for tenants!", { count: created + updated }));
			} else {
				toast.success(t("Successfully saved {count} submeter readings as draft", { count: toSave.length }));
			}

			// Optimistically mark recorded in local state and cache
			const updated = drafts.map(d => ({
				...d,
				water: { ...d.water, exists: d.water.current !== "" ? true : d.water.exists },
				electricity: { ...d.electricity, exists: d.electricity.current !== "" ? true : d.electricity.exists },
			}));
			updateDraftsAndCache(updated);

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
				const updated = drafts.map(d => ({
					...d,
					water: { ...d.water, exists: d.water.current !== "" ? true : d.water.exists },
					electricity: { ...d.electricity, exists: d.electricity.current !== "" ? true : d.electricity.exists },
				}));
				updateDraftsAndCache(updated);
				toast.success(t("Saved {count} readings offline! Will sync upon reconnection.", { count: toSave.length }));
			} else {
				console.error("[UtilityBilling] Save error:", err);
				toast.error(tr(err.message || t("Failed to save submeter readings")));

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

		const waterError = readingCellError(draft.water, "Water reading");
		const electricityError = readingCellError(draft.electricity, "Electricity reading");
		if (waterError || electricityError) {
			setTouchedReadings((prev) => ({
				...prev,
				...(waterError ? { [`${draft.unitId}:water`]: true } : {}),
				...(electricityError ? { [`${draft.unitId}:electricity`]: true } : {}),
			}));
			toast.error(tr((waterError || electricityError) ?? ""));
			return;
		}

		if (draft.water.current !== "") {
			toSave.push({
				leaseId: readingLeaseId,
				unitId: draft.unitId,
				utilityType: "water",
				billingPeriodStart: start,
				billingPeriodEnd: end,
				previousReading: draft.water.previous,
					currentReading: parseNumericInput(draft.water.current) as number,
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
					currentReading: parseNumericInput(draft.electricity.current) as number,
				note: ""
			});
		}

		if (toSave.length === 0) {
			toast.info(t("Please enter at least one current reading"));
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
				throw new Error(errJson.error || t("Save failed with status {status}", { status: res.status }));

			}
			toast.success(t("Saved and billed readings for {unit}", { unit: draft.unitName }));
			await fetchData();
			await fetchPendingInvoices();
			setSelectedUnitId(null);
		} catch (e: any) {
			console.error("[UtilityBilling] Single unit save error:", e);
			toast.error(tr(e.message || t("Failed to save unit reading")));
		} finally {
			setSaving(false);
		}
	};

	const activeDraft = drafts.find(d => d.unitId === selectedUnitId || (d.leaseId && d.leaseId === selectedUnitId));

	const formattedCycleMonth = useMemo(() => {
		if (!selectedMonth || !selectedMonth.includes("-")) return selectedMonth;
		const [y, m] = selectedMonth.split("-");
		const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
		return date.toLocaleDateString(locale, { month: "short", year: "numeric" });
	}, [selectedMonth, locale]);

	if (loading && !workspace) {
		return (
			<div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
				<Loader2 className="size-10 animate-spin text-primary" />
				<p className="text-sm font-medium text-muted-foreground">{t("Loading utility data...")}</p>
			</div>
		);
	}

	return (
		<>
			{/* Utility Billing Onboarding Greeting Modal */}
			<UtilityBillingOnboardingModal
				isOpen={isOnboardingModalOpen}
				onClose={handleDismissOnboarding}
				onStartTour={handleStartTour}
				propertyName={properties.find((p) => p.id === activePropertyId)?.name}
			/>

			{/* Step-by-step Guided Tour Spotlight */}
			<UtilityBillingTourSpotlight
				isOpen={isTourOpen && !isOnboardingModalOpen}
				currentStepIndex={tourStepIndex}
				onNext={handleTourNext}
				onPrev={handleTourPrev}
				onClose={handleTourClose}
				onCompleteStep={handleCompleteOnboardingStep}
			/>

			{/* Step Completion Choice Modal */}
			<UtilityBillingCompletionModal
				isOpen={isCompletionModalOpen}
				onContinueExploring={handleContinueExploringBilling}
				onProceedToTenants={handleProceedToTenantsFromBilling}
				onReturnToDashboard={handleReturnToDashboardFromBilling}
				propertyName={properties.find((p) => p.id === activePropertyId)?.name}
			/>

		<div className="flex flex-col space-y-6 pb-32 w-full">
			{/* Single Polite Live Region for Accessible Error Announcements */}
			<div aria-live="polite" className="sr-only">
				{liveErrorAnnouncement}
			</div>

			{/* Re-occurring Setup Banner (shows after dismissal until step is complete) */}
			{isBillingStepPending && (dismissedThisVisit || isBillingStepDeferred) && (
				<div className="rounded-2xl border border-primary/20 bg-primary/[0.04] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
					<div className="flex items-start gap-3.5">
						<div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
							<Zap className="size-5" />
						</div>
						<div>
							<div className="flex flex-wrap items-center gap-2">
								<span className="text-xs font-bold uppercase tracking-wider text-primary">
									{t("Step 3 of 5 • Onboarding")}
								</span>
								<span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
									{t("Water & Electricity Setup")}
								</span>
							</div>
							<p className="text-base font-bold text-foreground mt-1">
								{t("Set up your water and electric rates")}
							</p>
							<p className="text-sm text-muted-foreground leading-snug mt-0.5">
								{t("Make sure your rates are set so bills compute automatically, or continue to add your tenants.")}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
						<button
							type="button"
							onClick={() => setActiveTab("rates")}
							className="flex-1 sm:flex-initial h-11 px-4 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-98"
						>
							{t("Check Rates")}
						</button>
						<button
							type="button"
							onClick={handleCompleteOnboardingStep}
							className="flex-1 sm:flex-initial h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-98"
						>
							<span>{t("Next: Add Tenants")}</span>
							<ArrowRight className="size-4" />
						</button>
					</div>
				</div>
			)}

			{/* Page Header — Clean & Decluttered */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="space-y-1">
					<div className="flex flex-wrap items-center gap-2.5">
						<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
							{t("Water & Electricity Billing")}
						</h1>
						{activeTab === "readings" && (
							<span
								className={cn(
									"inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border transition-colors",
									autoSaveStatus === "saving"
										? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
										: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
								)}
							>
								<Check className="size-3.5" />
								<span>
									{autoSaveStatus === "saving"
										? t("Saving...")
										: t("Saved automatically")}
								</span>
							</span>
						)}
					</div>
					<p className="text-sm text-muted-foreground">
						{t("Enter each room's new meter numbers below. Bills calculate automatically.")}
					</p>
				</div>

				{/* Month Picker directly in header */}
				<div className="shrink-0 self-start sm:self-center">
					<MonthPicker
						value={selectedMonth}
						onChange={(newMonth) => {
							if (newMonth === selectedMonth) return;
							monthlyDraftsRef.current[selectedMonth] = drafts;
							try {
								OfflineStorage.set("utility_monthly_drafts", monthlyDraftsRef.current, null, "utility");
							} catch (e) {}

							if (workspace) {
								const optimisticDrafts = buildDraftsFromWorkspace(
									workspace,
									{ readings: [] },
									allReadingsRef.current,
									newMonth,
									monthlyDraftsRef.current
								);
								setDrafts(optimisticDrafts);
							}
							setSelectedMonth(newMonth);
							setGuidedRoomIndex(0);
							setListPage(0);
						}}
						align="right"
					/>
				</div>
			</div>

			{/* Clean Single-Row Tab Navigation */}
			<div className="flex items-center overflow-x-auto scrollbar-none gap-1.5 p-1.5 rounded-2xl bg-muted/40 border border-border/60">
				{[
					{ 
						id: "readings", 
						label: "Meter Readings", 
						icon: Zap,
						badge: `${readingsSummary.recordedCount}/${readingsSummary.totalUnits}`
					},
					{ 
						id: "verify", 
						label: "Payment Proofs", 
						icon: ShieldCheck,
						badge: pendingInvoices.length > 0 ? t("{count} Waiting", { count: pendingInvoices.length }) : undefined,
						badgeAlert: pendingInvoices.length > 0
					},
					{ 
						id: "rates", 
						label: "Electricity & Water Rates", 
						icon: Settings2,
						badge: isRatesDirty ? t("Unsaved") : undefined,
						badgeAlert: isRatesDirty
					},
					{ 
						id: "history", 
						label: "Past Bills", 
						icon: History 
					}
				].map((tab) => {
					const isTabHighlighted = isTourOpen && (
						(tourStepIndex === 0 && tab.id === "rates") ||
						((tourStepIndex === 1 || tourStepIndex === 2) && tab.id === "readings")
					);

					return (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveTab(tab.id as any)}
						className={cn(
							"flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 min-h-[44px] text-sm font-semibold transition-all whitespace-nowrap cursor-pointer relative",
							activeTab === tab.id
								? "bg-card text-foreground font-bold shadow-sm border border-border/80"
								: "text-muted-foreground hover:text-foreground hover:bg-card/50 border border-transparent",
							isTabHighlighted && "ring-4 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_25px_rgba(155,119,255,0.8)] animate-pulse font-bold z-20"
						)}
					>
						{isTabHighlighted && (
							<span className="relative flex size-2 shrink-0">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
								<span className="relative inline-flex rounded-full size-2 bg-primary"></span>
							</span>
						)}
						<tab.icon className={cn("size-4 shrink-0", activeTab === tab.id ? "text-primary" : "text-muted-foreground")} />
						<span>{t(tab.label)}</span>
						{tab.badge && (
							<span className={cn(
								"px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0",
								tab.badgeAlert 
									? "bg-amber-500 text-zinc-950 font-bold" 
									: activeTab === tab.id 
										? "bg-primary/15 text-primary" 
										: "bg-muted text-muted-foreground"
							)}>
								{tab.badge}
							</span>
						)}
					</button>
					);
				})}
			</div>

			{/* Single-Row Unified Control & Room Navigator Bar (only on Readings tab) */}
			{activeTab === "readings" && (() => {
				const safeGuidedIdx = Math.min(guidedRoomIndex, Math.max(0, filteredDrafts.length - 1));
				const totalPages = Math.max(1, Math.ceil(filteredDrafts.length / ROOMS_PER_PAGE));
				const safeListPage = Math.min(listPage, totalPages - 1);

				const nextUnfinishedIdx = filteredDrafts.findIndex((d, i) => {
					if (i === safeGuidedIdx) return false;
					const wP = d.water.previous || 0;
					const wC = parseFloat(d.water.current);
					const wOk = d.water.exists || (!isNaN(wC) && wC >= wP && d.water.current.trim() !== "");
					const eP = d.electricity.previous || 0;
					const eC = parseFloat(d.electricity.current);
					const eOk = d.electricity.exists || (!isNaN(eC) && eC >= eP && d.electricity.current.trim() !== "");
					return !(wOk && eOk);
				});

				return (
					<div className="rounded-2xl border border-border/80 bg-card p-2.5 sm:px-3.5 shadow-2xs flex flex-wrap xl:flex-nowrap items-center justify-between gap-2.5">
						{/* Left: Compact Mode Switcher */}
						<div className="inline-flex rounded-xl bg-muted/50 border border-border/70 p-1 shrink-0">
							<button
								type="button"
								onClick={() => setViewMode("guided")}
								className={cn(
									"inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer min-h-[38px] whitespace-nowrap",
									viewMode === "guided"
										? "bg-primary text-primary-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								<Compass className="size-4 shrink-0" />
								<span>{t("One Room")}</span>
							</button>
							<button
								type="button"
								onClick={() => setViewMode("list")}
								className={cn(
									"inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer min-h-[38px] whitespace-nowrap",
									viewMode === "list"
										? "bg-primary text-primary-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								<Layers className="size-4 shrink-0" />
								<span>{t("All Rooms")}</span>
							</button>
						</div>

						{/* Center: Room Stepper Dropdown (Guided) OR Page Stepper (List) */}
						{filteredDrafts.length > 0 && (
							<div className="flex items-center gap-1.5 flex-1 min-w-0 justify-start xl:justify-center">
								{viewMode === "guided" ? (
									<>
										<button
											type="button"
											disabled={safeGuidedIdx <= 0}
											onClick={() => setGuidedRoomIndex((i) => Math.max(0, i - 1))}
											aria-label={t("Previous room")}
											className="inline-flex size-10 items-center justify-center rounded-xl border border-border/80 bg-background hover:bg-muted text-foreground transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed shrink-0"
										>
											<ChevronLeft className="size-4" />
										</button>

										<div className="relative flex-1 min-w-[180px] max-w-[300px]">
											<select
												aria-label={t("Jump to room")}
												value={safeGuidedIdx}
												onChange={(e) => setGuidedRoomIndex(Number(e.target.value))}
												className="h-10 w-full rounded-xl border border-border/80 bg-background pl-3 pr-8 text-sm font-bold text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer appearance-none truncate"
											>
												{filteredDrafts.map((item, idx) => {
													const wP = item.water.previous || 0;
													const wC = parseFloat(item.water.current);
													const wOk = item.water.exists || (!isNaN(wC) && wC >= wP && item.water.current.trim() !== "");
													const eP = item.electricity.previous || 0;
													const eC = parseFloat(item.electricity.current);
													const eOk = item.electricity.exists || (!isNaN(eC) && eC >= eP && item.electricity.current.trim() !== "");
													const readyMark = wOk && eOk ? "✓ " : "";
													const tenantSuffix = item.tenantName ? ` — ${item.tenantName}` : ` (${t("Vacant")})`;
													return (
														<option key={item.unitId} value={idx}>
															{`${readyMark}${item.unitName}${tenantSuffix} (${idx + 1}/${filteredDrafts.length})`}
														</option>
													);
												})}
											</select>
											<ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
										</div>

										<button
											type="button"
											disabled={safeGuidedIdx >= filteredDrafts.length - 1}
											onClick={() => setGuidedRoomIndex((i) => Math.min(filteredDrafts.length - 1, i + 1))}
											aria-label={t("Next room")}
											className="inline-flex size-10 items-center justify-center rounded-xl border border-border/80 bg-background hover:bg-muted text-foreground transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed shrink-0"
										>
											<ChevronRight className="size-4" />
										</button>

										{nextUnfinishedIdx !== -1 && (
											<button
												type="button"
												onClick={() => setGuidedRoomIndex(nextUnfinishedIdx)}
												title={t("Jump to next room that still needs meter numbers")}
												className="hidden sm:inline-flex items-center gap-1 h-10 px-3 rounded-xl border border-border/80 bg-background hover:bg-muted text-xs font-bold text-primary cursor-pointer shrink-0 whitespace-nowrap"
											>
												<span>{t("Next Unfinished")}</span>
												<ArrowRight className="size-3.5" />
											</button>
										)}
									</>
								) : totalPages > 1 ? (
									<div className="flex items-center gap-1.5">
										<button
											type="button"
											disabled={safeListPage === 0}
											onClick={() => setListPage((p) => Math.max(0, p - 1))}
											aria-label={t("Previous page")}
											className="inline-flex size-10 items-center justify-center rounded-xl border border-border/80 bg-background hover:bg-muted text-foreground transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed shrink-0"
										>
											<ChevronLeft className="size-4" />
										</button>
										<span className="text-sm font-bold text-foreground px-2.5 tabular-nums whitespace-nowrap">
											{t("Page {page} of {total}", { page: safeListPage + 1, total: totalPages })}
										</span>
										<button
											type="button"
											disabled={safeListPage >= totalPages - 1}
											onClick={() => setListPage((p) => Math.min(totalPages - 1, p + 1))}
											aria-label={t("Next page")}
											className="inline-flex size-10 items-center justify-center rounded-xl border border-border/80 bg-background hover:bg-muted text-foreground transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed shrink-0"
										>
											<ChevronRight className="size-4" />
										</button>
									</div>
								) : null}
							</div>
						)}

						{/* Right: Compact Filter + Search */}
						<div className="flex items-center gap-2 shrink-0 w-full sm:w-auto xl:w-auto">
							<div className="relative shrink-0">
								<select
									aria-label={t("Filter rooms")}
									value={filterStatus}
									onChange={(e) => {
										setFilterStatus(e.target.value as any);
										setGuidedRoomIndex(0);
										setListPage(0);
									}}
									className="h-10 rounded-xl border border-border/80 bg-background pl-3 pr-8 text-sm font-semibold text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer appearance-none"
								>
									<option value="occupied">{t("Occupied ({count})", { count: filterCounts.occupied })}</option>
									<option value="needs_reading">{t("Needs Reading ({count})", { count: filterCounts.needsReading })}</option>
									<option value="recorded">{t("Ready ({count})", { count: filterCounts.recorded })}</option>
									<option value="all">{t("All Rooms ({count})", { count: filterCounts.all })}</option>
									<option value="vacant">{t("Vacant ({count})", { count: filterCounts.vacant })}</option>
								</select>
								<ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
							</div>

							<div className="relative flex-1 sm:w-44 md:w-48">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
								<input
									maxLength={60}
									placeholder={t("Search room...")}
									value={searchQuery}
									onChange={(e) => {
										setSearchQuery(e.target.value);
										setGuidedRoomIndex(0);
										setListPage(0);
									}}
									className="h-10 w-full rounded-xl border border-border/80 bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
								/>
							</div>
						</div>
					</div>
				);
			})()}

			{/* Content Area */}
			<AnimatePresence mode="wait">
				{activeTab === "readings" && (
					<motion.div 
						key="readings"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="space-y-5"
					>

						{/* All Rooms Vacant Helpful Callout (removes confusion for empty buildings) */}
						{filteredDrafts.length > 0 && filteredDrafts.every(d => d.occupancyStatus !== "occupied") && (
							<div className="rounded-2xl border border-border/80 bg-muted/20 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
											{t("All Rooms Currently Vacant")}
										</span>
									</div>
									<h3 className="text-base font-bold text-foreground">
										{t("No tenants have moved in yet")}
									</h3>
									<p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
										{t("Meter readings are only recorded once tenants live in the rooms. For now, check your Electricity & Water Rates, then proceed to add your tenants.")}
									</p>
								</div>
								<div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
									<button
										type="button"
										onClick={() => setActiveTab("rates")}
										className="flex-1 sm:flex-initial h-11 px-4 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-98"
									>
										{t("Check Rates")}
									</button>
									<button
										type="button"
										onClick={handleCompleteOnboardingStep}
										className="flex-1 sm:flex-initial h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-98"
									>
										<span>{t("Next: Add Tenants")}</span>
										<ArrowRight className="size-4" />
									</button>
								</div>
							</div>
						)}

						{/* Empty Filter State */}
						{filteredDrafts.length === 0 ? (
							<div className="rounded-2xl border border-border/80 bg-card px-6 py-16 text-center shadow-xs">
								<div className="flex flex-col items-center gap-3 text-muted-foreground max-w-md mx-auto">
									<Building2 className="size-12 opacity-30" />
									<p className="text-lg font-bold text-foreground">{t("No rooms found")}</p>
									<p className="text-sm text-muted-foreground">
										{t("No rooms match your current search or filter criteria.")}
									</p>
									<button
										type="button"
										onClick={() => {
											setFilterStatus("all");
											setSearchQuery("");
											setGuidedRoomIndex(0);
											setListPage(0);
										}}
										className="mt-2 h-11 px-5 rounded-xl bg-card border border-border/80 hover:bg-muted text-sm font-bold text-foreground transition-all cursor-pointer shadow-xs"
									>
										{t("Clear All Filters")}
									</button>
								</div>
							</div>
						) : viewMode === "guided" ? (
							/* =========================================================
							   GUIDED MODE: ONE ROOM AT A TIME
							   ========================================================= */
							(() => {
								const safeIdx = Math.min(guidedRoomIndex, filteredDrafts.length - 1);
								const draft = filteredDrafts[safeIdx];

								const waterPrev = draft.water.previous || 0;
								const waterCurr = parseFloat(draft.water.current);
								const hasWater = draft.water.exists || (!isNaN(waterCurr) && waterCurr >= waterPrev && draft.water.current.trim() !== "");
								const waterUsage = !isNaN(waterCurr) && waterCurr >= waterPrev ? waterCurr - waterPrev : 0;
								const waterCost = waterUsage * (draft.water.rate || 0);
								const waterErr = readingCellError(draft.water, "Water reading");
								const showWaterErr = Boolean(touchedReadings[`${draft.unitId}:water`] && waterErr);
								const waterHintId = `reading-${draft.unitId}-water-hint`;
								const waterErrId = `reading-${draft.unitId}-water-error`;

								const elecPrev = draft.electricity.previous || 0;
								const elecCurr = parseFloat(draft.electricity.current);
								const hasElec = draft.electricity.exists || (!isNaN(elecCurr) && elecCurr >= elecPrev && draft.electricity.current.trim() !== "");
								const elecUsage = !isNaN(elecCurr) && elecCurr >= elecPrev ? elecCurr - elecPrev : 0;
								const elecCost = elecUsage * (draft.electricity.rate || 0);
								const elecErr = readingCellError(draft.electricity, "Electricity reading");
								const showElecErr = Boolean(touchedReadings[`${draft.unitId}:electricity`] && elecErr);
								const elecHintId = `reading-${draft.unitId}-electricity-hint`;
								const elecErrId = `reading-${draft.unitId}-electricity-error`;

								const roomRent = draft.occupancyStatus === "occupied" ? draft.rentAmount : 0;
								const totalEst = roomRent + waterCost + elecCost;
								const isComplete = hasWater && hasElec;

								return (
									<div>
										{/* Single Room Focused Card */}
										<div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-sm">
											{/* Card Header */}
											<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
												<div className="space-y-1.5">
													<div className="flex flex-wrap items-center gap-2.5">
														<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
															{t("Room {current} of {total}", { current: safeIdx + 1, total: filteredDrafts.length })}
														</span>
														{draft.occupancyStatus === "occupied" ? (
															<span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30">
																{t("Occupied")} {draft.tenantName ? `• ${draft.tenantName}` : ""}
															</span>
														) : (
															<span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
																{t("Vacant Room")}
															</span>
														)}
													</div>
													<h2 className="text-2xl sm:text-3xl font-bold text-foreground">
														{draft.unitName}
													</h2>
													<p className="text-sm text-muted-foreground">
														{t("Base Monthly Rent:")}{" "}
														<strong className="text-foreground font-mono tabular-nums">
															₱{roomRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
														</strong>
													</p>
												</div>

												<div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
													<span
														className={cn(
															"inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold border",
															isComplete
																? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
																: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
														)}
													>
														{isComplete ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
														<span>{isComplete ? t("Ready to Send") : t("Needs Meter Numbers")}</span>
													</span>

													<button
														type="button"
														onClick={() => setSelectedUnitId(draft.unitId)}
														className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-border/80 bg-background hover:bg-muted text-sm font-bold text-foreground transition-all cursor-pointer"
													>
														<Edit3 className="size-4 text-muted-foreground" />
														<span>{t("Room Settings")}</span>
													</button>
												</div>
											</div>

											{/* Two Big Clear Meter Inputs */}
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												{/* Water Meter Box */}
												<div className="rounded-2xl border border-sky-500/25 bg-sky-500/[0.03] dark:bg-sky-500/[0.06] p-5 sm:p-6 space-y-4">
													<div className="flex items-center justify-between gap-2">
														<div className="flex items-center gap-2">
															<div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
																<Droplets className="size-5" />
															</div>
															<span className="text-base font-bold text-foreground">{t("Water Meter (m³)")}</span>
														</div>
														<span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-800 dark:text-sky-200 font-mono">
															₱{draft.water.rate || 0} / m³
														</span>
													</div>

													<div className="rounded-xl bg-background/80 border border-border/70 px-4 py-3 flex items-center justify-between">
														<span className="text-sm font-medium text-muted-foreground">{t("Last Month's Reading:")}</span>
														<span className="text-base font-bold font-mono tabular-nums text-foreground">{waterPrev} m³</span>
													</div>

													<div className="space-y-1.5">
														<label
															htmlFor={`reading-input-${draft.unitId}-water`}
															className="block text-sm font-bold text-foreground"
														>
															{t("Type this month's water reading")}
														</label>
														<span id={waterHintId} className="block text-xs text-muted-foreground">
															{t("Enter a number {prev} or higher", { prev: waterPrev })}
														</span>
														<div className="relative">
															<input
																id={`reading-input-${draft.unitId}-water`}
																type="text"
																inputMode="decimal"
																maxLength={10}
																value={draft.water.current}
																placeholder={`${waterPrev}`}
																aria-invalid={showWaterErr ? "true" : "false"}
																aria-describedby={showWaterErr ? `${waterHintId} ${waterErrId}` : waterHintId}
																onBlur={() => handleMeterFieldBlur(draft, "water")}
																onChange={(e) => handleMeterValueChange(draft.unitId, "water", e.target.value)}
																className={cn(
																	"w-full h-14 rounded-xl border-2 border-sky-400/80 dark:border-sky-500/70 bg-background pl-4 pr-14 text-xl font-mono font-bold tabular-nums text-foreground outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-500/20 transition-all placeholder:text-muted-foreground/40",
																	showWaterErr && fieldErrorClass
																)}
															/>
															<span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 pointer-events-none select-none">
																m³
															</span>
														</div>
														<FieldError
															id={waterErrId}
															message={showWaterErr ? waterErr : undefined}
															className="text-xs"
														/>
													</div>

													{hasWater && !showWaterErr && (
														<div className="rounded-xl bg-sky-500/10 border border-sky-500/25 px-4 py-2.5 flex items-center justify-between text-sm">
															<span className="font-semibold text-sky-900 dark:text-sky-200">
																{t("Used:")} <strong className="font-mono">{waterUsage.toFixed(1)} m³</strong>
															</span>
															<span className="font-bold font-mono tabular-nums text-sky-950 dark:text-sky-100">
																₱{waterCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
															</span>
														</div>
													)}
												</div>

												{/* Electricity Meter Box */}
												<div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.03] dark:bg-amber-500/[0.06] p-5 sm:p-6 space-y-4">
													<div className="flex items-center justify-between gap-2">
														<div className="flex items-center gap-2">
															<div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
																<Zap className="size-5" />
															</div>
															<span className="text-base font-bold text-foreground">{t("Electricity Meter (kWh)")}</span>
														</div>
														<span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-200 font-mono">
															₱{draft.electricity.rate || 0} / kWh
														</span>
													</div>

													<div className="rounded-xl bg-background/80 border border-border/70 px-4 py-3 flex items-center justify-between">
														<span className="text-sm font-medium text-muted-foreground">{t("Last Month's Reading:")}</span>
														<span className="text-base font-bold font-mono tabular-nums text-foreground">{elecPrev} kWh</span>
													</div>

													<div className="space-y-1.5">
														<label
															htmlFor={`reading-input-${draft.unitId}-electricity`}
															className="block text-sm font-bold text-foreground"
														>
															{t("Type this month's electricity reading")}
														</label>
														<span id={elecHintId} className="block text-xs text-muted-foreground">
															{t("Enter a number {prev} or higher", { prev: elecPrev })}
														</span>
														<div className="relative">
															<input
																id={`reading-input-${draft.unitId}-electricity`}
																type="text"
																inputMode="decimal"
																maxLength={10}
																value={draft.electricity.current}
																placeholder={`${elecPrev}`}
																aria-invalid={showElecErr ? "true" : "false"}
																aria-describedby={showElecErr ? `${elecHintId} ${elecErrId}` : elecHintId}
																onBlur={() => handleMeterFieldBlur(draft, "electricity")}
																onChange={(e) => handleMeterValueChange(draft.unitId, "electricity", e.target.value)}
																className={cn(
																	"w-full h-14 rounded-xl border-2 border-amber-400/80 dark:border-amber-500/70 bg-background pl-4 pr-16 text-xl font-mono font-bold tabular-nums text-foreground outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-500/20 transition-all placeholder:text-muted-foreground/40",
																	showElecErr && fieldErrorClass
																)}
															/>
															<span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 pointer-events-none select-none">
																kWh
															</span>
														</div>
														<FieldError
															id={elecErrId}
															message={showElecErr ? elecErr : undefined}
															className="text-xs"
														/>
													</div>

													{hasElec && !showElecErr && (
														<div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 flex items-center justify-between text-sm">
															<span className="font-semibold text-amber-900 dark:text-amber-200">
																{t("Used:")} <strong className="font-mono">{elecUsage.toFixed(1)} kWh</strong>
															</span>
															<span className="font-bold font-mono tabular-nums text-amber-950 dark:text-amber-100">
																₱{elecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
															</span>
														</div>
													)}
												</div>
											</div>

											{/* Plain-English Bill Summary Box */}
											<div className="rounded-2xl bg-muted/30 border border-border/80 p-5 space-y-3">
												<div className="text-sm font-bold text-muted-foreground">
													{t("Bill Summary for {unit}", { unit: draft.unitName })}
												</div>
												<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
													<div className="flex items-center justify-between sm:justify-start sm:gap-2">
														<span className="text-muted-foreground">{t("Room Rent:")}</span>
														<strong className="font-mono tabular-nums text-foreground">
															₱{roomRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
														</strong>
													</div>
													<div className="flex items-center justify-between sm:justify-start sm:gap-2">
														<span className="text-muted-foreground">{t("Water:")}</span>
														<strong className="font-mono tabular-nums text-foreground">
															₱{waterCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
														</strong>
													</div>
													<div className="flex items-center justify-between sm:justify-start sm:gap-2">
														<span className="text-muted-foreground">{t("Electricity:")}</span>
														<strong className="font-mono tabular-nums text-foreground">
															₱{elecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
														</strong>
													</div>
												</div>
												<div className="pt-3 border-t border-border/70 flex items-center justify-between">
													<span className="text-base font-bold text-foreground">{t("Total Bill:")}</span>
													<span className="text-2xl font-bold font-mono tabular-nums text-primary">
														₱{totalEst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
													</span>
												</div>
											</div>

											{/* Step-by-step Navigation Footer */}
											<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
												<button
													type="button"
													disabled={safeIdx === 0}
													onClick={() => setGuidedRoomIndex((i) => Math.max(0, i - 1))}
													className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl border border-border bg-background hover:bg-muted text-base font-bold text-foreground transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
												>
													<ArrowLeft className="size-4" />
													<span>{t("Previous Room")}</span>
												</button>

												<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
													{safeIdx < filteredDrafts.length - 1 ? (
														<button
															type="button"
															onClick={() => setGuidedRoomIndex((i) => Math.min(filteredDrafts.length - 1, i + 1))}
															className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-primary text-primary-foreground text-base font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
														>
															<span>{t("Next Room")}</span>
															<ArrowRight className="size-4" />
														</button>
													) : (
														<button
															type="button"
															onClick={() => setIsConfirmSendOpen(true)}
															className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-primary text-primary-foreground text-base font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
														>
															<Send className="size-4" />
															<span>{t("Review & Send Bills")}</span>
														</button>
													)}
												</div>
											</div>
										</div>
									</div>
								);
							})()
						) : (
							/* =========================================================
							   ALL ROOMS LIST VIEW (Paginated Stacked Room Cards)
							   ========================================================= */
							(() => {
								const totalListPages = Math.max(1, Math.ceil(filteredDrafts.length / ROOMS_PER_PAGE));
								const safeListPage = Math.min(listPage, totalListPages - 1);
								const startIdx = safeListPage * ROOMS_PER_PAGE;
								const endIdx = Math.min(filteredDrafts.length, startIdx + ROOMS_PER_PAGE);
								const pageItems = filteredDrafts.slice(startIdx, endIdx);

								return (
									<div className="space-y-4">
										{pageItems.map((draft, localIdx) => {
											const globalIdx = startIdx + localIdx;
											const waterPrev = draft.water.previous || 0;
											const waterCurr = parseFloat(draft.water.current);
											const hasWater = draft.water.exists || (!isNaN(waterCurr) && waterCurr >= waterPrev && draft.water.current.trim() !== "");
											const waterUsage = !isNaN(waterCurr) && waterCurr >= waterPrev ? waterCurr - waterPrev : 0;
											const waterCost = waterUsage * (draft.water.rate || 0);
											const waterErr = readingCellError(draft.water, "Water reading");
											const showWaterErr = Boolean(touchedReadings[`${draft.unitId}:water`] && waterErr);
											const waterHintId = `list-reading-${draft.unitId}-water-hint`;
											const waterErrId = `list-reading-${draft.unitId}-water-error`;

											const elecPrev = draft.electricity.previous || 0;
											const elecCurr = parseFloat(draft.electricity.current);
											const hasElec = draft.electricity.exists || (!isNaN(elecCurr) && elecCurr >= elecPrev && draft.electricity.current.trim() !== "");
											const elecUsage = !isNaN(elecCurr) && elecCurr >= elecPrev ? elecCurr - elecPrev : 0;
											const elecCost = elecUsage * (draft.electricity.rate || 0);
											const elecErr = readingCellError(draft.electricity, "Electricity reading");
											const showElecErr = Boolean(touchedReadings[`${draft.unitId}:electricity`] && elecErr);
											const elecHintId = `list-reading-${draft.unitId}-electricity-hint`;
											const elecErrId = `list-reading-${draft.unitId}-electricity-error`;

											const roomRent = draft.occupancyStatus === "occupied" ? draft.rentAmount : 0;
											const totalEst = roomRent + waterCost + elecCost;
											const isComplete = hasWater && hasElec;

											return (
												<div
													key={draft.unitId}
													className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-2xs transition-colors"
												>
													{/* Card Top Bar */}
													<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
														<div className="space-y-1">
															<div className="flex flex-wrap items-center gap-2.5">
																<span className="text-lg font-bold text-foreground">{draft.unitName}</span>
																{draft.occupancyStatus === "occupied" ? (
																	<span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-3 py-0.5 rounded-full border border-emerald-500/30">
																		{t("Occupied")} {draft.tenantName ? `• ${draft.tenantName}` : ""}
																	</span>
																) : (
																	<span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border">
																		{t("Vacant")}
																	</span>
																)}
																<span
																	className={cn(
																		"inline-flex items-center gap-1 text-xs font-bold px-3 py-0.5 rounded-full border",
																		isComplete
																			? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
																			: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
																	)}
																>
																	{isComplete ? <Check className="size-3.5" /> : <Clock className="size-3.5" />}
																	<span>{isComplete ? t("Ready") : t("Needs Reading")}</span>
																</span>
															</div>
															<p className="text-sm text-muted-foreground">
																{t("Base Rent:")}{" "}
																<strong className="font-mono tabular-nums text-foreground">
																	₱{roomRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
																</strong>{" "}
																{t("/ mo")}
															</p>
														</div>

														<div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
															<div className="text-left sm:text-right">
																<span className="block text-xs font-medium text-muted-foreground">{t("Total Bill")}</span>
																<span className="text-xl font-bold font-mono tabular-nums text-foreground">
																	₱{totalEst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
																</span>
															</div>
															<button
																type="button"
																onClick={() => {
																	setGuidedRoomIndex(globalIdx);
																	setViewMode("guided");
																}}
																className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border border-border bg-background hover:bg-muted text-sm font-bold text-foreground transition-all cursor-pointer"
															>
																<span>{t("Open Room")}</span>
															</button>
															<button
																type="button"
																onClick={() => setSelectedUnitId(draft.unitId)}
																className="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-xl border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground text-sm font-semibold transition-all cursor-pointer"
																title={t("Inspect or adjust room details")}
															>
																<Edit3 className="size-4" />
																<span className="sr-only sm:not-sr-only">{t("Settings")}</span>
															</button>
														</div>
													</div>

													{/* Two Side-by-Side Meter Inputs */}
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/60">
														{/* Water Input */}
														<div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.03] p-4 space-y-2">
															<div className="flex items-center justify-between text-sm">
																<span className="inline-flex items-center gap-1.5 font-bold text-foreground">
																	<Droplets className="size-4 text-sky-500" />
																	<span>{t("Water (m³)")}</span>
																</span>
																<span className="text-muted-foreground">
																	{t("Last month:")} <strong className="font-mono text-foreground">{waterPrev} m³</strong>
																</span>
															</div>
															<span id={waterHintId} className="block text-xs text-muted-foreground">
																{t("Enter {prev} or higher", { prev: waterPrev })}
															</span>
															<div className="relative">
																<input
																	id={`reading-input-${draft.unitId}-water`}
																	type="text"
																	inputMode="decimal"
																	maxLength={10}
																	aria-label={t("Water reading for {unit}", { unit: draft.unitName })}
																	aria-invalid={showWaterErr ? "true" : "false"}
																	aria-describedby={showWaterErr ? `${waterHintId} ${waterErrId}` : waterHintId}
																	onBlur={() => handleMeterFieldBlur(draft, "water")}
																	value={draft.water.current}
																	placeholder={`${waterPrev}`}
																	onChange={(e) => handleMeterValueChange(draft.unitId, "water", e.target.value)}
																	className={cn(
																		"w-full h-12 rounded-xl border-2 border-sky-400/80 dark:border-sky-500/70 bg-background pl-3.5 pr-12 font-mono text-base font-bold tabular-nums text-foreground outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-500/20 transition-all",
																		showWaterErr && fieldErrorClass
																	)}
																/>
																<span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 pointer-events-none">
																	m³
																</span>
															</div>
															<FieldError id={waterErrId} message={showWaterErr ? waterErr : undefined} className="text-xs" />
															{hasWater && !showWaterErr && (
																<div className="text-xs font-bold text-sky-800 dark:text-sky-200 font-mono tabular-nums">
																	+{waterUsage.toFixed(1)} m³ = ₱{waterCost.toFixed(2)}
																</div>
															)}
														</div>

														{/* Electricity Input */}
														<div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4 space-y-2">
															<div className="flex items-center justify-between text-sm">
																<span className="inline-flex items-center gap-1.5 font-bold text-foreground">
																	<Zap className="size-4 text-amber-500" />
																	<span>{t("Electricity (kWh)")}</span>
																</span>
																<span className="text-muted-foreground">
																	{t("Last month:")} <strong className="font-mono text-foreground">{elecPrev} kWh</strong>
																</span>
															</div>
															<span id={elecHintId} className="block text-xs text-muted-foreground">
																{t("Enter {prev} or higher", { prev: elecPrev })}
															</span>
															<div className="relative">
																<input
																	id={`reading-input-${draft.unitId}-electricity`}
																	type="text"
																	inputMode="decimal"
																	maxLength={10}
																	aria-label={t("Electricity reading for {unit}", { unit: draft.unitName })}
																	aria-invalid={showElecErr ? "true" : "false"}
																	aria-describedby={showElecErr ? `${elecHintId} ${elecErrId}` : elecHintId}
																	onBlur={() => handleMeterFieldBlur(draft, "electricity")}
																	value={draft.electricity.current}
																	placeholder={`${elecPrev}`}
																	onChange={(e) => handleMeterValueChange(draft.unitId, "electricity", e.target.value)}
																	className={cn(
																		"w-full h-12 rounded-xl border-2 border-amber-400/80 dark:border-amber-500/70 bg-background pl-3.5 pr-14 font-mono text-base font-bold tabular-nums text-foreground outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-500/20 transition-all",
																		showElecErr && fieldErrorClass
																	)}
																/>
																<span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 pointer-events-none">
																	kWh
																</span>
															</div>
															<FieldError id={elecErrId} message={showElecErr ? elecErr : undefined} className="text-xs" />
															{hasElec && !showElecErr && (
																<div className="text-xs font-bold text-amber-800 dark:text-amber-200 font-mono tabular-nums">
																	+{elecUsage.toFixed(1)} kWh = ₱{elecCost.toFixed(2)}
																</div>
															)}
														</div>
													</div>
												</div>
											);
										})}

										{/* Bottom Pagination Controls */}
										{totalListPages > 1 && (
											<div className="rounded-2xl border border-border/80 bg-card px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
												<span className="text-sm font-semibold text-muted-foreground tabular-nums">
													{t("Page {page} of {total}", { page: safeListPage + 1, total: totalListPages })}
												</span>
												<div className="flex items-center gap-2">
													<button
														type="button"
														disabled={safeListPage === 0}
														onClick={() => {
															setListPage((p) => Math.max(0, p - 1));
															window.scrollTo({ top: 0, behavior: "smooth" });
														}}
														className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border border-border bg-background hover:bg-muted text-sm font-bold text-foreground transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
													>
														<ChevronLeft className="size-4" />
														<span>{t("Previous")}</span>
													</button>
													<button
														type="button"
														disabled={safeListPage >= totalListPages - 1}
														onClick={() => {
															setListPage((p) => Math.min(totalListPages - 1, p + 1));
															window.scrollTo({ top: 0, behavior: "smooth" });
														}}
														className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border border-border bg-background hover:bg-muted text-sm font-bold text-foreground transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
													>
														<span>{t("Next")}</span>
														<ChevronRight className="size-4" />
													</button>
												</div>
											</div>
										)}
									</div>
								);
							})()
						)}
					</motion.div>
				)}

				{/* Verify Payments Queue Tab */}
				{activeTab === "verify" && (
					<motion.div 
						key="verify"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="space-y-6"
					>
						{/* Tab Header Banner */}
						<div className="rounded-2xl border border-border/70 bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="space-y-1">
								<div className="flex flex-wrap items-center gap-2.5">
									<h2 className="text-xl font-bold text-foreground">{t("Check Tenant Payments")}</h2>
									<span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
										{t("{count} Waiting", { count: pendingInvoices.length })}
									</span>
								</div>
								<p className="text-sm text-muted-foreground">
									{t("Check tenant GCash screenshots, verify reference numbers, and confirm payment in one click.")}
								</p>
							</div>

							<Link 
								href="/landlord/settings?category=Finance"
								className="shrink-0 inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-foreground hover:bg-muted transition-all"
							>
								<QrCode className="size-4 text-primary" />
								<span>{t("My GCash QR Code")}</span>
								<ArrowUpRight className="size-4" />
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
									<h3 className="text-lg font-bold text-foreground">{t("All Payments Checked!")}</h3>
									<p className="text-sm text-muted-foreground max-w-sm mx-auto">
										{t("There are no tenant payments waiting right now. New GCash receipts will appear here automatically.")}
									</p>
								</div>
								<Link 
									href="/landlord/invoices" 
									className="mt-2 text-sm font-bold text-primary hover:underline flex items-center gap-1"
								>
									<span>{t("View Bills & Receipts")}</span>
									<ChevronRight className="size-4" />
								</Link>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{pendingInvoices.map((inv) => (
									<div 
										key={inv.id}
										className="rounded-2xl border border-border/70 bg-card p-5 space-y-4 hover:border-primary/40 transition-all shadow-sm"
									>
										<div className="flex items-start justify-between gap-3">
											<div>
												<span className="text-xs font-mono text-muted-foreground uppercase tracking-wider block">
													{inv.invoiceNumber}
												</span>
												<h4 className="text-lg font-bold text-foreground mt-0.5">{inv.tenant}</h4>
												<p className="text-sm text-muted-foreground">{inv.unit} • {inv.property}</p>
											</div>
											<div className="text-right">
												<span className="text-xl font-bold text-foreground font-mono tabular-nums">
													₱{inv.amount.toLocaleString()}
												</span>
												<span className="block text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full mt-1">
													{t("Needs Check")}
												</span>
											</div>
										</div>

										<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3.5 text-sm">
											<div className="flex flex-wrap items-center gap-2">
												<span className="text-muted-foreground">{t("Method:")}</span>
												<span className="font-bold text-foreground">{t(paymentMethodLabel(inv.paymentMethod, "GCash"))}</span>
												{inv.referenceNumber && (
													<span className="font-mono text-xs bg-muted px-2.5 py-1 rounded-lg text-foreground font-bold">
														{t("Ref:")} {inv.referenceNumber}
													</span>
												)}
											</div>

											<button
												type="button"
												onClick={() => setActiveVerifyInvoiceId(inv.id)}
												className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm cursor-pointer"
											>
												<ShieldCheck className="size-4" />
												<span>{t("Review")}</span>
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
						<BillingOperationsPanel 
							propertyId={selectedPropertyId} 
							viewMode="rates" 
							isTourActive={isTourOpen}
							tourStepIndex={tourStepIndex}
							onDirtyChange={setIsRatesDirty}
							onSaved={() => {
								setIsRatesDirty(false);
								fetchData();
								if (isBillingStepPending) { handleBillingSaved(); }
							}}
						/>
					</motion.div>
				)}

				{/* History Tab */}
				{activeTab === "history" && (
					<motion.div 
						key="history"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="space-y-8"
					>
						{/* Plain-English Header */}
						<div className="rounded-3xl neumorphic-panel p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
							<div className="space-y-1.5">
								<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
									<BarChart3 className="size-3.5" />
									<span>{t("Monthly Records")}</span>
								</div>
								<h3 className="text-2xl font-bold text-foreground tracking-tight">{t("Past Monthly Bills")}</h3>
								<p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
									{t("Click any month below to view the water and electricity readings recorded for your rooms.")}
								</p>
							</div>
							<div className="flex items-center gap-3">
								<Link 
									href="/landlord/invoices?tab=ledger"
									className="h-11 px-5 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
								>
									<span>{t("View Bills & Receipts")}</span>
									<ArrowUpRight className="size-4" />
								</Link>
							</div>
						</div>

						<div className="space-y-3">
							{[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
								const d = new Date();
								d.setDate(1);
								d.setMonth(d.getMonth() - i);
								const monthStr = d.toISOString().slice(0, 7);
								const monthLabel = d.toLocaleDateString(locale, { month: "short" });
								const yearLabel = d.getFullYear().toString();
								const reportTitle = d.toLocaleDateString(locale, { month: "long", year: "numeric" });
								const summary = historySummaries[monthStr];
								const totalElec = summary?.totalElec ?? 0;
								const totalWater = summary?.totalWater ?? 0;
								const readingCount = summary?.readingCount ?? 0;
								const hasData = readingCount > 0;
								const isCurrentMonth = i === 0;

								return (
									<button 
										key={monthStr}
										type="button"
										onClick={() => setSelectedHistoryMonth(monthStr)}
										className="group relative w-full grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-5 rounded-2xl neumorphic-panel hover:border-primary/40 hover:bg-primary/[0.01] active:scale-[0.99] text-left transition-all cursor-pointer"
									>
										{/* Date Block */}
										<div className="md:col-span-4 flex items-center gap-4">
											<div className="size-14 flex items-center justify-center rounded-xl neumorphic-inset group-hover:border-primary/20 group-hover:bg-primary/5 transition-all shrink-0">
												<div className="text-center">
													<p className="text-xs font-bold uppercase leading-none text-muted-foreground group-hover:text-primary transition-colors">{monthLabel}</p>
													<p className="text-lg font-bold mt-0.5 text-foreground">{yearLabel}</p>
												</div>
											</div>
											<div>
												<h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
													{reportTitle}
												</h4>
												<span className={cn(
													"inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-1",
													isCurrentMonth 
														? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
														: hasData 
															? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
															: "bg-muted text-muted-foreground"
												)}>
													{isCurrentMonth ? t("Current Month") : hasData ? t("Recorded") : t("No Readings")}
												</span>
											</div>
										</div>

										{/* Metrics */}
										<div className="md:col-span-6 flex flex-wrap items-center gap-8">
											<div>
												<span className="text-xs font-semibold text-muted-foreground block">{t("Electricity")}</span>
												<span className="text-sm font-bold text-foreground font-mono tabular-nums">
													{historySummariesLoading ? "..." : `${totalElec.toFixed(1)} kWh`}
												</span>
											</div>
											<div>
												<span className="text-xs font-semibold text-muted-foreground block">{t("Water")}</span>
												<span className="text-sm font-bold text-foreground font-mono tabular-nums">
													{historySummariesLoading ? "..." : `${totalWater.toFixed(1)} m³`}
												</span>
											</div>
											<div>
												<span className="text-xs font-semibold text-muted-foreground block">{t("Readings Saved")}</span>
												<span className="text-sm font-bold text-foreground font-mono tabular-nums">
													{historySummariesLoading ? "..." : t("{count} records", { count: readingCount })}
												</span>
											</div>
										</div>

										{/* Action Arrow */}
										<div className="md:col-span-2 flex justify-end">
											<div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-all">
												<span>{t("View")}</span>
												<ChevronRight className="size-4" />
											</div>
										</div>
									</button>
								);
							})}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Sticky Bottom Bar on Readings Tab (Single source of truth for Save Readings & Send Monthly Bills) */}
			{activeTab === "readings" && filteredDrafts.length > 0 && (
				<div className="fixed bottom-4 left-4 right-4 lg:left-72 z-40 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
					<div className="max-w-5xl mx-auto rounded-2xl border-2 border-border bg-card/95 backdrop-blur-md px-5 py-3 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-auto">
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
							<span className="text-sm sm:text-base font-bold text-foreground">
								{t("{ready} of {total} rooms ready", {
									ready: readingsSummary.recordedCount,
									total: readingsSummary.totalUnits,
								})}
							</span>
							<span className="text-sm text-muted-foreground">
								{t("Estimated Total:")}{" "}
								<strong className="font-mono tabular-nums text-foreground">
									₱{readingsSummary.grandTotalEstimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</strong>
							</span>
						</div>

						<div className="flex items-center gap-2.5">
							<button
								type="button"
								onClick={() => handleSaveReadings(false)}
								disabled={saving}
								className={cn(
									"flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-border bg-background hover:bg-muted text-sm font-bold text-foreground transition-all cursor-pointer disabled:opacity-50 relative",
									isTourOpen && tourStepIndex === 1 && "ring-4 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_30px_rgba(155,119,255,0.85)] animate-pulse scale-105 bg-primary/10 border-primary z-30"
								)}
							>
								{isTourOpen && tourStepIndex === 1 && (
									<span className="relative flex size-2.5 shrink-0">
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
										<span className="relative inline-flex rounded-full size-2.5 bg-primary"></span>
									</span>
								)}
								<Save className="size-4 text-muted-foreground" />
								<span>{t("Save Readings")}</span>
							</button>
							<button
								type="button"
								onClick={() => setIsConfirmSendOpen(true)}
								disabled={saving}
								className={cn(
									"flex-[1.5] sm:flex-initial inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm sm:text-base font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-sm disabled:opacity-50 relative",
									isTourOpen && tourStepIndex === 2 && "ring-4 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_35px_rgba(155,119,255,0.95)] animate-pulse scale-105 brightness-110 font-black z-30"
								)}
							>
								{isTourOpen && tourStepIndex === 2 && (
									<span className="relative flex size-2.5 shrink-0">
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
										<span className="relative inline-flex rounded-full size-2.5 bg-white"></span>
									</span>
								)}
								{saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
								<span>{t("Send Monthly Bills")}</span>
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Review & Send Bills Confirmation Modal */}
			<ConfirmSendBillsModal
				isOpen={isConfirmSendOpen}
				onClose={() => setIsConfirmSendOpen(false)}
				onConfirm={() => {
					setIsConfirmSendOpen(false);
					void handleSaveReadings(true);
				}}
				saving={saving}
				monthLabel={formattedCycleMonth}
				readyDrafts={readingsSummary.readyDrafts}
				missingOccupiedDrafts={readingsSummary.missingOccupiedDrafts}
			/>

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
						updateDraftsAndCache(newDrafts);
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
		</>
	);
}

function ConfirmSendBillsModal({
	isOpen,
	onClose,
	onConfirm,
	saving,
	monthLabel,
	readyDrafts,
	missingOccupiedDrafts,
}: {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	saving: boolean;
	monthLabel: string;
	readyDrafts: ReadingDraft[];
	missingOccupiedDrafts: ReadingDraft[];
}) {
	const { t } = useLanguageContext();

	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	const totalBatchAmount = useMemo(() => {
		return readyDrafts.reduce((sum, d) => {
			const wPrev = d.water.previous || 0;
			const wCurr = parseFloat(d.water.current);
			const wUsage = !isNaN(wCurr) && wCurr >= wPrev ? wCurr - wPrev : 0;
			const wCost = wUsage * (d.water.rate || 0);

			const ePrev = d.electricity.previous || 0;
			const eCurr = parseFloat(d.electricity.current);
			const eUsage = !isNaN(eCurr) && eCurr >= ePrev ? eCurr - ePrev : 0;
			const eCost = eUsage * (d.electricity.rate || 0);

			const rent = d.occupancyStatus === "occupied" ? d.rentAmount : 0;
			return sum + rent + wCost + eCost;
		}, 0);
	}, [readyDrafts]);

	return (
		<AnimatePresence>
			{isOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4"
					role="dialog"
					aria-modal="true"
					aria-labelledby="confirm-send-bills-title"
				>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-black/60 backdrop-blur-xs"
						onClick={onClose}
					/>
					<motion.div
						initial={{ opacity: 0, scale: 0.96, y: 12 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: 12 }}
						className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5 max-h-[85vh] flex flex-col"
					>
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-1">
								<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
									<Send className="size-3.5" />
									<span>{monthLabel}</span>
								</span>
								<h2 id="confirm-send-bills-title" className="text-xl sm:text-2xl font-bold text-foreground">
									{t("Review & Send Monthly Bills")}
								</h2>
								<p className="text-sm text-muted-foreground">
									{t("Please check the summary below before sending bills to your tenants.")}
								</p>
							</div>
							<button
								type="button"
								onClick={onClose}
								aria-label={t("Close")}
								className="size-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted transition-all cursor-pointer shrink-0"
							>
								<X className="size-5" />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto space-y-3 pr-1 overscroll-contain">
							{readyDrafts.length === 0 ? (
								<div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-medium text-amber-800 dark:text-amber-200 flex items-start gap-3">
									<AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
									<div>
										<p className="font-bold">{t("No rooms are ready to send yet.")}</p>
										<p className="mt-1">
											{t("Please enter both water and electricity meter readings for at least one room first.")}
										</p>
									</div>
								</div>
							) : (
								<>
									<div className="space-y-2">
										{readyDrafts.map((d) => {
											const wPrev = d.water.previous || 0;
											const wCurr = parseFloat(d.water.current);
											const wUsage = !isNaN(wCurr) && wCurr >= wPrev ? wCurr - wPrev : 0;
											const wCost = wUsage * (d.water.rate || 0);

											const ePrev = d.electricity.previous || 0;
											const eCurr = parseFloat(d.electricity.current);
											const eUsage = !isNaN(eCurr) && eCurr >= ePrev ? eCurr - ePrev : 0;
											const eCost = eUsage * (d.electricity.rate || 0);

											const rent = d.occupancyStatus === "occupied" ? d.rentAmount : 0;
											const roomTotal = rent + wCost + eCost;

											return (
												<div
													key={d.unitId}
													className="rounded-xl border border-border/80 bg-background px-4 py-3 flex items-center justify-between gap-3"
												>
													<div>
														<div className="text-sm font-bold text-foreground">
															{d.unitName} {d.tenantName ? `• ${d.tenantName}` : ""}
														</div>
														<div className="text-xs text-muted-foreground mt-0.5">
															{t("Water")} {wUsage.toFixed(1)} m³ + {t("Electric")} {eUsage.toFixed(1)} kWh
														</div>
													</div>
													<div className="text-base font-bold font-mono tabular-nums text-foreground">
														₱{roomTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
													</div>
												</div>
											);
										})}
									</div>

									<div className="rounded-xl bg-muted/40 border border-border/80 px-4 py-3 flex items-center justify-between">
										<span className="text-sm font-bold text-foreground">
											{t("Total for {count} room(s)", { count: readyDrafts.length })}
										</span>
										<span className="text-lg font-bold font-mono tabular-nums text-primary">
											₱{totalBatchAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
										</span>
									</div>
								</>
							)}

							{missingOccupiedDrafts.length > 0 && (
								<div className="rounded-xl border border-border bg-muted/20 p-3.5 text-xs text-muted-foreground leading-relaxed">
									<strong className="text-foreground">{t("Note:")} </strong>
									{t("{count} occupied room(s) ({rooms}) do not have meter readings yet and will be skipped for now.", {
										count: missingOccupiedDrafts.length,
										rooms: missingOccupiedDrafts.map((m) => m.unitName).join(", "),
									})}
								</div>
							)}
						</div>

						<div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-border/60">
							<button
								type="button"
								onClick={onClose}
								className="flex-1 h-12 px-5 rounded-xl border border-border bg-background hover:bg-muted text-sm font-bold text-foreground transition-all cursor-pointer"
							>
								{t("Go Back")}
							</button>
							<button
								type="button"
								disabled={saving || readyDrafts.length === 0}
								onClick={onConfirm}
								className="flex-[1.5] inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
							>
								{saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
								<span>{t("Yes, Send {count} Bills Now", { count: readyDrafts.length })}</span>
							</button>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
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
	const { t } = useLanguageContext();
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
									<p className="text-xs text-muted-foreground">{t("Unit Billing & Submeter Profile")}</p>
								</div>
							</div>
							<button 
								onClick={onClose} 
								aria-label={t("Close")} className="size-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted transition-all"
							>
								<X className="size-5" />
							</button>
						</div>

						{/* Modal Content */}
						<div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="rounded-2xl neumorphic-inset p-5">
									<span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">{t("Base Monthly Rent")}</span>
									<div className="flex items-baseline gap-1.5">
										<span className="text-lg font-black text-muted-foreground">₱</span>
										<input min={0} max={9999999.99} step="0.01" 
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
											{draft.occupancyStatus === "occupied" ? t("Lease Status") : t("Unit Status")}
										</span>
									</div>
									<span className="text-base font-black text-foreground mt-1">
										{draft.occupancyStatus === "occupied"
											? (draft.tenantName ? t("Active Tenant: {name}", { name: draft.tenantName }) : t("Active Tenant Occupancy"))
											: t("Vacant Unit (No Active Tenant)")}
									</span>
								</div>
							</div>

							<ResourceSection 
								type="water"
								label={t("Water Submeter")}
								icon={Droplets}
								colorClass="sky"
								draft={draft.water}
								onUpdate={(patch) => onUpdate({ water: { ...draft.water, ...patch } })}
							/>

							<ResourceSection 
								type="electricity"
								label={t("Electricity Submeter")}
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
								{t("Cancel")}
							</button>
							<button 
								type="button"
								onClick={onSave || onClose}
								disabled={saving}
								className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 cursor-pointer"
							>
								{saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
								<span>{t("Save & Bill This Unit")}</span>
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
	const { t } = useLanguageContext();
	const isSky = colorClass === "sky";
	const bgClass = isSky ? "dark:border-sky-500/10" : "dark:border-amber-500/10";
	const accentClass = isSky ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400";

	const [currentTouched, setCurrentTouched] = useState(false);
	const currentError = readingCellError(draft, isSky ? "Water reading" : "Electricity reading");
	const currentErrorId = `resource-${isSky ? "water" : "electricity"}-current-error`;
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
							<label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">{t("Previous")}</label>
							<input min={0} max={9999999} 
								type="number" 
								value={draft.previous}
								onChange={(e) => onUpdate({ previous: parseFloat(e.target.value) || 0 })}
								className="w-full rounded-xl neumorphic-panel px-3 py-2 text-xs font-mono font-bold outline-none focus:border-primary"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">{t("Current")}</label>
								<input min={0} max={9999999}
									type="number"
									step="0.01"
									inputMode="decimal"
									value={draft.current}
									placeholder={t("Enter reading...")}
									onChange={(e) => onUpdate({ current: e.target.value })}
									onBlur={() => setCurrentTouched(true)}
									aria-invalid={currentTouched && currentError ? true : undefined}
									aria-describedby={currentTouched && currentError ? currentErrorId : undefined}
									className={cn("w-full rounded-xl neumorphic-panel px-3 py-2 text-xs font-mono font-black outline-none focus:border-primary", accentClass, currentTouched && currentError && fieldErrorClass)}
								/>
								<FieldError id={currentErrorId} message={currentTouched ? currentError : undefined} />
						</div>
					</div>
				</div>

				<div className="md:col-span-2 flex flex-col justify-center">
					<div className="text-center p-3 rounded-xl neumorphic-panel border border-border/40">
						<span className={cn("text-[9px] font-black uppercase tracking-widest block opacity-80", accentClass)}>{t("Billing Rate")}</span>
						<div className="flex items-center justify-center gap-1 mt-1">
							<span className="text-sm font-black text-muted-foreground">₱</span>
							<input min={0} max={99999.99} 
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

	const { t, locale } = useLanguageContext();
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
					unit_name: r.unit?.name || r.unit_id || t("Unknown Unit"),
					tenant_name: r.lease?.tenant?.full_name || t("Unknown Tenant"),
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
	const monthFormatted = dateObj.toLocaleDateString(locale, { month: "long", year: "numeric" });

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
								<h2 className="text-xl font-black text-foreground">{t("{month} Breakdown", { month: monthFormatted })}</h2>
								<p className="text-xs text-muted-foreground">{t("Historical Audit Record")}</p>
							</div>
						</div>
						<button 
							onClick={onClose} 
							aria-label={t("Close")} className="size-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted transition-all"
						>
							<X className="size-5" />
						</button>
					</div>

					{/* Modal Content */}
					<div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
						{/* Summary Stats */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="rounded-2xl neumorphic-panel p-5">
								<span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t("Total Electricity")}</span>
								<div className="mt-2 flex items-baseline gap-2">
									<span className="text-2xl font-black text-amber-500 font-mono">{totalElec.toFixed(1)}</span>
									<span className="text-xs font-black text-muted-foreground">kWh</span>
								</div>
							</div>
							<div className="rounded-2xl neumorphic-panel p-5">
								<span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t("Total Water")}</span>
								<div className="mt-2 flex items-baseline gap-2">
									<span className="text-2xl font-black text-sky-500 font-mono">{totalWater.toFixed(1)}</span>
									<span className="text-xs font-black text-muted-foreground">m³</span>
								</div>
							</div>
							<div className="rounded-2xl neumorphic-panel p-5">
								<span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t("Total Billed")}</span>
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
											<th className="px-6 py-4 font-bold text-muted-foreground">{t("Unit")}</th>
											<th className="px-6 py-4 font-bold text-muted-foreground">{t("Type")}</th>
											<th className="px-6 py-4 font-bold text-muted-foreground text-center">{t("Prev")}</th>
											<th className="px-6 py-4 font-bold text-muted-foreground text-center">{t("Curr")}</th>
											<th className="px-6 py-4 font-bold text-muted-foreground text-center">{t("Usage")}</th>
											<th className="px-6 py-4 font-bold text-muted-foreground text-right">{t("Charge")}</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border font-mono">
										{records.length === 0 ? (
											<tr>
												<td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-sans">
													{t("No utility readings recorded for this cycle.")}
												</td>
											</tr>
										) : records.map((r, idx) => (
											<tr key={idx} className="hover:bg-muted/10">
												<td className="px-6 py-3 font-sans font-bold text-foreground">{r.unit_name}</td>
												<td className="px-6 py-3 font-sans capitalize">
													{r.utility_type === "water" ? (
														<span className="text-sky-600 font-bold">{t("Water")}</span>
													) : (
														<span className="text-amber-600 font-bold">{t("Electric")}</span>
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
							{t("Close")}
						</button>

					</div>
				</motion.div>
			</div>
	</AnimatePresence>
	);
}
