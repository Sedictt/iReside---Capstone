import { NextResponse } from "next/server";
import { isId } from "@/lib/validation/schemas/tenant-lifecycle.schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySigningToken } from "@/lib/jwt";

/**
 * GET /api/tenant/leases/[leaseId]
 * 
 * Fetches lease details for tenant review before signing.
 * Returns lease information including property, unit, and landlord details.
 * 
 * Requirements: 2.5, 2.6
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ leaseId: string }> }
) {
  const { leaseId } = await context.params;
  if (!isId(leaseId)) {
    return NextResponse.json({ error: "Lease not found" }, { status: 404 });
  }
  try {
    // Get token from query params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Signing token is required" },
        { status: 401 }
      );
    }

    // Verify token
    const tokenResult = verifySigningToken(token);
    if (!tokenResult.valid || !tokenResult.payload) {
      return NextResponse.json(
        { error: tokenResult.error || "Invalid signing token" },
        { status: 401 }
      );
    }

    const { leaseId: tokenLeaseId, actorId: tokenTenantId, role: tokenRole } = tokenResult.payload;

    // Verify role
    if (tokenRole !== 'tenant') {
      return NextResponse.json(
        { error: "Unauthorized: Invalid role for this endpoint" },
        { status: 403 }
      );
    }

    // Verify lease ID matches
    if (tokenLeaseId !== leaseId) {
      return NextResponse.json(
        { error: "Lease ID mismatch" },
        { status: 403 }
      );
    }

    // The signing token is the authorization here: the link is opened from an email,
    // often signed out or in a browser signed in as someone else, so RLS on the
    // visitor's session would hide the lease. The token checks above and the
    // tenant_id check below scope this read.
    const supabase = createAdminClient();
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select(`
        id,
        status,
        tenant_id,
        start_date,
        end_date,
        monthly_rent,
        security_deposit,
        terms,
        unit:units!inner (
          name,
          property:properties!inner (
            name,
            address,
            city,
            house_rules
          )
        ),
        landlord:profiles!leases_landlord_id_fkey (
          full_name,
          email
        ),
        tenant:profiles!leases_tenant_id_fkey (
          full_name,
          email
        )
      `)
      .eq("id", leaseId)
      .maybeSingle();

    if (leaseError) {
      console.error("[get-lease] Database error:", leaseError);
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

    // Verify tenant ID matches
    if (lease.tenant_id !== tokenTenantId) {
      return NextResponse.json(
        { error: "Unauthorized: Tenant ID mismatch" },
        { status: 403 }
      );
    }

    return NextResponse.json(lease);
  } catch (error) {
    console.error("[get-lease] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
