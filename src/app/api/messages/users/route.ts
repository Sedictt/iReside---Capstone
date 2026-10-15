import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseSearchParams } from "@/lib/validation/server";
import { messageUserSearchQuerySchema, sanitizeSearchTerm } from "@/lib/validation/schemas/operations.schema";

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
    const parsedQuery = parseSearchParams(url.searchParams, messageUserSearchQuerySchema);
    if (!parsedQuery.ok) return parsedQuery.response;
    const query = sanitizeSearchTerm(parsedQuery.data.q);
    const { limit } = parsedQuery.data;

    if (query.length < 2) {
        return NextResponse.json({ users: [] });
    }

    try {
        const searchPattern = `%${query}%`;

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
