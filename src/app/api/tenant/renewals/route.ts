import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tenant/renewals
 * 
 * List all renewal requests for the authenticated tenant.
 * Includes lease and property details for context.
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    // Get tenant from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch renewal requests with lease details
    const { data: renewals, error: fetchError } = await supabase
      .from("renewal_requests")
      .select(`
        *,
        current_lease:leases!inner (
          id,
          start_date,
          end_date,
          monthly_rent,
          unit:units!inner (
            name,
            property:properties!inner (
              name,
              address
            )
          )
        ),
        new_lease:leases!new_lease_id (
          id,
          status
        )
      `)
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("[renewals] Database error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch renewal requests" },
        { status: 500 }
      );
    }

    return NextResponse.json(renewals || []);
  } catch (error) {
    console.error("[renewals] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
