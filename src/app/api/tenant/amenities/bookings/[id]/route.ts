import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user } = await requireUser();
    const { id } = await params;

    try {
        const supabase = await createClient();

        // Verify the booking belongs to the tenant
        const { data: booking, error: fetchError } = await supabase
            .from("amenity_bookings")
            .select("tenant_id")
            .eq("id", id)
            .single();

        if (fetchError || !booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        if (booking.tenant_id !== user.id) {
            return NextResponse.json({ error: "Not authorized to cancel this booking" }, { status: 403 });
        }

        // Update status to cancelled
        const { error: updateError } = await supabase
            .from("amenity_bookings")
            .update({ status: "cancelled" })
            .eq("id", id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to cancel booking";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}