import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;
    const adminClient = createAdminClient();

    const body = (await request.json().catch(() => ({}))) as { status?: "revoked" };
    if (body.status !== "revoked") {
        return NextResponse.json({ error: "Unsupported invite update." }, { status: 400 });
    }

    const { data: invite, error: findError } = await adminClient
        .from("tenant_intake_invites" as any)
        .select("id")
        .eq("id", id)
        .eq("landlord_id", userId)
        .maybeSingle();

    if (findError || !invite) {
        return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }

    const { error: updateError } = await adminClient
        .from("tenant_intake_invites" as any)
        .update({ status: "revoked" })
        .eq("id", id)
        .eq("landlord_id", userId);

    if (updateError) {
        return NextResponse.json({ error: "Failed to revoke invite." }, { status: 500 });
    }

    await adminClient.from("tenant_intake_invite_events" as any).insert({
        invite_id: id,
        event_type: "revoked",
        metadata: {},
    });

    return NextResponse.json({ success: true });
}
