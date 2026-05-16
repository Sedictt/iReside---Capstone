import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { getTenantBookings, createAmenityBooking } from "@/lib/queries/amenities";

export async function GET() {
    const { user, supabase } = await requireUser();

    try {
        const bookings = await getTenantBookings(user.id, supabase);
        return NextResponse.json({ bookings: bookings || [] });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch bookings";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { user, supabase } = await requireUser();

    try {
        const body = await request.json();

        // Validate required fields
        const { amenity_id, booking_date, start_time, end_time, notes } = body;

        if (!amenity_id || !booking_date || !start_time || !end_time) {
            return NextResponse.json(
                { error: "Missing required fields: amenity_id, booking_date, start_time, end_time" },
                { status: 400 }
            );
        }

        const booking = await createAmenityBooking({
            amenity_id,
            tenant_id: user.id,
            booking_date,
            start_time,
            end_time,
            notes: notes || undefined,
        }, supabase);

        return NextResponse.json({ booking }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create booking";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}