import { describe, expect, it } from "vitest";
import type { BillingWorkspace } from "@/lib/billing/server";
import {
	buildDraftsFromWorkspace,
	computeDraftBill,
	formatRoomDisplayName,
	getPreviousMonthString,
	isDraftReady,
	readingCellError,
	resolvePreviousReading,
	sanitizeMeterInput,
} from "../utility-drafts";

describe("utility-drafts", () => {
	it("shifts months across year boundaries cleanly", () => {
		expect(getPreviousMonthString("2026-01")).toBe("2025-12");
		expect(getPreviousMonthString("2026-11")).toBe("2026-10");
	});

	it("sanitizes meter input to digits and at most one decimal point", () => {
		expect(sanitizeMeterInput("12abc4.5.6")).toBe("124.56");
		expect(sanitizeMeterInput("1234567890123")).toBe("1234567890");
	});

	it("validates reading cell against previous reading while allowing blank drafts", () => {
		expect(readingCellError({ previous: 100, current: "", exists: false }, "Water")).toBeUndefined();
		expect(readingCellError({ previous: 100, current: "95", exists: false }, "Water")).toBeDefined();
		expect(readingCellError({ previous: 100, current: "100", exists: false }, "Water")).toBeUndefined();
		expect(readingCellError({ previous: 100, current: "90", exists: true }, "Water")).toBeUndefined();
	});

	it("carries over prior month reading from historical readings or in-memory drafts", () => {
		const allReadings = [
			{
				unit_id: "u1",
				lease_id: "l1",
				utility_type: "water",
				billing_period_start: "2026-09-01",
				billing_period_end: "2026-09-30",
				current_reading: 42,
			},
			{
				unit_id: "u1",
				lease_id: "l1",
				utility_type: "water",
				billing_period_start: "2026-10-01",
				billing_period_end: "2026-10-31",
				current_reading: 58.5,
			},
		];

		expect(
			resolvePreviousReading({
				targetMonth: "2026-11",
				unitId: "u1",
				leaseId: "l1",
				utilityType: "water",
				allReadings,
				monthlyDrafts: {},
			}),
		).toBe(58.5);

		// In-memory prior month draft takes precedence if present
		expect(
			resolvePreviousReading({
				targetMonth: "2026-11",
				unitId: "u1",
				leaseId: "l1",
				utilityType: "water",
				allReadings,
				monthlyDrafts: {
					"2026-10": [
						{
							unitId: "u1",
							unitName: "Room 101",
							propertyId: "p1",
							propertyName: "Dorm A",
							leaseId: "l1",
							tenantName: "Juan",
							occupancyStatus: "occupied",
							rentAmount: 5000,
							water: { previous: 42, current: "61.2", exists: false, rate: 40 },
							electricity: { previous: 100, current: "", exists: false, rate: 15 },
						},
					],
				},
			}),
		).toBe(61.2);
	});

	it("builds drafts with true occupancy, tenant, utility rates, and prior carry-over", () => {
		const workspace = {
			properties: [
				{
					id: "p1",
					name: "Dorm A",
					units: [
						{ id: "u2", name: "Room 102", status: "vacant", rent_amount: 4500 },
						{ id: "u1", name: "Room 101", status: "occupied", rent_amount: 5000 },
					],
				},
			],
			activeLeases: [
				{
					id: "l1",
					monthly_rent: 5200,
					unit: { id: "u1", name: "Room 101" },
					property: { id: "p1", name: "Dorm A" },
					tenant: { id: "t1", full_name: "Maria Clara" },
				},
			],
			utilityConfigs: [
				{ id: "c1", property_id: "p1", unit_id: null, utility_type: "water", rate_per_unit: 45 },
				{ id: "c2", property_id: "p1", unit_id: null, utility_type: "electricity", rate_per_unit: 14 },
			],
		} as unknown as BillingWorkspace;

		const allReadings = [
			{
				unit_id: "u1",
				lease_id: "l1",
				utility_type: "electricity",
				billing_period_start: "2026-10-01",
				billing_period_end: "2026-10-31",
				current_reading: 1200,
			},
		];

		const drafts = buildDraftsFromWorkspace(
			workspace,
			{ readings: [] },
			allReadings,
			"2026-11",
		);

		expect(drafts).toHaveLength(2);
		expect(drafts[0].unitId).toBe("u1"); // Sorted numerically: Room 101 before Room 102
		expect(drafts[0].occupancyStatus).toBe("occupied");
		expect(drafts[0].tenantName).toBe("Maria Clara");
		expect(drafts[0].leaseId).toBe("l1");
		expect(drafts[0].rentAmount).toBe(5200);
		expect(drafts[0].water.rate).toBe(45);
		expect(drafts[0].electricity.rate).toBe(14);
		expect(drafts[0].electricity.previous).toBe(1200);

		expect(drafts[1].unitId).toBe("u2");
		expect(drafts[1].occupancyStatus).toBe("vacant");
		expect(drafts[1].leaseId).toBeNull();
	});

	it("calculates draft bills accurately and marks readiness", () => {
		const bill = computeDraftBill({
			unitId: "u1",
			unitName: "Room 101",
			propertyId: "p1",
			propertyName: "Dorm A",
			leaseId: "l1",
			tenantName: "Maria",
			occupancyStatus: "occupied",
			rentAmount: 5000,
			water: { previous: 10, current: "15", exists: false, rate: 40 },
			electricity: { previous: 100, current: "120", exists: false, rate: 15 },
		});

		expect(bill.waterUsage).toBe(5);
		expect(bill.waterCost).toBe(200);
		expect(bill.elecUsage).toBe(20);
		expect(bill.elecCost).toBe(300);
		expect(bill.totalBill).toBe(5500);
		expect(bill.isReady).toBe(true);

		expect(
			isDraftReady({
				unitId: "u1",
				unitName: "Room 101",
				propertyId: "p1",
				propertyName: "Dorm A",
				leaseId: "l1",
				tenantName: "Maria",
				occupancyStatus: "occupied",
				rentAmount: 5000,
				water: { previous: 10, current: "8", exists: false, rate: 40 },
				electricity: { previous: 100, current: "120", exists: false, rate: 15 },
			}),
		).toBe(false);
	});

	it("avoids duplicate Unit prefix on rooms named Room 101", () => {
		expect(formatRoomDisplayName("Room 101")).toBe("Room 101");
		expect(formatRoomDisplayName("Unit 2B")).toBe("Unit 2B");
		expect(formatRoomDisplayName("103")).toBe("Unit 103");
	});
});
