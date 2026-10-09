import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RenewalStatus } from "@/types/database";
import { databaseErrorResponse, parseJsonBody } from "@/lib/validation/server";
import { isId, renewalTermRule, tenantRenewalRequestSchema } from "@/lib/validation/schemas/tenant-lifecycle.schema";

/**
 * POST /api/tenant/lease/[id]/renew
 * 
 * Submit a lease renewal request with term length.
 * Validates: lease is active, renewal window is open, no duplicate pending requests.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: leaseId } = await context.params;
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

    if (!isId(leaseId)) {
      return NextResponse.json({ error: "Lease not found or you don't have access" }, { status: 404 });
    }

    // Parse request body (whole months only; decimals/NaN/negatives rejected)
    const parsed = await parseJsonBody(request, tenantRenewalRequestSchema);
    if (!parsed.ok) return parsed.response;
    const { term_months } = parsed.data;

    // Fetch lease with property for renewal window check
    const { data: lease, error: leaseError } = await (supabase
      .from("leases")
      .select(`
        *,
        unit:units (
          property:properties (*)
        )
      `) as any)
      .eq("id", leaseId)
      .eq("tenant_id", user.id)
      .single();

    if (leaseError || !lease) {
      return NextResponse.json(
        { error: "Lease not found or you don't have access" },
        { status: 404 }
      );
    }

    // Check lease is active
    if (lease.status !== "active") {
      return NextResponse.json(
        { error: "Only active leases can be renewed" },
        { status: 400 }
      );
    }

    // When the landlord configured specific renewal terms, only those can be requested.
    const property = lease.unit?.property;
    const offeredTerms: number[] = Array.isArray((property?.renewal_settings as any)?.renewal_terms)
      ? ((property.renewal_settings as any).renewal_terms as Array<{ months?: unknown }>)
          .map((term) => Number(term?.months))
          .filter((months) => Number.isInteger(months) && months > 0)
      : [];
    const termError = renewalTermRule(term_months, offeredTerms);
    if (termError) {
      return NextResponse.json({ error: termError, fieldErrors: { term_months: termError } }, { status: 400 });
    }

    // Check renewal window is open
    const renewalWindowDays = property?.renewal_window_days || 90;
    const endDate = new Date(lease.end_date);
    const windowOpenDate = new Date(endDate);
    windowOpenDate.setDate(windowOpenDate.getDate() - renewalWindowDays);
    const today = new Date();
    
    if (today < windowOpenDate) {
      const daysUntilWindow = Math.ceil((windowOpenDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return NextResponse.json(
        { 
          error: "Renewal window is not open yet",
          days_until_window: daysUntilWindow
        },
        { status: 400 }
      );
    }

    // Check for existing pending renewal requests
    const { data: existingRequests, error: checkError } = await supabase
      .from("renewal_requests")
      .select("id, status")
      .eq("current_lease_id", leaseId)
      .in("status", ["pending", "approved"]);

    if (checkError) {
      console.error("[renew-lease] Error checking existing requests:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing renewal requests" },
        { status: 500 }
      );
    }

    if (existingRequests && existingRequests.length > 0) {
      return NextResponse.json(
        { 
          error: "A renewal request already exists for this lease",
          status: existingRequests[0].status
        },
        { status: 409 }
      );
    }

    // Calculate proposed dates
    const proposedStartDate = new Date(lease.end_date);
    const proposedEndDate = new Date(proposedStartDate);
    proposedEndDate.setMonth(proposedEndDate.getMonth() + term_months);

    // Calculate proposed monthly rent based on property renewal_settings if set
    let proposedMonthlyRent = Number(lease.monthly_rent) || 0;
    const renewalSettings = property?.renewal_settings as any;
    if (renewalSettings?.base_rent_adjustment && renewalSettings.base_rent_adjustment > 0) {
      if (renewalSettings.adjustment_type === "percentage") {
        proposedMonthlyRent = Math.round(proposedMonthlyRent * (1 + Number(renewalSettings.base_rent_adjustment) / 100));
      } else if (renewalSettings.adjustment_type === "fixed") {
        proposedMonthlyRent = proposedMonthlyRent + Number(renewalSettings.base_rent_adjustment);
      }
    }

    const adminClient = createAdminClient();

    // Create renewal request using adminClient to ensure reliable creation and satisfy service permissions
    const renewalRequest = {
      current_lease_id: leaseId,
      tenant_id: user.id,
      landlord_id: lease.landlord_id,
      proposed_start_date: proposedStartDate.toISOString().split('T')[0],
      proposed_end_date: proposedEndDate.toISOString().split('T')[0],
      proposed_monthly_rent: proposedMonthlyRent,
      proposed_security_deposit: lease.security_deposit,
      terms_json: lease.terms,
      status: "pending" as RenewalStatus,
    };

    const { data: newRequest, error: createError } = await adminClient
      .from("renewal_requests")
      .insert(renewalRequest)
      .select()
      .single();

    if (createError) {
      console.error("[renew-lease] Error creating renewal request:", createError);
      return databaseErrorResponse(createError, "Failed to create renewal request");
    }

    // Notify landlord using adminClient (required for cross-user notifications under RLS)
    try {
      await adminClient
        .from("notifications")
        .insert({
          user_id: lease.landlord_id,
          type: "lease_renewal_request",
          title: "Renewal Request Submitted",
          message: `Tenant has requested a lease renewal for ${term_months} months.`,
          data: { lease_id: leaseId, renewal_request_id: newRequest.id }
        });
    } catch (notifErr) {
      console.error("[renew-lease] Non-fatal notification error:", notifErr);
    }

    return NextResponse.json({
      message: "Renewal request submitted successfully",
      renewal_request: newRequest
    });

  } catch (error) {
    console.error("[renew-lease] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
