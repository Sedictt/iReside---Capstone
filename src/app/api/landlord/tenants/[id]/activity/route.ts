import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const tenantId = (await params).id;
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    // Parallel fetch activity data
    const [maintenance, payments, leases, applications] = await Promise.all([
        supabase
            .from("maintenance_requests")
            .select("id, title, status, created_at, category")
            .eq("tenant_id", tenantId)
            .eq("landlord_id", userId)
            .order("created_at", { ascending: false }),
        supabase
            .from("payments")
            .select("id, amount, status, created_at, description")
            .eq("tenant_id", tenantId)
            .eq("landlord_id", userId)
            .order("created_at", { ascending: false }),
        supabase
            .from("leases")
            .select("id, status, created_at, signed_at")
            .eq("tenant_id", tenantId)
            .eq("landlord_id", userId)
            .order("created_at", { ascending: false }),
        supabase
            .from("applications")
            .select("id, status, created_at")
            .eq("applicant_id", tenantId)
            .eq("landlord_id", userId)
            .order("created_at", { ascending: false })
    ]);

    // Aggregate and normalize activity
    const activities = [
        ...(maintenance.data || []).map(item => ({
            id: item.id,
            type: "maintenance",
            title: `Maintenance: ${item.title}`,
            status: item.status,
            date: item.created_at,
            icon: "Wrench"
        })),
        ...(payments.data || []).map(item => ({
            id: item.id,
            type: "payment",
            title: `Payment: ${item.description || "Rent"}`,
            amount: item.amount,
            status: item.status,
            date: item.created_at,
            icon: "Wallet"
        })),
        ...(leases.data || []).map(item => ({
            id: item.id,
            type: "lease",
            title: `Lease Status: ${item.status}`,
            date: item.signed_at || item.created_at,
            icon: "FileText"
        })),
        ...(applications.data || []).map(item => ({
            id: item.id,
            type: "application",
            title: `Application ${item.status}`,
            date: item.created_at,
            icon: "UserCheck"
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ activities });
}
