import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { getTenantBookings, createAmenityBooking } from "@/lib/queries/amenities";
import { databaseErrorResponse, parseJsonBody } from "@/lib/validation/server";
import {
    INACTIVE_BOOKING_STATUSES,
    amenityBookingSchema,
    timeRangesOverlap,
} from "@/lib/validation/schemas/operations.schema";

export async function GET() {
    const { user, supabase } = await requireUser();

    try {
        const bookings = await getTenantBookings(user.id, supabase);
        return NextResponse.json({ bookings: bookings || [] });
    } catch (error) {
        console.error("[GET /api/tenant/amenities/bookings]", error);
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { user, supabase } = await requireUser();

    const parsed = await parseJsonBody(request, amenityBookingSchema);
    if (!parsed.ok) return parsed.response;
    const { amenity_id, booking_date, start_time, end_time, notes } = parsed.data;

    try {
        // The amenity must be active and belong to a property where this tenant has an active lease.
        const { data: amenity } = await supabase
            .from("amenities")
            .select("id, property_id, status")
            .eq("id", amenity_id)
            .maybeSingle();

        if (!amenity || String(amenity.status ?? "").toLowerCase() !== "active") {
            return NextResponse.json(
                { error: "This amenity is not available for booking.", fieldErrors: { amenity_id: "This amenity is not available for booking." } },
                { status: 404 }
            );
        }

        const { data: leases } = await supabase
            .from("leases")
            .select("id, unit:units!inner(property_id)")
            .eq("tenant_id", user.id)
            .eq("status", "active")
            .eq("unit.property_id", amenity.property_id)
            .limit(1);

        if (!leases || leases.length === 0) {
            return NextResponse.json(
                { error: "You can only book amenities at the property where you have an active lease." },
                { status: 403 }
            );
        }

        // Reject overlapping bookings for the same amenity and day (including double submits).
        const { data: sameDayBookings, error: overlapError } = await supabase
            .from("amenity_bookings")
            .select("id, start_time, end_time, status")
            .eq("amenity_id", amenity_id)
            .eq("booking_date", booking_date);

        if (overlapError) {
            return databaseErrorResponse(overlapError, "Failed to create booking");
        }

        const conflict = (sameDayBookings ?? []).find(
            (booking) =>
                !(INACTIVE_BOOKING_STATUSES as readonly string[]).includes(String(booking.status ?? "").toLowerCase()) &&
                timeRangesOverlap(start_time, end_time, String(booking.start_time), String(booking.end_time))
        );

        if (conflict) {
            const message = "This time slot is already booked. Choose another date or time.";
            return NextResponse.json({ error: message, fieldErrors: { booking_date: message } }, { status: 409 });
        }

        const booking = await createAmenityBooking({
            amenity_id,
            tenant_id: user.id,
            booking_date,
            start_time,
            end_time,
            notes: notes ?? undefined,
        }, supabase);

        return NextResponse.json({ booking }, { status: 201 });
    } catch (error) {
        console.error("[POST /api/tenant/amenities/bookings]", error);
        if (error && typeof error === "object" && "code" in error) {
            return databaseErrorResponse(error as { code?: string }, "Failed to create booking");
        }
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}
