import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ListingEventType = "view" | "lead";

const isValidEventType = (value: string): value is ListingEventType =>
    value === "view" || value === "lead";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const resolvedParams = await context.params;
    const id = resolvedParams?.id;

    if (!id) {
        return NextResponse.json({ error: "Listing id is required." }, { status: 400 });
    }

    let eventType: ListingEventType = "view";

    if (request.headers.get("content-type")?.includes("application/json")) {
        const body = (await request.json()) as { type?: string };
        if (body?.type) {
            if (!isValidEventType(body.type)) {
                return NextResponse.json({ error: "Invalid listing event type." }, { status: 400 });
            }
            eventType = body.type;
        }
    }

    const supabase = await createClient();
    const { data, error } = await (supabase.rpc as any)("increment_listing_metric", {
        p_listing_id: id,
        p_metric: eventType,
    });

    if (error) {
        return NextResponse.json({ error: "Failed to record listing metric." }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: Number(data ?? 0) });
}
