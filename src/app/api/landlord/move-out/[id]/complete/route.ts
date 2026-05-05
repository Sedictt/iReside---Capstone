import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PUT /api/landlord/move-out/[id]/complete
 * 
 * Finalize move-out: terminate lease and mark unit as vacant.
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership and inspection status
    const { data: moveOutRequest, error: fetchError } = await supabase
      .from("move_out_requests")
      .select("*, lease:leases(*)")
      .eq("id", id)
      .eq("landlord_id", user.id)
      .single();

    if (fetchError || !moveOutRequest) {
      return NextResponse.json({ error: "Move-out request not found" }, { status: 404 });
    }

    if (moveOutRequest.status !== "approved" || !moveOutRequest.inspection_date) {
      return NextResponse.json(
        { error: "Move-out cannot be completed. Inspection must be recorded first." },
        { status: 400 }
      );
    }

    // Perform updates in a pseudo-transaction (using Rpc if available, or just sequential updates)
    // 1. Update move-out request
    const { error: moveOutUpdateError } = await supabase
      .from("move_out_requests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (moveOutUpdateError) throw moveOutUpdateError;

    // 2. Terminate lease
    const { error: leaseError } = await supabase
      .from("leases")
      .update({ status: "terminated" })
      .eq("id", moveOutRequest.lease_id);

    if (leaseError) throw leaseError;

    // 3. Mark unit as vacant
    const { error: unitError } = await supabase
      .from("units")
      .update({ status: "vacant" })
      .eq("id", (moveOutRequest.lease as any).unit_id);

    if (unitError) throw unitError;

    // 4. Notify tenant
    await supabase.from("notifications").insert({
      user_id: moveOutRequest.tenant_id,
      type: "move_out_finalized",
      title: "Move-Out Finalized",
      message: "Your move-out has been finalized. Thank you for staying with us!",
      data: { move_out_request_id: id }
    });

    return NextResponse.json({
      message: "Move-out completed successfully",
    });

  } catch (error: any) {
    console.error("[landlord-move-out-complete] Error:", error);
    return NextResponse.json(
      { error: "Failed to complete move-out: " + error.message },
      { status: 500 }
    );
  }
}
