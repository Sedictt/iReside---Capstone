import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
      lease_id,
      unit_id,
      applicant_email,
      applicant_name,
      unit:units(name, property_id, properties(id, name, landlord_id, contract_template))
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

  // 1. REPAIR applicant_id if missing
  let currentApplicantId = application.applicant_id;
  if (!currentApplicantId && application.applicant_email) {
    console.log(`[signing-link] Missing applicant_id. Searching for profile with email: ${application.applicant_email}`);
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", application.applicant_email)
      .maybeSingle();
      
    if (existingProfile) {
      console.log(`[signing-link] Found existing profile ${existingProfile.id}, linking to application...`);
      currentApplicantId = existingProfile.id;
      await supabase
        .from("applications")
        .update({ applicant_id: existingProfile.id })
        .eq("id", applicationId);
    } else {
      // Create tenant account automatically if it doesn't exist
      console.log(`[signing-link] No profile found for ${application.applicant_email}. Provisioning account...`);
      const adminClient = createAdminClient();
      const tempPassword = Math.random().toString(36).slice(-12);
      
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: application.applicant_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: application.applicant_name || "Tenant",
          role: "tenant",
          onboarding_source: "signing_link_repair",
        }
      });
      
      if (!createError && newUser?.user) {
        console.log(`[signing-link] Provisioned new tenant account ${newUser.user.id}`);
        currentApplicantId = newUser.user.id;
        
        await adminClient.from("profiles").upsert({
          id: newUser.user.id,
          full_name: application.applicant_name || "Tenant",
          email: application.applicant_email,
          role: "tenant",
        });
        
        await adminClient
          .from("applications")
          .update({ applicant_id: newUser.user.id })
          .eq("id", applicationId);
      } else {
        console.error("[signing-link] Failed to provision tenant account:", createError?.message);
      }
    }
  }

  // Fetch lease with unit and property details
  let lease: any = null;
  if (application.lease_id) {
    const { data: leaseData } = await supabase
      .from("leases")
      .select(`
        id,
        status,
        landlord_id,
        tenant_id,
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
  } else {
    // FALLBACK: Try to find a lease that was created but not linked to this application
    console.log(`[signing-link] Fallback: Searching for unlinked lease for application ${applicationId}`);
    
    let foundLeaseQuery = supabase
      .from("leases")
      .select(`
        id,
        status,
        landlord_id,
        tenant_id,
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
      .eq("status", "pending_signature");

    // Try to narrow down by tenant if we have one
    if (currentApplicantId) {
      foundLeaseQuery = foundLeaseQuery.eq("tenant_id", currentApplicantId);
    } else {
      // Otherwise narrow by unit
      foundLeaseQuery = foundLeaseQuery.eq("unit_id", (application as any).unit_id || "");
    }

    const { data: foundLease } = await foundLeaseQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (foundLease) {
      console.log(`[signing-link] Found unlinked lease ${foundLease.id}, linking now...`);
      lease = foundLease;
      
      // Repair the link
      const repairPayload = { lease_id: foundLease.id } as any;
      const { error: repairError } = await supabase
        .from("applications")
        .update(repairPayload)
        .eq("id", applicationId);
        
      if (repairError) {
        console.error("[signing-link] Failed to repair lease_id link:", repairError);
      } else {
        application.lease_id = foundLease.id;
      }
    }
  }

  // Determine the tenant ID to use
  const tenantId = currentApplicantId || lease?.tenant_id;

  if (!tenantId) {
    return NextResponse.json(
      { error: "Tenant ID not found for this application or lease" },
      { status: 400 }
    );
  }

  // Fetch applicant profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", tenantId)
    .maybeSingle();

  // 2. HARDCODED ACTIVATION BYPASS (per user request)
  // This allows manual activation of specific problematic leases
  const TARGET_LEASE_ID = "40675cbc-7d65-4b21-bedb-70112380d3ab";
  const TARGET_TENANT_ID = "804d8f41-635b-4766-abf6-67d8b8b5ad43";
  
  if (application.lease_id === TARGET_LEASE_ID || lease?.id === TARGET_LEASE_ID) {
    console.log(`[signing-link] TARGET MATCH: Force activating lease ${TARGET_LEASE_ID}`);
    const adminClient = createAdminClient();
    
    // Force update lease to active
    await adminClient.from("leases").update({
      status: "active",
      tenant_id: TARGET_TENANT_ID,
      tenant_signed_at: new Date().toISOString(),
      landlord_signed_at: new Date().toISOString(),
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq("id", TARGET_LEASE_ID);

    // Force update application
    const appUpdatePayload = {
      status: "approved",
      lease_id: TARGET_LEASE_ID,
      applicant_id: TARGET_TENANT_ID
    } as any;
    await adminClient.from("applications" as any).update(appUpdatePayload).eq("id", applicationId);

    return NextResponse.json({
      success: true,
      message: "Lease has been manually activated via bypass.",
      lease_id: TARGET_LEASE_ID,
      status: "active"
    });
  }

  const hadLeaseInitially = !!lease;

  // If no lease exists, create one automatically
  if (!lease) {
    console.log(`[signing-link] No lease found for application ${applicationId}. Creating one...`);
    const adminClient = createAdminClient();
    const unit = (application as any).unit as any;
    const property = unit?.property || unit?.properties as any;
    const contractTemplate = property?.contract_template || {};

    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 12);

    // Use default values since financial data isn't stored in applications table
    const monthlyRent = 0; // Will be updated later if needed
    const securityDeposit = 0; // Will be updated later if needed

    const { data: newLease, error: leaseCreateError } = await adminClient
      .from("leases")
      .insert({
        unit_id: application.unit_id,
        tenant_id: tenantId,
        landlord_id: user.id,
        status: "pending_signature",
        start_date: startDate,
        end_date: endDate.toISOString().split('T')[0],
        monthly_rent: monthlyRent,
        security_deposit: securityDeposit,
        terms: contractTemplate,
        landlord_signature: `auto-${Date.now()}`,
      })
      .select(`
        id,
        status,
        landlord_id,
        tenant_id,
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
      .single();

    if (leaseCreateError || !newLease) {
      console.error("[signing-link] Lease creation failed:", leaseCreateError);
      return NextResponse.json(
        { error: "Failed to create lease record. Please try again." },
        { status: 500 }
      );
    }

    lease = newLease;
    console.log(`[signing-link] Created lease ${newLease.id} for application ${applicationId}`);

    // Link lease to application
    const linkPayload = { lease_id: newLease.id } as any;
    const { error: linkError } = await adminClient
      .from("applications" as any)
      .update(linkPayload)
      .eq("id", applicationId);

    if (linkError) {
      console.error("[signing-link] Failed to link lease to application:", linkError);
    } else {
      application.lease_id = newLease.id;
    }
  }

  // Verify landlord owns this application
  if (lease.landlord_id !== user.id) {
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

  const token = generateSigningToken(application.lease_id!, tenantId, 'tenant');
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
    .eq("id", application.lease_id!);

  if (updateError) {
    console.error("[signing-link] Update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update lease with signing link" },
      { status: 500 }
    );
  }

  // Generate signing URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const signingUrl = `${baseUrl}/signing/tenant/${application.lease_id}?token=${token}`;

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
      leaseId: application.lease_id!,
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
    lease_created: !hadLeaseInitially,
  });
}
