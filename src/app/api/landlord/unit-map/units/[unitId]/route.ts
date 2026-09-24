import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { renumberUnitsList } from "@/lib/unit-naming";

export const dynamic = "force-dynamic";

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ unitId: string }> }
) {
    const { unitId } = await context.params;
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId, supabase } = authContext;

    if (!unitId) {
        return NextResponse.json({ error: "unitId is required" }, { status: 400 });
    }

    // 1. Verify unit exists
    const { data: unit, error: unitError } = await supabase
        .from("units")
        .select("id, property_id, name, floor, status")
        .eq("id", unitId)
        .maybeSingle();

    if (unitError || !unit) {
        return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // 2. Verify property ownership
    const { data: property, error: propError } = await supabase
        .from("properties")
        .select("id, total_units, landlord_id")
        .eq("id", unit.property_id)
        .eq("landlord_id", userId)
        .maybeSingle();

    if (propError || !property) {
        return NextResponse.json({ error: "Property not found or access denied" }, { status: 403 });
    }

    // Safeguard 1: Block occupied units
    if (unit.status && String(unit.status).toLowerCase() === "occupied") {
        return NextResponse.json(
            { error: "Cannot delete an occupied unit." },
            { status: 400 }
        );
    }

    // Safeguard 2: Block units with active or pending leases
    const { data: activeLeases } = await supabase
        .from("leases")
        .select("id")
        .eq("unit_id", unitId)
        .in("status", ["active", "pending", "pending_signature", "approved"])
        .limit(1);

    if (activeLeases && activeLeases.length > 0) {
        return NextResponse.json(
            { error: "Cannot delete a unit with active or pending leases." },
            { status: 400 }
        );
    }

    // Safeguard 3: Minimum 1 unit per property
    const { count: unitCount } = await supabase
        .from("units")
        .select("id", { count: "exact", head: true })
        .eq("property_id", unit.property_id);

    if (unitCount !== null && unitCount <= 1) {
        return NextResponse.json(
            { error: "Properties must have at least one unit." },
            { status: 400 }
        );
    }

    const admin = createServiceRoleSupabaseClient();

    // Remove unit map position if exists
    await admin
        .from("unit_map_positions" as any)
        .delete()
        .eq("unit_id", unitId);

    // Delete the unit
    const { error: deleteError } = await admin
        .from("units")
        .delete()
        .eq("id", unitId);

    if (deleteError) {
        return NextResponse.json(
            { error: "Failed to delete unit." },
            { status: 500 }
        );
    }

    // Sync updated total_units count on the property to prevent auto-heal from re-creating it
    const newTotalUnits = Math.max(1, (unitCount || 1) - 1);
    await admin
        .from("properties")
        .update({
            total_units: newTotalUnits,
            updated_at: new Date().toISOString(),
        })
        .eq("id", unit.property_id);

    // Fetch remaining units
    const { data: remainingUnits, error: fetchError } = await admin
        .from("units")
        .select("id, name, floor, status, rent_amount, beds, baths, sqft")
        .eq("property_id", unit.property_id)
        .order("floor", { ascending: true })
        .order("name", { ascending: true });

    if (fetchError || !remainingUnits) {
        return NextResponse.json({ success: true, units: [], totalUnits: newTotalUnits });
    }

    // Auto-renumber remaining units sequentially across floors
    const renumberedUnits = renumberUnitsList(remainingUnits);

    const updatePromises = renumberedUnits.map((u) =>
        admin
            .from("units")
            .update({ name: u.name })
            .eq("id", u.id)
    );
    await Promise.all(updatePromises);

    // Fetch final updated units
    const { data: refreshedUnits } = await admin
        .from("units")
        .select("id, name, floor, status, rent_amount, beds, baths, sqft")
        .eq("property_id", unit.property_id)
        .order("floor", { ascending: true })
        .order("name", { ascending: true });

    return NextResponse.json({
        success: true,
        units: refreshedUnits ?? renumberedUnits,
        totalUnits: newTotalUnits,
    });
}
