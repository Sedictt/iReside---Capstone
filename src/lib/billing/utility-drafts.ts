import type { BillingWorkspace } from "@/lib/billing/server";
import { parseNumericInput } from "@/lib/validation/rules";
import { currentReadingRule } from "@/lib/validation/schemas/billing.schema";

export type ReadingDraftCell = {
	previous: number;
	current: string;
	exists: boolean;
	rate?: number;
	posted?: boolean;
	dirty?: boolean;
	billingMode?: string;
	isDirectPay?: boolean;
};

export type ReadingDraft = {
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
		posted?: boolean;
		dirty?: boolean;
		billingMode?: string;
		isDirectPay?: boolean;
	};
	electricity: {
		previous: number;
		current: string;
		exists: boolean;
		rate: number;
		posted?: boolean;
		dirty?: boolean;
		billingMode?: string;
		isDirectPay?: boolean;
	};
};

export type ReadingSaveRequest = {
	leaseId: string;
	unitId?: string;
	utilityType: string;
	billingPeriodStart: string;
	billingPeriodEnd: string;
	previousReading: number;
	currentReading: number;
	note: string;
};

/** Inline error for a not-yet-recorded or edited meter reading (blank = not entered, which is allowed). */
export function readingCellError(
	cell: Pick<ReadingDraftCell, "previous" | "current" | "exists" | "dirty">,
	label: string,
): string | undefined {
	if (cell.exists && !cell.dirty) return undefined;
	return currentReadingRule(cell.current, cell.previous, { label, required: false });
}

/** Sanitizes meter reading text input to digits and at most one decimal point (max 10 chars). */
export function sanitizeMeterInput(raw: string): string {
	const stripped = raw.replace(/[^0-9.]/g, "");
	const parts = stripped.split(".");
	const normalized = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : stripped;
	return normalized.slice(0, 10);
}

/** Returns YYYY-MM for the month immediately preceding the given YYYY-MM string. */
export function getPreviousMonthString(monthStr: string): string {
	const [yearStr, monthStrPart] = monthStr.split("-");
	const year = parseInt(yearStr, 10);
	const month = parseInt(monthStrPart, 10);
	if (month === 1) {
		return `${year - 1}-12`;
	}
	return `${year}-${String(month - 1).padStart(2, "0")}`;
}

