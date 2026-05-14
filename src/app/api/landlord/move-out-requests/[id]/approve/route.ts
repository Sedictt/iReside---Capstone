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
    const { inspection_date } = await req.json();

    if (!inspection_date) {
      return NextResponse.json({ error: "Inspection date is required" }, { status: 400 });
    }

    const reqQuery = supabase
      .from("move_out_requests" as any)
      .select("*, lease:leases(start_date, end_date)");

    const { data: existingRequest, error: fetchError } = await reqQuery
      .eq("id", id)
      .eq("landlord_id", user.id)
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

    if (updateError) throw updateError;

    const { error: leaseUpdateError } = await supabase
      .from("leases")
      .update({
        end_date: existingRequest.requested_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRequest.lease_id);

    if (leaseUpdateError) console.error("Failed to update lease end_date:", leaseUpdateError);

    await supabase.from("notifications").insert({
      user_id: existingRequest.tenant_id,
      type: "lease",
      title: "Move-Out Request Approved",
      message: `Your move-out request has been approved. Inspection scheduled for ${inspection_date}.`,
      data: { move_out_request_id: id, inspection_date },
    });

    return NextResponse.json({ success: true, message: "Move-out request approved" });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}