import { NextResponse, NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, RenewalStatus } from "@/types/database";
import { parseJsonBody } from "@/lib/validation/server";
import { isId, renewalDecisionSchema, renewalTermDatesRule } from "@/lib/validation/schemas/tenant-lifecycle.schema";

/**
 * GET /api/landlord/renewals/[id]
 * Get single renewal request details.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { supabase } = authContext;

  if (!isId(id)) {
    return NextResponse.json({ error: "Renewal request not found" }, { status: 404 });
  }

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

  try {
    // Get landlord from auth
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    if (!isId(id)) {
      return NextResponse.json({ error: "Renewal request not found" }, { status: 404 });
    }

    // Validate the decision payload before touching the request.
    const parsed = await parseJsonBody(request, renewalDecisionSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    // Get renewal request
    const { data: renewalRequest, error: fetchError } = await supabase
      .from("renewal_requests")
      .select("*, current_lease:leases!renewal_requests_current_lease_id_fkey (unit_id, start_date, end_date, unit:units!inner (property:properties!inner (landlord_id)))")
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
    if (propertyLandlordId !== userId) {
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

    if (body.action === "approve") {
      // Update renewal request with proposed terms
      const { proposed_start_date, proposed_end_date, proposed_monthly_rent, proposed_security_deposit, terms_json } = body;

      // Validate the effective term (overrides fall back to the tenant's proposal) before any write,
      // so a bad term cannot leave the request "approved" without a lease.
      const currentLeaseDates = renewalRequest.current_lease as any;
      const effectiveStart = proposed_start_date || renewalRequest.proposed_start_date;
      const effectiveEnd = proposed_end_date || renewalRequest.proposed_end_date;
      const dateProblem = renewalTermDatesRule(effectiveStart, effectiveEnd, currentLeaseDates?.end_date ?? null);
      if (dateProblem) {
        return NextResponse.json(
          { error: dateProblem.message, fieldErrors: { [dateProblem.field]: dateProblem.message } },
          { status: 400 }
        );
      }
      const effectiveRent = Number(proposed_monthly_rent ?? renewalRequest.proposed_monthly_rent);
      if (!Number.isFinite(effectiveRent) || effectiveRent <= 0) {
        return NextResponse.json(
          { error: "Proposed monthly rent must be greater than ₱0.", fieldErrors: { proposed_monthly_rent: "Proposed monthly rent must be greater than ₱0." } },
          { status: 400 }
        );
      }

      const updateData: any = {
        status: "approved" as RenewalStatus,
        ...(proposed_start_date && { proposed_start_date }),
        ...(proposed_end_date && { proposed_end_date }),
        ...(proposed_monthly_rent !== undefined && { proposed_monthly_rent }),
        ...(proposed_security_deposit !== undefined && { proposed_security_deposit }),
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
        landlord_id: userId,
        status: "draft" as any,
        start_date: effectiveStart as string,
        end_date: effectiveEnd as string,
        monthly_rent: effectiveRent,
        security_deposit: Number(proposed_security_deposit ?? renewalRequest.proposed_security_deposit ?? 0),
        terms: (terms_json || renewalRequest.terms_json) as Json,
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

      // Notify tenant using admin client (cross-user notification)
      try {
        const adminClient = createAdminClient();
        await adminClient
          .from("notifications")
          .insert({
            user_id: renewalRequest.tenant_id,
            type: "lease_renewal_approved",
            title: "Renewal Approved",
            message: "Your lease renewal request has been approved. A new lease is ready for signing.",
            data: { renewal_request_id: id, new_lease_id: lease.id }
          });
      } catch (notifErr) {
        console.error("[landlord-renewal] Non-fatal notification error:", notifErr);
      }

      return NextResponse.json({
        message: "Renewal request approved. New lease created.",
        renewal_request: updated,
        new_lease: lease
      });

    } else if (body.action === "reject") {
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

      // Notify tenant using admin client (cross-user notification)
      try {
        const adminClient = createAdminClient();
        await adminClient
          .from("notifications")
          .insert({
            user_id: renewalRequest.tenant_id,
            type: "lease_renewal_rejected",
            title: "Renewal Rejected",
            message: "Your lease renewal request has been rejected.",
            data: { renewal_request_id: id, notes: landlord_notes }
          });
      } catch (notifErr) {
        console.error("[landlord-renewal] Non-fatal notification error:", notifErr);
      }

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
