import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSignature, sanitizeSignatureDataURL, retryWithBackoff } from "@/lib/signature-validation";
import { logAuditEvent, extractIpAddress, extractUserAgent } from "@/lib/audit-logging";
import { sendLeaseActivatedNotification } from "@/lib/email";
import { isValidLeaseStatusTransition, getTransitionErrorMessage } from "@/lib/lease-status-transitions";

type SignLeaseBody = {
  landlord_signature: string;
};

/**
 * POST /api/landlord/leases/[leaseId]/sign
 * 
 * Allows landlord to countersign a lease agreement after tenant has signed.
 * Validates signature format, verifies lease status, and updates the lease
 * with the landlord's signature using optimistic locking.
 * 
 * Requirements: 5.7, 5.8
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ leaseId: string }> }
) {
  const { leaseId } = await context.params;
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Parse request body
  let body: SignLeaseBody;
  try {
    body = (await request.json()) as SignLeaseBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  // Validate required fields
  if (!body.landlord_signature) {
    return NextResponse.json(
      { error: "Missing required field: landlord_signature" },
      { status: 400 }
    );
  }

  // Fetch lease record
  const { data: lease, error: leaseError } = await supabase
    .from("leases")
    .select("id, status, landlord_id, tenant_signature, tenant_signed_at")
    .eq("id", leaseId)
    .maybeSingle();

  if (leaseError) {
    console.error("[landlord-sign-lease] Database error:", leaseError);
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

  // Verify landlord ID matches authenticated user
  if (lease.landlord_id !== user.id) {
    return NextResponse.json(
      { error: "Unauthorized: You are not the landlord for this lease" },
      { status: 403 }
    );
  }

  // Validate lease status - must be pending landlord signature
  if (lease.status !== "pending_landlord_signature") {
    return NextResponse.json(
      { error: `Cannot sign lease with status: ${lease.status}. Lease must be in 'pending_landlord_signature' status.` },
      { status: 409 }
    );
  }

  // Validate status transition
  const newStatus = "active";
  if (!isValidLeaseStatusTransition(lease.status, newStatus)) {
    return NextResponse.json(
      { error: getTransitionErrorMessage(lease.status, newStatus) },
      { status: 409 }
    );
  }

  // Verify tenant has already signed
  if (!lease.tenant_signature || !lease.tenant_signed_at) {
    return NextResponse.json(
      { error: "Tenant has not signed this lease yet" },
      { status: 409 }
    );
  }

  // Validate signature format and content
  const validation = await validateSignature(body.landlord_signature);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  // Sanitize signature data URL
  let sanitizedSignature: string;
  try {
    sanitizedSignature = sanitizeSignatureDataURL(body.landlord_signature);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid signature data URL format" },
      { status: 400 }
    );
  }

  // Update lease with landlord signature using optimistic locking
  const signedAt = new Date().toISOString();
  
  const updateLeaseWithRetry = async () => {
    // Fetch current lock version
    const { data: currentLease, error: fetchError } = await supabase
      .from("leases")
      .select("signature_lock_version")
      .eq("id", leaseId)
      .single();

    if (fetchError || !currentLease) {
      throw new Error("Failed to fetch lease for optimistic locking");
    }

    const currentLockVersion = currentLease.signature_lock_version;

    // Update with optimistic lock
    const { error: updateError } = await supabase
      .from("leases")
      .update({
        landlord_signature: sanitizedSignature,
        status: newStatus,
        landlord_signed_at: signedAt,
        signed_at: signedAt,
        updated_at: signedAt,
        signature_lock_version: currentLockVersion + 1,
      })
      .eq("id", leaseId)
      .eq("signature_lock_version", currentLockVersion);

    if (updateError) {
      throw new Error(`Failed to update lease: ${updateError.message}`);
    }
  };

  try {
    await retryWithBackoff(updateLeaseWithRetry, 3, 1000);
  } catch (error) {
    console.error("[landlord-sign-lease] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update lease. Please try again." },
      { status: 500 }
    );
  }

  // Log audit event
  try {
    await logAuditEvent({
      leaseId,
      eventType: "landlord_signed",
      actorId: user.id,
      ipAddress: extractIpAddress(request),
      userAgent: extractUserAgent(request),
      metadata: {
        signing_mode: "remote",
        tenant_signed_at: lease.tenant_signed_at,
        status_transition: `${lease.status} -> ${newStatus}`,
      },
    });
  } catch (auditError) {
    console.error("[landlord-sign-lease] Audit logging error:", auditError);
    // Non-blocking error, continue with response
  }

  // Log lease activation event
  try {
    await logAuditEvent({
      leaseId,
      eventType: "lease_activated",
      actorId: user.id,
      ipAddress: extractIpAddress(request),
      userAgent: extractUserAgent(request),
      metadata: {
        signed_at: signedAt,
        status_transition: `${lease.status} -> ${newStatus}`,
      },
    });
  } catch (auditError) {
    console.error("[landlord-sign-lease] Lease activation audit error:", auditError);
    // Non-blocking error, continue with response
  }

  // Send confirmation email to tenant
  try {
    // Fetch lease and tenant details for email
    const { data: leaseDetails } = await supabase
      .from("leases")
      .select(`
        start_date,
        tenant_id,
        units (
          name,
          properties (
            name
          )
        )
      `)
      .eq("id", leaseId)
      .single();

    if (leaseDetails && !('error' in leaseDetails)) {
      // Fetch tenant profile separately
      const { data: tenantProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", leaseDetails.tenant_id)
        .single();

      const tenantEmail = tenantProfile?.email;
      const tenantName = tenantProfile?.full_name || "Tenant";
      const propertyName = (leaseDetails as any).units?.properties?.name || "Property";
      const unitName = (leaseDetails as any).units?.name || "Unit";
      const moveInDate = leaseDetails.start_date;

      if (tenantEmail) {
        await sendLeaseActivatedNotification({
          to: tenantEmail,
          tenantName,
          propertyName,
          unitName,
          moveInDate,
        });
      }
    }
  } catch (emailError) {
    console.error("[landlord-sign-lease] Email notification error:", emailError);
    // Non-blocking error, continue with response
  }

  return NextResponse.json({
    success: true,
    lease_status: "active",
    signed_at: signedAt,
  });
}
