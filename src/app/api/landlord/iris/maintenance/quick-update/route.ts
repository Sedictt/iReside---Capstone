import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import {
  IrisOperationsService,
  type MaintenanceTicketSummary,
} from "@/lib/services/iris";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getWriteClient(authSupabase: any) {
  if (process.env.VITEST) {
    return authSupabase;
  }
  try {
    return createServiceRoleSupabaseClient();
  } catch {
    return authSupabase;
  }
}

const QuickUpdateTicketSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  status: z.enum([
    "pending",
    "assigned",
    "in_progress",
    "resolved",
    "closed",
    "cancelled",
  ]),
  assignedTechnician: z.string().max(60).optional(),
  notes: z.string().max(250).optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const auth = await requireAuthenticatedUser(request);
    if (!("userId" in auth)) {
      return auth as Response;
    }

    // 2. Validate landlord role
    if (auth.userRole !== "landlord") {
      return NextResponse.json(
        { error: "Forbidden: Landlord role required" },
        { status: 403 }
      );
    }

    // 3. Parse and validate JSON request body
    let rawJson: unknown;
    try {
      rawJson = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const parseResult = QuickUpdateTicketSchema.safeParse(rawJson);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { ticketId, status, assignedTechnician, notes } = parseResult.data;

    // 4. Fetch maintenance ticket
    const { data: ticket, error: ticketError } = await auth.supabase
      .from("maintenance_requests")
      .select("id, unit_id, tenant_id, landlord_id, title, description, priority, status, third_party_name, created_at, updated_at")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: "Maintenance ticket not found" },
        { status: 404 }
      );
    }

    // 5. Verify ownership (either landlord_id matches or unit belongs to landlord's properties)
    let isAuthorized = ticket.landlord_id === auth.userId;
    let unitName = "Unit";
    let propertyId = "";
    let propertyName = "Property";

    if (ticket.unit_id) {
      const { data: unit } = await auth.supabase
        .from("units")
        .select("id, name, property_id")
        .eq("id", ticket.unit_id)
        .maybeSingle();

      if (unit) {
        unitName = unit.name;
        propertyId = unit.property_id;

        const ownsProp = await IrisOperationsService.verifyLandlordPropertyOwnership(
          auth.supabase,
          auth.userId,
          unit.property_id
        );
        if (ownsProp) {
          isAuthorized = true;
        }

        const { data: prop } = await auth.supabase
          .from("properties")
          .select("name")
          .eq("id", unit.property_id)
          .maybeSingle();
        if (prop) {
          propertyName = prop.name;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Ticket does not belong to landlord's properties" },
        { status: 403 }
      );
    }

    // 6. Fetch tenant name
    let tenantName = "Resident";
    if (ticket.tenant_id) {
      const { data: profile } = await auth.supabase
        .from("profiles")
        .select("full_name")
        .eq("id", ticket.tenant_id)
        .maybeSingle();
      if (profile?.full_name) {
        tenantName = profile.full_name;
      }
    }

    const currentTicketSummary: MaintenanceTicketSummary = {
      id: ticket.id,
      unitId: ticket.unit_id,
      unitName,
      propertyId,
      propertyName,
      tenantName,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority as MaintenanceTicketSummary["priority"],
      status: ticket.status as MaintenanceTicketSummary["status"],
      assignedTechnician: ticket.third_party_name,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    };

    // 7. Validate status transition
    let updatedTicketSummary: MaintenanceTicketSummary;
    try {
      updatedTicketSummary = IrisOperationsService.updateMaintenanceTicketStatus(
        currentTicketSummary,
        status,
        {
          assignedTechnician: assignedTechnician || undefined,
          notes,
        }
      );
    } catch (transitionErr) {
      const msg =
        transitionErr instanceof Error
          ? transitionErr.message
          : "Invalid status transition";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // 8. Update maintenance_requests record
    const { error: updateError } = await auth.supabase
      .from("maintenance_requests")
      .update({
        status,
        third_party_name: updatedTicketSummary.assignedTechnician ?? null,
        updated_at: updatedTicketSummary.updatedAt ?? new Date().toISOString(),
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", ticket.id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update ticket: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 9. Dispatch notification to tenant
    if (ticket.tenant_id) {
      try {
        const writeClient = getWriteClient(auth.supabase);
        const readableStatus = status.replace("_", " ");
        const techNote = updatedTicketSummary.assignedTechnician
          ? ` Assigned to: ${updatedTicketSummary.assignedTechnician}.`
          : "";
        const noteText = notes ? ` Note: ${notes}` : "";

        const { error: notifError } = await writeClient.from("notifications").insert({
          user_id: ticket.tenant_id,
          type: "maintenance",
          title: "Maintenance Ticket Updated",
          message: `Your maintenance request "${ticket.title}" (Unit ${unitName}) is now marked as ${readableStatus}.${techNote}${noteText}`,
          data: {
            ticketId: ticket.id,
            status,
            assignedTechnician: updatedTicketSummary.assignedTechnician,
            notes,
          },
          read: false,
        });
        if (notifError) {
          console.warn("Failed to create maintenance notification:", notifError);
        }
      } catch (notifErr) {
        console.warn("Failed to create maintenance notification:", notifErr);
      }
    }

    return NextResponse.json(updatedTicketSummary);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
