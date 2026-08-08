import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    type: string;
};

export async function GET() {
    const authContext = await requireAuthenticatedUser();
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, read, created_at, type")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

    if (error) {
        return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
    }

    const notifications: NotificationItem[] = (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        read: row.read,
        createdAt: row.created_at,
        type: row.type,
    }));

    const unreadCount = notifications.filter((notification) => !notification.read).length;

    return NextResponse.json({ notifications, unreadCount });
}
