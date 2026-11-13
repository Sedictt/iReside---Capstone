import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MobileUtilitiesView } from "../MobileUtilitiesView";
import { MobileUtilityRatesSection } from "../MobileUtilityRatesSection";
import type { BillingWorkspace } from "@/lib/billing/server";
import { mutationQueue } from "@/lib/offline/mutationQueue";
import { invalidateViewCache } from "@/lib/mobile/view-cache";

let mockSearchParamsString = "";
let mockSelectedPropertyId = "prop-1";
const defaultMockProperties = [
	{
		id: "prop-1",
		name: "Fernando Dormitory",
		address: "Manila",
		image: null,
		units: [],
	},
];
let mockProperties = defaultMockProperties;
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(mockSearchParamsString),
	useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/context/AuthContext", () => ({
	useAuth: () => ({
		user: { id: "landlord-1" },
		profile: { id: "landlord-1", role: "landlord", full_name: "Nanay Rosa" },
		loading: false,
	}),
}));

vi.mock("@/context/PropertyContext", () => ({
	useProperty: () => {
		const selectedProperty =
			mockProperties.find((p) => p.id === mockSelectedPropertyId) ?? null;
		return {
			properties: mockProperties,
			selectedPropertyId: mockSelectedPropertyId,
			setSelectedPropertyId: vi.fn(),
			selectedProperty,
			loading: false,
			status: "ready",
			setupSignals: null,
			refreshProperties: vi.fn(),
			updateSetupStep: vi.fn(),
		};
	},
}));

vi.mock("@/context/LanguageContext", () => ({
	useLanguageContext: () => ({
		t: (s: string, params?: Record<string, string | number>) =>
			params
				? Object.entries(params).reduce(
						(acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
						s,
					)
				: s,
		language: "en",
		setLanguage: vi.fn(),
	}),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	},
}));

vi.mock("@/components/landlord/invoices/InvoiceModal", () => ({
	InvoiceModal: ({ invoiceId }: { invoiceId: string }) => (
		<div data-testid="invoice-modal">Invoice {invoiceId}</div>
	),
}));

const sampleWorkspace = {
	properties: [
		{
			id: "prop-1",
			name: "Fernando Dormitory",
			units: [
				{ id: "u1", name: "Room 101", status: "occupied", rent_amount: 5000 },
				{ id: "u2", name: "Room 102", status: "occupied", rent_amount: 5000 },
				{ id: "u3", name: "Room 103", status: "occupied", rent_amount: 5000 },
				{ id: "u4", name: "Room 104", status: "occupied", rent_amount: 5000 },
				{ id: "u5", name: "Room 105", status: "occupied", rent_amount: 5000 },
				{ id: "u6", name: "Room 106", status: "vacant", rent_amount: 5000 },
			],
		},
	],
	activeLeases: [
		{
			id: "l1",
			monthly_rent: 5000,
			unit: { id: "u1", name: "Room 101" },
			property: { id: "prop-1", name: "Fernando Dormitory" },
			tenant: { id: "t1", full_name: "Juan Dela Cruz" },
		},
		{
			id: "l2",
			monthly_rent: 5000,
			unit: { id: "u2", name: "Room 102" },
			property: { id: "prop-1", name: "Fernando Dormitory" },
			tenant: { id: "t2", full_name: "Ana Santos" },
		},
		{
			id: "l3",
			monthly_rent: 5000,
			unit: { id: "u3", name: "Room 103" },
			property: { id: "prop-1", name: "Fernando Dormitory" },
			tenant: { id: "t3", full_name: "Pedro Reyes" },
		},
		{
			id: "l4",
			monthly_rent: 5000,
			unit: { id: "u4", name: "Room 104" },
			property: { id: "prop-1", name: "Fernando Dormitory" },
			tenant: { id: "t4", full_name: "Lorna Bautista" },
		},
		{
			id: "l5",
			monthly_rent: 5000,
			unit: { id: "u5", name: "Room 105" },
			property: { id: "prop-1", name: "Fernando Dormitory" },
			tenant: { id: "t5", full_name: "Marco Diaz" },
		},
	],
	utilityConfigs: [
		{ id: "c1", property_id: "prop-1", unit_id: null, utility_type: "water", rate_per_unit: 40 },
		{ id: "c2", property_id: "prop-1", unit_id: null, utility_type: "electricity", rate_per_unit: 15 },
	],
};

