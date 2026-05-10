import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const tenantId = (await params).id;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch profile to ensure access
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "landlord") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parallel fetch activity data
    const [maintenance, payments, leases, applications] = await Promise.all([
        supabase
            .from("maintenance_requests")
            .select("id, title, status, created_at, category")
            .eq("tenant_id", tenantId)
            .eq("landlord_id", user.id)
            .order("created_at", { ascending: false }),
        supabase
            .from("payments")
            .select("id, amount, status, created_at, type")
            .eq("tenant_id", tenantId)
            .eq("landlord_id", user.id)
            .order("created_at", { ascending: false }),
        supabase
            .from("leases")
            .select("id, status, created_at, signed_at")
            .eq("tenant_id", tenantId)
            .eq("landlord_id", user.id)
            .order("created_at", { ascending: false }),
        supabase
            .from("applications")
            .select("id, status, created_at")
            .eq("tenant_id", tenantId)
            .eq("landlord_id", user.id)
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
            title: `Payment: ${item.type || "Rent"}`,
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
