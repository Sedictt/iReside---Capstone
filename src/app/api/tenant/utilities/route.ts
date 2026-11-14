import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const authContext = await requireAuthenticatedUser(request);
	if (!("userId" in authContext)) return authContext as Response;
	const { userId } = authContext;
	const adminClient = createServiceRoleSupabaseClient();

	try {
		const { data: lease } = await adminClient
			.from("leases")
			.select("id, unit_id, status, units(name, property_id, properties(name))")
			.eq("tenant_id", userId)
			.in("status", ["active", "pending_signature"])
			.order("created_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (!lease) {
			return NextResponse.json({
				lease: null,
				readings: [],
				rates: { electricity: null, water: null },
			});
		}

		const unitRel = lease.units as {
			name?: string;
			property_id?: string | null;
			properties?: { name?: string } | null;
		} | null;
		const propertyId = unitRel?.property_id ?? null;

		const [{ data: readings }, { data: configs }] = await Promise.all([
			adminClient
				.from("utility_readings")
				.select(
					"id, utility_type, previous_reading, current_reading, usage, billed_rate, computed_charge, billing_period_start, billing_period_end, payment_id, created_at"
				)
				.eq("lease_id", lease.id)
				.order("billing_period_end", { ascending: false })
				.order("created_at", { ascending: false })
				.limit(24),
			propertyId
				? adminClient
						.from("utility_configs")
						.select("utility_type, rate_per_unit, unit_id, billing_mode")
						.eq("property_id", propertyId)
						.eq("is_active", true)
				: Promise.resolve({ data: [] }),
		]);

		const pickRate = (type: "electricity" | "water") => {
			const list = (configs ?? []).filter((c) => c.utility_type === type);
			const unitOverride = list.find((c) => c.unit_id === lease.unit_id);
			const propDefault = list.find((c) => !c.unit_id);
			const chosen = unitOverride ?? propDefault ?? list[0];
			return chosen ? Number(chosen.rate_per_unit) : null;
		};

		return NextResponse.json({
			lease: {
				id: lease.id,
				unitId: lease.unit_id,
				propertyId,
				unitName: unitRel?.name ?? null,
				propertyName: unitRel?.properties?.name ?? null,
			},
			readings: readings ?? [],
			rates: {
				electricity: pickRate("electricity"),
				water: pickRate("water"),
			},
		});
	} catch (err) {
		console.error("[GET /api/tenant/utilities] Failed:", err);
		return NextResponse.json({ error: "Failed to load utility readings." }, { status: 500 });
	}
}
