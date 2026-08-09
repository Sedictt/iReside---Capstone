import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { MessageService } from "@/lib/services/messaging";

export async function GET(request: Request) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  try {
    const messageService = new MessageService(supabase);
    const count = await messageService.getTotalUnreadCount(userId);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("[unread-count] Failed to fetch unread message count:", error);
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
  }
}

