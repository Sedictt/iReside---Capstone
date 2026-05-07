import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySigningToken } from "@/lib/jwt";

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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      landlordId = user.id;
    }

    // Fetch lease with related data
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select(`
        id,
        status,
        landlord_id,
        start_date,
        end_date,
        monthly_rent,
        security_deposit,
        terms,
        tenant_signature,
        tenant_signed_at,
        signed_document_url,
        signed_at,
        landlord_signed_at,
        unit:units!inner (
          name,
          property:properties!inner (
            name,
            address,
            contract_template
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
      console.error("[get-landlord-lease] Database error:", leaseError);
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
        { error: "Unauthorized: Landlord ID mismatch" },
        { status: 403 }
      );
    }

    return NextResponse.json(lease);
  } catch (error) {
    console.error("[get-landlord-lease] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
