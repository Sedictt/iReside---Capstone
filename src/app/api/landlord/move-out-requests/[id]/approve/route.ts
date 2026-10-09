import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { parseJsonBody } from "@/lib/validation/server";
import { isId, moveOutApproveSchema } from "@/lib/validation/schemas/tenant-lifecycle.schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  const authContext = await requireAuthenticatedUser(req);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  try {
    const { id } = await params;
    if (!isId(id)) {
      return NextResponse.json({ error: "Move-out request not found" }, { status: 404 });
    }
    const parsed = await parseJsonBody(req, moveOutApproveSchema);
    if (!parsed.ok) return parsed.response;
    const inspection_date = parsed.data.inspection_date;

    if (!inspection_date) {
      return NextResponse.json({ error: "Inspection date is required" }, { status: 400 });
    }

    const reqQuery = supabase
      .from("move_out_requests" as any)
      .select("*, lease:leases(start_date, end_date)");

    const { data: existingRequest, error: fetchError } = await reqQuery
      .eq("id", id)
      .eq("landlord_id", userId)
      .eq("status", "pending")
      .single() as any;

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: "Move-out request not found or already processed" }, { status: 404 });
    }

    const updatePayload = {
        status: "approved",
        approved_at: new Date().toISOString(),
        inspection_date,
        updated_at: new Date().toISOString(),
      } as any;
      const { error: updateError } = await supabase
        .from("move_out_requests" as any)
        .update(updatePayload)
        .eq("id", id);

    if (updateError) {
      console.error("[move-out-requests approve] Update error:", updateError);
      return NextResponse.json({ error: "Failed to approve move-out request" }, { status: 500 });
    }

    // Keep end_date > start_date (DB constraint lease_dates_valid).
    const leaseStart: string | undefined = existingRequest.lease?.start_date;
    if (!leaseStart || String(existingRequest.requested_date) > String(leaseStart)) {
      const { error: leaseUpdateError } = await supabase
        .from("leases")
        .update({
          end_date: existingRequest.requested_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRequest.lease_id);

      if (leaseUpdateError) console.error("Failed to update lease end_date:", leaseUpdateError);
    }

    await supabase.from("notifications").insert({
      user_id: existingRequest.tenant_id,
      type: "lease",
      title: "Move-Out Request Approved",
      message: `Your move-out request has been approved. Inspection scheduled for ${inspection_date}.`,
      data: { move_out_request_id: id, inspection_date },
    });

    return NextResponse.json({ success: true, message: "Move-out request approved" });
  } catch (e: unknown) {
    console.error("[move-out-requests approve] Unexpected error:", e);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}