import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** PATCH /api/landlord/units/[id]/status
 *  Body: { status: "vacant" | "occupied" | "maintenance" }
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const unitId = resolvedParams?.id;
    if (!unitId) {
        return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
    }

    const body = await request.json() as { status?: string };
    const { status } = body;

    const ALLOWED_STATUSES = ["vacant", "occupied", "maintenance"] as const;
    type UnitStatus = typeof ALLOWED_STATUSES[number];

    if (!status || !ALLOWED_STATUSES.includes(status as UnitStatus)) {
        return NextResponse.json(
            { error: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
            { status: 400 }
        );
    }

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
    if (property.landlord_id !== user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Prevent marking as occupied if there's an active lease (the DB trigger handles it)
    // Just update the status directly — the trigger on leases will keep it in sync
    const { error: updateError } = await supabase
        .from("units")
        .update({ status: status as UnitStatus })
        .eq("id", unitId);

    if (updateError) {
        return NextResponse.json({ error: `Failed to update status: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
}
