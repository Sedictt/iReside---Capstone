import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id: postId } = await context.params;
    if (!postId) {
        return NextResponse.json({ error: "Missing post ID" }, { status: 400 });
    }

    const supabase = (await createClient()) as any;
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from("community_comments")
        .select(`
            id,
            post_id,
            author_id,
            content,
            parent_comment_id,
            created_at,
            profiles!author_id ( full_name, avatar_url, avatar_bg_color )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("[API] /api/community/posts/[id]/comments error:", error);
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    const comments = (data || []).map((row: any) => ({
        id: row.id,
        postId: row.post_id,
        authorId: row.author_id,
        authorName: row.profiles?.full_name || "Unknown",
        authorAvatar: row.profiles?.avatar_url || null,
        authorAvatarBgColor: row.profiles?.avatar_bg_color || null,
        content: row.content,
        parentCommentId: row.parent_comment_id,
        createdAt: row.created_at,
    }));

    return NextResponse.json(
        { comments },
        {
            status: 200,
            headers: {
                "Cache-Control": "private, no-cache, stale-while-revalidate=60",
            },
        }
    );
}
