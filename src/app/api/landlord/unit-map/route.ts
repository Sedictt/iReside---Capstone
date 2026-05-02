import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type UnitMapPositionRow = {
    unit_id: string;
    floor_key: string;
    x: number;
    y: number;
    w: number;
    h: number;
};

function isValidUnitMapPosition(position: Pick<UnitMapPositionRow, "floor_key" | "x" | "y" | "w" | "h"> | null | undefined) {
    if (!position) return false;

    const floorKey = position.floor_key?.trim().toLowerCase();
    if (!floorKey || floorKey === "none" || floorKey === "null" || floorKey === "undefined") {
        return false;
    }

    return Number.isFinite(position.x)
        && Number.isFinite(position.y)
        && Number.isFinite(position.w)
        && Number.isFinite(position.h)
        && position.w > 0
        && position.h > 0;
}

/** GET /api/landlord/unit-map?propertyId=xxx
 *  Returns: units (with positions), floor_configs, map_decorations
 */
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const propertyId = request.nextUrl.searchParams.get("propertyId");
    if (!propertyId) {
        return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: property, error: propError } = await supabase
        .from("properties")
        .select("id, map_decorations" as any)
        .eq("id", propertyId)
        .eq("landlord_id", user.id)
        .maybeSingle() as any;

    if (propError || !property) {
        return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    // Fetch floor configs ordered by sort_order / floor_number
    const { data: floorConfigs, error: floorError } = await (supabase
        .from("property_floor_configs" as any)
        .select("id, floor_number, floor_key, display_name, sort_order")
        .eq("property_id", propertyId)
        .order("sort_order", { ascending: true })
        .order("floor_number", { ascending: true }) as any);

    if (floorError) {
        return NextResponse.json({ error: "Failed to fetch floor configs" }, { status: 500 });
    }

    // Fetch units with their map positions
    const { data: units, error: unitsError } = await supabase
        .from("units")
        .select("id, name, floor, status, rent_amount, beds, baths, sqft")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true });

    if (unitsError) {
        return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
    }

    const unitIds = (units ?? []).map(u => u.id);
    
    let positions: UnitMapPositionRow[] = [];

    if (unitIds.length > 0) {
        const { data: posData, error: posError } = await (supabase
            .from("unit_map_positions" as any)
            .select("unit_id, floor_key, x, y, w, h")
            .in("unit_id", unitIds) as any);

        if (posError) {
            return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 });
        }
        positions = posData ?? [];
    }

    // Fetch active leases for units in this property (owned by the landlord)
    let leaseData: Record<string, { tenant_name: string | null; lease_start: string | null; lease_end: string | null; tenant_avatar_url: string | null; tenant_avatar_bg_color: string | null }> = {};
    
    if (unitIds.length > 0) {
        const { data: leases, error: leasesError } = await supabase
            .from("leases")
            .select(`
                unit_id,
                start_date,
                end_date,
                profiles!leases_tenant_id_fkey(full_name, avatar_url, avatar_bg_color)
            `)
            .in("unit_id", unitIds)
            .eq("landlord_id", user.id)
            .in("status", ["active", "pending_landlord_signature", "pending_tenant_signature"]);

        if (leasesError) {
            return NextResponse.json({ error: "Failed to fetch lease data" }, { status: 500 });
        }

        // Build lease lookup by unit_id
        for (const lease of (leases ?? []) as any[]) {
            leaseData[lease.unit_id] = {
                tenant_name: lease.profiles?.full_name ?? null,
                tenant_avatar_url: lease.profiles?.avatar_url ?? null,
                tenant_avatar_bg_color: lease.profiles?.avatar_bg_color ?? null,
                lease_start: lease.start_date ?? null,
                lease_end: lease.end_date ?? null,
            };
        }
    }

    // Fetch maintenance requests for units in this property
    let maintenanceData: Record<string, { maintenance_title: string | null; maintenance_description: string | null; maintenance_created_at: string | null; maintenance_status: string | null }> = {};
    
    if (unitIds.length > 0) {
        const { data: maintenanceRequests, error: maintenanceError } = await supabase
            .from("maintenance_requests")
            .select("unit_id, title, description, status, created_at")
            .in("unit_id", unitIds)
            .eq("landlord_id", user.id)
            .in("status", ["open", "assigned", "in_progress"]);

        if (maintenanceError) {
            return NextResponse.json({ error: "Failed to fetch maintenance data" }, { status: 500 });
        }

        // Build maintenance lookup by unit_id (use latest if multiple)
        for (const request of (maintenanceRequests ?? []) as any[]) {
            maintenanceData[request.unit_id] = {
                maintenance_title: request.title ?? null,
                maintenance_description: request.description ?? null,
                maintenance_created_at: request.created_at ?? null,
                maintenance_status: request.status ?? null,
            };
        }
    }

    // Fetch pending application counts for units
    let applicationCounts: Record<string, number> = {};
    if (unitIds.length > 0) {
        const { data: apps, error: appsError } = await (supabase
            .from("tenant_applications" as any)
            .select("unit_id, id")
            .in("unit_id", unitIds)
            .in("status", ["pending", "reviewing"]) as any);
        
        if (!appsError && apps) {
            for (const app of (apps as any[])) {
                applicationCounts[app.unit_id] = (applicationCounts[app.unit_id] || 0) + 1;
            }
        }
    }

    const positionsByUnitId = new Map(
        positions
            .filter((position) => isValidUnitMapPosition(position))
            .map((position) => [position.unit_id, position] as const)
    );

    const enrichedUnits = (units ?? []).map(unit => ({
        ...unit,
        position: positionsByUnitId.get(unit.id) ?? null,
        ...(leaseData[unit.id] ?? {}),
        ...(maintenanceData[unit.id] ?? {}),
        application_count: applicationCounts[unit.id] || 0,
    }));

    const placedCount = enrichedUnits.filter(u => u.position !== null).length;
    const isSetupComplete = enrichedUnits.length > 0 && placedCount === enrichedUnits.length;

    return NextResponse.json({
        floorConfigs: floorConfigs ?? [],
        units: enrichedUnits,
        mapDecorations: property.map_decorations ?? {},
        isSetupComplete,
        placedCount,
        totalUnits: enrichedUnits.length,
    });
}

