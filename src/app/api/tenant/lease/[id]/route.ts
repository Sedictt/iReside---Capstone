import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { LeaseService, LeaseNotFoundError } from "@/lib/services/lease";

/**
 * GET /api/tenant/lease/[id]
 *
 * Fetches a single lease for the authenticated tenant.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as any;
  const { userId, supabase } = authContext;
  const { id: leaseId } = await context.params;

  try {
    const leaseService = new LeaseService(supabase);
    const lease = await leaseService.getTenantLeaseById(userId, leaseId);

    return NextResponse.json({
      lease,
    });
  } catch (error) {
    if (error instanceof LeaseNotFoundError) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }
    console.error("[tenant-lease-by-id] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

