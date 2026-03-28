import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSigningToken } from "@/lib/jwt";
import { hashToken } from "@/lib/jwt";
import { logAuditEvent } from "@/lib/audit-logging";
import { sendSigningLinkEmail } from "@/lib/email";

/**
 * POST /api/landlord/applications/[applicationId]/signing-link/regenerate
 * 
 * Regenerates a signing link for a tenant. Invalidates the previous token
 * and generates a new one with a fresh 30-day expiration.
 * 
 * Requirements: 13.5, 13.6, 13.8
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ applicationId: string }> }
) {
  const { applicationId } = await context.params;
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Fetch application with lease and tenant details
  const { data: application, error: appError } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      tenant_id,
      lease_id,
      profiles!applications_tenant_id_fkey (
        email,
        full_name
      ),
      leases!applications_lease_id_fkey (
        id,
        status,
        landlord_id,
        signing_link_token_hash,
        start_date,
        monthly_rent,
        security_deposit,
        units!leases_unit_id_fkey (
          name,
          properties!units_property_id_fkey (
            name,
            landlord_id,
            profiles!properties_landlord_id_fkey (
              email,
              full_name
            )
          )
        )
      )
    `)
    .eq("id", applicationId)
    .maybeSingle();

  if (appError) {
    console.error("[regenerate-signing-link] Database error:", appError);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }

  if (!application) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  }

  // Verify landlord owns this application
  if (application.leases?.landlord_id !== user.id) {
    return NextResponse.json(
      { error: "Unauthorized: You are not the landlord for this application" },
      { status: 403 }
    );
  }

  // Verify application is approved and has a lease
  if (application.status !== "approved") {
    return NextResponse.json(
      { error: `Cannot regenerate signing link for application with status: ${application.status}` },
      { status: 409 }
    );
  }

  if (!application.lease_id || !application.leases) {
    return NextResponse.json(
      { error: "Application does not have an associated lease" },
      { status: 409 }
    );
  }

  // Verify lease is in correct status
  if (application.leases.status !== "pending_signature" && application.leases.status !== "pending_tenant_signature") {
    return NextResponse.json(
      { error: `Cannot regenerate signing link for lease with status: ${application.leases.status}` },
      { status: 409 }
    );
  }

  // Generate new JWT signing token
  const tenantEmail = application.profiles?.email;
  if (!tenantEmail) {
    return NextResponse.json(
      { error: "Tenant email not found" },
      { status: 500 }
    );
  }

  const tokenPayload = {
    leaseId: application.lease_id,
    tenantId: application.tenant_id,
    tenantEmail,
  };

  const token = generateSigningToken(tokenPayload);
  const tokenHash = hashToken(token);

  // Update lease with new token hash (invalidates previous token)
  const { error: updateError } = await supabase
    .from("leases")
    .update({
      signing_link_token_hash: tokenHash,
      signing_mode: "remote",
      status: "pending_tenant_signature",
      updated_at: new Date().toISOString(),
    })
    .eq("id", application.lease_id);

  if (updateError) {
    console.error("[regenerate-signing-link] Update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update lease with new signing link" },
      { status: 500 }
    );
  }

  // Generate signing URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const signingUrl = `${baseUrl}/tenant/sign-lease/${application.lease_id}?token=${token}`;

  // Send signing link email to tenant
  const propertyName = application.leases?.units?.properties?.name || "Property";
  const unitName = application.leases?.units?.name || "Unit";
  const rentAmount = application.leases?.monthly_rent || 0;
  const depositAmount = application.leases?.security_deposit || 0;
  const landlordName = application.leases?.units?.properties?.profiles?.full_name || "Landlord";
  const landlordEmail = application.leases?.units?.properties?.profiles?.email || "";
  const tenantName = application.profiles?.full_name || "Tenant";
  
  // Token expires in 30 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  let emailSent = false;
  try {
    await sendSigningLinkEmail({
      to: tenantEmail,
      tenantName,
      signingUrl,
      propertyName,
      unitName,
      rentAmount,
      depositAmount,
      landlordName,
      landlordEmail,
      expiresAt,
    });
    emailSent = true;
  } catch (emailError) {
    console.error("[regenerate-signing-link] Email sending error:", emailError);
    // Continue with response even if email fails - link will be returned for manual sharing
  }

  // Log audit event for link regeneration
  try {
    await logAuditEvent({
      leaseId: application.lease_id,
      eventType: "signing_link_regenerated",
      actorId: user.id,
      metadata: {
        application_id: applicationId,
        tenant_email: tenantEmail,
        signing_mode: "remote",
        email_sent: emailSent,
        expires_at: expiresAt.toISOString(),
      },
    });
  } catch (auditError) {
    console.error("[regenerate-signing-link] Audit logging error:", auditError);
    // Non-blocking error, continue with response
  }

  return NextResponse.json({
    success: true,
    signing_url: signingUrl,
    lease_id: application.lease_id,
    tenant_email: tenantEmail,
    expires_at: expiresAt.toISOString(),
    email_sent: emailSent,
  });
}