/** Resolves the most recent prior reading for a unit/lease strictly before targetMonth. */
export function resolvePreviousReading({
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
				(item) => item.unitId === unitId || (leaseId && item.leaseId === leaseId),
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
		.filter((r) => {
			const matchesUnit = r.unit_id === unitId || (leaseId && r.lease_id === leaseId);
			const matchesType = r.utility_type === utilityType;
			const periodStartMonth = (r.billing_period_start || "").slice(0, 7);
			return matchesUnit && matchesType && periodStartMonth < targetMonth;
		})
		.sort((a, b) => {
			const timeA = new Date(a.billing_period_end || a.billing_period_start || a.created_at).getTime();
			const timeB = new Date(b.billing_period_end || b.billing_period_start || b.created_at).getTime();
			return timeB - timeA; // Most recent prior reading first
		});

	if (priorReadings.length > 0) {
		return Number(priorReadings[0].current_reading) || 0;
	}

	return 0;
}

/** Resolves a single utility cell (water or electricity) with saved reading or carried-over prior reading. */
export function resolveUtilityItem({
	targetMonth,
	unitId,
	leaseId,
	utilityType,
	readingsData,
	allReadings,
	monthlyDrafts,
	rate,
	billingMode,
	isDirectPay,
}: {
	targetMonth: string;
	unitId: string;
	leaseId: string | null;
	utilityType: "water" | "electricity";
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readingsData: { readings?: any[] };
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	allReadings: any[];
	monthlyDrafts: Record<string, ReadingDraft[]>;
	rate: number;
	billingMode?: string;
	isDirectPay?: boolean;
}) {
	const currentReading = (readingsData?.readings || []).find(
		(r) => (r.unit_id === unitId || (leaseId && r.lease_id === leaseId)) && r.utility_type === utilityType,
	);

	const existingDraft = monthlyDrafts[targetMonth]?.find(
		(d) => d.unitId === unitId || (leaseId && d.leaseId === leaseId),
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
		const isPosted = Boolean(currentReading.payment_id || currentReading.invoice_id || currentReading.is_posted);
		return {
			previous: recordedPrev > 0 ? recordedPrev : resolvedPrior || 0,
			current:
				currentReading.current_reading !== undefined && currentReading.current_reading !== null
					? currentReading.current_reading.toString()
					: existingUtil?.current || "",
			exists: true,
			posted: isPosted,
			dirty: false,
			rate,
			billingMode,
			isDirectPay,
		};
	}

	return {
		previous:
			existingUtil && existingUtil.previous !== undefined && existingUtil.previous !== 0 && resolvedPrior === 0
				? existingUtil.previous
				: resolvedPrior,
		current: existingUtil?.current || "",
		exists: false,
		posted: false,
		dirty: Boolean(existingUtil?.dirty && existingUtil?.current),
		rate,
		billingMode,
		isDirectPay,
	};
}

/** Builds sorted per-unit reading drafts from the billing workspace, current month readings, and historical readings. */
export function buildDraftsFromWorkspace(
	workspaceData: BillingWorkspace,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readingsData: { readings?: any[] },
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	allReadings: any[],
	targetMonth: string,
	monthlyDrafts: Record<string, ReadingDraft[]> = {},
	unknownUnitLabel = "Unknown Unit",
): ReadingDraft[] {
	const draftsList: ReadingDraft[] = [];
	const seenUnitIds = new Set<string>();

	const resolveRatesForUnit = (propertyId: string, unitId: string) => {
		const propertyWaterConfig = (workspaceData.utilityConfigs || []).find(
			(c) => c.property_id === propertyId && c.utility_type === "water" && c.unit_id === null,
		);
		const unitWaterConfig = (workspaceData.utilityConfigs || []).find(
			(c) => c.unit_id === unitId && c.utility_type === "water",
		);
		const propertyElecConfig = (workspaceData.utilityConfigs || []).find(
			(c) => c.property_id === propertyId && c.utility_type === "electricity" && c.unit_id === null,
		);
		const unitElecConfig = (workspaceData.utilityConfigs || []).find(
			(c) => c.unit_id === unitId && c.utility_type === "electricity",
		);
		const waterConfig = unitWaterConfig ?? propertyWaterConfig;
		const elecConfig = unitElecConfig ?? propertyElecConfig;
		return {
			waterRate: waterConfig?.rate_per_unit || 0,
			elecRate: elecConfig?.rate_per_unit || 0,
			waterMode: waterConfig?.billing_mode,
			elecMode: elecConfig?.billing_mode,
			waterDirect: waterConfig?.note === "responsibility:tenant_direct",
			elecDirect: elecConfig?.note === "responsibility:tenant_direct",
		};
	};

	// 1. Iterate over all properties and their units
	(workspaceData.properties || []).forEach((property) => {
		(property.units || []).forEach((unit) => {
			seenUnitIds.add(unit.id);
			const activeLease = (workspaceData.activeLeases || []).find((l) => l.unit?.id === unit.id);

			const leaseId = activeLease ? activeLease.id : null;
			const isOccupied = !!activeLease;
			const occupancyStatus: "occupied" | "vacant" | "maintenance" = isOccupied
				? "occupied"
				: unit.status === "maintenance"
					? "maintenance"
					: "vacant";

			const { waterRate, elecRate, waterMode, elecMode, waterDirect, elecDirect } = resolveRatesForUnit(
				property.id,
				unit.id,
			);

			draftsList.push({
				unitId: unit.id,
				unitName: unit.name || unknownUnitLabel,
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
					billingMode: waterMode,
					isDirectPay: waterDirect,
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
					billingMode: elecMode,
					isDirectPay: elecDirect,
				}),
			});
		});
	});

	// 2. Include any active lease whose unit might not have been returned in property.units
	(workspaceData.activeLeases || []).forEach((lease) => {
		if (lease.unit?.id && !seenUnitIds.has(lease.unit.id)) {
			seenUnitIds.add(lease.unit.id);
			const propId = lease.property?.id || "";
			const { waterRate, elecRate, waterMode, elecMode, waterDirect, elecDirect } = resolveRatesForUnit(
				propId,
				lease.unit.id,
			);

			draftsList.push({
				unitId: lease.unit.id,
				unitName: lease.unit.name || unknownUnitLabel,
				propertyId: propId,
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
					billingMode: waterMode,
					isDirectPay: waterDirect,
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
					billingMode: elecMode,
					isDirectPay: elecDirect,
				}),
			});
		}
	});

	draftsList.sort((a, b) => a.unitName.localeCompare(b.unitName, undefined, { numeric: true, sensitivity: "base" }));
	return draftsList;
}

