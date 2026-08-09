import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { verifySigningToken } from "@/lib/jwt";
import { LeaseService, LeaseNotFoundError } from "@/lib/services/lease";

/**
 * GET /api/landlord/leases/[leaseId]
 *
 * Fetches lease details for landlord review before countersigning.
 * Supports both session-based and token-based (remote signing) access.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ leaseId: string }> }
) {
  const { leaseId } = await context.params;
  const supabase = await createClient();

  try {
    // Get token from query params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    let landlordId: string;

    if (token) {
      // Verify token
      const tokenResult = verifySigningToken(token);
      if (!tokenResult.valid || !tokenResult.payload) {
        return NextResponse.json(
          { error: tokenResult.error || "Invalid signing token" },
          { status: 401 }
        );
      }

      if (tokenResult.payload.leaseId !== leaseId || tokenResult.payload.role !== 'landlord') {
        return NextResponse.json(
          { error: "Unauthorized: Token mismatch" },
          { status: 403 }
        );
      }
      landlordId = tokenResult.payload.actorId;
    } else {
      // Get authenticated user
      const authContext = await requireAuthenticatedUser(request);
      if (!("userId" in authContext)) return authContext as any;
      landlordId = authContext.userId;
    }

    // Fetch lease with related data
    const leaseService = new LeaseService(supabase);
    const lease = await leaseService.getLeaseDetail(leaseId);

    // Verify landlord ID matches
    if (lease.landlord_id !== landlordId) {
      return NextResponse.json(
        { error: "Unauthorized: Landlord ID mismatch" },
        { status: 403 }
      );
    }

    return NextResponse.json(lease);
  } catch (error) {
    if (error instanceof LeaseNotFoundError) {
      return NextResponse.json(
        { error: "Lease not found" },
        { status: 404 }
      );
    }
    console.error("[get-landlord-lease] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}