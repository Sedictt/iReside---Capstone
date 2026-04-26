import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type LeaseWithUnit = {
    id: string;
    landlord_id: string;
    unit_id: string;
};

export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: leaseData, error: leaseError } = await supabase
        .from("leases")
        .select("id, landlord_id, unit_id")
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (leaseError) {
        return NextResponse.json({ error: "Failed to load active lease." }, { status: 500 });
    }

    if (!leaseData?.unit_id) {
        return NextResponse.json({ property: null });
    }

    const lease = leaseData as unknown as LeaseWithUnit;
    const { data: currentUnit, error: currentUnitError } = await supabase
        .from("units")
        .select("id, name, property_id")
        .eq("id", lease.unit_id)
        .maybeSingle();

    if (currentUnitError || !currentUnit?.property_id) {
        return NextResponse.json({ error: "Failed to load current unit." }, { status: 500 });
    }

    const currentUnitRow = currentUnit as {
        id: string;
        name: string;
        property_id: string;
    };
    const propertyId = currentUnitRow.property_id;
    const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("id, name, address, map_decorations")
        .eq("id", propertyId)
        .maybeSingle();

    if (propertyError || !property) {
        return NextResponse.json({ error: "Failed to load property details." }, { status: 500 });
    }

    const { data: units, error: unitsError } = await supabase
        .from("units")
        .select("id, name, floor, status, beds, baths, sqft, rent_amount")
        .eq("property_id", propertyId)
        .order("floor", { ascending: true })
        .order("name", { ascending: true });

    if (unitsError) {
        return NextResponse.json({ error: "Failed to load units." }, { status: 500 });
    }

    const [{ data: positions, error: posError }, { data: requests, error: requestsError }, { data: floorConfigs, error: floorError }] = await Promise.all([
        supabase
            .from("unit_map_positions")
            .select("unit_id, floor_key, x, y, w, h")
            .in("unit_id", (units ?? []).map(u => u.id)),
        supabase
            .from("unit_transfer_requests")
            .select("id, requested_unit_id, status, reason, created_at, landlord_note")
            .eq("tenant_id", user.id)
            .eq("property_id", propertyId)
            .order("created_at", { ascending: false })
            .limit(10),
        supabase
            .from("property_floor_configs")
            .select("id, floor_number, floor_key, display_name, sort_order")
            .eq("property_id", propertyId)
            .order("sort_order", { ascending: true })
    ]);

    // Map positions to units
    const positionsByUnitId = new Map(
        (positions ?? [])
            .filter(p => p.x !== null && p.y !== null && p.w !== null && p.h !== null)
            .map(p => [p.unit_id, p] as const)
    );

    // Enrich units with positions
    const unitsWithPositions = (units ?? []).map(unit => ({
        ...unit,
        position: positionsByUnitId.get(unit.id) ?? null
    }));

    const transferTableMissing = requestsError && (requestsError as { code?: string }).code === "42P01";
    if (requestsError && !transferTableMissing) {
        return NextResponse.json({ error: "Failed to load transfer requests." }, { status: 500 });
    }

    const placedCount = unitsWithPositions.filter(u => u.position !== null).length;
    const isSetupComplete = unitsWithPositions.length > 0 && placedCount === unitsWithPositions.length;

    return NextResponse.json({
        property,
        leaseId: lease.id,
        landlordId: lease.landlord_id,
        tenantId: user.id,
        currentUnitId: currentUnitRow.id,
        currentUnitName: currentUnitRow.name,
        units: unitsWithPositions,
        transferRequests: transferTableMissing ? [] : (requests ?? []),
        floorConfigs: floorConfigs ?? [],
        mapDecorations: (property as any).map_decorations ?? {},
        isSetupComplete,
        placedCount,
        totalUnits: unitsWithPositions.length
    });
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: { requestedUnitId?: string; reason?: string };
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const requestedUnitId = payload.requestedUnitId?.trim();
    const reason = payload.reason?.trim() || null;

    if (!requestedUnitId) {
        return NextResponse.json({ error: "requestedUnitId is required." }, { status: 400 });
    }

    const { data: leaseData, error: leaseError } = await supabase
        .from("leases")
        .select("id, landlord_id, unit_id")
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (leaseError || !leaseData?.unit_id) {
        return NextResponse.json({ error: "Active lease not found." }, { status: 400 });
    }

    const lease = leaseData as unknown as {
        id: string;
        landlord_id: string;
        unit_id: string;
    };

    const { data: currentUnit, error: currentUnitError } = await supabase
        .from("units")
        .select("id, property_id")
        .eq("id", lease.unit_id)
        .maybeSingle();

    if (currentUnitError || !currentUnit) {
        return NextResponse.json({ error: "Current unit not found." }, { status: 400 });
    }

    const currentUnitRow = currentUnit as { id: string; property_id: string };

    if (currentUnitRow.id === requestedUnitId) {
        return NextResponse.json({ error: "You are already assigned to this unit." }, { status: 400 });
    }

    const { data: requestedUnit, error: requestedUnitError } = await supabase
        .from("units")
        .select("id, property_id, status")
        .eq("id", requestedUnitId)
        .maybeSingle();

    if (requestedUnitError || !requestedUnit) {
        return NextResponse.json({ error: "Requested unit not found." }, { status: 404 });
    }

    if (requestedUnit.property_id !== currentUnitRow.property_id) {
        return NextResponse.json({ error: "Requested unit is outside your current property." }, { status: 400 });
    }

    if (requestedUnit.status !== "vacant") {
        return NextResponse.json({ error: "Only vacant units can be requested." }, { status: 400 });
    }

    const { data: pendingRequest } = await supabase
        .from("unit_transfer_requests")
        .select("id")
        .eq("tenant_id", user.id)
        .eq("property_id", currentUnitRow.property_id)
        .eq("status", "pending")
        .limit(1)
        .maybeSingle();

    if (pendingRequest) {
        return NextResponse.json(
            { error: "You already have a pending transfer request for this property." },
            { status: 409 }
        );
    }

    const { data: created, error: createError } = await supabase
        .from("unit_transfer_requests")
        .insert({
            lease_id: lease.id,
            tenant_id: user.id,
            landlord_id: lease.landlord_id,
            property_id: currentUnitRow.property_id,
            current_unit_id: currentUnitRow.id,
            requested_unit_id: requestedUnitId,
            reason
        })
        .select("id, status, requested_unit_id, reason, created_at")
        .single();

    if (createError) {
        if ((createError as { code?: string }).code === "42P01") {
            return NextResponse.json(
                { error: "Unit transfer feature is not initialized. Please run the latest database migrations." },
                { status: 503 }
            );
        }
        return NextResponse.json({ error: "Failed to submit transfer request." }, { status: 500 });
    }

    const transferRequestId = created.id;
    const transferMessage = reason
        ? `A tenant requested a unit transfer. Reason: ${reason}`
        : "A tenant requested a unit transfer.";

    await supabase.from("notifications").insert({
        user_id: lease.landlord_id,
        type: "application",
        title: "Unit Transfer Request",
        message: transferMessage,
        data: {
            transferRequestId,
            requestedUnitId,
            tenantId: user.id
        }
    });

    return NextResponse.json({ request: created }, { status: 201 });
}
