import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { renumberUnitsList } from "@/lib/unit-naming";

export const dynamic = "force-dynamic";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ unitId: string }> }
) {
    const { unitId } = await context.params;
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId, supabase } = authContext;

    const body = await request.json() as { floor: number; autoRenumber?: boolean };
    const { floor, autoRenumber = true } = body;

    if (floor === undefined || floor === null) {
        return NextResponse.json({ error: "floor is required" }, { status: 400 });
    }

    // Verify the unit belongs to a property owned by the landlord
    const { data: unit, error: unitError } = await supabase
        .from("units")
        .select("id, property_id, floor, name")
        .eq("id", unitId)
        .maybeSingle();

    if (unitError || !unit) {
        return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const { data: property, error: propError } = await supabase
        .from("properties")
        .select("id")
        .eq("id", unit.property_id)
        .eq("landlord_id", userId)
        .maybeSingle();

    if (propError || !property) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const admin = createServiceRoleSupabaseClient();

    // Update the unit's floor
    const { error: updateError } = await admin
        .from("units")
        .update({ floor })
        .eq("id", unitId);

    if (updateError) {
        return NextResponse.json({ error: "Failed to update unit floor" }, { status: 500 });
    }

    // Clear unit_map_positions if any
    await admin
        .from("unit_map_positions" as any)
        .delete()
        .eq("unit_id", unitId);

    if (!autoRenumber) {
        return NextResponse.json({ success: true });
    }

    // Fetch all units for property
    const { data: allUnits, error: fetchError } = await admin
        .from("units")
        .select("id, name, floor, status, rent_amount, beds, baths, sqft")
        .eq("property_id", unit.property_id);

    if (fetchError || !allUnits) {
        return NextResponse.json({ success: true });
    }

    // Sort units: for each floor, existing units come first, and the newly moved unit comes last
    const sortedForRenumber = [...allUnits].sort((a, b) => {
        if (a.floor !== b.floor) return a.floor - b.floor;
        // On the same floor: the newly moved unit is placed at the end of this floor
        if (a.id === unitId) return 1;
        if (b.id === unitId) return -1;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    });

    const renumbered = renumberUnitsList(sortedForRenumber);

    const updatePromises = renumbered.map((u) =>
        admin
            .from("units")
            .update({ name: u.name })
            .eq("id", u.id)
    );
    await Promise.all(updatePromises);

    const { data: refreshedUnits } = await admin
        .from("units")
        .select("id, name, floor, status, rent_amount, beds, baths, sqft")
        .eq("property_id", unit.property_id)
        .order("floor", { ascending: true })
        .order("name", { ascending: true });

    return NextResponse.json({
        success: true,
        units: refreshedUnits ?? renumbered,
    });
}
