import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { parseJsonBody } from "@/lib/validation/server";
import { isId, moveOutDenySchema } from "@/lib/validation/schemas/tenant-lifecycle.schema";

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
    const parsed = await parseJsonBody(req, moveOutDenySchema);
    if (!parsed.ok) return parsed.response;
    const { denial_reason } = parsed.data;

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

    if (updateError) {
      console.error("[move-out-requests deny] Update error:", updateError);
      return NextResponse.json({ error: "Failed to deny move-out request" }, { status: 500 });
    }

    await supabase.from("notifications").insert({
      user_id: existingRequest.tenant_id,
      type: "lease",
      title: "Move-Out Request Denied",
      message: `Your move-out request has been denied. Reason: ${denial_reason}`,
      data: { move_out_request_id: id, denial_reason },
    });

    return NextResponse.json({ success: true, message: "Move-out request denied" });
  } catch (e: unknown) {
    console.error("[move-out-requests deny] Unexpected error:", e);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}