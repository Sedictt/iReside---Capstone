import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { LeaseService } from "@/lib/services/lease";

/**
 * GET /api/landlord/leases
 *
 * List all leases for the authenticated landlord.
 * Supports filtering by propertyId and status.
 */
export async function GET(request: Request) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as any;
  const { userId, supabase } = authContext;
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const unitId = searchParams.get("unitId") ?? undefined;

  try {
    const leaseService = new LeaseService(supabase);
    const leases = await leaseService.listLeasesForLandlord(userId, { propertyId, status, unitId });
    return NextResponse.json(leases || []);
  } catch (error) {
    console.error("[landlord-leases] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}