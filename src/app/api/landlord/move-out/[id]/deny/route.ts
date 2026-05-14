import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PUT /api/landlord/move-out/[id]/deny
 * 
 * Deny a move-out request.
 * Body: { denial_reason: string }
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
  const { denial_reason } = body;

  if (!denial_reason) {
    return NextResponse.json(
      { error: "Denial reason is required" },
      { status: 400 }
    );
  }

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
    const reqQuery = supabase
      .from("move_out_requests" as any)
      .select("*");

    const { data: moveOutRequest, error: fetchError } = await reqQuery
      .eq("id", id)
      .eq("landlord_id", user.id)
      .single() as any;

    if (fetchError || !moveOutRequest) {
      return NextResponse.json(
        { error: "Move-out request not found" },
        { status: 404 }
      );
    }

    if (moveOutRequest.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot deny request with status: ${moveOutRequest.status}` },
        { status: 400 }
      );
    }

    // Update move-out request
    const updatePayload = {
        status: "denied",
        denied_at: new Date().toISOString(),
        denial_reason: denial_reason
      } as any;
      const updateQuery = supabase
        .from("move_out_requests" as any)
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      const { data: updated, error: updateError } = await updateQuery as any;

    if (updateError) {
      console.error("[landlord-move-out-deny] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to deny move-out request" },
        { status: 500 }
      );
    }

    // Notify tenant
    await supabase
      .from("notifications")
      .insert({
        user_id: moveOutRequest.tenant_id,
        type: "move_out_denied",
        title: "Move-Out Denied",
        message: `Your move-out request has been denied. Reason: ${denial_reason}`,
        data: { move_out_request_id: id, denial_reason }
      } as any);

    return NextResponse.json({
      message: "Move-out request denied",
      data: updated
    });

  } catch (error) {
    console.error("[landlord-move-out-deny] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
