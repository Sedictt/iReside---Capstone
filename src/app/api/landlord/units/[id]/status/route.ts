import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { databaseErrorResponse, parseJsonBody, parseWithSchema } from "@/lib/validation/server";
import { unitIdSchema, unitStatusSchema } from "@/lib/validation/schemas/properties.schema";

/** Lease states that hold a unit (mirrors the unit-delete safeguard). */
const UNIT_HOLDING_LEASE_STATUSES = ["active", "pending_signature", "pending_tenant_signature", "pending_landlord_signature"];

/** PATCH /api/landlord/units/[id]/status
 *  Body: { status: "vacant" | "occupied" | "maintenance" }
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const resolvedParams = await context.params;
    const unitId = resolvedParams?.id;
    if (!unitId) {
        return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
    }
    const idCheck = parseWithSchema(unitIdSchema, unitId);
    if (!idCheck.ok) return idCheck.response;

    const parsed = await parseJsonBody(request, unitStatusSchema);
    if (!parsed.ok) return parsed.response;
    const { status } = parsed.data;

    // Verify the landlord owns this unit via the property
    const { data: unit, error: unitError } = await supabase
        .from("units")
        .select("id, status, property_id, properties!inner(landlord_id)")
        .eq("id", unitId)
        .maybeSingle();

    if (unitError || !unit) {
        return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const property = unit.properties as unknown as { landlord_id: string };
    if (property.landlord_id !== userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // A unit held by a signed/pending lease cannot be manually released back to vacant;
    // the lease lifecycle (move-out / termination) frees it and the DB trigger keeps it in sync.
    if (status === "vacant" && unit.status !== "vacant") {
        const { data: holdingLeases, error: leaseError } = await supabase
            .from("leases")
            .select("id")
            .eq("unit_id", unitId)
            .in("status", UNIT_HOLDING_LEASE_STATUSES as any)
            .limit(1);

        if (leaseError) {
            return databaseErrorResponse(leaseError, "Failed to update status.");
        }
        if (holdingLeases && holdingLeases.length > 0) {
            return NextResponse.json(
                { error: "This unit has an active or pending lease and cannot be marked vacant.", fieldErrors: { status: "This unit has an active or pending lease and cannot be marked vacant." } },
                { status: 409 }
            );
        }
    }

    const { error: updateError } = await supabase
        .from("units")
        .update({ status })
        .eq("id", unitId);

    if (updateError) {
        console.error("Failed to update unit status:", updateError);
        return databaseErrorResponse(updateError, "Failed to update status.");
    }

    return NextResponse.json({ success: true, status });
}
