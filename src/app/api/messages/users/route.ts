import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim();
    const limitParam = Number(url.searchParams.get("limit") ?? "8");
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(20, Math.floor(limitParam))) : 8;

    if (query.length < 2) {
        return NextResponse.json({ users: [] });
    }

    try {
        const escaped = query.replace(/[%,]/g, "");
        const searchPattern = `%${escaped}%`;

        const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url, role")
            .neq("id", user.id)
            .or(`full_name.ilike.${searchPattern},email.ilike.${searchPattern}`)
            .order("full_name", { ascending: true })
            .limit(limit);

        if (error) {
            console.error("Failed to search message users:", error);
            return NextResponse.json({ error: "Failed to search users." }, { status: 500 });
        }

        const users = (data ?? []).map((profile) => ({
            id: profile.id,
            fullName: profile.full_name,
            email: profile.email,
            avatarUrl: profile.avatar_url,
            role: profile.role,
        }));

        return NextResponse.json({ users });
    } catch (error) {
        console.error("Failed to search message users:", error);
        return NextResponse.json({ error: "Failed to search users." }, { status: 500 });
    }
}
