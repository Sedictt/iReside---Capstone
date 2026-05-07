import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySigningToken } from "@/lib/jwt";
import {
  validateSignature,
  sanitizeSignatureDataURL,
  retryWithBackoff,
} from "@/lib/signature-validation";
import { logAuditEvent, extractIpAddress, extractUserAgent } from "@/lib/audit-logging";
import { sendTenantSignedNotification } from "@/lib/email";
import { isValidLeaseStatusTransition, getTransitionErrorMessage } from "@/lib/lease-status-transitions";

type SignLeaseBody = {
  tenant_signature: string;
  signing_token: string;
};

/**
 * POST /api/tenant/leases/[leaseId]/sign
 * 
 * Allows tenant to sign a lease agreement via a secure signing link.
 * Validates the signing token, verifies lease status, and updates the lease
 * with the tenant's signature.
 * 
 * Requirements: 2.6, 2.7
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ leaseId: string }> }
) {
  const { leaseId } = await context.params;
  const supabase = await createClient();

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
  if (!body.tenant_signature || !body.signing_token) {
    return NextResponse.json(
      { error: "Missing required fields: tenant_signature and signing_token" },
      { status: 400 }
    );
  }

  // Verify signing token
  const tokenResult = verifySigningToken(body.signing_token);
  
  if (!tokenResult.valid || !tokenResult.payload) {
    return NextResponse.json(
      { error: tokenResult.error || "Invalid signing token" },
      { status: 401 }
    );
  }

  const { leaseId: tokenLeaseId, actorId: tokenTenantId, role: tokenRole } = tokenResult.payload;

  // Verify lease ID from token matches URL parameter
  if (tokenLeaseId !== leaseId) {
    return NextResponse.json(
      { error: "Lease ID mismatch" },
      { status: 403 }
    );
  }

  // Verify role
  if (tokenRole !== 'tenant') {
    return NextResponse.json(
      { error: "Unauthorized: Invalid role for this endpoint" },
      { status: 403 }
    );
  }

  // Fetch lease record
  const { data: lease, error: leaseError } = await supabase
    .from("leases")
    .select("id, status, tenant_id, landlord_id, landlord_signature")
    .eq("id", leaseId)
    .maybeSingle();

  if (leaseError) {
    console.error("[sign-lease] Database error:", leaseError);
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

  // Verify tenant ID from token matches lease tenant
  if (lease.tenant_id !== tokenTenantId) {
    return NextResponse.json(
      { error: "Unauthorized: Tenant ID mismatch" },
      { status: 403 }
    );
  }

  // Validate lease status
  if (lease.status !== "pending_signature" && lease.status !== "pending_tenant_signature") {
    return NextResponse.json(
      { error: `Cannot sign lease with status: ${lease.status}` },
      { status: 409 }
    );
  }

  // Validate status transition
  const newStatus = "pending_landlord_signature";
  if (!isValidLeaseStatusTransition(lease.status, newStatus)) {
    return NextResponse.json(
      { error: getTransitionErrorMessage(lease.status, newStatus) },
      { status: 409 }
    );
  }

  // Validate signature format and content
  const validation = await validateSignature(body.tenant_signature);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  // Sanitize signature data URL
  let sanitizedSignature: string;
  try {
    sanitizedSignature = sanitizeSignatureDataURL(body.tenant_signature);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid signature data URL format" },
      { status: 400 }
    );
  }

  // Update lease with tenant signature using optimistic locking
  const signedAt = new Date().toISOString();
  
  const updateLeaseWithRetry = async () => {
    // We use the admin client here to ensure system-level updates (status, lock version) 
    // succeed without RLS interference, since we've already securely verified the JWT token.
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    // Fetch current lock version
    const { data: currentLease, error: fetchError } = await adminClient
      .from("leases")
      .select("signature_lock_version")
      .eq("id", leaseId)
      .single();

    if (fetchError || !currentLease) {
      throw new Error(`Failed to fetch lease for optimistic locking: ${fetchError?.message}`);
    }

    const currentLockVersion = currentLease.signature_lock_version;

    // Update with optimistic lock
    const { error: updateError, data: updatedRows } = await adminClient
      .from("leases")
      .update({
        tenant_signature: sanitizedSignature,
        status: newStatus,
        tenant_signed_at: signedAt,
        updated_at: signedAt,
        signature_lock_version: currentLockVersion + 1,
      })
      .eq("id", leaseId)
      .eq("signature_lock_version", currentLockVersion)
      .select('id');

    if (updateError) {
      throw new Error(`Failed to update lease: ${updateError.message}`);
    }
    
    // If no rows were returned, the optimistic lock failed (or lease deleted)
    if (!updatedRows || updatedRows.length === 0) {
       throw new Error("Optimistic lock failure: lease was updated by another process.");
    }
  };

  try {
    await retryWithBackoff(updateLeaseWithRetry, 3, 1000);
  } catch (error) {
    console.error("[sign-lease] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update lease. Please try again." },
      { status: 500 }
    );
  }

  // Log audit event
  try {
    await logAuditEvent({
      leaseId,
      eventType: "tenant_signed",
      actorId: tokenTenantId,
      ipAddress: extractIpAddress(request),
      userAgent: extractUserAgent(request),
      metadata: {
        signing_mode: "remote",
        status_transition: `${lease.status} -> ${newStatus}`,
      },
    });
  } catch (auditError) {
    console.error("[sign-lease] Audit logging error:", auditError);
    // Non-blocking error, continue with response
  }

  // Send notification email to landlord
  try {
    // Generate landlord signing link
    const { generateLandlordSigningLink } = await import("@/lib/jwt");
    const landlordSigningUrl = generateLandlordSigningLink(leaseId, lease.landlord_id);

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    // Fetch landlord and tenant details for email using explicit aliases
    const { data: leaseWithRelations, error: relationError } = await adminClient
      .from("leases")
      .select(`
        id,
        unit_id,
        units (
          name,
          properties (name)
        ),
        tenant:profiles!leases_tenant_id_fkey (full_name, email),
        landlord:profiles!leases_landlord_id_fkey (full_name, email)
      `)
      .eq("id", leaseId)
      .single();

    if (!relationError && leaseWithRelations) {
      const landlordEmail = (leaseWithRelations.landlord as any)?.email;
      const landlordName = (leaseWithRelations.landlord as any)?.full_name || "Landlord";
      const tenantName = (leaseWithRelations.tenant as any)?.full_name || "The tenant";
      const propertyName = (leaseWithRelations.units as any)?.properties?.name || "The property";
      const unitName = (leaseWithRelations.units as any)?.name || "The unit";

      if (landlordEmail) {
        await sendTenantSignedNotification({
          to: landlordEmail,
          landlordName,
          tenantName,
          leaseId,
          signingUrl: landlordSigningUrl
        });
      }

      // Trigger real-time in-app notification
      await adminClient.from("notifications").insert({
        user_id: lease.landlord_id,
        type: "lease",
        title: "Tenant Signed Lease",
        message: `${tenantName} has signed the lease for ${propertyName} - ${unitName}. Please review and countersign.`,
        data: { leaseId, signingUrl: landlordSigningUrl },
        read: false
      });
    } else {
      console.error("[sign-lease] Failed to fetch relations for email:", relationError);
    }
  } catch (emailError) {
    console.error("[sign-lease] Email notification error:", emailError);
    // Non-blocking error, continue with response
  }

  return NextResponse.json({
    success: true,
    lease_status: "pending_landlord_signature",
    signed_at: signedAt,
  });
}
