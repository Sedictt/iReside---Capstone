import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser, type AuthenticatedContext } from "@/lib/api/auth-guard";
import { databaseErrorResponse, parseJsonBody, parseSearchParams } from "@/lib/validation/server";
import {
    floorConfigCreateSchema,
    floorConfigDeleteQuerySchema,
    floorConfigRenameSchema,
} from "@/lib/validation/schemas/properties.schema";

async function ownsProperty(supabase: AuthenticatedContext["supabase"], propertyId: string, userId: string) {
    const { data } = await supabase
        .from("properties")
        .select("id")
        .eq("id", propertyId)
        .eq("landlord_id", userId)
        .maybeSingle();
    return Boolean(data);
}

/** PATCH /api/landlord/unit-map/floor-configs
 *  Rename a floor
 */
export async function PATCH(request: NextRequest) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId, supabase } = authContext;

    const parsed = await parseJsonBody(request, floorConfigRenameSchema);
    if (!parsed.ok) return parsed.response;
    const { propertyId, floorKey, displayName } = parsed.data;

    // Verify ownership
    if (!(await ownsProperty(supabase, propertyId, userId))) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: updated, error } = await (supabase
        .from("property_floor_configs" as any)
        .update({ display_name: displayName } as any)
        .eq("property_id", propertyId)
        .eq("floor_key", floorKey)
        .select("id") as any);

    if (error) {
        return NextResponse.json({ error: "Failed to update floor name" }, { status: 500 });
    }

    if (Array.isArray(updated) && updated.length === 0) {
        return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}

/** DELETE /api/landlord/unit-map/floor-configs?propertyId=xxx&floorKey=xxx
 *  Remove a floor and move its units to the first available floor
 */
export async function DELETE(request: NextRequest) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId, supabase } = authContext;

    const rawPropertyId = request.nextUrl.searchParams.get("propertyId")?.trim();
    const rawFloorKey = request.nextUrl.searchParams.get("floorKey")?.trim();

    if (!rawPropertyId || !rawFloorKey) {
        return NextResponse.json({ error: "propertyId and floorKey required" }, { status: 400 });
    }

    const query = parseSearchParams(request.nextUrl.searchParams, floorConfigDeleteQuerySchema);
    if (!query.ok) return query.response;
    const { propertyId } = query.data;

    // Verify ownership
    if (!(await ownsProperty(supabase, propertyId, userId))) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get floor info - normalize the floor_key to lowercase for matching
    const floorKey = query.data.floorKey.toLowerCase();

    let { data: floor, error: findError } = await (supabase
        .from("property_floor_configs" as any)
        .select("floor_number, floor_key")
        .eq("property_id", propertyId)
        .eq("floor_key", floorKey)
        .maybeSingle() as any);

    // Fallback: If looking for 'ground' and not found, try floor_number: 0
    if (!floor && floorKey === "ground") {
        const { data: fallbackFloor } = await (supabase
            .from("property_floor_configs" as any)
            .select("floor_number, floor_key")
            .eq("property_id", propertyId)
            .eq("floor_number", 0)
            .maybeSingle() as any);
        if (fallbackFloor) {
            floor = fallbackFloor;
            findError = null;
        }
    }

    if (findError || !floor) {
        return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    }

    const storedFloorKey: string = floor.floor_key ?? floorKey;

    // Find first available floor to move units to
    const { data: otherFloors } = await (supabase
        .from("property_floor_configs" as any)
        .select("floor_number")
        .eq("property_id", propertyId)
        .neq("floor_key", storedFloorKey)
        .order("floor_number", { ascending: true })
        .limit(1) as any);

    if (!otherFloors || otherFloors.length === 0) {
        return NextResponse.json({ error: "Cannot delete the last floor" }, { status: 400 });
    }

    const targetFloorNumber = otherFloors[0].floor_number;

    // Positions are cleared only for this property's units (floor keys like "floor1" repeat across properties).
    const { data: propertyUnits, error: unitsError } = await supabase
        .from("units")
        .select("id")
        .eq("property_id", propertyId);

    if (unitsError) {
        return databaseErrorResponse(unitsError, "Failed to delete floor");
    }
    const propertyUnitIds = (propertyUnits ?? []).map((unit: { id: string }) => unit.id);

    // Run all cleanup operations in parallel
    const [, , { error }] = await Promise.all([
        // 1. Move units
        supabase
            .from("units")
            .update({ floor: targetFloorNumber })
            .eq("property_id", propertyId)
            .eq("floor", floor.floor_number),
        // 2. Clear positions
        propertyUnitIds.length > 0
            ? (supabase
                .from("unit_map_positions" as any)
                .delete()
                .eq("floor_key", storedFloorKey)
                .in("unit_id", propertyUnitIds) as any)
            : Promise.resolve({ error: null }),
        // 3. Delete floor config
        supabase
            .from("property_floor_configs" as any)
            .delete()
            .eq("property_id", propertyId)
            .eq("floor_key", storedFloorKey) as any,
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
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId, supabase } = authContext;

    const parsed = await parseJsonBody(request, floorConfigCreateSchema);
    if (!parsed.ok) return parsed.response;
    const { propertyId, floorNumber, displayName } = parsed.data;

    // Verify ownership (previously missing: any signed-in user could add floors to any property).
    if (!(await ownsProperty(supabase, propertyId, userId))) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const floorKey = floorNumber === 0 ? "ground" : `floor${floorNumber}`;

    const { error } = await (supabase
        .from("property_floor_configs" as any)
        .insert({
            property_id: propertyId,
            floor_number: floorNumber,
            floor_key: floorKey,
            display_name: displayName,
            sort_order: floorNumber
        } as any) as any);

    if (error) {
        if (error.code === "23505") {
            return NextResponse.json(
                { error: "This floor already exists.", fieldErrors: { floorNumber: "This floor already exists." } },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: "Failed to add floor" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
