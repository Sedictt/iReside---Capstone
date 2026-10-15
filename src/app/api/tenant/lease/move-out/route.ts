import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseJsonBody } from "@/lib/validation/server";
import { moveOutDateRule, moveOutRequestSchema } from "@/lib/validation/schemas/tenant-lifecycle.schema";

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseJsonBody(req, moveOutRequestSchema);
    if (!parsed.ok) return parsed.response;
    const { reason, requestedDate } = parsed.data;

    // Minimum notice (Asia/Manila calendar days); the lease-end bound is checked once the lease is known.
    const noticeError = moveOutDateRule(requestedDate);
    if (noticeError) {
        return NextResponse.json({ error: noticeError, fieldErrors: { requestedDate: noticeError } }, { status: 400 });
    }

    try {
        // 1. Get active lease
        const { data: lease, error: leaseError } = await supabase
            .from("leases")
            .select("id, landlord_id, end_date")
            .eq("tenant_id", user.id)
            .eq("status", "active")
            .single();

        if (leaseError || !lease) {
            return NextResponse.json({ error: "No active lease found" }, { status: 404 });
        }

        const leaseEndError = moveOutDateRule(requestedDate, { leaseEndDate: (lease as { end_date?: string | null }).end_date ?? null });
        if (leaseEndError) {
            return NextResponse.json({ error: leaseEndError, fieldErrors: { requestedDate: leaseEndError } }, { status: 400 });
        }

        // 2. Check for existing pending request
        const { data: existing } = await supabase
            .from("move_out_requests" as any)
            .select("id")
            .eq("lease_id", lease.id)
            .eq("status", "pending")
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: "A move-out request is already pending" }, { status: 400 });
        }

        // 3. Create request
        const { error: insertError } = await supabase
            .from("move_out_requests" as any)
            .insert({
                lease_id: lease.id,
                tenant_id: user.id,
                landlord_id: lease.landlord_id,
                reason: reason ?? "",
                requested_date: requestedDate,
                status: "pending"
            });

        if (insertError) {
            console.error("[tenant-move-out] Insert error:", insertError);
            return NextResponse.json({ error: "Failed to submit move-out request." }, { status: 500 });
        }

        // 4. Create notification for landlord
        await supabase.from("notifications").insert({
            user_id: lease.landlord_id,
            type: "lease",
            title: "New Move-Out Request",
            message: `A tenant has requested to move out on ${requestedDate}.`,
            data: { leaseId: lease.id }
        });

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        console.error("[tenant-move-out] Unexpected error:", e);
        return NextResponse.json({ error: "Failed to submit move-out request." }, { status: 500 });
    }
}
