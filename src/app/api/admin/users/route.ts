import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { supabase: null, error: "Unauthorized" };

    // Use admin client to bypass RLS when checking the role
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") return { supabase: null, error: "Forbidden" };
    return { supabase, error: null };
}

export async function GET() {
    const { supabase, error } = await assertAdmin();
    if (error || !supabase) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

    const { data, error: dbError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, avatar_url, created_at")
        .order("created_at", { ascending: false });

    if (dbError) return NextResponse.json({ error: "Failed to load users." }, { status: 500 });

    const tenantIds = (data ?? [])
        .filter((profile) => profile.role === "tenant")
        .map((profile) => profile.id);

    const adminClient = createAdminClient();
    const { data: tourRows, error: tourError } =
        tenantIds.length > 0
            ? await (adminClient as any)
                  .from("tenant_product_tour_states")
                  .select("tenant_id, status, started_at, completed_at, last_event_at")
                  .in("tenant_id", tenantIds)
            : { data: [], error: null };

    if (tourError) return NextResponse.json({ error: "Failed to load tenant product tour summaries." }, { status: 500 });

    const tourMap = new Map(
        (tourRows ?? []).map((row: any) => [
            row.tenant_id,
            {
                status: (row.status as "not_started" | "in_progress" | "skipped" | "completed") ?? "not_started",
                startedAt: (row.started_at as string | null) ?? null,
                completedAt: (row.completed_at as string | null) ?? null,
                lastEventAt: (row.last_event_at as string | null) ?? null,
            },
        ])
    );

    const users = (data ?? []).map((profile) => ({
        ...profile,
        productTourSummary:
            profile.role === "tenant"
                ? tourMap.get(profile.id) ?? {
                      status: "not_started",
                      startedAt: null,
                      completedAt: null,
                      lastEventAt: null,
                  }
                : null,
    }));

    return NextResponse.json({ users });
}