/** POST /api/landlord/unit-map
 *  Body: { propertyId, positions: [{unitId, floorKey, x, y, w, h}], decorations? }
 *  Upserts all positions + optionally updates decorations blob
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
        propertyId: string;
        positions?: Array<{ unitId: string; floorKey: string; x: number; y: number; w: number; h: number }>;
        decorations?: Record<string, unknown>;
    };

    const { propertyId, positions, decorations } = body;
    if (!propertyId) {
        return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: property, error: propError } = await supabase
        .from("properties")
        .select("id")
        .eq("id", propertyId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (propError || !property) {
        return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    // Upsert/delete positions
    if (positions !== undefined) {
        const { data: propertyUnits, error: propertyUnitsError } = await supabase
            .from("units")
            .select("id")
            .eq("property_id", propertyId);

        if (propertyUnitsError) {
            return NextResponse.json({ error: "Failed to fetch property units" }, { status: 500 });
        }

        const propertyUnitIds = (propertyUnits ?? []).map((unit) => unit.id);
        const propertyUnitIdSet = new Set(propertyUnitIds);
        const validPositions = positions.filter((position) => (
            propertyUnitIdSet.has(position.unitId)
            && isValidUnitMapPosition({
                floor_key: position.floorKey,
                x: position.x,
                y: position.y,
                w: position.w,
                h: position.h,
            })
        ));

        const rows = validPositions.map(p => ({
            unit_id: p.unitId,
            floor_key: p.floorKey,
            x: p.x,
            y: p.y,
            w: p.w,
            h: p.h,
            updated_at: new Date().toISOString(),
        }));

        if (rows.length > 0) {
            const { error: upsertError } = await (supabase
                .from("unit_map_positions" as any)
                .upsert(rows, { onConflict: "unit_id" }) as any);

            if (upsertError) {
                return NextResponse.json({ error: `Failed to save positions: ${upsertError.message}` }, { status: 500 });
            }
        }

        const placedUnitIds = new Set(validPositions.map((position) => position.unitId));
        const unplacedUnitIds = propertyUnitIds.filter((unitId) => !placedUnitIds.has(unitId));

        if (unplacedUnitIds.length > 0) {
            const { error: deleteError } = await (supabase
                .from("unit_map_positions" as any)
                .delete()
                .in("unit_id", unplacedUnitIds) as any);

            if (deleteError) {
                return NextResponse.json({ error: `Failed to clear stale positions: ${deleteError.message}` }, { status: 500 });
            }
        }

        // Also sync units.floor based on floorKey (e.g. "floor2" → floor=2, "ground" → floor=0)
        const floorUpdates = validPositions.map(p => {
            let floorNumber = 1;
            if (p.floorKey === "ground") floorNumber = 0;
            else {
                const match = /^floor(\d+)$/i.exec(p.floorKey);
                if (match) floorNumber = parseInt(match[1], 10);
            }
            return { id: p.unitId, floor: floorNumber };
        });

        for (const update of floorUpdates) {
            await supabase
                .from("units")
                .update({ floor: update.floor })
                .eq("id", update.id);
        }
    }

    // Update decorations blob if provided
    if (decorations !== undefined) {
        const { error: decError } = await (supabase
            .from("properties")
            .update({ map_decorations: decorations } as any)
            .eq("id", propertyId)
            .eq("landlord_id", user.id) as any);

        if (decError) {
            return NextResponse.json({ error: "Failed to save decorations" }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true });
}

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
    
    // First, get all floors for debugging
    const { data: allFloors } = await (supabase
        .from("property_floor_configs" as any)
        .select("id, floor_number, floor_key")
        .eq("property_id", propertyId) as any);
    
    console.log(`[DELETE Floor] All floors in property:`, allFloors);
    console.log(`[DELETE Floor] Looking for floor_key='${normalizedFloorKey}'`);
    
    let { data: floor, error: findError } = await (supabase
        .from("property_floor_configs" as any)
        .select("floor_number")
        .eq("property_id", propertyId)
        .eq("floor_key", normalizedFloorKey)
        .maybeSingle() as any);

    console.log(`[DELETE Floor] Query result:`, { floor, findError });

    // Fallback: If looking for 'ground' and not found, try floor_number: 0
    if (!floor && normalizedFloorKey === "ground") {
        console.log(`[DELETE Floor] Fallback: trying floor_number=0`);
        const { data: fallbackFloor } = await (supabase
            .from("property_floor_configs" as any)
            .select("floor_number")
            .eq("property_id", propertyId)
            .eq("floor_number", 0)
            .maybeSingle() as any);
        console.log(`[DELETE Floor] Fallback result:`, { fallbackFloor });
        if (fallbackFloor) {
            floor = fallbackFloor;
            findError = null;
        }
    }

    if (findError || !floor) {
        console.log(`[DELETE Floor] FAILED - Floor not found`);
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

    // 1. Move units
    await supabase
        .from("units")
        .update({ floor: targetFloorNumber })
        .eq("property_id", propertyId)
        .eq("floor", floor.floor_number);
    
    // 2. Clear positions
    await (supabase
        .from("unit_map_positions" as any)
        .delete()
        .eq("floor_key", floorKey) as any);

    // 3. Delete floor config
    const { error } = await (supabase
        .from("property_floor_configs" as any)
        .delete()
        .eq("property_id", propertyId)
        .eq("floor_key", floorKey) as any);

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
