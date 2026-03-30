import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { error: "Unauthorized" };

    // Use admin client to bypass RLS when checking the role
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") return { error: "Forbidden" };
    return { error: null };
}

export async function GET() {
    const { error } = await assertAdmin();
    if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

    const adminClient = createAdminClient();

    const [
        { count: totalUsers, error: e1 },
        { count: totalLandlords, error: e2 },
        { count: totalTenants, error: e3 },
        { count: activeLeases, error: e4 },
        { count: totalProperties, error: e5 },
    ] = await Promise.all([
        adminClient.from("profiles").select("*", { count: "exact", head: true }),
        adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "landlord"),
        adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "tenant"),
        adminClient.from("leases").select("*", { count: "exact", head: true }).eq("status", "active"),
        adminClient.from("properties").select("*", { count: "exact", head: true }),
    ]);

    if (e1 || e2 || e3 || e4 || e5) {
        return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
    }

    return NextResponse.json({
        totalUsers: totalUsers ?? 0,
        totalLandlords: totalLandlords ?? 0,
        totalTenants: totalTenants ?? 0,
        activeLeases: activeLeases ?? 0,
        totalProperties: totalProperties ?? 0,
    });
}
