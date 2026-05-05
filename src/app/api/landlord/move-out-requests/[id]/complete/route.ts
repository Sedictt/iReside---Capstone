import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { inspection_notes, inspection_photos, deposit_deductions } = body;

    const { data: existingRequest, error: fetchError } = await supabase
      .from("move_out_requests")
      .select("*, lease:leases(id, unit_id, security_deposit)")
      .eq("id", id)
      .eq("landlord_id", user.id)
      .eq("status", "approved")
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: "Move-out request not found or not approved" }, { status: 404 });
    }

    const depositRefundAmount = existingRequest.lease?.security_deposit 
      ? (deposit_deductions?.total_deductions 
          ? Number(existingRequest.lease.security_deposit) - Number(deposit_deductions.total_deductions)
          : Number(existingRequest.lease.security_deposit))
      : 0;

    const updateData: Record<string, unknown> = {
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
      .from("move_out_requests")
      .update(updateData)
      .eq("id", id);

    if (updateError) throw updateError;

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
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}