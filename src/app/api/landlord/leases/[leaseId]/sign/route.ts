import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSignature, sanitizeSignatureDataURL, retryWithBackoff } from "@/lib/signature-validation";
import { logAuditEvent, extractIpAddress, extractUserAgent } from "@/lib/audit-logging";
import { sendLeaseActivatedNotification } from "@/lib/email";
import { isValidLeaseStatusTransition, getTransitionErrorMessage } from "@/lib/lease-status-transitions";
import { verifySigningToken } from "@/lib/jwt";
import { generateLeasePdf } from "@/lib/lease-pdf";

type SignLeaseBody = {
  landlord_signature: string;
  signing_token?: string;
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

  let landlordId: string;

  // Handle token-based signing or session-based signing
  if (body.signing_token) {
    const tokenResult = verifySigningToken(body.signing_token);
    if (!tokenResult.valid || !tokenResult.payload) {
      return NextResponse.json(
        { error: tokenResult.error || "Invalid signing token" },
        { status: 401 }
      );
    }

    if (tokenResult.payload.leaseId !== leaseId || tokenResult.payload.role !== 'landlord') {
      return NextResponse.json(
        { error: "Unauthorized: Token mismatch" },
        { status: 403 }
      );
    }
    landlordId = tokenResult.payload.actorId;
  } else {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    landlordId = user.id;
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

  // Verify landlord ID matches
  if (lease.landlord_id !== landlordId) {
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
  
  const updateLeaseAndApplication = async () => {
    // Use admin client for system-level updates
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    // 1. Update lease
    const { data: currentLease, error: fetchError } = await adminClient
      .from("leases")
      .select("signature_lock_version")
      .eq("id", leaseId)
      .single();

    if (fetchError || !currentLease) {
      throw new Error(`Failed to fetch lease for optimistic locking: ${fetchError?.message}`);
    }

    const currentLockVersion = currentLease.signature_lock_version;

    const { error: updateLeaseError, data: updatedRows } = await adminClient
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
      .eq("signature_lock_version", currentLockVersion)
      .select('id');

    if (updateLeaseError) {
      throw new Error(`Failed to update lease: ${updateLeaseError.message}`);
    }
    
    if (!updatedRows || updatedRows.length === 0) {
       throw new Error("Optimistic lock failure: lease was updated by another process.");
    }

    // 2. Update associated application
    const { data: application, error: appFetchError } = await adminClient
      .from("applications")
      .select("id, compliance_checklist")
      .eq("lease_id", leaseId)
      .maybeSingle();

    if (!appFetchError && application) {
      const updatedChecklist = {
        ...(application.compliance_checklist as Record<string, unknown>),
        lease_signed: true,
        application_completed: true
      };

      await adminClient
        .from("applications")
        .update({
          status: "approved",
          compliance_checklist: updatedChecklist,
          updated_at: signedAt
        })
        .eq("id", application.id);
    }
  };

  try {
    await retryWithBackoff(updateLeaseAndApplication, 3, 1000);
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
      actorId: landlordId,
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
  }

  // Log lease activation event
  try {
    await logAuditEvent({
      leaseId,
      eventType: "lease_activated",
      actorId: landlordId,
      ipAddress: extractIpAddress(request),
      userAgent: extractUserAgent(request),
      metadata: {
        signed_at: signedAt,
        status_transition: `${lease.status} -> ${newStatus}`,
      },
    });
  } catch (auditError) {
    console.error("[landlord-sign-lease] Lease activation audit error:", auditError);
  }

  // Fetch full lease details for notifications and document generation
  let leaseDetails: any = null;
  let tenantProfile: any = null;
  let landlordProfile: any = null;
  
  try {
    const { data: leaseData } = await supabase
      .from("leases")
      .select(`
        id,
        start_date,
        end_date,
        monthly_rent,
        security_deposit,
        terms,
        tenant_id,
        landlord_id,
        tenant_signature,
        tenant_signed_at,
        landlord_signature,
        landlord_signed_at,
        units (
          id,
          name,
          properties (
            id,
            name,
            address,
            house_rules
          )
        )
      `)
      .eq("id", leaseId)
      .single();

    if (leaseData && !('error' in leaseData)) {
      leaseDetails = leaseData;
      
      // Fetch tenant profile
      const { data: tProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", leaseData.tenant_id)
        .single();
      if (tProfile) tenantProfile = tProfile;
      
      // Fetch landlord profile
      const { data: lProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", leaseData.landlord_id)
        .single();
      if (lProfile) landlordProfile = lProfile;
    }
  } catch (fetchError) {
    console.error("[landlord-sign-lease] Fetch details error:", fetchError);
  }

  // Send confirmation email to tenant
  try {
    if (leaseDetails && tenantProfile) {
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
  }

  // Send system notification to landlord about successful activation
  try {
    if (landlordId && leaseDetails) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminClient = createAdminClient();
      
      const tenantName = tenantProfile?.full_name || "Tenant";
      const propertyName = (leaseDetails as any).units?.properties?.name || "Property";
      const unitName = (leaseDetails as any).units?.name || "Unit";
      
      await adminClient.from("notifications").insert({
        user_id: landlordId,
        type: "lease",
        title: "Lease Activated",
        message: `The lease for ${propertyName} - ${unitName} with ${tenantName} has been successfully activated. Both parties have signed the agreement.`,
        data: { leaseId, status: "active" },
        read: false
      });
    }
  } catch (notificationError) {
    console.error("[landlord-sign-lease] Landlord notification error:", notificationError);
  }

  // Generate and store signed lease document in vault
  try {
    if (leaseDetails && tenantProfile && landlordProfile) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminClient = createAdminClient();
      
      // Generate the signed PDF
      const pdfBlob = await generateLeasePdf({
        id: leaseDetails.id,
        startDate: new Date(leaseDetails.start_date).toLocaleDateString(),
        endDate: new Date(leaseDetails.end_date).toLocaleDateString(),
        monthlyRent: leaseDetails.monthly_rent,
        securityDeposit: leaseDetails.security_deposit,
        property: (leaseDetails as any).units?.properties,
        unit: (leaseDetails as any).units,
        landlord: { 
          name: landlordProfile.full_name || "Landlord", 
          email: landlordProfile.email 
        },
        tenant: { 
          name: tenantProfile.full_name || "Tenant", 
          email: tenantProfile.email 
        },
        terms: leaseDetails.terms,
        tenantSignature: leaseDetails.tenant_signature,
        tenantSignedAt: leaseDetails.tenant_signed_at,
        landlordSignature: sanitizedSignature,
        landlordSignedAt: signedAt,
      });

      // Convert blob to array buffer for upload
      const arrayBuffer = await pdfBlob.arrayBuffer();
      
      // Upload to storage bucket
      const fileName = `leases/${landlordId}/${leaseId}/signed-lease-${Date.now()}.pdf`;
      const { error: uploadError } = await adminClient
        .storage
        .from("landlord-documents")
        .upload(fileName, arrayBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        console.error("[landlord-sign-lease] Document upload error:", uploadError);
      } else {
        // Get public URL
        const { data: { publicUrl } } = adminClient
          .storage
          .from("landlord-documents")
          .getPublicUrl(fileName);

        // Update lease record with signed document URL and path
        await adminClient
          .from("leases")
          .update({
            signed_document_url: publicUrl,
            signed_document_path: fileName,
            updated_at: signedAt,
          })
          .eq("id", leaseId);

        console.log("[landlord-sign-lease] Signed document stored in vault:", publicUrl);
      }
    }
  } catch (docError) {
    console.error("[landlord-sign-lease] Document generation/storage error:", docError);
    // Non-blocking - lease is still activated even if document storage fails
  }

  return NextResponse.json({
    success: true,
    lease_status: "active",
    signed_at: signedAt,
  });
}
