import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLandlordSigningLink } from "@/lib/jwt";

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
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const landlordId = user.id;

  // Fetch lease record
  const { data: lease, error: leaseError } = await supabase
    .from("leases")
    .select("id, status, landlord_id, tenant_signature, tenant_signed_at")
    .eq("id", leaseId)
    .maybeSingle();

  if (leaseError) {
    console.error("[landlord-signing-link] Database error:", leaseError);
    return NextResponse.json(
      { error: "Failed to fetch lease" },
      { status: 500 }
    );
  }

  if (!lease) {
    return NextResponse.json(
      { error: "Lease not found" },
      { status: 404 }
    );
  }

  // Verify landlord ID matches
  if (lease.landlord_id !== landlordId) {
    return NextResponse.json(
      { error: "Unauthorized: You are not the landlord for this lease" },
      { status: 403 }
    );
  }

  // Verify lease is in correct status for countersignature
  if (lease.status !== "pending_landlord_signature") {
    return NextResponse.json(
      { error: `Cannot generate signing link. Lease status is: ${lease.status}. Expected: pending_landlord_signature` },
      { status: 409 }
    );
  }

  // Verify tenant has already signed
  if (!lease.tenant_signature || !lease.tenant_signed_at) {
    return NextResponse.json(
      { error: "Tenant has not signed this lease yet" },
      { status: 409 }
    );
  }

  // Generate landlord signing link
  const signingUrl = generateLandlordSigningLink(leaseId, landlordId);

  return NextResponse.json({
    success: true,
    signingUrl,
    leaseId,
    status: lease.status,
  });
}
