import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const authContext = await requireAuthenticatedUser(request);
        if (!("userId" in authContext)) return authContext as Response;
        const { userId, supabase } = authContext;

        // 1. Fetch Tenant's Payments (Rent & Utilities due dates)
        const paymentsPromise = supabase
            .from("payments")
            .select(`
                id,
                amount,
                subtotal,
                paid_amount,
                balance_remaining,
                status,
                due_date,
                invoice_number,
                description,
                workflow_status,
                lease:leases (
                    id,
                    unit:units (
                        id,
                        name,
                        property_id,
                        property:properties (
                            id,
                            name
                        )
                    )
                )
            `)
            .eq("tenant_id", userId);

        // 2. Fetch Tenant's Leases (Start & End dates)
        const leasesPromise = supabase
            .from("leases")
            .select(`
                id,
                start_date,
                end_date,
                monthly_rent,
                status,
                unit:units (
                    id,
                    name,
                    property_id,
                    property:properties (
                        id,
                        name
                    )
                )
            `)
            .eq("tenant_id", userId);

        // 3. Fetch Tenant's Maintenance Requests
        const maintenancePromise = supabase
            .from("maintenance_requests")
            .select(`
                id,
                title,
                description,
                status,
                priority,
                category,
                created_at,
                resolved_at,
                unit:units (
                    id,
                    name,
                    property_id,
                    property:properties (
                        id,
                        name
                    )
                )
            `)
            .eq("tenant_id", userId);

        // 4. Fetch Tenant's Amenity Bookings
        const bookingsPromise = supabase
            .from("amenity_bookings")
            .select(`
                id,
                booking_date,
                start_time,
                end_time,
                status,
                notes,
                total_price,
                amenity:amenities (
                    id,
                    name,
                    type,
                    property_id,
                    property:properties!amenities_property_id_fkey (
                        id,
                        name
                    )
                )
            `)
            .eq("tenant_id", userId);

        // Run all queries concurrently
        const [paymentsRes, leasesRes, maintenanceRes, bookingsRes] = await Promise.all([
            paymentsPromise,
            leasesPromise,
            maintenancePromise,
            bookingsPromise
        ]);

        if (paymentsRes.error) throw paymentsRes.error;
        if (leasesRes.error) throw leasesRes.error;
        if (maintenanceRes.error) throw maintenanceRes.error;
        if (bookingsRes.error) throw bookingsRes.error;

        const rawPayments = paymentsRes.data || [];
        const rawLeases = leasesRes.data || [];
        const rawMaintenance = maintenanceRes.data || [];
        const rawBookings = bookingsRes.data || [];

        const events: any[] = [];

        // --- Process Payments ---
        rawPayments.forEach((p: any) => {
            if (!p.due_date) return;
            const unitProperty = p.lease?.unit?.property;

            events.push({
                id: `payment-${p.id}`,
                title: p.status === 'paid' ? 'Rent Paid' : 'Payment Due',
                date: p.due_date,
                type: "payment",
                status: p.status,
                amount: p.amount,
                balanceRemaining: p.balance_remaining,
                invoiceNumber: p.invoice_number,
                description: p.description || 'Monthly Rent Payment',
                propertyName: unitProperty?.name,
                unitName: p.lease?.unit?.name,
                detailsUrl: `/tenant/payments`,
                actionLabel: p.status === 'paid' ? 'View Receipt' : 'Pay Bill',
                rawEvent: p
            });
        });

        // --- Process Leases (Start & End dates) ---
        rawLeases.forEach((l: any) => {
            if (l.start_date) {
                events.push({
                    id: `lease-start-${l.id}`,
                    title: `Lease Start`,
                    date: l.start_date,
                    type: "lease",
                    status: "Active",
                    leaseStatus: l.status,
                    propertyName: l.unit?.property?.name,
                    unitName: l.unit?.name,
                    detailsUrl: `/tenant/lease`,
                    actionLabel: 'View Lease',
                    rawEvent: l
                });
            }

            if (l.end_date) {
                events.push({
                    id: `lease-end-${l.id}`,
                    title: `Lease Expiration`,
                    date: l.end_date,
                    type: "lease",
                    status: "Expiring",
                    leaseStatus: l.status,
                    propertyName: l.unit?.property?.name,
                    unitName: l.unit?.name,
                    detailsUrl: `/tenant/lease`,
                    actionLabel: 'Review Renewal',
                    rawEvent: l
                });
            }
        });

        // --- Process Maintenance Requests ---
        rawMaintenance.forEach((m: any) => {
            const dateStr = m.created_at ? m.created_at.split("T")[0] : null;
            if (!dateStr) return;

            events.push({
                id: `maintenance-${m.id}`,
                title: `Maintenance: ${m.title}`,
                date: dateStr,
                type: "maintenance",
                status: m.status,
                priority: m.priority,
                category: m.category,
                description: m.description,
                propertyName: m.unit?.property?.name,
                unitName: m.unit?.name,
                detailsUrl: `/tenant/maintenance?id=${m.id}`,
                actionLabel: 'Track Repair',
                rawEvent: m
            });
        });

        // --- Process Amenity Bookings ---
        rawBookings.forEach((b: any) => {
            if (!b.booking_date) return;

            events.push({
                id: `booking-${b.id}`,
                title: `Facility: ${b.amenity?.name || 'Amenity'}`,
                date: b.booking_date,
                type: "booking",
                status: b.status,
                startTime: b.start_time,
                endTime: b.end_time,
                notes: b.notes,
                totalPrice: b.total_price,
                propertyName: b.amenity?.property?.name,
                detailsUrl: `/tenant/utilities`,
                actionLabel: 'View Booking',
                rawEvent: b
            });
        });

        return NextResponse.json({ events });
    } catch (error) {
        console.error("Failed to load tenant calendar events:", error);
        return NextResponse.json(
            { error: "Failed to load calendar events" },
            { status: 500 }
        );
    }
}
