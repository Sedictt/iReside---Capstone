import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/landlord/move-out/[id]/inspection
 * 
 * Record inspection results for a move-out request.
 */
export async function POST(
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

    const body = await request.json();
    const { inspection_date, inspection_notes, inspection_photos, checklist_data, deposit_deductions, deposit_refund_amount } = body;

    // Verify ownership and status
    const reqQuery = supabase
      .from("move_out_requests" as any)
      .select("*");

    const { data: moveOutRequest, error: fetchError } = await reqQuery
      .eq("id", id)
      .eq("landlord_id", user.id)
      .single() as any;

    if (fetchError || !moveOutRequest) {
      return NextResponse.json({ error: "Move-out request not found" }, { status: 404 });
    }

    if (moveOutRequest.status !== "approved") {
      return NextResponse.json(
        { error: `Cannot record inspection for request with status: ${moveOutRequest.status}. Must be 'approved'.` },
        { status: 400 }
      );
    }

    // Update move-out request with inspection data
    const updatePayload = {
      inspection_date: inspection_date || new Date().toISOString().split('T')[0],
      inspection_notes,
      inspection_photos,
      checklist_data,
      deposit_deductions,
      deposit_refund_amount,
      updated_at: new Date().toISOString()
    } as any;
    const updateQuery = supabase
      .from("move_out_requests" as any)
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    const { data: updated, error: updateError } = await updateQuery as any;

    if (updateError) {
      console.error("[landlord-move-out-inspection] Update error:", updateError);
      return NextResponse.json({ error: "Failed to record inspection" }, { status: 500 });
    }

    // Notify tenant
    await supabase.from("notifications").insert({
      user_id: moveOutRequest.tenant_id,
      type: "move_out_inspection_completed",
      title: "Inspection Completed",
      message: "The move-out inspection for your unit has been completed. You can now view the results.",
      data: { move_out_request_id: id }
    } as any);

    return NextResponse.json({
      message: "Inspection recorded successfully",
      data: updated
    });

  } catch (error) {
    console.error("[landlord-move-out-inspection] Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

/**
 * GET /api/landlord/move-out/[id]/inspection
 * 
 * Fetch system-checked clearance status (rent balance, utilities)
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const selectQuery = supabase
      .from("move_out_requests" as any)
      .select("lease_id")
      .eq("id", id)
      .eq("landlord_id", user.id)
      .single();

    const { data: moveOut, error: fetchError } = await selectQuery as any;

    if (fetchError || !moveOut) {
      return NextResponse.json({ error: "Move-out request not found" }, { status: 404 });
    }

    const { data: payments, error: paymentError } = await supabase
      .from("payments")
      .select("balance_remaining")
      .eq("lease_id", moveOut.lease_id)
      .gt("balance_remaining", 0);

    if (paymentError) throw paymentError;
    const totalOutstanding = payments.reduce((sum, p) => sum + (p.balance_remaining || 0), 0);

    const { data: readings, error: readingError } = await supabase
      .from("utility_readings")
      .select("utility_type, computed_charge")
      .eq("lease_id", moveOut.lease_id)
      .is("payment_id", null);

    if (readingError) throw readingError;

    const waterBill = readings
      .filter(r => r.utility_type === "water")
      .reduce((sum, r) => sum + (Number(r.computed_charge) || 0), 0);
    
    const electricityBill = readings
      .filter(r => r.utility_type === "electricity")
      .reduce((sum, r) => sum + (Number(r.computed_charge) || 0), 0);

    return NextResponse.json({
      rent_settled: totalOutstanding === 0,
      utilities_settled: readings.length === 0,
      outstanding_balance: totalOutstanding,
      water_balance: waterBill,
      electricity_balance: electricityBill,
      pending_readings: readings.length
    });

  } catch (error) {
    console.error("[landlord-move-out-clearance] Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
