import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AdvisoryPayload = {
    id: string;
    title: string;
    message: string;
    createdAt: string;
};

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, created_at")
        .eq("user_id", user.id)
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
