import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { LeaseService } from "@/lib/services/lease";

/**
 * GET /api/tenant/lease
 *
 * Fetches the active or primary lease for the authenticated tenant.
 */
export async function GET(request: Request) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as any;
  const { userId, supabase } = authContext;

  try {
    const leaseService = new LeaseService(supabase);
    const activeLease = await leaseService.getTenantActiveLease(userId);

    return NextResponse.json({
      lease: activeLease,
    });
  } catch (error) {
    console.error("[tenant-lease] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

