import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { getTransitionErrorMessage, isValidLeaseStatusTransition } from "@/lib/lease-status-transitions";
import type { LeaseStatus } from "@/types/database";
import { parseJsonBody } from "@/lib/validation/server";
import { isId, legacyMoveOutCompleteSchema } from "@/lib/validation/schemas/tenant-lifecycle.schema";

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
    const parsed = await parseJsonBody(req, legacyMoveOutCompleteSchema);
    if (!parsed.ok) return parsed.response;
    const { inspection_notes, inspection_photos, deposit_deductions } = parsed.data;

    const { data: existingRequest, error: fetchError } = await (supabase
      .from("move_out_requests" as any)
      .select("*, lease:leases(id, unit_id, security_deposit, status)")
      .eq("id", id)
      .eq("landlord_id", userId)
      .eq("status", "approved")
      .single() as any);

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: "Move-out request not found or not approved" }, { status: 404 });
    }

    const securityDeposit = Number(existingRequest.lease?.security_deposit ?? 0);
    const totalDeductions = Number(deposit_deductions?.total_deductions ?? 0);
    if (totalDeductions > securityDeposit) {
      return NextResponse.json(
        {
          error: "Total deductions cannot exceed the security deposit.",
          fieldErrors: { "deposit_deductions.total_deductions": "Total deductions cannot exceed the security deposit." },
        },
        { status: 400 }
      );
    }
    const depositRefundAmount = securityDeposit > 0 ? Math.round((securityDeposit - totalDeductions) * 100) / 100 : 0;

    // Lease status changes go through the lease state machine (active -> terminated only).
    const leaseStatus: string | undefined = existingRequest.lease?.status;
    if (leaseStatus && !isValidLeaseStatusTransition(leaseStatus as LeaseStatus, "terminated")) {
      return NextResponse.json({ error: getTransitionErrorMessage(leaseStatus as LeaseStatus, "terminated") }, { status: 409 });
    }

    const updateData: any = {
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (inspection_notes) updateData.inspection_notes = inspection_notes;
    if (inspection_photos) updateData.inspection_photos = inspection_photos;
    if (deposit_deductions) {
      updateData.deposit_deductions = deposit_deductions;
      updateData.deposit_refund_amount = depositRefundAmount;
    }

    const { error: updateError } = await supabase
      .from("move_out_requests" as any)
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("[move-out-requests complete] Update error:", updateError);
      return NextResponse.json({ error: "Failed to complete move-out" }, { status: 500 });
    }

    await supabase
      .from("leases")
      .update({
        status: "terminated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRequest.lease_id);

    await supabase
      .from("units")
      .update({
        status: "vacant",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRequest.lease?.unit_id);

    await supabase.from("notifications").insert({
      user_id: existingRequest.tenant_id,
      type: "lease",
      title: "Move-Out Completed",
      message: `Your move-out has been completed. Security deposit refund: ₱${depositRefundAmount.toLocaleString()}`,
      data: { move_out_request_id: id, refund_amount: depositRefundAmount },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Move-out completed",
      refund_amount: depositRefundAmount 
    });
  } catch (e: unknown) {
    console.error("[move-out-requests complete] Unexpected error:", e);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}