import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { parseWithSchema } from "@/lib/validation/server";
import { isId, moveOutApproveSchema } from "@/lib/validation/schemas/tenant-lifecycle.schema";

/**
 * PUT /api/landlord/move-out/[id]/approve
 * 
 * Approve a move-out request.
 * Body: { inspection_date: string }
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  if (!isId(id)) {
    return NextResponse.json({ error: "Move-out request not found" }, { status: 404 });
  }

  try {

    // Get move-out request and verify ownership
    const reqQuery = supabase
      .from("move_out_requests" as any)
      .select("*, lease:leases!inner(*)");

    const { data: moveOutRequest, error: fetchError } = await reqQuery
      .eq("id", id)
      .eq("landlord_id", userId)
      .single() as any;

    if (fetchError || !moveOutRequest) {
      return NextResponse.json(
        { error: "Move-out request not found" },
        { status: 404 }
      );
    }

    if (moveOutRequest.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot approve request with status: ${moveOutRequest.status}` },
        { status: 400 }
      );
    }

    let rawBody: unknown = {};
    try {
      rawBody = await request.json();
    } catch {
      rawBody = {};
    }
    const parsed = parseWithSchema(moveOutApproveSchema, rawBody ?? {});
    if (!parsed.ok) return parsed.response;
    const inspection_date = parsed.data.inspection_date ?? null;

    // Update move-out request
    const updatePayload = {
        status: "approved",
        approved_at: new Date().toISOString(),
        inspection_date: inspection_date || null
      } as any;
      const updateQuery = supabase
        .from("move_out_requests" as any)
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

    const { data: updated, error: updateError } = await updateQuery as any;

    if (updateError) {
      console.error("[landlord-move-out-approve] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to approve move-out request" },
        { status: 500 }
      );
    }

    // Update lease end_date to the requested move-out date — only when it keeps
    // end_date > start_date (DB constraint lease_dates_valid).
    const leaseStart: string | undefined = moveOutRequest.lease?.start_date;
    if (!leaseStart || String(moveOutRequest.requested_date) > String(leaseStart)) {
      const { error: leaseError } = await supabase
        .from("leases")
        .update({ end_date: moveOutRequest.requested_date })
        .eq("id", moveOutRequest.lease_id);

      if (leaseError) {
        console.error("[landlord-move-out-approve] Lease update error:", leaseError);
      }
    } else {
      console.warn("[landlord-move-out-approve] Skipped lease end_date update: requested date is not after lease start.");
    }

    // Notify tenant
    await supabase
      .from("notifications")
      .insert({
        user_id: moveOutRequest.tenant_id,
        type: "move_out_approved" as string,
        title: "Move-Out Approved",
        message: `Your move-out request for ${moveOutRequest.requested_date} has been approved.`,
        data: { move_out_request_id: id, inspection_date }
      } as any);

    return NextResponse.json({
      message: "Move-out request approved",
      data: updated
    });

  } catch (error) {
    console.error("[landlord-move-out-approve] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
