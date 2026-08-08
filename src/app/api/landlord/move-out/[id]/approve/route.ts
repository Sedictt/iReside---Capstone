import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

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

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const { inspection_date } = body;

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

    // Update lease end_date to the requested move-out date
    const { error: leaseError } = await supabase
      .from("leases")
      .update({ end_date: moveOutRequest.requested_date })
      .eq("id", moveOutRequest.lease_id);

    if (leaseError) {
      console.error("[landlord-move-out-approve] Lease update error:", leaseError);
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
