import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { MaintenanceService } from "@/lib/services/maintenance";
import {
    MaintenanceNotFoundError,
    MaintenanceValidationError,
} from "@/lib/services/maintenance/maintenance.errors";
import type {
    CreateTenantMaintenanceInput,
    UpdateTenantMaintenanceInput,
} from "@/lib/services/maintenance/maintenance.types";

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        const maintenanceService = new MaintenanceService(supabase);
        const requests = await maintenanceService.getTenantMaintenanceRequests(userId);

        return NextResponse.json({ requests });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to load maintenance requests." },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        const body = (await request.json()) as CreateTenantMaintenanceInput;
        const maintenanceService = new MaintenanceService(supabase);
        const newRequest = await maintenanceService.createTenantMaintenance(userId, body);

        return NextResponse.json({ request: newRequest });
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

export async function PATCH(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        const body = (await request.json()) as UpdateTenantMaintenanceInput;
        const maintenanceService = new MaintenanceService(supabase);
        const updatedRequest = await maintenanceService.updateTenantMaintenance(userId, body);

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

