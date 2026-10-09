import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { MaintenanceService } from "@/lib/services/maintenance";
import {
    MaintenanceNotFoundError,
    MaintenanceValidationError,
} from "@/lib/services/maintenance/maintenance.errors";
import { parseJsonBody } from "@/lib/validation/server";
import {
    tenantMaintenanceCreateSchema,
    tenantMaintenanceUpdateSchema,
} from "@/lib/validation/schemas/operations.schema";

/** Window in which an identical open request from the same tenant is treated as a double submit. */
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        const maintenanceService = new MaintenanceService(supabase);
        const requests = await maintenanceService.getTenantMaintenanceRequests(userId);

        return NextResponse.json({ requests });
    } catch (error) {
        console.error("[GET /api/tenant/maintenance]", error);
        return NextResponse.json({ error: "Failed to load maintenance requests." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const parsed = await parseJsonBody(request, tenantMaintenanceCreateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    try {
        // Double-click / retry guard: the same open request submitted moments ago.
        const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
        const { data: recentDuplicate } = await supabase
            .from("maintenance_requests")
            .select("id")
            .eq("tenant_id", userId)
            .eq("title", body.title)
            .eq("description", body.description)
            .eq("status", "open")
            .gte("created_at", since)
            .limit(1)
            .maybeSingle();

        if (recentDuplicate) {
            return NextResponse.json(
                { error: "This maintenance request was already submitted." },
                { status: 409 }
            );
        }

        const maintenanceService = new MaintenanceService(supabase);
        const newRequest = await maintenanceService.createTenantMaintenance(userId, body);

        return NextResponse.json({ request: newRequest });
    } catch (error) {
        if (error instanceof MaintenanceValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error("[POST /api/tenant/maintenance]", error);
        return NextResponse.json({ error: "Failed to create maintenance request." }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const parsed = await parseJsonBody(request, tenantMaintenanceUpdateSchema);
    if (!parsed.ok) return parsed.response;

    try {
        const maintenanceService = new MaintenanceService(supabase);
        const updatedRequest = await maintenanceService.updateTenantMaintenance(userId, parsed.data);

        return NextResponse.json({ request: updatedRequest });
    } catch (error) {
        if (error instanceof MaintenanceValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error instanceof MaintenanceNotFoundError) {
            return NextResponse.json({ success: true });
        }
        console.error("[PATCH /api/tenant/maintenance]", error);
        return NextResponse.json({ error: "Failed to update maintenance request." }, { status: 500 });
    }
}