/** Returns true if a utility requires submeter reading entry. */
export function isMeterSubmetered(cell: Pick<ReadingDraftCell, "billingMode" | "isDirectPay">): boolean {
	return cell.billingMode !== "included_in_rent" && !cell.isDirectPay;
}

/** Returns true if a single meter cell has a valid saved or entered reading >= previous (or is not submetered). */
export function isMeterCellReady(
	cell: Pick<ReadingDraftCell, "previous" | "current" | "exists" | "dirty" | "billingMode" | "isDirectPay">,
): boolean {
	if (!isMeterSubmetered(cell)) return true;
	if (cell.exists && !cell.dirty) return true;
	const prev = cell.previous || 0;
	const curr = parseNumericInput(cell.current);
	return curr !== null && Number.isFinite(curr) && curr >= prev && cell.current.trim() !== "";
}

/** Returns true when both water and electricity readings for a room are ready. */
export function isDraftReady(draft: ReadingDraft): boolean {
	return isMeterCellReady(draft.water) && isMeterCellReady(draft.electricity);
}

/** Computes usage, utility costs, and total monthly bill estimate for a room draft. */
export function computeDraftBill(draft: ReadingDraft) {
	const waterPrev = draft.water.previous || 0;
	const waterCurr = parseNumericInput(draft.water.current);
	const hasWater = isMeterCellReady(draft.water);
	const waterUsage = waterCurr !== null && waterCurr >= waterPrev ? waterCurr - waterPrev : 0;
	const waterCost = waterUsage * (draft.water.rate || 0);

	const elecPrev = draft.electricity.previous || 0;
	const elecCurr = parseNumericInput(draft.electricity.current);
	const hasElec = isMeterCellReady(draft.electricity);
	const elecUsage = elecCurr !== null && elecCurr >= elecPrev ? elecCurr - elecPrev : 0;
	const elecCost = elecUsage * (draft.electricity.rate || 0);

	const roomRent = draft.occupancyStatus === "occupied" ? draft.rentAmount : 0;
	const totalBill = roomRent + waterCost + elecCost;

	return {
		waterPrev,
		waterUsage,
		waterCost,
		hasWater,
		elecPrev,
		elecUsage,
		elecCost,
		hasElec,
		roomRent,
		totalBill,
		isReady: hasWater && hasElec,
	};
}

/** Avoids redundant prefixes like "Unit Room 101" when a room name already starts with "Room" or "Unit". */
export function formatRoomDisplayName(name: string): string {
	const trimmed = name.trim();
	if (!trimmed) return "Room";
	if (/^(room|unit|apt|apartment|studio|suite)\b/i.test(trimmed)) {
		return trimmed;
	}
	return `Unit ${trimmed}`;
}
