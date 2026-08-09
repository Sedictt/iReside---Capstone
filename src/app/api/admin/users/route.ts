import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { UserService } from "@/lib/services/user";

export async function GET(request: Request) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  const userService = new UserService(supabase);
  const profile = await userService.getProfile(userId);

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await userService.listUsersForAdmin();
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Failed to load admin users:", error);
    return NextResponse.json({ error: "Failed to load users." }, { status: 500 });
  }
}
