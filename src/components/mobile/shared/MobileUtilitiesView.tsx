"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
	AlertTriangle,
	Building2,
	Calendar,
	CalendarDays,
	Check,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock,
	Droplets,
	Gauge,
	History,
	ListChecks,
	Plus,
	Receipt,
	RefreshCw,
	Search,
	Send,
	SlidersHorizontal,
	User,
	WifiOff,
	X,
	Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useProperty } from "@/context/PropertyContext";
import { useLanguageContext } from "@/context/LanguageContext";
import { triggerHaptic } from "@/lib/haptics";
import type { BillingWorkspace, InvoiceListItem } from "@/lib/billing/server";
import { formatPhpCurrency as formatCurrency } from "@/lib/billing/utils";
import { paymentMethodLabel } from "@/lib/billing/payment-methods";
import {
	buildDraftsFromWorkspace,
	computeDraftBill,
	formatRoomDisplayName,
	isDraftReady,
	isMeterSubmetered,
	readingCellError,
	sanitizeMeterInput,
	type ReadingDraft,
	type ReadingSaveRequest,
} from "@/lib/billing/utility-drafts";
import { OfflineStorage } from "@/lib/offline/offlineStorage";
import { mutationQueue } from "@/lib/offline/mutationQueue";
import { readViewCache, writeViewCache, hasViewCache, fetchJsonDeduped } from "@/lib/mobile/view-cache";
import { PullToRefresh } from "@/components/mobile/shared/PullToRefresh";
import { MobilePropertySelector } from "@/components/mobile/shared/MobilePropertySelector";
import { MobileUtilityConfirmSheet } from "@/components/mobile/shared/MobileUtilityConfirmSheet";
import { MobileUtilityRoomSheet } from "@/components/mobile/shared/MobileUtilityRoomSheet";
import { MobileUtilityRatesSection } from "@/components/mobile/shared/MobileUtilityRatesSection";
import { MobileUtilityHistorySheet } from "@/components/mobile/shared/MobileUtilityHistorySheet";
import { InvoiceModal } from "@/components/landlord/invoices/InvoiceModal";

type ActiveTab = "readings" | "payments" | "rates" | "history";
type FilterStatus = "occupied" | "needs_reading" | "ready" | "all";

const ROOMS_PER_PAGE = 4;

type PastMonthSummary = {
	month: string;
	monthLabel: string;
	readingCount: number;
	postedCount: number;
	totalCharges: number;
	totalElectricKwh: number;
	totalWaterM3: number;
};

