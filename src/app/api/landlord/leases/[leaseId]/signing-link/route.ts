import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import {
  LeaseService,
  LeaseNotFoundError,
  LeaseAccessError,
  LeaseSigningEligibilityError,
} from "@/lib/services/lease";

/**
 * POST /api/landlord/leases/[leaseId]/signing-link
 *
 * Generates a secure signing link for a landlord to countersign a lease.
 * Only works for leases in "pending_landlord_signature" status.
 *
 * Requirements: Lease countersignature workflow
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ leaseId: string }> }
) {
  const { leaseId } = await context.params;
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId: landlordId, supabase } = authContext;

  try {
    const leaseService = new LeaseService(supabase);
    const result = await leaseService.generateLandlordSigningLink(landlordId, leaseId);

    return NextResponse.json({
      success: true,
      signingUrl: result.signingUrl,
      leaseId: result.leaseId,
      status: result.status,
    });
  } catch (error) {
    if (error instanceof LeaseNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof LeaseAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof LeaseSigningEligibilityError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("[landlord-signing-link] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to generate signing link" },
      { status: 500 }
    );
  }
}

