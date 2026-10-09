import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { zUuid } from "@/lib/validation/zod-fields";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user } = await requireUser();
    const { id } = await params;

    if (!zUuid().safeParse(id).success) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

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
            .eq("id", id)
            .eq("tenant_id", user.id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[DELETE /api/tenant/amenities/bookings/[id]]", error);
        return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
    }
}