function getCurrentMonthString(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonthString(monthStr: string, delta: number): string {
	const [y, m] = monthStr.split("-").map(Number);
	const date = new Date(y, m - 1 + delta, 1);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthStr: string): string {
	const [y, m] = monthStr.split("-").map(Number);
	const date = new Date(y, (m || 1) - 1, 1);
	if (Number.isNaN(date.getTime())) return monthStr;
	return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getMonthBounds(monthStr: string): { start: string; end: string } {
	const [y, m] = monthStr.split("-").map(Number);
	const lastDay = new Date(y, m, 0).getDate();
	return {
		start: `${monthStr}-01`,
		end: `${monthStr}-${String(lastDay).padStart(2, "0")}`,
	};
}

function resolveTabFromQuery(rawTab: string | null): ActiveTab {
	switch (rawTab) {
		case "verify":
		case "payments":
			return "payments";
		case "rates":
			return "rates";
		case "history":
			return "history";
		default:
			return "readings";
	}
}

function parseInvoiceAmount(inv: InvoiceListItem): number {
	const candidate = inv.amount ?? inv.balanceRemaining ?? 0;
	const num = Number(candidate);
	return Number.isFinite(num) ? num : 0;
}

function subscribeOnlineStatus(callback: () => void): () => void {
	if (typeof window === "undefined") return () => {};
	window.addEventListener("online", callback);
	window.addEventListener("offline", callback);
	return () => {
		window.removeEventListener("online", callback);
		window.removeEventListener("offline", callback);
	};
}

function subscribeMutationQueue(callback: () => void): () => void {
	let initialized = false;
	const unsubscribe = mutationQueue.subscribe(() => {
		if (!initialized) return;
		callback();
	});
	initialized = true;
	return unsubscribe;
}

function isNetworkOrOfflineError(err: unknown, status?: number): boolean {
	if (typeof navigator !== "undefined" && !navigator.onLine) {
		return true;
	}
	if (status === 502 || status === 503 || status === 504) {
		return true;
	}
	if (err instanceof TypeError) {
		return true;
	}
	if (err instanceof Error) {
		if (err.name === "AbortError") return true;
		if (
			/failed to fetch|network|offline|load failed|aborted|timeout/i.test(
				err.message,
			)
		) {
			return true;
		}
	}
	return false;
}

export function MobileUtilitiesView() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { profile, loading: authLoading } = useAuth();
	const {
		properties: contextProperties,
		selectedPropertyId,
		selectedProperty,
	} = useProperty();
	const { t } = useLanguageContext();

	const queryTab = searchParams.get("tab");
	const queryMonth = searchParams.get("month");

	const [activeTab, setActiveTab] = useState<ActiveTab>(() =>
		resolveTabFromQuery(queryTab),
	);
	const [selectedMonth, setSelectedMonth] = useState<string>(() =>
		queryMonth && /^\d{4}-\d{2}$/.test(queryMonth)
			? queryMonth
			: getCurrentMonthString(),
	);

	// Sync URL tab parameter if user arrives from a deep link like /mobile/utilities?tab=verify
	const [prevQueryTab, setPrevQueryTab] = useState(queryTab);
	if (queryTab !== prevQueryTab) {
		setPrevQueryTab(queryTab);
		if (queryTab) {
			setActiveTab(resolveTabFromQuery(queryTab));
		}
	}

	const [prevQueryMonth, setPrevQueryMonth] = useState(queryMonth);
	if (queryMonth !== prevQueryMonth) {
		setPrevQueryMonth(queryMonth);
		if (queryMonth && /^\d{4}-\d{2}$/.test(queryMonth)) {
			setSelectedMonth(queryMonth);
		}
	}

	// Connectivity & offline queue state
	const isOnline = useSyncExternalStore(
		subscribeOnlineStatus,
		() => (typeof navigator !== "undefined" ? navigator.onLine : true),
		() => true,
	);
	const pendingQueueCount = useSyncExternalStore(
		subscribeMutationQueue,
		() => mutationQueue.getQueue().length,
		() => 0,
	);

	// Core workspace & readings state
	const [workspace, setWorkspace] = useState<BillingWorkspace | null>(
		() => readViewCache<BillingWorkspace>("utilities:workspace") ?? null,
	);
	const [monthlyDrafts, setMonthlyDrafts] = useState<
		Record<string, ReadingDraft[]>
	>(
		() =>
			OfflineStorage.get<Record<string, ReadingDraft[]>>(
				"utility_monthly_drafts",
			)?.data || {},
	);
	const [loading, setLoading] = useState<boolean>(
		() => !hasViewCache("utilities:workspace"),
	);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [usingCachedData, setUsingCachedData] = useState<boolean>(false);

	// Auto-save indicator
	const [draftSaveState, setDraftSaveState] = useState<
		"idle" | "saving" | "saved"
	>("idle");
	const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Meter reading workflow UI state
	const [filterStatus, setFilterStatus] = useState<FilterStatus>("occupied");
	const [hasInitializedFilter, setHasInitializedFilter] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(0);

	// Save & modal/sheet state
	const [saving, setSaving] = useState(false);
	const [syncingQueue, setSyncingQueue] = useState(false);
	const [isConfirmSendOpen, setIsConfirmSendOpen] = useState(false);
	const [sheetDraftUnitId, setSheetDraftUnitId] = useState<string | null>(null);
	const [sheetInitialFocus, setSheetInitialFocus] = useState<
		"water" | "electricity" | undefined
	>(undefined);
	const [isWalkthroughMode, setIsWalkthroughMode] = useState(false);
	const [walkthroughUnitIds, setWalkthroughUnitIds] = useState<string[]>([]);
	const isSyncingRef = useRef(false);

	// Payment proofs tab state
	const [invoices, setInvoices] = useState<InvoiceListItem[]>(
		() => readViewCache<InvoiceListItem[]>("utilities:invoices") ?? [],
	);
	const [loadingInvoices, setLoadingInvoices] = useState<boolean>(
		() => !hasViewCache("utilities:invoices"),
	);
	const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
		null,
	);

	// Past bills tab state
	const historyCacheKey = `utilities:history:${selectedPropertyId || "all"}`;
	const [pastMonths, setPastMonths] = useState<PastMonthSummary[]>(
		() => readViewCache<PastMonthSummary[]>(historyCacheKey) ?? [],
	);
	const [loadingHistory, setLoadingHistory] = useState<boolean>(
		() => !readViewCache<PastMonthSummary[]>(historyCacheKey),
	);
	const [prevHistoryCacheKey, setPrevHistoryCacheKey] = useState(historyCacheKey);
	if (historyCacheKey !== prevHistoryCacheKey) {
		setPrevHistoryCacheKey(historyCacheKey);
		const cachedHistory = readViewCache<PastMonthSummary[]>(historyCacheKey);
		setPastMonths(cachedHistory ?? []);
		setLoadingHistory(!cachedHistory);
	}
	const [historyModalMonth, setHistoryModalMonth] = useState<string | null>(
		null,
	);

	const isLandlordOrAdmin =
		!profile?.role ||
		profile.role === "landlord" ||
		profile.role === "admin";

	const persistDraftsLocally = useCallback(
		(nextMap: Record<string, ReadingDraft[]>) => {
			setDraftSaveState("saving");
			OfflineStorage.set("utility_monthly_drafts", nextMap);
			if (draftSaveTimerRef.current) {
				clearTimeout(draftSaveTimerRef.current);
			}
			draftSaveTimerRef.current = setTimeout(() => {
				setDraftSaveState("saved");
			}, 250);
		},
		[],
	);

	useEffect(() => {
		return () => {
			if (draftSaveTimerRef.current) {
				clearTimeout(draftSaveTimerRef.current);
			}
		};
	}, []);

	const loadDataRequestIdRef = useRef(0);
	const historyRequestIdRef = useRef(0);

	const loadData = useCallback(
		async () => {
			if (!isLandlordOrAdmin) {
				return;
			}
			const requestId = ++loadDataRequestIdRef.current;

			try {
				if (typeof navigator !== "undefined" && !navigator.onLine) {
					await Promise.resolve();
					throw new Error("OFFLINE");
				}

				const [wsData, readingsData, allReadingsData] = await Promise.all([
					fetchJsonDeduped<BillingWorkspace>("/api/landlord/payment-settings"),
					fetchJsonDeduped<{ readings?: unknown[] }>(
						`/api/landlord/utility-readings?month=${encodeURIComponent(selectedMonth)}`,
					).catch(() => ({ readings: [] })),
					fetchJsonDeduped<{ readings?: unknown[] }>(
						"/api/landlord/utility-readings",
					).catch(() => ({ readings: [] })),
				]);
				if (requestId !== loadDataRequestIdRef.current) return;

				const allReadings = Array.isArray(allReadingsData.readings)
					? allReadingsData.readings
					: [];

				OfflineStorage.set("utility_workspace", wsData);
				OfflineStorage.set(`utility_readings_${selectedMonth}`, readingsData);
				OfflineStorage.set("utility_all_readings", allReadings);

				writeViewCache("utilities:workspace", wsData);
				setLoadError(null);
				setUsingCachedData(false);
				setWorkspace(wsData);

				setMonthlyDrafts((prevMap) => {
					const built = buildDraftsFromWorkspace(
						wsData,
						readingsData,
						allReadings,
						selectedMonth,
						prevMap,
						"Room",
					);
					const nextMap = { ...prevMap, [selectedMonth]: built };
					OfflineStorage.set("utility_monthly_drafts", nextMap);
					return nextMap;
				});
			} catch (err) {
				if (requestId !== loadDataRequestIdRef.current) return;
				const cachedWs =
					OfflineStorage.get<BillingWorkspace>("utility_workspace")?.data;
				const cachedReadings = OfflineStorage.get<{ readings?: unknown[] }>(
					`utility_readings_${selectedMonth}`,
				)?.data || { readings: [] };
				const cachedAllReadings =
					OfflineStorage.get<unknown[]>("utility_all_readings")?.data || [];
				const cachedDrafts =
					OfflineStorage.get<Record<string, ReadingDraft[]>>(
						"utility_monthly_drafts",
					)?.data || {};

				if (cachedWs) {
					setLoadError(null);
					setWorkspace(cachedWs);
					setUsingCachedData(true);
					const built = buildDraftsFromWorkspace(
						cachedWs,
						cachedReadings,
						cachedAllReadings,
						selectedMonth,
						cachedDrafts,
						"Room",
					);
					setMonthlyDrafts((prev) => ({
						...cachedDrafts,
						...prev,
						[selectedMonth]: built,
					}));
				} else {
					const message =
						err instanceof Error && err.message === "OFFLINE"
							? "You are currently offline and no saved readings were found on this device."
							: "We couldn't load your water and electricity rooms right now.";
					setLoadError(message);
				}
			} finally {
				if (requestId === loadDataRequestIdRef.current) {
					setLoading(false);
					setRefreshing(false);
				}
			}
		},
		[isLandlordOrAdmin, selectedMonth],
	);

	useEffect(() => {
		if (authLoading) return;
		let active = true;
		const run = async () => {
			if (active) {
				await loadData();
			}
		};
		void run();
		return () => {
			active = false;
		};
	}, [authLoading, loadData]);

	const loadPaymentProofs = useCallback(async () => {
		if (!isLandlordOrAdmin) return;
		try {
			const data = await fetchJsonDeduped<{ invoices?: InvoiceListItem[] }>(
				"/api/landlord/invoices",
			);
			const list: InvoiceListItem[] = Array.isArray(data.invoices)
				? data.invoices
				: [];
			setInvoices(list);
			writeViewCache("utilities:invoices", list);
			OfflineStorage.set("utility_invoices_cache", list);
		} catch {
			if (!hasViewCache("utilities:invoices")) {
				const cached =
					OfflineStorage.get<InvoiceListItem[]>("utility_invoices_cache")
						?.data || [];
				setInvoices(cached);
			}
		} finally {
			setLoadingInvoices(false);
		}
	}, [isLandlordOrAdmin]);

	useEffect(() => {
		if (authLoading || !isLandlordOrAdmin) return;
		let active = true;
		const run = async () => {
			if (active) {
				await loadPaymentProofs();
			}
		};
		void run();
		return () => {
			active = false;
		};
	}, [authLoading, isLandlordOrAdmin, loadPaymentProofs]);

	const unitLookup = useMemo(() => {
		const nameById: Record<string, string> = {};
		const propertyIdById: Record<string, string> = {};
		const tenantByUnitId: Record<string, string> = {};

		for (const prop of workspace?.properties || []) {
			for (const unit of prop.units || []) {
				nameById[unit.id] = unit.name;
				propertyIdById[unit.id] = prop.id;
			}
		}
		for (const prop of contextProperties) {
			for (const unit of prop.units || []) {
				if (!nameById[unit.id]) nameById[unit.id] = unit.name;
				if (!propertyIdById[unit.id]) propertyIdById[unit.id] = prop.id;
			}
		}
		for (const lease of workspace?.activeLeases || []) {
			if (lease.unit?.id) {
				if (!nameById[lease.unit.id] && lease.unit.name) {
					nameById[lease.unit.id] = lease.unit.name;
				}
				if (!propertyIdById[lease.unit.id] && lease.property?.id) {
					propertyIdById[lease.unit.id] = lease.property.id;
				}
				if (lease.tenant?.full_name) {
					tenantByUnitId[lease.unit.id] = lease.tenant.full_name;
				}
			}
		}

		return { nameById, propertyIdById, tenantByUnitId };
	}, [workspace, contextProperties]);

	const unitLookupRef = useRef(unitLookup);
	useEffect(() => {
		unitLookupRef.current = unitLookup;
	}, [unitLookup]);

	const loadPastBillsHistory = useCallback(async () => {
		if (!isLandlordOrAdmin) return;
		const requestId = ++historyRequestIdRef.current;
		try {
			const months = Array.from({ length: 9 }, (_, idx) =>
				shiftMonthString(getCurrentMonthString(), -idx),
			);

			const summaries = await Promise.all(
				months.map(async (month) => {
					try {
						const res = await fetch(
							`/api/landlord/utility-readings?month=${encodeURIComponent(month)}`,
							{ cache: "no-store" },
						);
						if (!res.ok) return null;
						const data = await res.json();
						const rows: Array<Record<string, unknown>> = Array.isArray(
							data.readings,
						)
							? data.readings
							: [];
						const scopedRows =
							selectedPropertyId === "all"
								? rows
								: rows.filter((r) => {
										const unitId =
											typeof r.unit_id === "string"
												? r.unit_id
												: typeof r.unitId === "string"
													? r.unitId
													: undefined;
										const propId =
											r.property_id ??
											r.propertyId ??
											(unitId
												? unitLookupRef.current.propertyIdById[unitId]
												: undefined);
										return propId === selectedPropertyId;
								  });
						if (scopedRows.length === 0) return null;

						let totalCharges = 0;
						let totalElectricKwh = 0;
						let totalWaterM3 = 0;
						const billedPaymentIds = new Set<string>();
						let fallbackPostedCount = 0;

						for (const r of scopedRows) {
							totalCharges += Number(
								r.totalCharge ?? r.total_charge ?? r.computed_charge ?? 0,
							);
							const paymentId =
								typeof r.payment_id === "string" && r.payment_id
									? r.payment_id
									: typeof r.paymentId === "string" && r.paymentId
										? r.paymentId
										: null;
							const invoiceId =
								typeof r.invoice_id === "string" && r.invoice_id
									? r.invoice_id
									: typeof r.invoiceId === "string" && r.invoiceId
										? r.invoiceId
										: null;

							if (paymentId) {
								billedPaymentIds.add(paymentId);
							} else if (invoiceId) {
								billedPaymentIds.add(invoiceId);
							} else if (r.isPosted || r.is_posted) {
								fallbackPostedCount += 1;
							}

							const uType = String(r.utilityType ?? r.utility_type ?? "");
							const prev = Number(r.previous_reading ?? r.previousReading ?? 0);
							const curr = Number(r.current_reading ?? r.currentReading ?? 0);
							const rawUsage = r.usage ?? r.usage_amount;
							const usage =
								rawUsage !== undefined && rawUsage !== null
									? Number(rawUsage) || 0
									: Math.max(0, curr - prev);
							if (uType === "electricity") totalElectricKwh += usage;
							if (uType === "water") totalWaterM3 += usage;
						}

						return {
							month,
							monthLabel: formatMonthLabel(month),
							readingCount: scopedRows.length,
							postedCount:
								billedPaymentIds.size > 0
									? billedPaymentIds.size
									: fallbackPostedCount,
							totalCharges,
							totalElectricKwh,
							totalWaterM3,
						} satisfies PastMonthSummary;
					} catch {
						return null;
					}
				}),
			);

			if (requestId !== historyRequestIdRef.current) return;
			const nonEmpty = summaries.filter(
				(item): item is PastMonthSummary => item !== null,
			);
			setPastMonths(nonEmpty);
			writeViewCache(historyCacheKey, nonEmpty);
		} finally {
			if (requestId === historyRequestIdRef.current) {
				setLoadingHistory(false);
			}
		}
	}, [isLandlordOrAdmin, selectedPropertyId, historyCacheKey]);

	useEffect(() => {
		if (activeTab === "history" && !authLoading) {
			void loadPastBillsHistory();
		}
	}, [activeTab, authLoading, loadPastBillsHistory]);

	// Selector properties list (sync with PropertyContext or workspace fallback)
	const selectorProperties = useMemo(() => {
		if (contextProperties.length > 0) {
			return contextProperties;
		}
		if (!workspace?.properties) return [];
		return workspace.properties.map((p) => ({
			id: p.id,
			name: p.name,
			address: "",
			image: null,
			units: (p.units || []).map((u) => ({
				id: u.id,
				name: u.name,
				status: u.status,
				rentAmount: u.rent_amount,
			})),
		}));
	}, [contextProperties, workspace]);

	// Drafts for the selected billing month
	const currentMonthDrafts = useMemo(
		() => monthlyDrafts[selectedMonth] || [],
		[monthlyDrafts, selectedMonth],
	);

	// Property-scoped drafts (ALWAYS the baseline for counts & totals, never affected by filter chips)
	const propertyScopedDrafts = useMemo(() => {
		if (selectedPropertyId === "all") return currentMonthDrafts;
		return currentMonthDrafts.filter(
			(d) => d.propertyId === selectedPropertyId,
		);
	}, [currentMonthDrafts, selectedPropertyId]);

	// Counts over property-scoped drafts
	const filterCounts = useMemo(() => {
		let occupied = 0;
		let needsReading = 0;
		let ready = 0;

		for (const d of propertyScopedDrafts) {
			const isOcc = d.occupancyStatus === "occupied";
			if (isOcc) occupied += 1;

			if (isDraftReady(d)) ready += 1;
			else if (isOcc) needsReading += 1;
		}

		return {
			occupied,
			needs_reading: needsReading,
			ready,
			all: propertyScopedDrafts.length,
		};
	}, [propertyScopedDrafts]);

	// Reset filter initialization cleanly when property changes
	const [prevPropertyId, setPrevPropertyId] = useState(selectedPropertyId);
	if (selectedPropertyId !== prevPropertyId) {
		setPrevPropertyId(selectedPropertyId);
		setCurrentPage(0);
		if (propertyScopedDrafts.length > 0) {
			setHasInitializedFilter(true);
			setFilterStatus(filterCounts.occupied > 0 ? "occupied" : "all");
		} else {
			setHasInitializedFilter(false);
		}
	} else if (!hasInitializedFilter && propertyScopedDrafts.length > 0) {
		// Auto-select "occupied" when occupied rooms exist, or fallback to "all" when none
		setHasInitializedFilter(true);
		setFilterStatus(filterCounts.occupied > 0 ? "occupied" : "all");
	}

	const pageResetKey = `${filterStatus}|${searchQuery}|${selectedMonth}`;
	const [prevPageResetKey, setPrevPageResetKey] = useState(pageResetKey);
	if (pageResetKey !== prevPageResetKey) {
		setPrevPageResetKey(pageResetKey);
		setCurrentPage(0);
	}

	// Property-level summary metrics
	const summaryMetrics = useMemo(() => {
		let totalElecKwh = 0;
		let totalWaterM3 = 0;
		let readyCount = 0;

		for (const d of propertyScopedDrafts) {
			const bill = computeDraftBill(d);
			totalElecKwh += bill.elecUsage;
			totalWaterM3 += bill.waterUsage;
			if (bill.isReady) {
				readyCount += 1;
			}
		}

		return {
			readyCount,
			totalRooms: propertyScopedDrafts.length,
			totalElecKwh,
			totalWaterM3,
		};
	}, [propertyScopedDrafts]);

	const hasMissingUtilityRates = useMemo(() => {
		if (propertyScopedDrafts.length === 0) return false;
		return propertyScopedDrafts.every(
			(d) => d.water.rate === 0 && d.electricity.rate === 0,
		);
	}, [propertyScopedDrafts]);

	// Filtered list for Room Cards
	const filteredDrafts = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return propertyScopedDrafts.filter((d) => {
			if (filterStatus === "occupied" && d.occupancyStatus !== "occupied") {
				return false;
			}
			if (
				filterStatus === "needs_reading" &&
				(d.occupancyStatus !== "occupied" || isDraftReady(d))
			) {
				return false;
			}
			if (filterStatus === "ready" && !isDraftReady(d)) {
				return false;
			}

			if (!q) return true;
			const displayRoom = formatRoomDisplayName(d.unitName).toLowerCase();
			return (
				displayRoom.includes(q) ||
				d.unitName.toLowerCase().includes(q) ||
				d.propertyName.toLowerCase().includes(q) ||
				(d.tenantName ?? "").toLowerCase().includes(q)
			);
		});
	}, [propertyScopedDrafts, filterStatus, searchQuery]);

	// Paginated slice (4 per page)
	const totalPages = Math.max(
		1,
		Math.ceil(filteredDrafts.length / ROOMS_PER_PAGE),
	);
	const clampedPage = Math.min(currentPage, totalPages - 1);
	const paginatedDrafts = useMemo(() => {
		const start = clampedPage * ROOMS_PER_PAGE;
		return filteredDrafts.slice(start, start + ROOMS_PER_PAGE);
	}, [filteredDrafts, clampedPage]);

	const activeSheetDrafts = useMemo(() => {
		if (isWalkthroughMode && walkthroughUnitIds.length > 0) {
			const byId = new Map(currentMonthDrafts.map((d) => [d.unitId, d]));
			const list = walkthroughUnitIds
				.map((id) => byId.get(id))
				.filter((d): d is ReadingDraft => Boolean(d));
			if (list.length > 0) return list;
		}
		return filteredDrafts;
	}, [isWalkthroughMode, walkthroughUnitIds, currentMonthDrafts, filteredDrafts]);

	const sheetDraftIndex = useMemo(() => {
		if (!sheetDraftUnitId) return -1;
		return activeSheetDrafts.findIndex((d) => d.unitId === sheetDraftUnitId);
	}, [activeSheetDrafts, sheetDraftUnitId]);

	const sheetDraft = useMemo(() => {
		if (!sheetDraftUnitId) return null;
		return (
			currentMonthDrafts.find((d) => d.unitId === sheetDraftUnitId) ?? null
		);
	}, [currentMonthDrafts, sheetDraftUnitId]);

	const hasPrevSheetRoom = sheetDraftIndex > 0;
	const hasNextSheetRoom =
		sheetDraftIndex >= 0 && sheetDraftIndex < activeSheetDrafts.length - 1;
	const roomPositionLabel =
		sheetDraftIndex >= 0 && activeSheetDrafts.length > 0
			? `${sheetDraftIndex + 1} ${t("of")} ${activeSheetDrafts.length}`
			: undefined;

	// Occupied rooms ready to bill (newly entered, edited, or saved-but-unbilled readings)
	const readyToBillDrafts = useMemo(() => {
		return propertyScopedDrafts.filter((d) => {
			if (d.occupancyStatus !== "occupied" || !d.leaseId) return false;
			if (!isDraftReady(d)) return false;

			const waterSubmetered = isMeterSubmetered(d.water);
			const elecSubmetered = isMeterSubmetered(d.electricity);
			if (!waterSubmetered && !elecSubmetered) return false;

			const waterNeedsBill =
				waterSubmetered &&
				d.water.current.trim() !== "" &&
				(!d.water.exists || !d.water.posted || Boolean(d.water.dirty));
			const elecNeedsBill =
				elecSubmetered &&
				d.electricity.current.trim() !== "" &&
				(!d.electricity.exists || !d.electricity.posted || Boolean(d.electricity.dirty));

			return waterNeedsBill || elecNeedsBill;
		});
	}, [propertyScopedDrafts]);

	const readyBatchTotal = useMemo(() => {
		return readyToBillDrafts.reduce(
			(sum, d) => sum + computeDraftBill(d).totalBill,
			0,
		);
	}, [readyToBillDrafts]);

	const missingOccupiedDrafts = useMemo(() => {
		return propertyScopedDrafts.filter(
			(d) =>
				d.occupancyStatus === "occupied" &&
				!isDraftReady(d) &&
				!readyToBillDrafts.some((u) => u.unitId === d.unitId),
		);
	}, [propertyScopedDrafts, readyToBillDrafts]);

	// Pending verification payment proofs
	const pendingProofInvoices = useMemo(() => {
		return invoices.filter((inv) => {
			const isPending =
				inv.status === "under_review" ||
				inv.workflowStatus === "under_review" ||
				inv.proofStatus === "submitted" ||
				(Boolean(inv.paymentProofUrl) &&
					inv.status !== "paid" &&
					inv.status !== "receipted" &&
					inv.status !== "rejected");
			if (!isPending) return false;
			if (selectedPropertyId !== "all" && selectedProperty?.name) {
				return inv.property.trim() === selectedProperty.name.trim();
			}
			return true;
		});
	}, [invoices, selectedPropertyId, selectedProperty]);

	const handleChangeMeter = useCallback(
		(unitId: string, utilityType: "water" | "electricity", raw: string) => {
			const sanitized = sanitizeMeterInput(raw);
			setMonthlyDrafts((prevMap) => {
				const list = prevMap[selectedMonth] || [];
				const nextList = list.map((d) => {
					if (d.unitId !== unitId) return d;
					return {
						...d,
						[utilityType]: {
							...d[utilityType],
							current: sanitized,
							dirty: true,
						},
					};
				});
				const nextMap = { ...prevMap, [selectedMonth]: nextList };
				persistDraftsLocally(nextMap);
				return nextMap;
			});
		},
		[selectedMonth, persistDraftsLocally],
	);

	const validateDraftsBeforeSubmit = useCallback(
		(targetDrafts: ReadingDraft[]): boolean => {
			for (const d of targetDrafts) {
				const wErr = readingCellError(d.water, "Water");
				if (wErr) {
					setSheetInitialFocus("water");
					setSheetDraftUnitId(d.unitId);
					toast.error("Please fix invalid meter reading", {
						description: wErr,
					});
					triggerHaptic("error");
					return false;
				}
				const eErr = readingCellError(d.electricity, "Electricity");
				if (eErr) {
					setSheetInitialFocus("electricity");
					setSheetDraftUnitId(d.unitId);
					toast.error("Please fix invalid meter reading", {
						description: eErr,
					});
					triggerHaptic("error");
					return false;
				}
			}
			return true;
		},
		[],
	);

	const buildRequestsFromDrafts = useCallback(
		(
			draftsToSave: ReadingDraft[],
			includeSavedUnposted = false,
		): ReadingSaveRequest[] => {
			const { start, end } = getMonthBounds(selectedMonth);
			const monthLabel = formatMonthLabel(selectedMonth);
			const requests: ReadingSaveRequest[] = [];

			for (const d of draftsToSave) {
				const leaseRef = d.leaseId || d.unitId;
				const shouldSendWater =
					d.water.current.trim() !== "" &&
					(!d.water.exists ||
						Boolean(d.water.dirty) ||
						(includeSavedUnposted && !d.water.posted));
				if (shouldSendWater) {
					const val = Number(d.water.current);
					if (Number.isFinite(val) && !readingCellError(d.water, "Water")) {
						requests.push({
							leaseId: leaseRef,
							unitId: d.unitId,
							utilityType: "water",
							billingPeriodStart: start,
							billingPeriodEnd: end,
							previousReading: d.water.previous,
							currentReading: val,
							note: `Water meter reading for ${monthLabel}`,
						});
					}
				}
				const shouldSendElec =
					d.electricity.current.trim() !== "" &&
					(!d.electricity.exists ||
						Boolean(d.electricity.dirty) ||
						(includeSavedUnposted && !d.electricity.posted));
				if (shouldSendElec) {
					const val = Number(d.electricity.current);
					if (
						Number.isFinite(val) &&
						!readingCellError(d.electricity, "Electricity")
					) {
						requests.push({
							leaseId: leaseRef,
							unitId: d.unitId,
							utilityType: "electricity",
							billingPeriodStart: start,
							billingPeriodEnd: end,
							previousReading: d.electricity.previous,
							currentReading: val,
							note: `Electricity meter reading for ${monthLabel}`,
						});
					}
				}
			}

			return requests;
		},
		[selectedMonth],
	);

	const executeReadingsSubmit = useCallback(
		async (draftsToSave: ReadingDraft[], postInvoices: boolean): Promise<boolean> => {
			if (!validateDraftsBeforeSubmit(draftsToSave)) {
				return false;
			}

			const requests = buildRequestsFromDrafts(draftsToSave, postInvoices);
			if (requests.length === 0) {
				toast.info(
					postInvoices
						? "Enter at least one new water or electricity reading before sending bills."
						: "No new changes to save yet.",
				);
				return false;
			}

			setSaving(true);
			const payload = {
				readings: requests,
				postInvoices,
				month: selectedMonth,
			};

			const enqueueOffline = () => {
				mutationQueue.enqueue(
					"SAVE_SUBMETER_READINGS",
					"/api/landlord/utility-readings",
					"POST",
					payload,
					`${postInvoices ? "Send" : "Save"} ${requests.length} utility readings for ${formatMonthLabel(selectedMonth)}`,
				);
				toast.success(t("Saved offline on your phone"), {
					description: t("Readings will sync automatically once internet returns."),
				});
				triggerHaptic("success");
				setIsConfirmSendOpen(false);
			};

			const controller =
				typeof AbortController !== "undefined" ? new AbortController() : null;
			const timeoutId = controller
				? setTimeout(() => controller.abort(), 10000)
				: null;

			try {
				if (typeof navigator !== "undefined" && !navigator.onLine) {
					enqueueOffline();
					return true;
				}

				const res = await fetch("/api/landlord/utility-readings", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
					...(controller ? { signal: controller.signal } : {}),
				});

				if (!res.ok) {
					if (isNetworkOrOfflineError(null, res.status)) {
						enqueueOffline();
						return true;
					}
					const errJson = await res.json().catch(() => ({}));
					throw new Error(errJson.error || "Could not save readings");
				}

				triggerHaptic("success");
				toast.success(
					postInvoices
						? `Sent bills for ${formatMonthLabel(selectedMonth)}!`
						: "Readings saved!",
					{
						description: postInvoices
							? `${requests.length} meter reading(s) posted to tenant bills.`
							: `${requests.length} meter reading(s) saved safely.`,
					},
				);

				setIsConfirmSendOpen(false);
				await loadData();
				return true;
			} catch (err) {
				if (isNetworkOrOfflineError(err)) {
					enqueueOffline();
					return true;
				}

				triggerHaptic("error");
				toast.error(
					err instanceof Error ? err.message : "Failed to save meter readings",
				);
				return false;
			} finally {
				if (timeoutId) clearTimeout(timeoutId);
				setSaving(false);
			}
		},
		[
			buildRequestsFromDrafts,
			loadData,
			selectedMonth,
			validateDraftsBeforeSubmit,
		],
	);

	const handleOpenConfirmSend = () => {
		if (!validateDraftsBeforeSubmit(propertyScopedDrafts)) return;
		if (readyToBillDrafts.length === 0) {
			toast.info("Enter at least one room's reading first", {
				description:
					"Tap any room below to type this month's water and electricity readings.",
			});
			triggerHaptic("warning");
			return;
		}
		triggerHaptic("light");
		setIsConfirmSendOpen(true);
	};

	const handleSaveSingleRoomSheet = async (draft: ReadingDraft): Promise<boolean> => {
		const hasAnyValue =
			draft.water.current.trim() !== "" ||
			draft.electricity.current.trim() !== "";
		if (!hasAnyValue) {
			return true;
		}
		const hasChanges =
			!draft.water.exists ||
			Boolean(draft.water.dirty) ||
			!draft.electricity.exists ||
			Boolean(draft.electricity.dirty);
		if (!hasChanges) {
			return true;
		}
		return executeReadingsSubmit([draft], false);
	};

	const handleStartWalkthrough = () => {
		const baseList =
			filteredDrafts.length > 0 ? filteredDrafts : propertyScopedDrafts;
		if (baseList.length === 0) return;

		const unread = baseList.filter((d) => !isDraftReady(d));
		const ordered = unread.length > 0 ? unread : baseList;
		const first = ordered[0];
		if (!first) return;

		triggerHaptic("light");
		setWalkthroughUnitIds(ordered.map((d) => d.unitId));
		setIsWalkthroughMode(true);
		setSheetInitialFocus("electricity");
		setSheetDraftUnitId(first.unitId);
	};

	const handleSaveAndNextRoom = async (draft: ReadingDraft): Promise<boolean> => {
		const ok = await handleSaveSingleRoomSheet(draft);
		if (!ok) return false;

		if (sheetDraftIndex >= 0 && sheetDraftIndex < activeSheetDrafts.length - 1) {
			triggerHaptic("light");
			setSheetDraftUnitId(activeSheetDrafts[sheetDraftIndex + 1].unitId);
		} else {
			setSheetDraftUnitId(null);
			setSheetInitialFocus(undefined);
			setIsWalkthroughMode(false);
		}
		return true;
	};

	const syncPendingQueue = useCallback(async () => {
		if (isSyncingRef.current) return;
		if (typeof navigator !== "undefined" && !navigator.onLine) return;
		if (mutationQueue.getQueue().length === 0) return;

		isSyncingRef.current = true;
		setSyncingQueue(true);
		try {
			const { successful } = await mutationQueue.processQueue();
			if (successful > 0) {
				await loadData();
				toast.success(t("All saved readings synced!"), {
					description: `${successful} ${t("saved batch(es) uploaded.")}`,
				});
				triggerHaptic("success");
			}
		} finally {
			isSyncingRef.current = false;
			setSyncingQueue(false);
		}
	}, [loadData, t]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		let timer: ReturnType<typeof setTimeout> | null = null;
		const scheduleSync = () => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				void syncPendingQueue();
			}, 1200);
		};
		if (navigator.onLine && mutationQueue.getQueue().length > 0) {
			scheduleSync();
		}
		window.addEventListener("online", scheduleSync);
		return () => {
			if (timer) clearTimeout(timer);
			window.removeEventListener("online", scheduleSync);
		};
	}, [syncPendingQueue]);

	// Guard for tenant accounts
	if (!authLoading && !isLandlordOrAdmin) {
		return (
			<div className="px-4 py-10 max-w-md mx-auto">
				<div className="rounded-2xl border border-border bg-card p-6 text-center space-y-4 shadow-sm">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
						<Gauge className="h-6 w-6" />
					</div>
					<h2 className="text-lg font-bold text-foreground">
						{t("Landlord Meter Workspace")}
					</h2>
					<p className="text-sm text-muted-foreground">
						{t("Your own water and electricity charges appear inside your Bills screen.")}
					</p>
					<button
						type="button"
						onClick={() => router.push("/mobile/billing")}
						className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
					>
						{t("Go to My Bills")}
					</button>
				</div>
			</div>
		);
	}

	if (loading && !workspace) {
		return (
			<div className="px-4 pt-2.5 pb-6 space-y-3">
				<div className="h-14 rounded-[1.75rem] bg-muted/50 animate-pulse" />
				<div className="h-13 rounded-[1.5rem] bg-muted/40 animate-pulse" />
				<div className="h-24 rounded-[1.5rem] bg-muted/40 animate-pulse" />
				<div className="h-11 rounded-xl bg-muted/40 animate-pulse" />
				<div className="flex gap-1.5">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className="h-10 w-20 rounded-full bg-muted/40 animate-pulse" />
					))}
				</div>
				<div className="h-40 rounded-[1.5rem] bg-muted/40 animate-pulse" />
				<div className="h-40 rounded-[1.5rem] bg-muted/40 animate-pulse" />
			</div>
		);
	}

	if (loadError && !workspace) {
		return (
			<div className="px-4 py-10 max-w-md mx-auto">
				<div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-card p-6 text-center space-y-4 shadow-sm">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
						<AlertTriangle className="h-6 w-6" />
					</div>
					<h2 className="text-lg font-bold text-foreground">
						{t("Could Not Load Readings")}
					</h2>
					<p className="text-sm text-muted-foreground">{t(loadError)}</p>
					<button
						type="button"
						onClick={() => {
							triggerHaptic("light");
							setLoading(true);
							setLoadError(null);
							void loadData();
						}}
						className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
					>
						<RefreshCw className="h-4 w-4" />
						<span>{t("Try Again")}</span>
					</button>
				</div>
			</div>
		);
	}

	const monthLabel = formatMonthLabel(selectedMonth);

	return (
		<div className="flex flex-col min-h-full">
			<PullToRefresh
				onRefresh={async () => {
					setRefreshing(true);
					setLoadError(null);
					await loadData();
				}}
				className="flex-1"
			>
				<div className="px-4 pt-2.5 pb-6 space-y-3">
					{/* Offline / Cached / Queue Banner */}
					{(!isOnline || usingCachedData || pendingQueueCount > 0) && (
						<div className="rounded-2xl border border-amber-300/70 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 px-3.5 py-2.5 flex items-center justify-between gap-2.5">
							<div className="flex items-start gap-2.5 min-w-0">
								<WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
								<div className="text-xs space-y-0.5 min-w-0">
									<p className="font-bold text-amber-950 dark:text-amber-100">
										{!isOnline
											? t("Working Offline")
											: usingCachedData
												? t("Showing Saved Copy")
												: t("Pending Sync")}
									</p>
									<p className="text-amber-800 dark:text-amber-200/90">
										{!isOnline
											? t("Readings are saved on your phone and will sync once internet returns.")
											: pendingQueueCount > 0
												? `${pendingQueueCount} ${t("saved action(s) waiting to sync.")}`
												: t("Showing your latest saved readings.")}
									</p>
								</div>
							</div>
							{isOnline && pendingQueueCount > 0 && (
								<button
									type="button"
									disabled={syncingQueue}
									onClick={() => {
										triggerHaptic("light");
										void syncPendingQueue();
									}}
									className="min-h-[40px] shrink-0 rounded-xl bg-amber-600 px-3 text-xs font-bold text-white hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
								>
									<RefreshCw className={cn("h-3.5 w-3.5", syncingQueue && "animate-spin")} />
									<span>{syncingQueue ? t("Syncing...") : t("Sync Now")}</span>
								</button>
							)}
						</div>
					)}

					{/* Full-Width Property Selector (never squishes property name) */}
					<MobilePropertySelector />

					{/* Calm 4-Tab Bar — concise 1-word labels, zero truncation */}
					<div
						role="tablist"
						aria-label={t("Water and electricity sections")}
						className="m-card grid grid-cols-4 gap-1 border border-border/60 p-1"
					>
						{(
							[
								{
									id: "readings" as ActiveTab,
									label: t("Readings"),
									icon: Gauge,
									badge: null,
								},
								{
									id: "payments" as ActiveTab,
									label: t("Proofs"),
									icon: Receipt,
									badge:
										pendingProofInvoices.length > 0
											? pendingProofInvoices.length
											: null,
								},
								{
									id: "rates" as ActiveTab,
									label: t("Rates"),
									icon: SlidersHorizontal,
									badge: null,
								},
								{
									id: "history" as ActiveTab,
									label: t("History"),
									icon: History,
									badge: null,
								},
							] as const
						).map((tab) => {
							const active = activeTab === tab.id;
							const Icon = tab.icon;
							return (
								<button
									key={tab.id}
									type="button"
									role="tab"
									aria-selected={active}
									onClick={() => {
										triggerHaptic("light");
										if (tab.id === "history" && !readViewCache(historyCacheKey)) {
											setLoadingHistory(true);
										}
										setActiveTab(tab.id);
									}}
									className={cn(
										"relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[11px] font-bold transition-all cursor-pointer",
										active
											? "bg-primary text-primary-foreground shadow-xs"
											: "text-muted-foreground hover:text-foreground hover:bg-muted/50",
									)}
								>
									<Icon className="h-4 w-4 shrink-0" />
									<span className="leading-tight text-center">{tab.label}</span>
									{tab.badge !== null && (
										<span
											className={cn(
												"absolute top-1 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-extrabold tabular-nums flex items-center justify-center",
												active
													? "bg-white text-primary"
													: "bg-rose-500 text-white",
											)}
										>
											{tab.badge}
										</span>
									)}
								</button>
							);
						})}
					</div>

					{/* TAB 1: METER READINGS */}
					{activeTab === "readings" && (
						<div className="space-y-3">
							{/* Unified Month Stepper + Summary Card */}
							<div className="m-card border border-border/60 p-3 space-y-2.5">
								<div className="flex items-center justify-between gap-2">
									<div className="flex flex-1 min-w-0 items-center justify-between gap-1 rounded-xl bg-muted/40 p-1">
										<button
											type="button"
											onClick={() => {
												triggerHaptic("light");
												setSelectedMonth((prev) => shiftMonthString(prev, -1));
											}}
											aria-label={t("Previous month")}
											className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-background text-foreground transition-colors cursor-pointer"
										>
											<ChevronLeft className="h-4 w-4" />
										</button>

										<div className="flex flex-col items-center text-center min-w-0">
											<div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
												<Calendar className="h-4 w-4 text-primary shrink-0" />
												<span className="truncate">{monthLabel}</span>
											</div>
											{draftSaveState !== "idle" && (
												<span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
													<CheckCircle2 className="h-2.5 w-2.5" />
													{draftSaveState === "saving"
														? t("Saving draft...")
														: t("Draft saved")}
												</span>
											)}
										</div>

										<button
											type="button"
											onClick={() => {
												triggerHaptic("light");
												setSelectedMonth((prev) => shiftMonthString(prev, 1));
											}}
											aria-label={t("Next month")}
											className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-background text-foreground transition-colors cursor-pointer"
										>
											<ChevronRight className="h-4 w-4" />
										</button>
									</div>

									<button
										type="button"
										onClick={() => {
											triggerHaptic("light");
											setRefreshing(true);
											setLoadError(null);
											void loadData();
										}}
										aria-label={t("Refresh rooms and readings")}
										className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-foreground hover:bg-muted transition-colors cursor-pointer"
									>
										<RefreshCw
											className={cn(
												"h-4 w-4",
												refreshing && "animate-spin text-primary",
											)}
										/>
									</button>
								</div>

								{selectorProperties.length > 0 && (
									<div className="grid grid-cols-3 divide-x divide-border/60 border-t border-border/60 pt-2.5">
										<div className="pr-2">
											<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
												{t("Progress")}
											</p>
											<p className="mt-0.5 text-sm font-black text-foreground tabular-nums">
												{summaryMetrics.readyCount}
												<span className="text-xs font-semibold text-muted-foreground">
													/{summaryMetrics.totalRooms}
												</span>
											</p>
										</div>

										<div className="px-2.5">
											<p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
												<Zap className="h-3 w-3 shrink-0" />
												<span className="truncate">{t("Electric")}</span>
											</p>
											<p className="mt-0.5 text-sm font-black text-foreground tabular-nums truncate">
												{summaryMetrics.totalElecKwh.toFixed(1)}
												<span className="ml-0.5 text-[10px] font-semibold text-muted-foreground">
													kWh
												</span>
											</p>
										</div>

										<div className="pl-2.5">
											<p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
												<Droplets className="h-3 w-3 shrink-0" />
												<span className="truncate">{t("Water")}</span>
											</p>
											<p className="mt-0.5 text-sm font-black text-foreground tabular-nums truncate">
												{summaryMetrics.totalWaterM3.toFixed(1)}
												<span className="ml-0.5 text-[10px] font-semibold text-muted-foreground">
													m³
												</span>
											</p>
										</div>
									</div>
								)}

								{selectorProperties.length > 0 && propertyScopedDrafts.length > 0 && (
									<button
										type="button"
										onClick={handleStartWalkthrough}
										className="w-full min-h-[48px] rounded-xl bg-primary px-3.5 py-2.5 flex items-center justify-between gap-2 text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-[0.99] cursor-pointer"
									>
										<span className="flex items-center gap-2 text-sm font-bold">
											<ListChecks className="h-4 w-4 shrink-0" />
											<span>{t("Read Rooms 1-by-1")}</span>
										</span>
										<span className="flex items-center gap-1.5 shrink-0">
											<span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold tabular-nums">
												{filterCounts.needs_reading > 0
													? `${filterCounts.needs_reading} ${t("left")}`
													: `${propertyScopedDrafts.length} ${t("rooms")}`}
											</span>
											<ChevronRight className="h-4 w-4" />
										</span>
									</button>
								)}
							</div>

							{selectorProperties.length === 0 ? (
								<div className="m-card border border-border/60 p-6 text-center space-y-3">
									<Building2 className="h-9 w-9 mx-auto text-muted-foreground" />
									<h3 className="text-base font-bold text-foreground">
										{t("No Properties Set Up Yet")}
									</h3>
									<p className="text-sm text-muted-foreground">
										{t("Add a property and rooms first before recording monthly water and electricity readings.")}
									</p>
									<button
										type="button"
										onClick={() => router.push("/mobile/properties")}
										className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
									>
										{t("Go to Properties")}
									</button>
								</div>
							) : (
								<>
									{/* Helpful Warning if Rates Not Configured */}
									{hasMissingUtilityRates && (
										<div className="rounded-2xl border border-amber-300/80 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 px-3.5 py-2.5 flex items-center justify-between gap-3">
											<p className="text-xs font-semibold text-amber-950 dark:text-amber-100">
												{t("Water & electricity rates are set to ₱0.")}
											</p>
											<button
												type="button"
												onClick={() => {
													triggerHaptic("light");
													setActiveTab("rates");
												}}
												className="min-h-[40px] shrink-0 rounded-xl bg-amber-600 px-3 text-xs font-bold text-white hover:bg-amber-700 cursor-pointer"
											>
												{t("Set Rates")}
											</button>
										</div>
									)}

									{/* Search & Unified Segmented Filter Bar */}
									<div className="m-card border border-border/60 p-2 space-y-2">
										<div className="relative">
											<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
											<input
												type="text"
												value={searchQuery}
												maxLength={60}
												onChange={(e) => setSearchQuery(e.target.value)}
												placeholder={t("Search room or tenant name...")}
												aria-label={t("Search room or tenant name")}
												style={{ outline: "none" }}
												className="h-11 w-full rounded-xl bg-muted/40 pl-9 pr-9 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-primary/30"
											/>
											{searchQuery && (
												<button
													type="button"
													onClick={() => setSearchQuery("")}
													aria-label={t("Clear search")}
													className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
												>
													<X className="h-4 w-4" />
												</button>
											)}
										</div>

										<div
											className="grid grid-cols-4 gap-1 rounded-xl bg-muted/40 p-1"
											role="tablist"
											aria-label={t("Filter rooms")}
										>
											{(
												[
													{
														key: "occupied" as FilterStatus,
														label: t("Occupied"),
														count: filterCounts.occupied,
													},
													{
														key: "needs_reading" as FilterStatus,
														label: t("To Read"),
														count: filterCounts.needs_reading,
													},
													{
														key: "ready" as FilterStatus,
														label: t("Ready"),
														count: filterCounts.ready,
													},
													{
														key: "all" as FilterStatus,
														label: t("All"),
														count: filterCounts.all,
													},
												] as const
											).map((tab) => {
												const active = filterStatus === tab.key;
												return (
													<button
														key={tab.key}
														type="button"
														role="tab"
														aria-selected={active}
														onClick={() => {
															triggerHaptic("light");
															setFilterStatus(tab.key);
														}}
														className={cn(
															"flex min-h-[40px] items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-bold transition-all active:scale-[0.98] cursor-pointer",
															active
																? "bg-primary text-primary-foreground shadow-xs"
																: "text-muted-foreground hover:text-foreground",
														)}
													>
														<span className="truncate">{tab.label}</span>
														<span
															className={cn(
																"text-[10px] font-extrabold tabular-nums",
																active ? "text-primary-foreground/90" : "text-muted-foreground",
															)}
														>
															{tab.count}
														</span>
													</button>
												);
											})}
										</div>
									</div>

									{/* Room Cards (4 per page) */}
									{filteredDrafts.length === 0 ? (
										<div className="rounded-2xl border border-border bg-card p-6 text-center space-y-3">
											{propertyScopedDrafts.length > 0 &&
											filterStatus === "occupied" &&
											filterCounts.occupied === 0 ? (
												<>
													<p className="text-base font-bold text-foreground">
														{t("No Occupied Rooms Right Now")}
													</p>
													<p className="text-sm text-muted-foreground">
														{t("All rooms in this property are currently vacant. You can still view or enter meter readings for vacant rooms.")}
													</p>
													<button
														type="button"
														onClick={() => {
															triggerHaptic("light");
															setFilterStatus("all");
														}}
														className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground cursor-pointer"
													>
														{t("Show All Vacant Rooms")}
													</button>
												</>
											) : (
												<>
													<p className="text-base font-bold text-foreground">
														{t("No Rooms Match Your Filter")}
													</p>
													<p className="text-sm text-muted-foreground">
														{searchQuery
															? `${t("No rooms found matching")} "${searchQuery}".`
															: t("Try changing the room filter to see more rooms.")}
													</p>
													<button
														type="button"
														onClick={() => {
															triggerHaptic("light");
															setSearchQuery("");
															setFilterStatus("all");
														}}
														className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-muted/60 px-4 text-sm font-bold text-foreground cursor-pointer"
													>
														{t("Clear All Filters")}
													</button>
												</>
											)}
										</div>
									) : (
										<div className="space-y-3">
											{paginatedDrafts.map((draft) => {
												const bill = computeDraftBill(draft);
												const ready = isDraftReady(draft);
												const elecSubmetered = isMeterSubmetered(draft.electricity);
												const waterSubmetered = isMeterSubmetered(draft.water);
												const allBilled =
													ready &&
													(!elecSubmetered || Boolean(draft.electricity.posted)) &&
													(!waterSubmetered || Boolean(draft.water.posted)) &&
													!draft.electricity.dirty &&
													!draft.water.dirty;
												const savedOnServer =
													(!elecSubmetered || draft.electricity.exists) &&
													(!waterSubmetered || draft.water.exists);
												const recorded =
													draft.water.exists && draft.electricity.exists;
												const elecError = readingCellError(
													draft.electricity,
													"Electricity",
												);
												const waterError = readingCellError(
													draft.water,
													"Water",
												);

												return (
													<div
														key={draft.unitId}
														className="m-card border border-border/60 p-4 space-y-3"
													>
														{/* Band 1: Room Identity & Single Status Pill */}
														<div className="flex items-start justify-between gap-3">
															<div className="min-w-0">
																{selectedPropertyId === "all" && (
																	<p className="text-[11px] font-semibold text-muted-foreground truncate">
																		{draft.propertyName}
																	</p>
																)}
																<h3 className="text-base font-black text-foreground">
																	{formatRoomDisplayName(draft.unitName)}
																</h3>
																<p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground truncate mt-0.5">
																	<User className="h-3.5 w-3.5 shrink-0 opacity-70" />
																	<span className="truncate">
																		{draft.tenantName
																			? draft.tenantName
																			: t("Vacant room")}
																	</span>
																</p>
															</div>

															{allBilled ? (
																<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap shrink-0">
																	<CheckCircle2 className="h-3.5 w-3.5" />
																	<span>{t("Bill Sent")}</span>
																</span>
															) : ready && savedOnServer && !draft.electricity.dirty && !draft.water.dirty ? (
																<span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary whitespace-nowrap shrink-0">
																	<Check className="h-3.5 w-3.5" />
																	<span>{t("Saved · Unbilled")}</span>
																</span>
															) : ready ? (
																<span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary whitespace-nowrap shrink-0">
																	<Check className="h-3.5 w-3.5" />
																	<span>{t("Ready to Send")}</span>
																</span>
															) : (
																<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 whitespace-nowrap shrink-0">
																	<Clock className="h-3.5 w-3.5" />
																	<span>{t("Needs Reading")}</span>
																</span>
															)}
														</div>

														{/* Band 2: Side-by-Side Tappable Meter Boxes */}
														<div className="grid grid-cols-2 gap-2.5">
															<button
																type="button"
																onClick={() => {
																	triggerHaptic("light");
																	setSheetInitialFocus("electricity");
																	setSheetDraftUnitId(draft.unitId);
																}}
																className={cn(
																	"min-h-[76px] rounded-xl border p-3 text-left transition-all active:scale-[0.98] cursor-pointer",
																	!elecSubmetered
																		? "border-border/70 bg-muted/25"
																		: elecError
																			? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/20"
																			: draft.electricity.current
																				? "border-amber-200/90 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20"
																				: "border-dashed border-border bg-muted/30 hover:bg-muted/50",
																)}
															>
																<div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
																	<span className="flex items-center gap-1">
																		<Zap className="h-3.5 w-3.5 shrink-0" />
																		<span>{t("Electric")}</span>
																	</span>
																	{draft.electricity.exists && (
																		<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
																	)}
																</div>

																{!elecSubmetered ? (
																	<>
																		<p className="mt-1.5 text-xs font-bold text-foreground">
																			{draft.electricity.isDirectPay
																				? t("Direct Pay")
																				: t("In Rent")}
																		</p>
																		<p className="text-[11px] font-medium text-muted-foreground mt-0.5">
																			{t("No meter needed")}
																		</p>
																	</>
																) : draft.electricity.current ? (
																	<>
																		<p className="mt-1.5 text-sm font-black text-foreground tabular-nums">
																			{draft.electricity.current}{" "}
																			<span className="text-[11px] font-semibold text-muted-foreground">
																				kWh
																			</span>
																		</p>
																		<p className="text-[11px] font-medium text-muted-foreground tabular-nums mt-0.5">
																			{t("Last")}: {draft.electricity.previous}
																			{bill.hasElec &&
																				` (+${bill.elecUsage.toFixed(1)})`}
																		</p>
																	</>
																) : (
																	<>
																		<p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-foreground">
																			<Plus className="h-3.5 w-3.5 text-primary" />
																			<span>{t("Tap to enter")}</span>
																		</p>
																		<p className="text-[11px] font-medium text-muted-foreground tabular-nums mt-0.5">
																			{t("Last")}: {draft.electricity.previous} kWh
																		</p>
																	</>
																)}
															</button>

															<button
																type="button"
																onClick={() => {
																	triggerHaptic("light");
																	setSheetInitialFocus("water");
																	setSheetDraftUnitId(draft.unitId);
																}}
																className={cn(
																	"min-h-[76px] rounded-xl border p-3 text-left transition-all active:scale-[0.98] cursor-pointer",
																	!waterSubmetered
																		? "border-border/70 bg-muted/25"
																		: waterError
																			? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/20"
																			: draft.water.current
																				? "border-sky-200/90 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/20"
																				: "border-dashed border-border bg-muted/30 hover:bg-muted/50",
																)}
															>
																<div className="flex items-center justify-between text-[11px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wide">
																	<span className="flex items-center gap-1">
																		<Droplets className="h-3.5 w-3.5 shrink-0" />
																		<span>{t("Water")}</span>
																	</span>
																	{draft.water.exists && (
																		<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
																	)}
																</div>

																{!waterSubmetered ? (
																	<>
																		<p className="mt-1.5 text-xs font-bold text-foreground">
																			{draft.water.isDirectPay
																				? t("Direct Pay")
																				: t("In Rent")}
																		</p>
																		<p className="text-[11px] font-medium text-muted-foreground mt-0.5">
																			{t("No meter needed")}
																		</p>
																	</>
																) : draft.water.current ? (
																	<>
																		<p className="mt-1.5 text-sm font-black text-foreground tabular-nums">
																			{draft.water.current}{" "}
																			<span className="text-[11px] font-semibold text-muted-foreground">
																				m³
																			</span>
																		</p>
																		<p className="text-[11px] font-medium text-muted-foreground tabular-nums mt-0.5">
																			{t("Last")}: {draft.water.previous}
																			{bill.hasWater &&
																				` (+${bill.waterUsage.toFixed(1)})`}
																		</p>
																	</>
																) : (
																	<>
																		<p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-foreground">
																			<Plus className="h-3.5 w-3.5 text-primary" />
																			<span>{t("Tap to enter")}</span>
																		</p>
																		<p className="text-[11px] font-medium text-muted-foreground tabular-nums mt-0.5">
																			{t("Last")}: {draft.water.previous} m³
																		</p>
																	</>
																)}
															</button>
														</div>

														{/* Band 3: Bill Estimate & Clear Action */}
														<div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2.5">
															<div>
																<p className="text-[11px] font-semibold text-muted-foreground">
																	{t("Est. Total Bill")}
																</p>
																<p className="text-sm font-black text-foreground tabular-nums">
																	{formatCurrency(bill.totalBill)}
																</p>
															</div>

															<button
																type="button"
																onClick={() => {
																	triggerHaptic("light");
																	setSheetInitialFocus(
																		elecSubmetered ? "electricity" : "water",
																	);
																	setSheetDraftUnitId(draft.unitId);
																}}
																className="min-h-[44px] rounded-xl border border-border bg-background px-3.5 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
															>
																{recorded || ready
																	? t("Edit Readings")
																	: t("Enter Readings")}
															</button>
														</div>
													</div>
												);
											})}

											{/* Pagination Bar */}
											{filteredDrafts.length > ROOMS_PER_PAGE && (
												<div className="m-card border border-border/60 p-3 flex items-center justify-between gap-2">
													<span className="text-xs font-semibold text-muted-foreground tabular-nums">
														{t("Showing")} {clampedPage * ROOMS_PER_PAGE + 1}–
														{Math.min(
															(clampedPage + 1) * ROOMS_PER_PAGE,
															filteredDrafts.length,
														)}{" "}
														{t("of")} {filteredDrafts.length}
													</span>
													<div className="flex items-center gap-2">
														<button
															type="button"
															disabled={clampedPage === 0}
															onClick={() => {
																triggerHaptic("light");
																setCurrentPage((p) => Math.max(0, p - 1));
															}}
															className="min-h-[44px] rounded-xl border border-border bg-background px-3.5 text-xs font-bold text-foreground disabled:opacity-40 cursor-pointer"
														>
															{t("Previous")}
														</button>
														<button
															type="button"
															disabled={clampedPage >= totalPages - 1}
															onClick={() => {
																triggerHaptic("light");
																setCurrentPage((p) =>
																	Math.min(totalPages - 1, p + 1),
																);
															}}
															className="min-h-[44px] rounded-xl border border-border bg-background px-3.5 text-xs font-bold text-foreground disabled:opacity-40 cursor-pointer"
														>
															{t("Next")}
														</button>
													</div>
												</div>
											)}
										</div>
									)}

									{/* Floating Sticky Action Pill (only when ready unbilled rooms exist) */}
									{readyToBillDrafts.length > 0 && (
										<div className="sticky bottom-3 z-30 pt-1">
											<div className="m-card border border-primary/35 bg-card/95 backdrop-blur-md p-3 shadow-lg flex items-center justify-between gap-3">
												<div className="min-w-0">
													<p className="text-xs font-bold text-foreground tabular-nums">
														{readyToBillDrafts.length === 1
															? t("1 room ready to bill")
															: t("{count} rooms ready to bill", {
																	count: readyToBillDrafts.length,
																})}
													</p>
													<p className="text-xs font-semibold text-primary tabular-nums mt-0.5">
														{t("Est. Total")}: {formatCurrency(readyBatchTotal)}
													</p>
												</div>
												<button
													type="button"
													disabled={saving}
													onClick={handleOpenConfirmSend}
													className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
												>
													<Send className="h-3.5 w-3.5 shrink-0" />
													<span>{t("Review & Send Bills")}</span>
												</button>
											</div>
										</div>
									)}
								</>
							)}
						</div>
					)}

					{/* TAB 2: PAYMENT PROOFS */}
					{activeTab === "payments" && (
						<div className="space-y-3">
							{loadingInvoices ? (
								<div className="space-y-3">
									{[0, 1, 2].map((i) => (
										<div
											key={i}
											className="h-32 rounded-[1.5rem] bg-muted/40 animate-pulse"
										/>
									))}
								</div>
							) : pendingProofInvoices.length === 0 ? (
								<div className="m-card border border-border/60 p-7 text-center space-y-3">
									<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
										<CheckCircle2 className="h-6 w-6" />
									</div>
									<h3 className="text-base font-bold text-foreground">
										{t("All Payments Checked!")}
									</h3>
									<p className="text-sm text-muted-foreground">
										{t("No tenant payment screenshots are waiting for review right now.")}
									</p>
								</div>
							) : (
								pendingProofInvoices.map((inv) => {
									const amount = parseInvoiceAmount(inv);
									return (
										<div
											key={inv.id}
											className="m-card border border-border/60 p-4 space-y-3"
										>
											<div className="flex items-start justify-between gap-3">
												<div className="min-w-0">
													<p className="text-xs font-semibold text-muted-foreground truncate">
														{inv.property || t("Property")}
													</p>
													<h3 className="text-base font-black text-foreground truncate">
														{inv.tenant || t("Tenant")}
													</h3>
													<p className="text-xs font-medium text-muted-foreground">
														{inv.unit
															? formatRoomDisplayName(inv.unit)
															: t("Room")}{" "}
														• {paymentMethodLabel(inv.paymentMethod, "GCash")}
													</p>
												</div>

												<div className="text-right shrink-0">
													<p className="text-lg font-black text-foreground tabular-nums">
														{formatCurrency(amount)}
													</p>
													<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
														<Clock className="h-3 w-3" />
														<span>{t("Waiting Review")}</span>
													</span>
												</div>
											</div>

											<button
												type="button"
												onClick={() => {
													triggerHaptic("light");
													setSelectedInvoiceId(inv.id);
												}}
												className="min-h-[48px] w-full rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 cursor-pointer"
											>
												{t("Review Payment")}
											</button>
										</div>
									);
								})
							)}
						</div>
					)}

					{/* TAB 3: WATER & ELECTRIC RATES */}
					{activeTab === "rates" && (
						<MobileUtilityRatesSection
							workspace={workspace}
							selectedPropertyId={selectedPropertyId}
							onSaved={() => {
								setRefreshing(true);
								void loadData();
							}}
						/>
					)}

					{/* TAB 4: PAST BILLS HISTORY */}
					{activeTab === "history" && (
						<div className="space-y-3">
							{loadingHistory ? (
								<div className="space-y-3">
									{[0, 1, 2].map((i) => (
										<div
											key={i}
											className="h-24 rounded-[1.5rem] bg-muted/40 animate-pulse"
										/>
									))}
								</div>
							) : pastMonths.length === 0 ? (
								<div className="m-card border border-border/60 p-7 text-center space-y-2">
									<CalendarDays className="h-8 w-8 mx-auto text-muted-foreground" />
									<h3 className="text-base font-bold text-foreground">
										{t("No Past Readings Yet")}
									</h3>
									<p className="text-sm text-muted-foreground">
										{t("Once you record and send monthly water and electricity readings, previous months will appear here.")}
									</p>
								</div>
							) : (
								pastMonths.map((item) => (
									<button
										key={item.month}
										type="button"
										onClick={() => {
											triggerHaptic("light");
											setHistoryModalMonth(item.month);
										}}
										className="m-card w-full border border-border/60 p-4 text-left hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 cursor-pointer"
									>
										<div className="space-y-1 min-w-0">
											<p className="text-base font-black text-foreground">
												{item.monthLabel}
											</p>
											<p className="text-xs font-medium text-muted-foreground">
												{item.readingCount} {t("meters recorded")} •{" "}
												{item.postedCount} {t("bills sent")}
											</p>
										</div>

										<div className="flex items-center gap-2 shrink-0">
											<span className="text-base font-black text-primary tabular-nums">
												{formatCurrency(item.totalCharges)}
											</span>
											<ChevronRight className="h-5 w-5 text-muted-foreground" />
										</div>
									</button>
								))
							)}
						</div>
					)}
				</div>
			</PullToRefresh>

			{/* Confirm Send Bills Bottom Sheet */}
			<MobileUtilityConfirmSheet
				isOpen={isConfirmSendOpen}
				onClose={() => setIsConfirmSendOpen(false)}
				onConfirm={() => {
					void executeReadingsSubmit(readyToBillDrafts, true);
				}}
				saving={saving}
				monthLabel={monthLabel}
				readyDrafts={readyToBillDrafts}
				missingOccupiedDrafts={missingOccupiedDrafts}
			/>

			{/* Focused Room Meter Bottom Sheet */}
			<MobileUtilityRoomSheet
				isOpen={Boolean(sheetDraft)}
				draft={sheetDraft}
				monthLabel={monthLabel}
				saving={saving}
				initialFocus={sheetInitialFocus}
				roomPositionLabel={roomPositionLabel}
				hasPrevRoom={hasPrevSheetRoom}
				hasNextRoom={hasNextSheetRoom}
				isWalkthroughMode={isWalkthroughMode}
				walkthroughIndex={sheetDraftIndex >= 0 ? sheetDraftIndex : 0}
				walkthroughTotal={activeSheetDrafts.length}
				isOnline={isOnline}
				pendingQueueCount={pendingQueueCount}
				onClose={() => {
					setSheetDraftUnitId(null);
					setSheetInitialFocus(undefined);
					setIsWalkthroughMode(false);
					setWalkthroughUnitIds([]);
				}}
				onChangeMeter={handleChangeMeter}
				onSaveRoom={handleSaveSingleRoomSheet}
				onSaveAndNext={handleSaveAndNextRoom}
				onPrevRoom={() => {
					if (sheetDraftIndex > 0) {
						triggerHaptic("light");
						setSheetDraftUnitId(activeSheetDrafts[sheetDraftIndex - 1].unitId);
					}
				}}
				onNextRoom={() => {
					if (sheetDraftIndex >= 0 && sheetDraftIndex < activeSheetDrafts.length - 1) {
						triggerHaptic("light");
						setSheetDraftUnitId(activeSheetDrafts[sheetDraftIndex + 1].unitId);
					}
				}}
			/>

			{/* Past Month Breakdown Sheet */}
			<MobileUtilityHistorySheet
				month={historyModalMonth}
				selectedPropertyId={selectedPropertyId}
				unitNameById={unitLookup.nameById}
				unitPropertyIdById={unitLookup.propertyIdById}
				tenantNameByUnitId={unitLookup.tenantByUnitId}
				onClose={() => setHistoryModalMonth(null)}
			/>

			{/* Payment Verification Modal (shared with desktop) */}
			{selectedInvoiceId && (
				<InvoiceModal
					invoiceId={selectedInvoiceId}
					onClose={() => setSelectedInvoiceId(null)}
					onUpdated={() => {
						setSelectedInvoiceId(null);
						void loadPaymentProofs();
						setRefreshing(true);
						void loadData();
					}}
				/>
			)}
		</div>
	);
}
