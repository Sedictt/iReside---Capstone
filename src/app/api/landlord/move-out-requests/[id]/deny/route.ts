import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  const authContext = await requireAuthenticatedUser(req);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  try {
    const { id } = await params;
    const { denial_reason } = await req.json();

    if (!denial_reason) {
      return NextResponse.json({ error: "Denial reason is required" }, { status: 400 });
    }

    const selectQuery = supabase
      .from("move_out_requests" as any)
      .select("*, tenant_id")
      .eq("id", id)
      .eq("landlord_id", userId)
      .eq("status", "pending")
      .single();

    const { data: existingRequest, error: fetchError } = await selectQuery as any;

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: "Move-out request not found or already processed" }, { status: 404 });
    }

    const updatePayload = {
        status: "denied",
        denied_at: new Date().toISOString(),
        denial_reason,
        updated_at: new Date().toISOString(),
      } as any;
      const { error: updateError } = await supabase
        .from("move_out_requests" as any)
        .update(updatePayload)
        .eq("id", id);

    if (updateError) throw updateError;

    await supabase.from("notifications").insert({
      user_id: existingRequest.tenant_id,
      type: "lease",
      title: "Move-Out Request Denied",
      message: `Your move-out request has been denied. Reason: ${denial_reason}`,
      data: { move_out_request_id: id, denial_reason },
    });

    return NextResponse.json({ success: true, message: "Move-out request denied" });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}