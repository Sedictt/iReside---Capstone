import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/landlord/renewals
 * 
 * List renewal requests for the authenticated landlord.
 * Supports filtering by status (pending, approved, rejected, signed).
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const propertyId = searchParams.get("propertyId");

  try {
    // Get landlord from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Build query
    let query = supabase
      .from("renewal_requests")
      .select(`
        *,
        current_lease:leases!inner (
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
          tenant:profiles!inner (
            id,
            full_name,
            email,
            phone
          )
        ),
        new_lease:leases!new_lease_id (
          id,
          status
        )
      `)
      .eq("landlord_id", user.id);

    // Apply status filter if provided
    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    // Apply property filter if provided
    if (propertyId) {
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
