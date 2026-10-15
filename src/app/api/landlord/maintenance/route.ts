import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { MaintenanceService } from "@/lib/services/maintenance";
import {
    MaintenanceNotFoundError,
    MaintenanceValidationError,
} from "@/lib/services/maintenance/maintenance.errors";
import { parseJsonBody, parseSearchParams } from "@/lib/validation/server";
import {
    landlordMaintenanceCreateSchema,
    landlordMaintenanceUpdateSchema,
    maintenanceListQuerySchema,
} from "@/lib/validation/schemas/operations.schema";

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const { searchParams } = new URL(request.url);
    const parsedQuery = parseSearchParams(searchParams, maintenanceListQuerySchema);
    if (!parsedQuery.ok) return parsedQuery.response;
    const propertyId = parsedQuery.data.propertyId ?? undefined;

    try {
        const maintenanceService = new MaintenanceService(supabase);
        const { requests, metrics } = await maintenanceService.getLandlordMaintenanceRequests(
            userId,
            propertyId
        );

        return NextResponse.json(
            { requests, metrics },
            { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" } }
        );
    } catch (error) {
        console.error("[GET /api/landlord/maintenance]", error);
        return NextResponse.json({ error: "Failed to load maintenance requests." }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const parsed = await parseJsonBody(request, landlordMaintenanceUpdateSchema);
    if (!parsed.ok) return parsed.response;

    try {
        const maintenanceService = new MaintenanceService(supabase);
        const updatedRequest = await maintenanceService.updateLandlordMaintenance(userId, parsed.data);

        return NextResponse.json({ request: updatedRequest });
    } catch (error) {
        if (error instanceof MaintenanceValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error instanceof MaintenanceNotFoundError) {
            return NextResponse.json({ success: true });
        }
        console.error("[PATCH /api/landlord/maintenance]", error);
        return NextResponse.json({ error: "Failed to update maintenance request." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const parsed = await parseJsonBody(request, landlordMaintenanceCreateSchema);
    if (!parsed.ok) return parsed.response;
    const postData = parsed.data;

    try {
        // The unit must belong to one of this landlord's properties.
        const { data: ownedUnit } = await supabase
            .from("units")
            .select("id, property_id, properties!inner(landlord_id)")
            .eq("id", postData.unitId)
            .eq("properties.landlord_id", userId)
            .maybeSingle();

        if (!ownedUnit || (postData.propertyId && (ownedUnit as { property_id: string }).property_id !== postData.propertyId)) {
            return NextResponse.json(
                { error: "Select a unit from one of your properties.", fieldErrors: { unitId: "Select a unit from one of your properties." } },
                { status: 404 }
            );
        }

        const maintenanceService = new MaintenanceService(supabase);
        const newRequest = await maintenanceService.createLandlordMaintenance(userId, {
            ...postData,
            propertyId: postData.propertyId ?? undefined,
        });

        return NextResponse.json({ request: newRequest }, { status: 201 });
    } catch (error) {
        if (error instanceof MaintenanceValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error("[POST /api/landlord/maintenance]", error);
        return NextResponse.json({ error: "Failed to create maintenance request." }, { status: 500 });
    }
}
