import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** PATCH /api/landlord/unit-map/floor-configs
 *  Rename a floor
 */
export async function PATCH(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
        propertyId: string;
        floorKey: string;
        displayName: string;
    };

    const { propertyId, floorKey, displayName } = body;
    if (!propertyId || !floorKey) {
        return NextResponse.json({ error: "propertyId and floorKey required" }, { status: 400 });
    }

    // Verify ownership
    const { data: property } = await supabase
        .from("properties")
        .select("id")
        .eq("id", propertyId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (!property) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { error } = await (supabase
        .from("property_floor_configs" as any)
        .update({ display_name: displayName || null } as any)
        .eq("property_id", propertyId)
        .eq("floor_key", floorKey) as any);

    if (error) {
        return NextResponse.json({ error: "Failed to update floor name" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

/** DELETE /api/landlord/unit-map/floor-configs?propertyId=xxx&floorKey=xxx
 *  Remove a floor and move its units to the first available floor
 */
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const propertyId = request.nextUrl.searchParams.get("propertyId")?.trim();
    const floorKey = request.nextUrl.searchParams.get("floorKey")?.trim();

    if (!propertyId || !floorKey) {
        return NextResponse.json({ error: "propertyId and floorKey required" }, { status: 400 });
    }

    // Verify ownership
    const { data: property } = await supabase
        .from("properties")
        .select("id")
        .eq("id", propertyId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (!property) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get floor info - normalize the floor_key to lowercase for matching
    const normalizedFloorKey = floorKey.toLowerCase().trim();
    
    let { data: floor, error: findError } = await (supabase
        .from("property_floor_configs" as any)
        .select("floor_number")
        .eq("property_id", propertyId)
        .eq("floor_key", normalizedFloorKey)
        .maybeSingle() as any);

    // Fallback: If looking for 'ground' and not found, try floor_number: 0
    if (!floor && normalizedFloorKey === "ground") {
        const { data: fallbackFloor } = await (supabase
            .from("property_floor_configs" as any)
            .select("floor_number")
            .eq("property_id", propertyId)
            .eq("floor_number", 0)
            .maybeSingle() as any);
        if (fallbackFloor) {
            floor = fallbackFloor;
            findError = null;
        }
    }

    if (findError || !floor) {
        return NextResponse.json({ 
            error: "Floor not found", 
            details: `Looking for key '${normalizedFloorKey}' (or floor 0) in property '${propertyId}'` 
        }, { status: 404 });
    }

    // Find first available floor to move units to
    const { data: otherFloors } = await (supabase
        .from("property_floor_configs" as any)
        .select("floor_number")
        .eq("property_id", propertyId)
        .neq("floor_key", floorKey)
        .order("floor_number", { ascending: true })
        .limit(1) as any);

    if (!otherFloors || otherFloors.length === 0) {
        return NextResponse.json({ error: "Cannot delete the last floor" }, { status: 400 });
    }

    const targetFloorNumber = otherFloors[0].floor_number;

    // Run all cleanup operations in parallel
    const [, , { error }] = await Promise.all([
        // 1. Move units
        supabase
            .from("units")
            .update({ floor: targetFloorNumber })
            .eq("property_id", propertyId)
            .eq("floor", floor.floor_number),
        // 2. Clear positions
        supabase
            .from("unit_map_positions" as any)
            .delete()
            .eq("floor_key", floorKey) as any,
        // 3. Delete floor config
        supabase
            .from("property_floor_configs" as any)
            .delete()
            .eq("property_id", propertyId)
            .eq("floor_key", floorKey) as any,
    ]);

    if (error) {
        return NextResponse.json({ error: "Failed to delete floor" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

/** PUT /api/landlord/unit-map/floor-configs
 *  Add a new floor
 */
export async function PUT(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
        propertyId: string;
        floorNumber: number;
        displayName?: string;
    };

    const { propertyId, floorNumber, displayName } = body;
    if (!propertyId || floorNumber === undefined) {
        return NextResponse.json({ error: "propertyId and floorNumber required" }, { status: 400 });
    }

    const floorKey = floorNumber === 0 ? "ground" : `floor${floorNumber}`;

    const { error } = await (supabase
        .from("property_floor_configs" as any)
        .insert({
            property_id: propertyId,
            floor_number: floorNumber,
            floor_key: floorKey,
            display_name: displayName || null,
            sort_order: floorNumber
        } as any) as any);

    if (error) {
        return NextResponse.json({ error: "Failed to add floor" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
