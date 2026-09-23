import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { MaintenanceService } from "@/lib/services/maintenance";
import {
    MaintenanceNotFoundError,
    MaintenanceValidationError,
} from "@/lib/services/maintenance/maintenance.errors";
import type {
    CreateLandlordMaintenanceInput,
    UpdateLandlordMaintenanceInput,
} from "@/lib/services/maintenance/maintenance.types";

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId") || undefined;

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
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to load maintenance requests." },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        const patchData = (await request.json()) as UpdateLandlordMaintenanceInput;
        const maintenanceService = new MaintenanceService(supabase);
        const updatedRequest = await maintenanceService.updateLandlordMaintenance(userId, patchData);

        return NextResponse.json({ request: updatedRequest });
    } catch (error: any) {
        if (error instanceof MaintenanceValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error instanceof MaintenanceNotFoundError) {
            return NextResponse.json({ success: true });
        }
        return NextResponse.json(
            { error: error?.message || "Failed to update maintenance request." },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        const postData = (await request.json()) as CreateLandlordMaintenanceInput;
        const maintenanceService = new MaintenanceService(supabase);
        const newRequest = await maintenanceService.createLandlordMaintenance(userId, postData);

        return NextResponse.json({ request: newRequest }, { status: 201 });
    } catch (error: any) {
        if (error instanceof MaintenanceValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json(
            { error: error?.message || "Failed to create maintenance request." },
            { status: 500 }
        );
    }
}


