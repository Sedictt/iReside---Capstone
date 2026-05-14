import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type InquiryAction = "read" | "unread" | "archive" | "unarchive" | "delete";

type ActionBody = {
    action?: InquiryAction;
};

const isValidAction = (value: unknown): value is InquiryAction => {
    return value === "read" || value === "unread" || value === "archive" || value === "unarchive" || value === "delete";
};

export async function POST(
    request: Request,
    context: { params: Promise<{ inquiryId: string }> }
) {
    const { inquiryId } = await context.params;
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ActionBody;

    if (!isValidAction(body.action)) {
        return NextResponse.json({ error: "Invalid inquiry action." }, { status: 400 });
    }

    const { data: inquiry, error: inquiryError } = await supabase
        .from("applications")
        .select("id")
        .eq("id", inquiryId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (inquiryError) {
        return NextResponse.json({ error: "Failed to load inquiry." }, { status: 500 });
    }

    if (!inquiry) {
        return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }

    const updates: {
        is_read?: boolean;
        is_archived?: boolean;
        deleted_at?: string | null;
    } = {};

    if (body.action === "read") {
        updates.is_read = true;
    } else if (body.action === "unread") {
        updates.is_read = false;
    } else if (body.action === "archive") {
        updates.is_archived = true;
    } else if (body.action === "unarchive") {
        updates.is_archived = false;
    } else if (body.action === "delete") {
        updates.deleted_at = new Date().toISOString();
    }

    const { error: upsertError } = await supabase
        .from("landlord_inquiry_actions" as any)
        .upsert(
            {
                inquiry_id: inquiryId,
                landlord_id: user.id,
                ...updates,
            },
            { onConflict: "inquiry_id,landlord_id" }
        );

    if (upsertError) {
        return NextResponse.json({ error: "Failed to update inquiry action." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
