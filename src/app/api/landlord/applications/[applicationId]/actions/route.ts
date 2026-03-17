import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/database";

type ActionBody = {
    status?: ApplicationStatus;
};

const ALLOWED_STATUSES: ApplicationStatus[] = ["reviewing", "approved", "rejected"];

const isAllowedStatus = (value: unknown): value is ApplicationStatus =>
    typeof value === "string" && ALLOWED_STATUSES.includes(value as ApplicationStatus);

export async function POST(
    request: Request,
    context: { params: Promise<{ applicationId: string }> }
) {
    const { applicationId } = await context.params;
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: ActionBody = {};
    try {
        body = (await request.json()) as ActionBody;
    } catch {
        body = {};
    }

    if (!isAllowedStatus(body.status)) {
        return NextResponse.json({ error: "Invalid application status." }, { status: 400 });
    }

    const { data: application, error: applicationError } = await supabase
        .from("applications")
        .select("id, status")
        .eq("id", applicationId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (applicationError) {
        return NextResponse.json({ error: "Failed to load application." }, { status: 500 });
    }

    if (!application) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (application.status === "withdrawn") {
        return NextResponse.json({ error: "Application has been withdrawn." }, { status: 409 });
    }

    const reviewedAt = new Date().toISOString();
    const { error: updateError } = await supabase
        .from("applications")
        .update({
            status: body.status,
            reviewed_at: reviewedAt,
        })
        .eq("id", applicationId)
        .eq("landlord_id", user.id);

    if (updateError) {
        return NextResponse.json({ error: "Failed to update application status." }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: body.status, reviewedAt });
}
