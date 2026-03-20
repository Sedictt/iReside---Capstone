import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApplicationStatus } from "@/types/database";

async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { userId: null, error: "Unauthorized" };

    // Use admin client to bypass RLS when checking the role
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") return { userId: null, error: "Forbidden" };
    return { userId: user.id, error: null };
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { userId, error } = await assertAdmin();
    if (error || !userId) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

    const body = await request.json() as { status: ApplicationStatus; admin_notes?: string };
    const { status, admin_notes } = body;

    if (!status) return NextResponse.json({ error: "status is required" }, { status: 400 });

    const adminClient = createAdminClient();

    // Update the application
    const { data: application, error: updateError } = await adminClient
        .from("landlord_applications")
        .update({ status, admin_notes: admin_notes ?? null, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("profile_id")
        .single();

    if (updateError || !application) {
        return NextResponse.json({ error: "Failed to update registration." }, { status: 500 });
    }

    // If approved, promote the user's role to landlord
    if (status === "approved") {
        await adminClient
            .from("profiles")
            .update({ role: "landlord", updated_at: new Date().toISOString() })
            .eq("id", application.profile_id);

        // Also update auth user metadata so middleware redirects correctly
        await adminClient.auth.admin.updateUserById(application.profile_id, {
            user_metadata: { role: "landlord" },
        });
    }

    return NextResponse.json({ success: true });
}
