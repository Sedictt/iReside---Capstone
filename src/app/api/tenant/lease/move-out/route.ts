import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { reason, requestedDate } = await req.json();

        if (!requestedDate) {
            return NextResponse.json({ error: "Requested date is required" }, { status: 400 });
        }

        // 1. Get active lease
        const { data: lease, error: leaseError } = await supabase
            .from("leases")
            .select("id, landlord_id")
            .eq("tenant_id", user.id)
            .eq("status", "active")
            .single();

        if (leaseError || !lease) {
            return NextResponse.json({ error: "No active lease found" }, { status: 404 });
        }

        // 2. Check for existing pending request
        const { data: existing } = await supabase
            .from("move_out_requests")
            .select("id")
            .eq("lease_id", lease.id)
            .eq("status", "pending")
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: "A move-out request is already pending" }, { status: 400 });
        }

        // 3. Create request
        const { error: insertError } = await supabase
            .from("move_out_requests")
            .insert({
                lease_id: lease.id,
                tenant_id: user.id,
                landlord_id: lease.landlord_id,
                reason: reason || "",
                requested_date: requestedDate,
                status: "pending"
            });

        if (insertError) throw insertError;

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
        const error = e as Error;
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
