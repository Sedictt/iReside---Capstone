import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  landlord_signature?: string;
  landlordSignature?: string;
  signing_token?: string;
  signingToken?: string;
  signed_pdf_base64?: string;
  signedPdfBase64?: string;
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
  const adminClient = createAdminClient();

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

  const signatureInput = body.landlord_signature || body.landlordSignature;
  const tokenInput = body.signing_token || body.signingToken;
  const pdfBase64Input = body.signed_pdf_base64 || body.signedPdfBase64;

  // Validate required fields
  if (!signatureInput) {
    return NextResponse.json(
      { error: "Missing required field: landlord_signature" },
      { status: 400 }
    );
  }

  let landlordId: string;

  // Handle token-based signing or session-based signing
  if (tokenInput) {
    const tokenResult = verifySigningToken(tokenInput);
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
    signResult = await leaseService.signLeaseAsLandlord(
      {
        leaseId,
        landlordId,
        signature: signatureInput,
      },
      adminClient,
    );
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

  // Fetch full lease details for notifications and document generation using adminClient
  let leaseDetails: any = null;
  let tenantProfile: any = null;
  let landlordProfile: any = null;
  
  try {
    const { data: leaseData, error: leaseFetchError } = await adminClient
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
            house_rules,
            contract_template,
            amenities
          )
        )
      `)
      .eq("id", leaseId)
      .single();

    if (!leaseFetchError && leaseData) {
      leaseDetails = leaseData;
      
      // Fetch tenant profile
      const { data: tProfile } = await adminClient
        .from("profiles")
        .select("email, full_name")
        .eq("id", leaseData.tenant_id)
        .single();
      if (tProfile) tenantProfile = tProfile;
      
      // Fetch landlord profile
      const { data: lProfile } = await adminClient
        .from("profiles")
        .select("email, full_name")
        .eq("id", leaseData.landlord_id)
        .single();
      if (lProfile) landlordProfile = lProfile;
    } else if (leaseFetchError) {
      console.error("[landlord-sign-lease] Lease fetch error:", leaseFetchError);
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

  // Store executed lease document in vault
  try {
    let arrayBuffer: ArrayBuffer | null = null;

    // 1. If high-fidelity signed PDF base64 is provided from the client, use it directly
    if (pdfBase64Input) {
      try {
        const buffer = Buffer.from(pdfBase64Input, "base64");
        arrayBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        );
      } catch (b64Err) {
        console.warn("[landlord-sign-lease] Failed to parse client signed PDF base64:", b64Err);
      }
    }

    // 2. Fallback: generate high-fidelity PDF with both signatures programmatically
    if (!arrayBuffer && leaseDetails) {
      const pdfBlob = await generateLeasePdf({
        id: leaseDetails.id,
        startDate: new Date(leaseDetails.start_date).toLocaleDateString(),
        endDate: new Date(leaseDetails.end_date).toLocaleDateString(),
        monthlyRent: leaseDetails.monthly_rent,
        securityDeposit: leaseDetails.security_deposit,
        property: (leaseDetails as any).units?.properties,
        unit: (leaseDetails as any).units,
        landlord: { 
          name: landlordProfile?.full_name || "Landlord", 
          email: landlordProfile?.email || ""
        },
        tenant: { 
          name: tenantProfile?.full_name || "Tenant", 
          email: tenantProfile?.email || ""
        },
        terms: leaseDetails.terms,
        tenantSignature: leaseDetails.tenant_signature,
        tenantSignedAt: leaseDetails.tenant_signed_at,
        landlordSignature: sanitizedSignature,
        landlordSignedAt: signedAt,
      });

      arrayBuffer = await pdfBlob.arrayBuffer();
    }

    if (arrayBuffer) {
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
        const { data: { publicUrl } } = adminClient
          .storage
          .from("landlord-documents")
          .getPublicUrl(fileName);

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
  }

  return NextResponse.json({
    success: true,
    lease_status: "active",
    signed_at: signedAt,
  });
}
