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

    return NextResponse.json({ users: data });
}
