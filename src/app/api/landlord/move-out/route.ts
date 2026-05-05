import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/landlord/move-out
 * 
 * List move-out requests for the authenticated landlord.
 * Supports filtering by status (pending, approved, denied, completed).
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  try {
    // Get landlord from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get move-out requests first
    let query = supabase
      .from("move_out_requests")
      .select("*")
      .eq("landlord_id", user.id);

    // Apply status filter if provided and not 'all'
    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: moveOutRequests, error: fetchError } = await query.order("created_at", { ascending: false });

    if (fetchError) {
      console.error("[landlord-move-out] Database error:", JSON.stringify(fetchError));
      return NextResponse.json(
        { error: `Database error: ${fetchError.message}`, details: fetchError },
        { status: 500 }
      );
    }

    if (!moveOutRequests || moveOutRequests.length === 0) {
      return NextResponse.json([]);
    }

    // Get related data in separate queries
    const leaseIds = moveOutRequests.map(r => r.lease_id);

    // Fetch leases
    const { data: leases } = await supabase
      .from("leases")
      .select("*, units(*, properties(*)), tenant:profiles!leases_tenant_id_fkey(*)")
      .in("id", leaseIds);

    // Build response with related data
    const enrichedRequests = moveOutRequests.map(req => {
      const lease = leases?.find(l => l.id === req.lease_id);
      return {
        ...req,
        lease: lease ? {
          id: lease.id,
          start_date: lease.start_date,
          end_date: lease.end_date,
          monthly_rent: lease.monthly_rent,
          security_deposit: lease.security_deposit,
          unit: lease.units ? {
            name: lease.units.name,
            property: lease.units.properties ? {
              id: lease.units.properties.id,
              name: lease.units.properties.name,
              address: lease.units.properties.address
            } : null
          } : null,
          tenant: lease.tenant ? {
            id: lease.tenant.id,
            full_name: lease.tenant.full_name,
            email: lease.tenant.email,
            phone: lease.tenant.phone
          } : null
        } : null
      };
    });

    return NextResponse.json(enrichedRequests || []);
  } catch (error: any) {
    console.error("[landlord-move-out] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", message: error.message },
      { status: 500 }
    );
  }
}
