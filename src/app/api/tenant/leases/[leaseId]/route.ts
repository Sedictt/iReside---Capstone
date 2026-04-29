import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    // Fetch lease with related data
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select(`
        id,
        status,
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

    return NextResponse.json(lease);
  } catch (error) {
    console.error("[get-lease] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
