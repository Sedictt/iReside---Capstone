import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { RenewalStatus } from "@/types/database";

/**
 * GET /api/landlord/renewals
 * 
 * List renewal requests for the authenticated landlord.
 * Supports filtering by status (pending, approved, rejected, signed).
 */
export async function GET(request: Request) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const propertyId = searchParams.get("propertyId");

  try {
    // Build query
    let query = supabase
      .from("renewal_requests")
      .select(`
        *,
        current_lease:leases!renewal_requests_current_lease_id_fkey (
          id,
          start_date,
          end_date,
          monthly_rent,
          security_deposit,
          unit:units!inner (
            name,
            beds,
            baths,
            property:properties!inner (
              id,
              name,
              address
            )
          ),
          tenant:profiles!leases_tenant_id_fkey!inner (
            id,
            full_name,
            email,
            phone
          )
        ),
        new_lease:leases!renewal_requests_new_lease_id_fkey (
          id,
          status
        )
      `)
      .eq("landlord_id", userId);

    // Apply status filter if provided
    if (statusFilter) {
      query = query.eq("status", statusFilter as RenewalStatus);
    }

    // Apply property filter if provided (skip if "all")
    if (propertyId && propertyId !== "all") {
      query = query.eq("current_lease.unit.property_id", propertyId);
    }

    const { data: renewals, error: fetchError } = await query.order("created_at", { ascending: false });

    if (fetchError) {
      console.error("[landlord-renewals] Database error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch renewal requests" },
        { status: 500 }
      );
    }

    return NextResponse.json(renewals || []);
  } catch (error) {
    console.error("[landlord-renewals] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
