import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ListingStatus } from "@/types/database";

type UpdateListingBody = {
    title?: string;
    rentAmount?: number;
    status?: ListingStatus;
};

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const supabase = await createClient();
    const resolvedParams = await context.params;
    const id = resolvedParams?.id;

    if (!id) {
        return NextResponse.json({ error: "Listing id is required." }, { status: 400 });
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UpdateListingBody;
    const { title, rentAmount, status } = body;

    const updates: any = {};

    if (title !== undefined) {
        updates.title = title.trim();
    }

    if (rentAmount !== undefined) {
        const numRent = Number(rentAmount);
        if (!Number.isFinite(numRent) || numRent < 0) {
            return NextResponse.json({ error: "Rent amount must be a valid non-negative number." }, { status: 400 });
        }
        updates.rent_amount = numRent;
    }

    if (status !== undefined) {
        if (!["draft", "published", "paused"].includes(status)) {
            return NextResponse.json({ error: "Invalid listing status." }, { status: 400 });
        }
        updates.status = status;
    }

    updates.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase
        .from("listings")
        .update(updates)
        .eq("id", id)
        .eq("landlord_id", user.id);

    if (updateError) {
        return NextResponse.json({ error: `Failed to update listing: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function DELETE(
    _request: Request,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const supabase = await createClient();
    const resolvedParams = await context.params;
    const id = resolvedParams?.id;

    if (!id) {
        return NextResponse.json({ error: "Listing id is required." }, { status: 400 });
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: deleteError } = await supabase
        .from("listings")
        .delete()
        .eq("id", id)
        .eq("landlord_id", user.id);

    if (deleteError) {
        return NextResponse.json({ error: `Failed to delete listing: ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
