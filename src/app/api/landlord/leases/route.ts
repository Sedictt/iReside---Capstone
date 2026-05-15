import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/landlord/leases
 *
 * List all leases for the authenticated landlord.
 * Supports filtering by propertyId and status.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
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

    // Build query
    let query = supabase
      .from("leases")
      .select(`
        id,
        status,
        start_date,
        end_date,
        monthly_rent,
        security_deposit,
        signed_at,
        created_at,
        unit:units!inner (
          id,
          name,
          beds,
          baths,
          property:properties!inner (
            id,
            name,
            address
          )
        ),
        tenant:profiles!leases_tenant_id_fkey (
          id,
          full_name,
          email,
          phone,
          avatar_url,
          avatar_bg_color
        )
      `)
      .eq("landlord_id", user.id);

    // Apply property filter if provided (skip if "all")
    if (propertyId && propertyId !== "all") {
      query = query.eq("unit.property_id", propertyId);
    }

    // Apply status filter if provided (supports comma-separated values for multiple statuses)
    if (statusFilter) {
      const statuses = statusFilter.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        query = query.eq("status", statuses[0] as any);
      } else if (statuses.length > 1) {
        query = query.in("status", statuses as any);
      }
    }

    const { data: leases, error: fetchError } = await query.order("created_at", { ascending: false });

    if (fetchError) {
      console.error("[landlord-leases] Database error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch leases" },
        { status: 500 }
      );
    }

    return NextResponse.json(leases || []);
  } catch (error) {
    console.error("[landlord-leases] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
