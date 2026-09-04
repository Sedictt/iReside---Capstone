import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** GET /api/landlord/units/[id]/history
 *  Returns real historical leases (tenants), maintenance requests, and unit expenses.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, userRole } = authContext;

    const resolvedParams = await context.params;
    const unitId = resolvedParams?.id;
    if (!unitId) {
        return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
    }

    const adminClient = createServiceRoleSupabaseClient();

    // Verify unit exists and verify landlord ownership
    const { data: unit, error: unitError } = await adminClient
        .from("units")
        .select(`
            id,
            name,
            floor,
            status,
            rent_amount,
            property_id,
            properties!inner (
                id,
                name,
                landlord_id
            )
        `)
        .eq("id", unitId)
        .maybeSingle();

    if (unitError || !unit) {
        return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const property = unit.properties as unknown as { id: string; name: string; landlord_id: string };
    if (property.landlord_id !== userId && userRole !== "admin") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch leases, maintenance requests, and expenses concurrently using adminClient
    const [
        { data: leases, error: leasesError },
        { data: maintenanceRequests, error: maintError },
        { data: expenses, error: expError }
    ] = await Promise.all([
        adminClient
            .from("leases")
            .select(`
                id,
                status,
                start_date,
                end_date,
                monthly_rent,
                security_deposit,
                created_at,
                tenant_id,
                profiles!leases_tenant_id_fkey (
                    id,
                    full_name,
                    email,
                    phone,
                    avatar_url,
                    avatar_bg_color
                )
            `)
            .eq("unit_id", unitId)
            .order("start_date", { ascending: false }),
        adminClient
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
                profiles!maintenance_requests_tenant_id_fkey (
                    full_name
                )
            `)
            .eq("unit_id", unitId)
            .order("created_at", { ascending: false }),
        adminClient
            .from("expenses")
            .select(`
                id,
                category,
                amount,
                date_incurred,
                description,
                created_at
            `)
            .eq("unit_id", unitId)
            .order("date_incurred", { ascending: false })
    ]);

    if (leasesError) {
        console.error("Failed to fetch leases for unit history:", leasesError);
    }
    if (maintError) {
        console.error("Failed to fetch maintenance requests for unit history:", maintError);
    }
    if (expError) {
        console.error("Failed to fetch expenses for unit history:", expError);
    }

    // Helper to format lease status into human readable label
    const formatLeaseStatus = (status: string | null) => {
        switch (status) {
            case "active":
                return "Active";
            case "expired":
                return "Completed";
            case "terminated":
                return "Terminated Early";
            case "pending_signature":
            case "pending_tenant_signature":
            case "pending_landlord_signature":
            case "renewal_pending":
                return "Pending Signature";
            case "draft":
                return "Draft";
            default:
                return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
        }
    };

    // Helper to format maintenance status
    const formatMaintenanceStatus = (status: string | null) => {
        switch (status) {
            case "resolved":
            case "closed":
                return "Completed";
            case "in_progress":
                return "In Progress";
            case "assigned":
                return "Assigned";
            case "open":
            case "pending":
                return "Pending";
            case "cancelled":
                return "Cancelled";
            default:
                return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";
        }
    };

    const formattedTenants = (leases || []).map((lease: any) => {
        const tenantProfile = lease.profiles;
        const tenantName = tenantProfile?.full_name || tenantProfile?.email?.split("@")[0] || "Unknown Tenant";
        return {
            id: lease.id,
            name: tenantName,
            email: tenantProfile?.email || null,
            phone: tenantProfile?.phone || null,
            leaseStart: lease.start_date,
            leaseEnd: lease.end_date,
            rent: Number(lease.monthly_rent) || Number(unit.rent_amount) || 0,
            securityDeposit: Number(lease.security_deposit) || 0,
            status: formatLeaseStatus(lease.status),
            rawStatus: lease.status,
            avatarUrl: tenantProfile?.avatar_url || null,
            avatarBg: tenantProfile?.avatar_bg_color || "bg-primary",
            createdAt: lease.created_at,
        };
    });

    const expenseList = (expenses || []).map((e: any) => ({
        id: e.id,
        category: e.category,
        amount: Number(e.amount) || 0,
        date: e.date_incurred || e.created_at,
        description: e.description,
    }));

    const formattedMaintenance = (maintenanceRequests || []).map((m: any) => {
        // Attempt to find any matching expense for this maintenance ticket by description or date
        const matchingExpense = expenseList.find(e => 
            e.description.toLowerCase().includes(m.title.toLowerCase()) || 
            (m.title && e.description.toLowerCase().includes(m.id.slice(0, 8)))
        );

        return {
            id: m.id,
            title: m.title || "Maintenance Request",
            description: m.description || "No description provided.",
            date: m.resolved_at || m.created_at,
            createdAt: m.created_at,
            resolvedAt: m.resolved_at,
            status: formatMaintenanceStatus(m.status),
            rawStatus: m.status,
            priority: m.priority || "normal",
            category: m.category || "General",
            cost: matchingExpense ? matchingExpense.amount : 0,
            tenantName: m.profiles?.full_name || null,
        };
    });

    return NextResponse.json({
        unit: {
            id: unit.id,
            name: unit.name,
            floor: unit.floor,
            status: unit.status,
            rentAmount: unit.rent_amount,
            propertyId: property.id,
            propertyName: property.name,
        },
        tenants: formattedTenants,
        maintenance: formattedMaintenance,
        expenses: expenseList,
    });
}
