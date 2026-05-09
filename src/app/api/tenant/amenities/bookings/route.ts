import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tenant/amenities/bookings
 * Fetch tenant's amenity bookings
 */
export async function GET() {
    const supabase = await createClient();
    
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data: bookings, error: bookingsError } = await supabase
            .from('amenity_bookings')
            .select(`
                id,
                booking_date,
                start_time,
                end_time,
                total_price,
                status,
                notes,
                created_at,
                amenity:amenities(
                    id,
                    name,
                    type,
                    icon_name,
                    image_url,
                    price_per_unit,
                    unit_type,
                    capacity,
                    location_details
                )
            `)
            .eq('tenant_id', user.id)
            .order('booking_date', { ascending: false });

        if (bookingsError) {
            console.error("Error fetching tenant bookings:", bookingsError);
            return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
        }

        return NextResponse.json({ bookings: bookings || [] });
    } catch (error) {
        console.error("Unexpected error in GET /api/tenant/amenities/bookings:", error);
        return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
    }
}

/**
 * POST /api/tenant/amenities/bookings
 * Create a new amenity booking
 */
export async function POST(request: Request) {
    const supabase = await createClient();
    
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { amenity_id, booking_date, start_time, end_time, notes } = body;

        // Validate required fields
        if (!amenity_id || !booking_date || !start_time || !end_time) {
            return NextResponse.json(
                { error: "Missing required fields: amenity_id, booking_date, start_time, end_time" },
                { status: 400 }
            );
        }

        // Get amenity details including landlord_id and pricing
        const { data: amenity, error: amenityError } = await supabase
            .from('amenities')
            .select('landlord_id, price_per_unit, unit_type, name')
            .eq('id', amenity_id)
            .single();

        if (amenityError || !amenity) {
            return NextResponse.json({ error: "Amenity not found" }, { status: 404 });
        }

        // Calculate total price based on duration
        let total_price = 0;
        if (amenity.unit_type !== 'free' && amenity.price_per_unit) {
            const startHour = parseInt(start_time.split(':')[0]);
            const endHour = parseInt(end_time.split(':')[0]);
            const hours = Math.max(1, endHour - startHour);
            total_price = amenity.price_per_unit * hours;
        }

        // Create the booking
        const { data: booking, error: bookingError } = await supabase
            .from('amenity_bookings')
            .insert({
                amenity_id,
                tenant_id: user.id,
                landlord_id: amenity.landlord_id,
                booking_date,
                start_time,
                end_time,
                total_price,
                status: 'Pending',
                notes: notes || null,
            })
            .select(`
                id,
                booking_date,
                start_time,
                end_time,
                total_price,
                status,
                notes,
                created_at,
                amenity:amenities(
                    id,
                    name,
                    type,
                    icon_name,
                    image_url,
                    price_per_unit,
                    unit_type,
                    capacity,
                    location_details
                )
            `)
            .single();

        if (bookingError) {
            console.error("Error creating booking:", bookingError);
            return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
        }

        return NextResponse.json({ booking }, { status: 201 });
    } catch (error) {
        console.error("Unexpected error in POST /api/tenant/amenities/bookings:", error);
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}