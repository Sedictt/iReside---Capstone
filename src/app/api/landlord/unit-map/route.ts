import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { parseJsonBody, parseSearchParams } from "@/lib/validation/server";
import { unitMapQuerySchema, unitMapSaveSchema } from "@/lib/validation/schemas/properties.schema";

export const dynamic = "force-dynamic";

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
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId, supabase } = authContext;

    const propertyId = request.nextUrl.searchParams.get("propertyId");
    if (!propertyId) {
        return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }
    const query = parseSearchParams(request.nextUrl.searchParams, unitMapQuerySchema);
    if (!query.ok) return query.response;

    // Fetch property, floor configs, and units concurrently
    const [
        { data: property, error: propError },
        { data: initialFloorConfigs, error: floorError },
        { data: initialUnits, error: unitsError }
    ] = await Promise.all([
        supabase
            .from("properties")
            .select("id, name, type, total_units, total_floors, base_rent_amount, map_decorations" as any)
            .eq("id", propertyId)
            .eq("landlord_id", userId)
            .maybeSingle() as any,
        supabase
            .from("property_floor_configs" as any)
            .select("id, floor_number, floor_key, display_name, sort_order")
            .eq("property_id", propertyId)
            .order("sort_order", { ascending: true })
            .order("floor_number", { ascending: true }) as any,
        supabase
            .from("units")
            .select("id, name, floor, status, rent_amount, beds, baths, sqft")
            .eq("property_id", propertyId)
            .order("created_at", { ascending: true })
    ]);

    if (propError || !property) {
        return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    if (floorError) {
        return NextResponse.json({ error: "Failed to fetch floor configs" }, { status: 500 });
    }

    if (unitsError) {
        return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
    }

    let floorConfigs = initialFloorConfigs;
    let units = initialUnits;

    const admin = createServiceRoleSupabaseClient();
    const targetFloors = Math.max(1, Number(property.total_floors) || 1);
    const targetUnits = Math.max(1, Number(property.total_units) || 1);
    const targetRent = Number(property.base_rent_amount) || 0;
    const propType = property.type || "apartment";

    // Auto-heal / sync missing floor configs
    const existingFloorNumbers = new Set((floorConfigs ?? []).map((f: any) => f.floor_number));
    const neededFloorConfigs: any[] = [];
    for (let i = 1; i <= targetFloors; i++) {
        if (!existingFloorNumbers.has(i)) {
            neededFloorConfigs.push({
                property_id: propertyId,
                floor_number: i,
                floor_key: `floor${i}`,
                display_name: `Floor ${i}`,
                sort_order: i,
            });
        }
    }
    for (const u of units ?? []) {
        if (u.floor && u.floor > 0 && !existingFloorNumbers.has(u.floor) && !neededFloorConfigs.some(f => f.floor_number === u.floor)) {
            neededFloorConfigs.push({
                property_id: propertyId,
                floor_number: u.floor,
                floor_key: `floor${u.floor}`,
                display_name: `Floor ${u.floor}`,
                sort_order: u.floor,
            });
        }
    }
    if (neededFloorConfigs.length > 0) {
        await (admin as any)
            .from("property_floor_configs")
            .upsert(neededFloorConfigs, { onConflict: "property_id,floor_key" });

        const { data: refreshedFloors } = await (admin
            .from("property_floor_configs" as any)
            .select("id, floor_number, floor_key, display_name, sort_order")
            .eq("property_id", propertyId)
            .order("sort_order", { ascending: true })
            .order("floor_number", { ascending: true }) as any);
        floorConfigs = refreshedFloors ?? floorConfigs;
    }

    // Auto-heal / sync missing units
    const currentUnitCount = units?.length || 0;
    if (targetUnits > currentUnitCount) {
        const activeFloorList = (floorConfigs ?? []).map((f: any) => f.floor_number).sort((a: number, b: number) => a - b);
        const availableFloors = activeFloorList.length > 0 ? activeFloorList : [1];
        const unitsPerFloor = Math.max(1, Math.ceil(targetUnits / availableFloors.length));
        const unitPrefix = propType === "dormitory" ? "Room" : propType === "boarding_house" ? "Room" : "Unit";
        const unitsToCreate = Array.from({ length: targetUnits - currentUnitCount }, (_, idx) => {
            const overallIndex = currentUnitCount + idx;
            const floorIdx = Math.min(availableFloors.length - 1, Math.floor(overallIndex / unitsPerFloor));
            const floorNumber = availableFloors[floorIdx];
            return {
                property_id: propertyId,
                name: `${unitPrefix} ${overallIndex + 1}`,
                floor: floorNumber,
                status: "vacant",
                rent_amount: targetRent,
                beds: 1,
                baths: 1,
            };
        });
        await (admin as any).from("units").insert(unitsToCreate);

        const { data: refreshedUnits } = await supabase
            .from("units")
            .select("id, name, floor, status, rent_amount, beds, baths, sqft")
            .eq("property_id", propertyId)
            .order("created_at", { ascending: true });
        units = refreshedUnits ?? units;
    }

    const unitIds = (units ?? []).map(u => u.id);
    
    let positions: UnitMapPositionRow[] = [];
    let leaseData: Record<string, { tenant_name: string | null; lease_start: string | null; lease_end: string | null; tenant_avatar_url: string | null; tenant_avatar_bg_color: string | null }> = {};
    let maintenanceData: Record<string, { maintenance_title: string | null; maintenance_description: string | null; maintenance_created_at: string | null; maintenance_status: string | null }> = {};
    let applicationCounts: Record<string, number> = {};

    if (unitIds.length > 0) {
        const [
            { data: posData, error: posError },
            { data: leases, error: leasesError },
            { data: maintenanceRequests, error: maintenanceError },
            { data: apps, error: appsError }
        ] = await Promise.all([
            supabase
                .from("unit_map_positions" as any)
                .select("unit_id, floor_key, x, y, w, h")
                .in("unit_id", unitIds) as any,
            supabase
                .from("leases")
                .select(`
                    unit_id,
                    start_date,
                    end_date,
                    profiles!leases_tenant_id_fkey(full_name, avatar_url, avatar_bg_color)
                `)
                .in("unit_id", unitIds)
                .eq("landlord_id", userId)
                .in("status", ["active", "pending_landlord_signature", "pending_tenant_signature"]),
            supabase
                .from("maintenance_requests")
                .select("unit_id, title, description, status, created_at")
                .in("unit_id", unitIds)
                .eq("landlord_id", userId)
                .in("status", ["open", "assigned", "in_progress"]),
            supabase
                .from("applications")
                .select("unit_id, id")
                .in("unit_id", unitIds)
                .in("status", ["pending", "reviewing"]) as any,
        ]);

        if (posError) {
            return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 });
        }
        positions = posData ?? [];

        if (leasesError) {
            return NextResponse.json({ error: "Failed to fetch lease data" }, { status: 500 });
        }
        for (const lease of (leases ?? []) as any[]) {
            leaseData[lease.unit_id] = {
                tenant_name: lease.profiles?.full_name ?? null,
                tenant_avatar_url: lease.profiles?.avatar_url ?? null,
                tenant_avatar_bg_color: lease.profiles?.avatar_bg_color ?? null,
                lease_start: lease.start_date ?? null,
                lease_end: lease.end_date ?? null,
            };
        }

        if (maintenanceError) {
            return NextResponse.json({ error: "Failed to fetch maintenance data" }, { status: 500 });
        }
        for (const request of (maintenanceRequests ?? []) as any[]) {
            maintenanceData[request.unit_id] = {
                maintenance_title: request.title ?? null,
                maintenance_description: request.description ?? null,
                maintenance_created_at: request.created_at ?? null,
                maintenance_status: request.status ?? null,
            };
        }

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
    // Map setup is initialized if at least 1 unit has been placed on the canvas.
    // Unplaced units (newly added or detached) appear in the "Unplaced Units" sidebar drawer rather than blocking the canvas.
    const isSetupComplete = placedCount > 0;
    const isFullyPlaced = enrichedUnits.length > 0 && placedCount === enrichedUnits.length;

    return NextResponse.json({
        floorConfigs: floorConfigs ?? [],
        units: enrichedUnits,
        mapDecorations: property.map_decorations ?? {},
        isSetupComplete,
        isFullyPlaced,
        placedCount,
        totalUnits: enrichedUnits.length,
    }, {
        headers: {
            "Cache-Control": "private, max-age=3, stale-while-revalidate=30",
        }
    });
}

