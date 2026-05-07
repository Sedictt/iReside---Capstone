import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSigningToken } from "@/lib/jwt";
import { hashToken } from "@/lib/jwt";
import { logAuditEvent } from "@/lib/audit-logging";
import { sendSigningLinkEmail } from "@/lib/email";

/**
 * POST /api/landlord/applications/[applicationId]/signing-link
 * 
 * Generates a secure signing link for a tenant to sign their lease remotely.
 * Creates a JWT token with 30-day expiration, stores the hash in the database,
 * and returns the full signing URL.
 * 
 * Requirements: 6.3, 6.4, 6.5, 6.6
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

  // Fetch application details first
  const { data: application, error: appError } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      applicant_id,
      lease_id
    `)
    .eq("id", applicationId)
    .maybeSingle();

  if (appError) {
    console.error("[signing-link] Database error:", appError);
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

  // Fetch applicant profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", application.applicant_id || "")
    .maybeSingle();

  // Fetch lease with unit and property details
  let lease: any = null;
  if (application.lease_id) {
    const { data: leaseData } = await supabase
      .from("leases")
      .select(`
        id,
        status,
        landlord_id,
        signing_link_token_hash,
        start_date,
        monthly_rent,
        security_deposit,
        units (
          name,
          properties (
            name,
            landlord_id
          )
        )
      `)
      .eq("id", application.lease_id)
      .maybeSingle();
    lease = leaseData;
  }

  // Verify landlord owns this application
  if (!lease || lease.landlord_id !== user.id) {
    return NextResponse.json(
      { error: "Unauthorized: You are not the landlord for this application" },
      { status: 403 }
    );
  }

  // Verify application is approved and has a lease
  if (application.status !== "approved") {
    return NextResponse.json(
      { error: `Cannot generate signing link for application with status: ${application.status}` },
      { status: 409 }
    );
  }

  if (!application.lease_id || !lease) {
    return NextResponse.json(
      { error: "Application does not have an associated lease" },
      { status: 409 }
    );
  }

  // Verify lease is in correct status
  if (lease.status !== "pending_signature" && lease.status !== "pending_tenant_signature") {
    return NextResponse.json(
      { error: `Lease is not ready for signing. Current status: ${lease.status}` },
      { status: 409 }
    );
  }

  // Generate JWT signing token
  const tenantEmail = profile?.email;
  if (!tenantEmail) {
    return NextResponse.json(
      { error: "Tenant email not found" },
      { status: 500 }
    );
  }

  const token = generateSigningToken(application.lease_id, application.applicant_id || "");
  const tokenHash = hashToken(token);

  // Update lease with token hash, signing mode, and status
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
    console.error("[signing-link] Update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update lease with signing link" },
      { status: 500 }
    );
  }

  // Generate signing URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const signingUrl = `${baseUrl}/tenant/sign-lease/${application.lease_id}?token=${token}`;

  // Send signing link email to tenant
  const propertyName = lease?.units?.properties?.name || "Property";
  const unitName = lease?.units?.name || "Unit";
  const rentAmount = lease?.monthly_rent || 0;
  const depositAmount = lease?.security_deposit || 0;
  const tenantName = profile?.full_name || "Tenant";
  
  // Fetch landlord profile separately
  let landlordName = "Landlord";
  let landlordEmail = "";
  if (lease?.landlord_id) {
    const { data: landlordProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", lease.landlord_id)
      .maybeSingle();
    if (landlordProfile && !('error' in landlordProfile)) {
      landlordName = landlordProfile.full_name || "Landlord";
      landlordEmail = landlordProfile.email || "";
    }
  }
  
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
    console.error("[signing-link] Email sending error:", emailError);
    // Continue with response even if email fails - link will be returned for manual sharing
  }

  // Log audit event
  try {
    await logAuditEvent({
      leaseId: application.lease_id,
      eventType: "signing_link_generated",
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
    console.error("[signing-link] Audit logging error:", auditError);
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