const sampleAllReadings = [
	{
		unit_id: "u1",
		lease_id: "l1",
		utility_type: "water",
		billing_period_start: "2026-01-01",
		billing_period_end: "2026-01-31",
		current_reading: 25,
	},
	{
		unit_id: "u1",
		lease_id: "l1",
		utility_type: "electricity",
		billing_period_start: "2026-01-01",
		billing_period_end: "2026-01-31",
		current_reading: 100,
	},
];

describe("MobileUtilitiesView", () => {
	beforeEach(() => {
		mockSearchParamsString = "month=2026-11";
		mockSelectedPropertyId = "prop-1";
		mockProperties = defaultMockProperties;
		localStorage.clear();
		mutationQueue.clear();
		invalidateViewCache();
		Object.defineProperty(navigator, "onLine", {
			configurable: true,
			value: true,
		});
		vi.restoreAllMocks();

		global.fetch = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes("/api/landlord/payment-settings")) {
				return new Response(JSON.stringify(sampleWorkspace), { status: 200 });
			}
			if (url.includes("/api/landlord/utility-readings?month=")) {
				return new Response(JSON.stringify({ readings: [] }), { status: 200 });
			}
			if (url.includes("/api/landlord/utility-readings")) {
				return new Response(JSON.stringify({ readings: sampleAllReadings }), { status: 200 });
			}
			if (url.includes("/api/landlord/invoices")) {
				return new Response(
					JSON.stringify({
						invoices: [
							{
								id: "inv-1",
								invoiceNumber: "INV-001",
								property: "Fernando Dormitory",
								tenant: "Juan Dela Cruz",
								unit: "Room 101",
								amount: 5500,
								subtotal: 5500,
								balanceRemaining: 5500,
								dueDate: "2026-11-30",
								issuedDate: "2026-11-01",
								status: "under_review",
								workflowStatus: "under_review",
								type: "rent",
								proofStatus: "submitted",
								paymentMethod: "gcash",
								referenceNumber: "REF123",
								paymentProofUrl: "https://example.com/proof.jpg",
								itemCount: 2,
								hasReceipt: false,
								amountTag: null,
								reviewAction: null,
								inPersonIntentExpiresAt: null,
								hasRefundRequest: false,
								refundSent: false,
							},
						],
					}),
					{ status: 200 },
				);
			}
			return new Response("{}", { status: 200 });
		}) as typeof fetch;
	});

	it("renders room cards immediately with carried-over previous readings and opens bottom sheet to compute live bill", async () => {
		render(<MobileUtilitiesView />);

		await waitFor(() => {
			expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
		});

		// Never renders "Unit Room 101"
		expect(screen.queryByText(/Unit Room 101/i)).not.toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Room 101" })).toBeInTheDocument();

		// Carried over last month's reading on the card (100 kWh & 25 m³)
		expect(screen.getByText(/Last: 100 kWh/i)).toBeInTheDocument();
		expect(screen.getByText(/Last: 25 m³/i)).toBeInTheDocument();

		// Tap Enter Readings on Room 101 to open the focused bottom sheet
		fireEvent.click(screen.getAllByRole("button", { name: /Enter Readings/i })[0]);

		await waitFor(() => {
			expect(screen.getByLabelText(/Type this month's water reading/i)).toBeInTheDocument();
		});

		// Type current readings -> live bill updates: Rent 5000 + Water (30-25)*40=200 + Elec (110-100)*15=150 = 5350
		fireEvent.change(screen.getByLabelText(/Type this month's water reading/i), {
			target: { value: "30" },
		});
		fireEvent.change(screen.getByLabelText(/Type this month's electricity reading/i), {
			target: { value: "110" },
		});

		expect(screen.getByText("5.0 m³")).toBeInTheDocument();
		expect(screen.getByText("10.0 kWh")).toBeInTheDocument();
		expect(screen.getAllByText(/5,350/).length).toBeGreaterThan(0);

		// Next Room advances directly to Room 102 inside the sheet
		fireEvent.click(screen.getByRole("button", { name: /Next Room/i }));
		await waitFor(() => {
			expect(
				within(screen.getByRole("dialog")).getByRole("heading", { name: "Room 102" }),
			).toBeInTheDocument();
		});
	});

	it("validates on blur inside the room sheet (punish late) and clears immediately on valid input (reward early)", async () => {
		render(<MobileUtilitiesView />);

		await waitFor(() => {
			expect(screen.getAllByRole("button", { name: /Enter Readings/i }).length).toBeGreaterThan(0);
		});

		fireEvent.click(screen.getAllByRole("button", { name: /Enter Readings/i })[0]);

		await waitFor(() => {
			expect(screen.getByLabelText(/Type this month's water reading/i)).toBeInTheDocument();
		});

		const waterInput = screen.getByLabelText(/Type this month's water reading/i);

		// Typing an invalid lower value does not show error until blur
		fireEvent.change(waterInput, { target: { value: "10" } });
		expect(screen.queryByText(/cannot be lower than/i)).not.toBeInTheDocument();

		fireEvent.blur(waterInput);
		expect(screen.getByText(/cannot be lower than/i)).toBeInTheDocument();

		// Reward early: entering >= 25 dismisses the error immediately without re-blur
		fireEvent.change(waterInput, { target: { value: "26" } });
		expect(screen.queryByText(/cannot be lower than/i)).not.toBeInTheDocument();
	});

	it("paginates occupied rooms at 4 per page and supports search reset", async () => {
		render(<MobileUtilitiesView />);

		await waitFor(() => {
			expect(screen.getByText(/Showing 1–4 of 5/i)).toBeInTheDocument();
		});
		expect(screen.queryByText("Marco Diaz")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Next" }));
		await waitFor(() => {
			expect(screen.getByText(/Showing 5–5 of 5/i)).toBeInTheDocument();
		});
		expect(screen.getByText("Marco Diaz")).toBeInTheDocument();

		// Empty search state + Clear All Filters
		const searchInput = screen.getByLabelText(/Search room or tenant name/i);
		fireEvent.change(searchInput, { target: { value: "NoSuchRoom999" } });
		await waitFor(() => {
			expect(screen.getByText(/No Rooms Match Your Filter/i)).toBeInTheDocument();
		});
		fireEvent.click(screen.getByRole("button", { name: /Clear All Filters/i }));
		await waitFor(() => {
			expect(screen.getByText("Room 101")).toBeInTheDocument();
		});
	});

	it("opens Proofs tab directly when ?tab=verify is passed", async () => {
		mockSearchParamsString = "tab=verify&month=2026-11";
		render(<MobileUtilitiesView />);

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "Review Payment" })).toBeInTheDocument();
		});
		expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
	});

	it("reveals Review & Send Bills once a room has readings and posts readings with postInvoices=true", async () => {
		render(<MobileUtilitiesView />);

		await waitFor(() => {
			expect(screen.getAllByRole("button", { name: /Enter Readings/i }).length).toBeGreaterThan(0);
		});

		// Contextual Review & Send Bills button is hidden before readings are entered
		expect(screen.queryByRole("button", { name: /Review & Send Bills/i })).not.toBeInTheDocument();

		fireEvent.click(screen.getAllByRole("button", { name: /Enter Readings/i })[0]);

		await waitFor(() => {
			expect(screen.getByLabelText(/Type this month's water reading/i)).toBeInTheDocument();
		});

		fireEvent.change(screen.getByLabelText(/Type this month's water reading/i), {
			target: { value: "30" },
		});
		fireEvent.change(screen.getByLabelText(/Type this month's electricity reading/i), {
			target: { value: "120" },
		});

		// Close sheet and verify contextual send banner is visible
		fireEvent.click(screen.getByRole("button", { name: "Close" }));

		await waitFor(() => {
			expect(screen.getByRole("button", { name: /Review & Send Bills/i })).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("button", { name: /Review & Send Bills/i }));

		await waitFor(() => {
			expect(screen.getByRole("button", { name: /Yes, Send 1 Bills Now/i })).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("button", { name: /Yes, Send 1 Bills Now/i }));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/landlord/utility-readings",
				expect.objectContaining({
					method: "POST",
				}),
			);
		});

		const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
			(c) => String(c[0]).includes("/api/landlord/utility-readings") && c[1]?.method === "POST",
		);
		expect(postCall).toBeTruthy();
		const body = JSON.parse(String(postCall?.[1]?.body));
		expect(body.postInvoices).toBe(true);
		expect(body.month).toBe("2026-11");
		expect(body.readings).toHaveLength(2);
		expect(body.readings[0].leaseId).toBe("l1");
	});

	it("allows editing an already-recorded reading, validates invalid lower edits, and keeps saved unbilled rooms in Review & Send Bills", async () => {
		const monthReadings = [
			{
				id: "r-w-1",
				property_id: "prop-1",
				unit_id: "u1",
				lease_id: "l1",
				payment_id: null,
				utility_type: "water",
				billing_period_start: "2026-11-01",
				billing_period_end: "2026-11-30",
				previous_reading: 25,
				current_reading: 30,
				usage: 5,
				computed_charge: 200,
			},
			{
				id: "r-e-1",
				property_id: "prop-1",
				unit_id: "u1",
				lease_id: "l1",
				payment_id: null,
				utility_type: "electricity",
				billing_period_start: "2026-11-01",
				billing_period_end: "2026-11-30",
				previous_reading: 100,
				current_reading: 115,
				usage: 15,
				computed_charge: 225,
			},
		];

		global.fetch = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes("/api/landlord/payment-settings")) {
				return new Response(JSON.stringify(sampleWorkspace), { status: 200 });
			}
			if (url.includes("/api/landlord/utility-readings?month=")) {
				return new Response(JSON.stringify({ readings: monthReadings }), {
					status: 200,
				});
			}
			if (url.includes("/api/landlord/utility-readings")) {
				return new Response(JSON.stringify({ readings: sampleAllReadings }), {
					status: 200,
				});
			}
			if (url.includes("/api/landlord/invoices")) {
				return new Response(JSON.stringify({ invoices: [] }), { status: 200 });
			}
			return new Response("{}", { status: 200 });
		}) as typeof fetch;

		render(<MobileUtilitiesView />);

		await waitFor(() => {
			expect(screen.getByText(/Saved · Unbilled/i)).toBeInTheDocument();
		});

		// Saved-but-unbilled rooms remain available in Review & Send Bills
		expect(
			screen.getByRole("button", { name: /Review & Send Bills/i }),
		).toBeInTheDocument();

		// Open Edit Readings on Room 101
		fireEvent.click(screen.getByRole("button", { name: /Edit Readings/i }));
		await waitFor(() => {
			expect(
				screen.getByLabelText(/Type this month's water reading/i),
			).toBeInTheDocument();
		});

		const waterInput = screen.getByLabelText(/Type this month's water reading/i);
		// Editing below previous (25) triggers blur validation
		fireEvent.change(waterInput, { target: { value: "20" } });
		fireEvent.blur(waterInput);
		expect(screen.getByText(/cannot be lower than/i)).toBeInTheDocument();

		// Valid updated reading saves only the dirty reading with postInvoices=false
		fireEvent.change(waterInput, { target: { value: "32" } });
		expect(screen.queryByText(/cannot be lower than/i)).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Save Readings/i }));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/landlord/utility-readings",
				expect.objectContaining({ method: "POST" }),
			);
		});

		const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
			(c) => String(c[0]).includes("/api/landlord/utility-readings") && c[1]?.method === "POST",
		);
		const body = JSON.parse(String(postCall?.[1]?.body));
		expect(body.postInvoices).toBe(false);
		expect(body.readings).toHaveLength(1);
		expect(body.readings[0].utilityType).toBe("water");
		expect(body.readings[0].currentReading).toBe(32);
	});

	afterEach(() => {
		Object.defineProperty(navigator, "onLine", {
			configurable: true,
			value: true,
		});
		mutationQueue.clear();
	});

	it("counts bills sent via payment_id, filters history by selected property, and shows room names instead of UUIDs", async () => {
		const historyReadings = [
			{
				id: "h-1",
				property_id: "prop-1",
				unit_id: "u1",
				lease_id: "l1",
				payment_id: "pay-1",
				utility_type: "water",
				billing_period_start: "2026-10-01",
				billing_period_end: "2026-10-31",
				previous_reading: 20,
				current_reading: 25,
				usage: 5,
				computed_charge: 200,
			},
			{
				id: "h-2",
				property_id: "prop-other",
				unit_id: "u-other",
				lease_id: "l-other",
				payment_id: "pay-2",
				utility_type: "electricity",
				billing_period_start: "2026-10-01",
				billing_period_end: "2026-10-31",
				previous_reading: 50,
				current_reading: 90,
				usage: 40,
				computed_charge: 600,
			},
		];

		global.fetch = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes("/api/landlord/payment-settings")) {
				return new Response(JSON.stringify(sampleWorkspace), { status: 200 });
			}
			if (url.includes("/api/landlord/utility-readings?month=2026-10")) {
				return new Response(JSON.stringify({ readings: historyReadings }), {
					status: 200,
				});
			}
			if (url.includes("/api/landlord/utility-readings?month=")) {
				return new Response(JSON.stringify({ readings: [] }), { status: 200 });
			}
			if (url.includes("/api/landlord/utility-readings")) {
				return new Response(JSON.stringify({ readings: historyReadings }), {
					status: 200,
				});
			}
			if (url.includes("/api/landlord/invoices")) {
				return new Response(JSON.stringify({ invoices: [] }), { status: 200 });
			}
			return new Response("{}", { status: 200 });
		}) as typeof fetch;

		render(<MobileUtilitiesView />);

		await waitFor(() => {
			expect(screen.getByRole("tab", { name: /History/i })).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("tab", { name: /History/i }));

		// Only prop-1 (₱200, 1 bill sent) should be counted, not prop-other (₱600)
		await waitFor(() => {
			expect(screen.getByText(/1 meters recorded • 1 bills sent/i)).toBeInTheDocument();
		});
		expect(screen.getByText(/₱200/)).toBeInTheDocument();

		// Open month breakdown sheet and confirm room name is resolved (no raw u1 UUID)
		fireEvent.click(screen.getByText(/October 2026/i));

		await waitFor(() => {
			expect(
				within(screen.getByRole("dialog")).getByText(/Room 101/i),
			).toBeInTheDocument();
		});
		expect(
			within(screen.getByRole("dialog")).queryByText(/Unit u1/i),
		).not.toBeInTheDocument();
	});

	it("edits and saves rates in Rates tab, preserves unsaved edits across identical background refreshes, and resets on property switch", async () => {
		const twoPropWorkspace = {
			properties: [
				...sampleWorkspace.properties,
				{
					id: "prop-2",
					name: "Maple Suites",
					units: [
						{ id: "u201", name: "Room 201", status: "vacant", rent_amount: 6000 },
					],
				},
			],
			activeLeases: sampleWorkspace.activeLeases,
			utilityConfigs: [
				{ id: "c1", property_id: "prop-1", unit_id: null, utility_type: "water", billing_mode: "tenant_paid", rate_per_unit: 40, note: null },
				{ id: "c2", property_id: "prop-1", unit_id: null, utility_type: "electricity", billing_mode: "tenant_paid", rate_per_unit: 15, note: null },
				{ id: "c3", property_id: "prop-2", unit_id: null, utility_type: "water", billing_mode: "tenant_paid", rate_per_unit: 55, note: null },
				{ id: "c4", property_id: "prop-2", unit_id: null, utility_type: "electricity", billing_mode: "tenant_paid", rate_per_unit: 18, note: null },
			],
		};

		mockProperties = [
			...defaultMockProperties,
			{ id: "prop-2", name: "Maple Suites", address: "QC", image: null, units: [] },
		];

		global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			if (url.includes("/api/landlord/payment-settings")) {
				if (init?.method === "POST") {
					return new Response(JSON.stringify({ ok: true }), { status: 200 });
				}
				return new Response(JSON.stringify(twoPropWorkspace), { status: 200 });
			}
			if (url.includes("/api/landlord/utility-readings?month=")) {
				return new Response(JSON.stringify({ readings: [] }), { status: 200 });
			}
			if (url.includes("/api/landlord/utility-readings")) {
				return new Response(JSON.stringify({ readings: sampleAllReadings }), { status: 200 });
			}
			if (url.includes("/api/landlord/invoices")) {
				return new Response(JSON.stringify({ invoices: [] }), { status: 200 });
			}
			return new Response("{}", { status: 200 });
		}) as typeof fetch;

		const { rerender } = render(<MobileUtilitiesView />);

		await waitFor(() => {
			expect(screen.getByRole("tab", { name: /Rates/i })).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("tab", { name: /Rates/i }));

		const waterRateInput = await screen.findByLabelText(/Price per cubic meter/i);
		expect(waterRateInput).toHaveValue("40");

		// User edits water rate to 48
		fireEvent.change(waterRateInput, { target: { value: "48" } });
		expect(waterRateInput).toHaveValue("48");

		// Save updated rate via POST /api/landlord/payment-settings
		fireEvent.click(screen.getByRole("button", { name: /Save Water & Electric Rates/i }));
		await waitFor(() => {
			const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
				(c) => String(c[0]).includes("/api/landlord/payment-settings") && c[1]?.method === "POST",
			);
			expect(postCall).toBeTruthy();
		});

		// Switching selectedPropertyId while mounted resets draft to prop-2's rate (55)
		mockSelectedPropertyId = "prop-2";
		rerender(<MobileUtilitiesView />);
		await waitFor(() => {
			expect(screen.getByLabelText(/Price per cubic meter/i)).toHaveValue("55");
		});
	});

	it("MobileUtilityRatesSection preserves unsaved edits when workspace revalidates with identical rates, and resets on property switch", () => {
		const ws = {
			properties: [
				{ id: "prop-1", name: "Fernando Dormitory", units: [] },
				{ id: "prop-2", name: "Maple Suites", units: [] },
			],
			activeLeases: [],
			utilityConfigs: [
				{ id: "c1", property_id: "prop-1", unit_id: null, utility_type: "water", billing_mode: "tenant_paid", rate_per_unit: 40, note: null },
				{ id: "c2", property_id: "prop-1", unit_id: null, utility_type: "electricity", billing_mode: "tenant_paid", rate_per_unit: 15, note: null },
				{ id: "c3", property_id: "prop-2", unit_id: null, utility_type: "water", billing_mode: "tenant_paid", rate_per_unit: 55, note: null },
				{ id: "c4", property_id: "prop-2", unit_id: null, utility_type: "electricity", billing_mode: "tenant_paid", rate_per_unit: 18, note: null },
			],
		} as unknown as BillingWorkspace;

		const onSaved = vi.fn();
		const { rerender } = render(
			<MobileUtilityRatesSection
				workspace={ws}
				selectedPropertyId="prop-1"
				onSaved={onSaved}
			/>,
		);

		const waterInput = screen.getByLabelText(/Price per cubic meter/i);
		expect(waterInput).toHaveValue("40");
		fireEvent.change(waterInput, { target: { value: "48" } });
		expect(waterInput).toHaveValue("48");

		// Re-render with a new workspace object reference containing identical server configs
		const clonedWs = JSON.parse(JSON.stringify(ws)) as BillingWorkspace;
		rerender(
			<MobileUtilityRatesSection
				workspace={clonedWs}
				selectedPropertyId="prop-1"
				onSaved={onSaved}
			/>,
		);
		expect(screen.getByLabelText(/Price per cubic meter/i)).toHaveValue("48");

		// Switch property -> resets cleanly to prop-2 rate
		rerender(
			<MobileUtilityRatesSection
				workspace={clonedWs}
				selectedPropertyId="prop-2"
				onSaved={onSaved}
			/>,
		);
		expect(screen.getByLabelText(/Price per cubic meter/i)).toHaveValue("55");
	});

	it("queues readings offline via mutationQueue and updates pending sync banner with useSyncExternalStore", async () => {
		render(<MobileUtilitiesView />);

		await waitFor(() => {
			expect(screen.getAllByRole("button", { name: /Enter Readings/i }).length).toBeGreaterThan(0);
		});

		// Simulate going offline after initial workspace load
		Object.defineProperty(navigator, "onLine", {
			configurable: true,
			value: false,
		});
		fireEvent(window, new Event("offline"));

		await waitFor(() => {
			expect(screen.getByText(/Working Offline/i)).toBeInTheDocument();
		});

		// Enter readings for Room 101 and save while offline
		fireEvent.click(screen.getAllByRole("button", { name: /Enter Readings/i })[0]);
		await waitFor(() => {
			expect(screen.getByLabelText(/Type this month's water reading/i)).toBeInTheDocument();
		});
		fireEvent.change(screen.getByLabelText(/Type this month's water reading/i), {
			target: { value: "30" },
		});
		fireEvent.click(screen.getByRole("button", { name: /Save Readings/i }));

		await waitFor(() => {
			expect(mutationQueue.getQueue()).toHaveLength(1);
		});

		// Come back online -> banner switches to Pending Sync with live queue count from useSyncExternalStore
		Object.defineProperty(navigator, "onLine", {
			configurable: true,
			value: true,
		});
		fireEvent(window, new Event("online"));

		await waitFor(() => {
			expect(screen.getByText(/Pending Sync/i)).toBeInTheDocument();
			expect(screen.getByText(/1 saved action\(s\) waiting to sync/i)).toBeInTheDocument();
		});
	});

	it("supports sequential 1-by-1 walkthrough mode and queues readings seamlessly if connection drops mid-walkthrough", async () => {
		const postedPayloads: unknown[] = [];
		const baseFetch = global.fetch as ReturnType<typeof vi.fn>;
		let failUtilityPostWithNetworkError = false;

		global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			if (url.includes("/api/landlord/utility-readings") && init?.method === "POST") {
				if (failUtilityPostWithNetworkError) {
					throw new TypeError("Failed to fetch");
				}
				postedPayloads.push(JSON.parse(String(init.body || "{}")));
				return new Response(JSON.stringify({ ok: true }), { status: 200 });
			}
			return baseFetch(input, init);
		}) as typeof fetch;

		render(<MobileUtilitiesView />);

		// Wait for walkthrough CTA to render
		const walkthroughBtn = await screen.findByRole("button", {
			name: /Read Rooms 1-by-1/i,
		});
		fireEvent.click(walkthroughBtn);

		// Should open Room 101 in walkthrough mode with Save & Next Room
		const dialog = await screen.findByRole("dialog");
		expect(within(dialog).getByText("Room 101")).toBeInTheDocument();
		expect(within(dialog).getByText(/1 of 5/i)).toBeInTheDocument();
		expect(
			within(dialog).getByRole("button", { name: /Save & Next Room/i }),
		).toBeInTheDocument();

		// Simulate connection drop even while navigator.onLine still reports true
		failUtilityPostWithNetworkError = true;

		fireEvent.change(within(dialog).getByLabelText(/Type this month's water reading/i), {
			target: { value: "31" },
		});
		fireEvent.click(within(dialog).getByRole("button", { name: /Save & Next Room/i }));

		// Queued offline without disrupting walkthrough -> advances directly to Room 102
		await waitFor(() => {
			expect(mutationQueue.getQueue()).toHaveLength(1);
			expect(within(screen.getByRole("dialog")).getByText("Room 102")).toBeInTheDocument();
			expect(within(screen.getByRole("dialog")).getByText(/2 of 5/i)).toBeInTheDocument();
		});

		// Connection returns -> tapping Sync Now flushes queued reading
		failUtilityPostWithNetworkError = false;
		fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Close/i }));

		const syncBtn = await screen.findByRole("button", { name: /Sync Now/i });
		fireEvent.click(syncBtn);

		await waitFor(() => {
			expect(mutationQueue.getQueue()).toHaveLength(0);
			expect(postedPayloads).toHaveLength(1);
		});
	});
});
