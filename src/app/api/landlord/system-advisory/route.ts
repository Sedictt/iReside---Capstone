import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

type AdvisoryPayload = {
    id: string;
    title: string;
    message: string;
    createdAt: string;
};

export async function GET() {
    const authContext = await requireAuthenticatedUser();
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, created_at")
        .eq("user_id", userId)
        .eq("type", "announcement")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: "Failed to fetch system advisory." }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ advisory: null });
    }

    const advisory: AdvisoryPayload = {
        id: data.id,
        title: data.title,
        message: data.message,
        createdAt: data.created_at,
    };

    return NextResponse.json({ advisory });
}
