import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { ApplicationService } from "@/lib/services/application";

export async function GET(request: Request) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  try {
    const applicationService = new ApplicationService(supabase);
    const [applicationsData, activityResult] = await Promise.all([
      applicationService.getTenantApplications(userId),
      supabase
        .from("notifications")
        .select("id, type, title, message, read, created_at")
        .eq("user_id", userId)
        .in("type", ["application", "lease", "message"])
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (activityResult.error) throw activityResult.error;

    return NextResponse.json({
      applications: applicationsData,
      recentActivity: activityResult.data ?? [],
    });
  } catch (error: any) {
    console.error("Failed to fetch tenant applications:", error);
    return NextResponse.json({ error: error?.message || "Failed to load applications." }, { status: 500 });
  }
}

