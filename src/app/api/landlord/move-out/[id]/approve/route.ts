import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();

  try {
    // Get landlord from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get move-out request and verify ownership
    const { data: moveOutRequest, error: fetchError } = await supabase
      .from("move_out_requests")
      .select("*, lease:leases!inner(*)")
      .eq("id", id)
      .eq("landlord_id", user.id)
      .single();

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
    const { data: updated, error: updateError } = await supabase
      .from("move_out_requests")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        inspection_date: inspection_date || null
      })
      .eq("id", id)
      .select()
      .single();

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
        type: "move_out_approved",
        title: "Move-Out Approved",
        message: `Your move-out request for ${moveOutRequest.requested_date} has been approved.`,
        data: { move_out_request_id: id, inspection_date }
      });

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