/** POST /api/landlord/unit-map
 *  Body: { propertyId, positions: [{unitId, floorKey, x, y, w, h}], decorations? }
 *  Upserts all positions + optionally updates decorations blob
 */
export async function POST(request: NextRequest) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId, supabase } = authContext;

    const parsed = await parseJsonBody(request, unitMapSaveSchema);
    if (!parsed.ok) return parsed.response;
    const { propertyId, positions, decorations } = parsed.data;

    // Verify ownership and fetch current decorations
    const { data: property, error: propError } = await supabase
        .from("properties")
        .select("id, map_decorations")
        .eq("id", propertyId)
        .eq("landlord_id", userId)
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
            // unit_map_positions stores integer pixels; canvas drags can produce fractions.
            x: Math.round(p.x),
            y: Math.round(p.y),
            w: Math.max(1, Math.round(p.w)),
            h: Math.max(1, Math.round(p.h)),
            updated_at: new Date().toISOString(),
        }));

        if (rows.length > 0) {
            const { error: upsertError } = await (supabase
                .from("unit_map_positions" as any)
                .upsert(rows, { onConflict: "unit_id" }) as any);

            if (upsertError) {
                console.error("Failed to save unit positions:", upsertError);
                return NextResponse.json({ error: "Failed to save positions." }, { status: 500 });
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
                console.error("Failed to clear stale unit positions:", deleteError);
                return NextResponse.json({ error: "Failed to clear stale positions." }, { status: 500 });
            }
        }

        // Also sync units.floor based on floorKey AND metadata if provided
        for (const p of validPositions) {
            let floorNumber = 1;
            if (p.floorKey === "ground") floorNumber = 0;
            else {
                const match = /^floor(\d+)$/i.exec(p.floorKey);
                if (match) floorNumber = parseInt(match[1], 10);
            }

            const updateData: Record<string, any> = { floor: floorNumber };
            if (p.metadata) {
                if (p.metadata.beds !== undefined) updateData.beds = p.metadata.beds;
                if (p.metadata.baths !== undefined) updateData.baths = p.metadata.baths;
                if (p.metadata.sqft !== undefined) updateData.sqft = p.metadata.sqft;
            }

            await supabase
                .from("units")
                .update(updateData as any)
                .eq("id", p.unitId);
        }
    }

    // Update decorations blob if provided while preserving non-floor keys like branding
    if (decorations !== undefined) {
        const existingDecorations = (property?.map_decorations as Record<string, unknown>) || {};
        const mergedDecorations: Record<string, unknown> = {
            ...existingDecorations,
            ...decorations,
        };
        if (existingDecorations.branding && !decorations.branding) {
            mergedDecorations.branding = existingDecorations.branding;
        }

        const { error: decError } = await (supabase
            .from("properties")
            .update({ map_decorations: mergedDecorations } as any)
            .eq("id", propertyId)
            .eq("landlord_id", userId) as any);

        if (decError) {
            return NextResponse.json({ error: "Failed to save decorations" }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true });
}

// Legacy aliases: floor-config management lives in ./floor-configs (ownership-checked + validated).
export { PATCH, DELETE, PUT } from "./floor-configs/route";
