import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RenewalStatus } from "@/types/database";

/**
 * GET /api/landlord/renewals/[id]
 * Get single renewal request details.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();

  try {
    const { data: request, error } = await supabase
      .from("renewal_requests")
      .select(`
        *,
        current_lease:leases!renewal_requests_current_lease_id_fkey (
          *,
          unit:units!inner (*),
          tenant:profiles!leases_tenant_id_fkey!inner (id, full_name, email, phone)
        ),
        new_lease:leases!renewal_requests_new_lease_id_fkey (*)
      `)
      .eq("id", id)
      .single();

    if (error || !request) {
      return NextResponse.json(
        { error: "Renewal request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("[landlord-renewal-get] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/landlord/renewals/[id]
 * Approve or reject a renewal request.
 * 
 * Body: { action: "approve" | "reject", ...fields }
 * Approve: { proposed_start_date?, proposed_end_date?, proposed_monthly_rent?, proposed_security_deposit?, terms_json? }
 * Reject: { landlord_notes: string }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();

  try {
    // Get landlord from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get renewal request
    const { data: renewalRequest, error: fetchError } = await supabase
      .from("renewal_requests")
      .select("*, current_lease:leases!renewal_requests_current_lease_id_fkey (unit:units!inner (property:properties!inner (landlord_id)))")
      .eq("id", id)
      .single();

    if (fetchError || !renewalRequest) {
      return NextResponse.json(
        { error: "Renewal request not found" },
        { status: 404 }
      );
    }

    // Verify landlord owns this request
    const propertyLandlordId = (renewalRequest.current_lease as any)?.unit?.property?.landlord_id;
    if (propertyLandlordId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You don't have access to this renewal request" },
        { status: 403 }
      );
    }

    // Check request is pending
    if (renewalRequest.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot process request with status: ${renewalRequest.status}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "approve") {
      // Update renewal request with proposed terms
      const { proposed_start_date, proposed_end_date, proposed_monthly_rent, proposed_security_deposit, terms_json } = body;

      const updateData: any = {
        status: "approved" as RenewalStatus,
        ...(proposed_start_date && { proposed_start_date }),
        ...(proposed_end_date && { proposed_end_date }),
        ...(proposed_monthly_rent && { proposed_monthly_rent }),
        ...(proposed_security_deposit && { proposed_security_deposit }),
        ...(terms_json && { terms_json }),
      };

      const { data: updated, error: updateError } = await supabase
        .from("renewal_requests")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("[landlord-renewal] Error updating request:", updateError);
        return NextResponse.json(
          { error: "Failed to approve renewal request" },
          { status: 500 }
        );
      }

      // Create new lease in draft status
      const currentLease = renewalRequest.current_lease as any;
      const newLease = {
        unit_id: currentLease.unit_id,
        tenant_id: renewalRequest.tenant_id,
        landlord_id: user.id,
        status: "draft" as any,
        start_date: proposed_start_date || renewalRequest.proposed_start_date,
        end_date: proposed_end_date || renewalRequest.proposed_end_date,
        monthly_rent: proposed_monthly_rent || renewalRequest.proposed_monthly_rent,
        security_deposit: proposed_security_deposit || renewalRequest.proposed_security_deposit,
        terms: terms_json || renewalRequest.terms_json,
      };

      const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .insert(newLease)
        .select()
        .single();

      if (leaseError) {
        console.error("[landlord-renewal] Error creating lease:", leaseError);
        return NextResponse.json(
          { error: "Failed to create new lease" },
          { status: 500 }
        );
      }

      // Update renewal request with new lease ID
      await supabase
        .from("renewal_requests")
        .update({ new_lease_id: lease.id })
        .eq("id", id);

      // Notify tenant
      await supabase
        .from("notifications")
        .insert({
          user_id: renewalRequest.tenant_id,
          type: "lease_renewal_approved",
          title: "Renewal Approved",
          message: "Your lease renewal request has been approved. A new lease is ready for signing.",
          data: { renewal_request_id: id, new_lease_id: lease.id }
        });

      return NextResponse.json({
        message: "Renewal request approved. New lease created.",
        renewal_request: updated,
        new_lease: lease
      });

    } else if (action === "reject") {
      const { landlord_notes } = body;

      const { data: updated, error: updateError } = await supabase
        .from("renewal_requests")
        .update({
          status: "rejected" as RenewalStatus,
          landlord_notes
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("[landlord-renewal] Error rejecting request:", updateError);
        return NextResponse.json(
          { error: "Failed to reject renewal request" },
          { status: 500 }
        );
      }

      // Notify tenant
      await supabase
        .from("notifications")
        .insert({
          user_id: renewalRequest.tenant_id,
          type: "lease_renewal_rejected",
          title: "Renewal Rejected",
          message: "Your lease renewal request has been rejected.",
          data: { renewal_request_id: id, notes: landlord_notes }
        });

      return NextResponse.json({
        message: "Renewal request rejected.",
        renewal_request: updated
      });

    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'approve' or 'reject'." },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("[landlord-renewal] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
