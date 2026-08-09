import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { NotificationService } from "@/lib/services/notification";

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    type: string;
};

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        const notificationService = new NotificationService(supabase);
        const [notificationsData, unreadCount] = await Promise.all([
            notificationService.getNotifications(userId, { limit: 10 }),
            notificationService.getUnreadCount(userId),
        ]);

        const notifications: NotificationItem[] = notificationsData.map((row) => ({
            id: row.id,
            title: row.title,
            message: row.message,
            read: row.read,
            createdAt: row.created_at,
            type: row.type,
        }));

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
    }
}

