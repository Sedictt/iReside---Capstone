import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";

/**
 * GET /api/tenant/renewals
 * 
 * List all renewal requests for the authenticated tenant.
 * Includes lease and property details for context.
 */
export async function GET(request: Request) {
  const { user, supabase } = await requireUser();

  try {

    // Fetch renewal requests with lease details
    const { data: renewals, error: fetchError } = await supabase
      .from("renewal_requests")
      .select(`
        *,
        current_lease:leases!renewal_requests_current_lease_id_fkey (
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
        new_lease:leases!renewal_requests_new_lease_id_fkey (
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
