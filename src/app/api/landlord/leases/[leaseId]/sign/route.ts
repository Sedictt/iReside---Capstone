import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { logAuditEvent, extractIpAddress, extractUserAgent } from "@/lib/audit-logging";
import { sendLeaseActivatedNotification } from "@/lib/email";
import { verifySigningToken } from "@/lib/jwt";
import { generateLeasePdf } from "@/lib/lease-pdf";
import {
  LeaseService,
  LeaseNotFoundError,
  LeaseAccessError,
  InvalidLeaseTransitionError,
  LeaseSigningEligibilityError,
} from "@/lib/services/lease";

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
    // Get authenticated user via auth guard
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    landlordId = authContext.userId;
  }

  const leaseService = new LeaseService(supabase);
  let signResult: { signedAt: string; sanitizedSignature: string };

  try {
    signResult = await leaseService.signLeaseAsLandlord({
      leaseId,
      landlordId,
      signature: body.landlord_signature,
    });
  } catch (error) {
    if (error instanceof LeaseNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof LeaseAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof InvalidLeaseTransitionError || error instanceof LeaseSigningEligibilityError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("[landlord-sign-lease] Signing error:", error);
    return NextResponse.json(
      { error: "Failed to update lease. Please try again." },
      { status: 500 }
    );
  }

  const signedAt = signResult.signedAt;
  const sanitizedSignature = signResult.sanitizedSignature;

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
        status_transition: "pending_landlord_signature -> active",
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
        status_transition: "pending_landlord_signature -> active",
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
