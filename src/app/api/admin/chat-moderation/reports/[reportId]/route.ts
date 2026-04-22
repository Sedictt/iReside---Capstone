import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_STATUS = new Set(["open", "reviewing", "resolved", "dismissed"]);

async function assertAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) return { user: null, error: "Unauthorized" as const };

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return { user: null, error: "Forbidden" as const };

    return { user, error: null };
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ reportId: string }> }
) {
    const auth = await assertAdmin();
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { reportId } = await context.params;
    if (!reportId) {
        return NextResponse.json({ error: "Invalid report id." }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as { status?: string } | null;
    const status = (body?.status ?? "").trim();

    if (!ALLOWED_STATUS.has(status)) {
        return NextResponse.json({ error: "Invalid report status." }, { status: 400 });
    }

    const adminClient = createAdminClient() as any;
    const { data, error } = await adminClient
        .from("message_user_reports")
        .update({
            status,
            updated_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .select("id, status, updated_at")
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: "Failed to update report status." }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json({
        report: {
            id: data.id as string,
            status: data.status as string,
            updatedAt: data.updated_at as string,
        },
    });
}
