import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ unitId: string }> }
) {
    const { unitId } = await context.params;
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId, supabase } = authContext;

    const body = await request.json() as { floor: number };
    const { floor } = body;

    if (floor === undefined || floor === null) {
        return NextResponse.json({ error: "floor is required" }, { status: 400 });
    }

    // Verify the unit belongs to a property owned by the landlord
    const { data: unit, error: unitError } = await supabase
        .from("units")
        .select("id, property_id")
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

    // Update the unit's floor
    const { error: updateError } = await supabase
        .from("units")
        .update({ floor })
        .eq("id", unitId);

    if (updateError) {
        return NextResponse.json({ error: "Failed to update unit floor" }, { status: 500 });
    }

    // Also update/clear position if the floor change makes it invalid 
    // (though in the wizard, unplaced units don't have positions yet)
    await supabase
        .from("unit_map_positions" as any)
        .delete()
        .eq("unit_id", unitId);

    return NextResponse.json({ success: true });
}
