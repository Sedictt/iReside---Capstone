import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

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

    const { leaseId: tokenLeaseId, tenantId: tokenTenantId } = tokenResult.payload;

    // Verify lease ID matches
    if (tokenLeaseId !== leaseId) {
      return NextResponse.json(
        { error: "Lease ID mismatch" },
        { status: 403 }
      );
    }

    // Fetch lease with related data
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
            address
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
