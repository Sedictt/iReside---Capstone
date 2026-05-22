import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";

export async function GET(request: Request) {
    try {
        const { user } = await requireUser();
        const supabase = await createClient();

        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get("propertyId");

        // 1. Fetch Payments (Rent & Utilities due dates)
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
                tenant_id,
                tenant:profiles!payments_tenant_id_fkey (
                    id,
                    full_name,
                    avatar_url,
                    avatar_bg_color
                ),
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
            .eq("landlord_id", user.id);

        // 2. Fetch Leases (Start & End dates)
        const leasesPromise = supabase
            .from("leases")
            .select(`
                id,
                start_date,
                end_date,
                monthly_rent,
                status,
                tenant_id,
                tenant:profiles!leases_tenant_id_fkey (
                    id,
                    full_name,
                    avatar_url,
                    avatar_bg_color
                ),
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
            .eq("landlord_id", user.id);

        // 3. Fetch Maintenance Requests
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
                tenant_id,
                tenant:profiles!maintenance_requests_tenant_id_fkey (
                    id,
                    full_name,
                    avatar_url,
                    avatar_bg_color
                ),
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
            .eq("landlord_id", user.id);

        // 4. Fetch Amenity Bookings
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
                tenant_id,
                tenant:profiles!tenant_id (
                    id,
                    full_name,
                    avatar_url,
                    avatar_bg_color
                ),
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
            .eq("landlord_id", user.id);

        // Run all queries in parallel for peak performance
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
            const unitProperty = p.lease?.unit?.property;
            const propId = p.lease?.unit?.property_id;
            
            // Apply property selector filtering
            if (propertyId && propertyId !== "all" && propId !== propertyId) return;

            events.push({
                id: `payment-${p.id}`,
                title: `${p.status === 'paid' ? 'Rent Paid' : 'Rent Due'} - ${p.tenant?.full_name || 'Tenant'}`,
                date: p.due_date,
                type: "payment",
                status: p.status,
                amount: p.amount,
                balanceRemaining: p.balance_remaining,
                invoiceNumber: p.invoice_number,
                description: p.description || `Monthly Rent Payment`,
                tenantName: p.tenant?.full_name,
                tenantAvatar: p.tenant?.avatar_url,
                tenantBg: p.tenant?.avatar_bg_color,
                propertyName: unitProperty?.name,
                unitName: p.lease?.unit?.name,
                detailsUrl: `/landlord/invoices?id=${p.id}`,
                rawEvent: p
            });
        });

        // --- Process Leases (Start & End dates) ---
        rawLeases.forEach((l: any) => {
            const propId = l.unit?.property_id;
            
            if (propertyId && propertyId !== "all" && propId !== propertyId) return;

            // Add Lease Start Event
            events.push({
                id: `lease-start-${l.id}`,
                title: `Lease Start - ${l.tenant?.full_name || 'Tenant'}`,
                date: l.start_date,
                type: "lease",
                status: "start",
                leaseStatus: l.status,
                tenantName: l.tenant?.full_name,
                tenantAvatar: l.tenant?.avatar_url,
                tenantBg: l.tenant?.avatar_bg_color,
                propertyName: l.unit?.property?.name,
                unitName: l.unit?.name,
                detailsUrl: `/landlord/leases`,
                rawEvent: l
            });

            // Add Lease End Event
            events.push({
                id: `lease-end-${l.id}`,
                title: `Lease End - ${l.tenant?.full_name || 'Tenant'}`,
                date: l.end_date,
                type: "lease",
                status: "end",
                leaseStatus: l.status,
                tenantName: l.tenant?.full_name,
                tenantAvatar: l.tenant?.avatar_url,
                tenantBg: l.tenant?.avatar_bg_color,
                propertyName: l.unit?.property?.name,
                unitName: l.unit?.name,
                detailsUrl: `/landlord/leases`,
                rawEvent: l
            });
        });

        // --- Process Maintenance Requests ---
        rawMaintenance.forEach((m: any) => {
            const propId = m.unit?.property_id;
            
            if (propertyId && propertyId !== "all" && propId !== propertyId) return;

            // Map maintenance request created_at to a date string (YYYY-MM-DD)
            const dateStr = m.created_at ? m.created_at.split("T")[0] : null;
            if (!dateStr) return;

            events.push({
                id: `maintenance-${m.id}`,
                title: `🔧 Maintenance: ${m.title}`,
                date: dateStr,
                type: "maintenance",
                status: m.status,
                priority: m.priority,
                category: m.category,
                description: m.description,
                tenantName: m.tenant?.full_name,
                tenantAvatar: m.tenant?.avatar_url,
                tenantBg: m.tenant?.avatar_bg_color,
                propertyName: m.unit?.property?.name,
                unitName: m.unit?.name,
                detailsUrl: `/landlord/maintenance`,
                rawEvent: m
            });
        });

        // --- Process Amenity Bookings ---
        rawBookings.forEach((b: any) => {
            const propId = b.amenity?.property_id;
            
            if (propertyId && propertyId !== "all" && propId !== propertyId) return;

            events.push({
                id: `booking-${b.id}`,
                title: `⭐ Booking: ${b.amenity?.name || 'Amenity'}`,
                date: b.booking_date,
                type: "booking",
                status: b.status,
                startTime: b.start_time,
                endTime: b.end_time,
                notes: b.notes,
                totalPrice: b.total_price,
                tenantName: b.tenant?.full_name,
                tenantAvatar: b.tenant?.avatar_url,
                tenantBg: b.tenant?.avatar_bg_color,
                propertyName: b.amenity?.property?.name,
                detailsUrl: `/landlord/utilities`, // amenities and facilities
                rawEvent: b
            });
        });

        return NextResponse.json({ events });
    } catch (error) {
        console.error("Failed to load landlord calendar events:", error);
        return NextResponse.json(
            { error: "Failed to load calendar events" },
            { status: 500 }
        );
    }
}
