import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySigningToken } from "@/lib/jwt";

type SignLeaseBody = {
  tenant_signature: string;
  signing_token: string;
};

/**
 * POST /api/tenant/leases/[leaseId]/sign
 * 
 * Allows tenant to sign a lease agreement via a secure signing link.
 * Validates the signing token, verifies lease status, and updates the lease
 * with the tenant's signature.
 * 
 * Requirements: 2.6, 2.7
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ leaseId: string }> }
) {
  const { leaseId } = await context.params;
  const supabase = await createClient();

  // Parse request body
  let body: SignLeaseBody;
  try {
    body = (await request.json()) as SignLeaseBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  // Validate required fields
  if (!body.tenant_signature || !body.signing_token) {
    return NextResponse.json(
      { error: "Missing required fields: tenant_signature and signing_token" },
      { status: 400 }
    );
  }

  // Verify signing token
  const tokenResult = verifySigningToken(body.signing_token);
  
  if (!tokenResult.valid || !tokenResult.payload) {
    return NextResponse.json(
      { error: tokenResult.error || "Invalid signing token" },
      { status: 401 }
    );
  }

  const { leaseId: tokenLeaseId, tenantId: tokenTenantId } = tokenResult.payload;

  // Verify lease ID from token matches URL parameter
  if (tokenLeaseId !== leaseId) {
    return NextResponse.json(
      { error: "Lease ID mismatch" },
      { status: 403 }
    );
  }

  // Fetch lease record
  const { data: lease, error: leaseError } = await supabase
    .from("leases")
    .select("id, status, tenant_id, landlord_signature")
    .eq("id", leaseId)
    .maybeSingle();

  if (leaseError) {
    console.error("[sign-lease] Database error:", leaseError);
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

  // Verify tenant ID from token matches lease tenant
  if (lease.tenant_id !== tokenTenantId) {
    return NextResponse.json(
      { error: "Unauthorized: Tenant ID mismatch" },
      { status: 403 }
    );
  }

  // Validate lease status
  if (lease.status !== "pending_signature") {
    return NextResponse.json(
      { error: `Cannot sign lease with status: ${lease.status}` },
      { status: 409 }
    );
  }

  // Update lease with tenant signature
  const signedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("leases")
    .update({
      tenant_signature: body.tenant_signature,
      status: "active",
      signed_at: signedAt,
      updated_at: signedAt,
    })
    .eq("id", leaseId);

  if (updateError) {
    console.error("[sign-lease] Update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update lease" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    lease_status: "active",
    signed_at: signedAt,
  });
}
