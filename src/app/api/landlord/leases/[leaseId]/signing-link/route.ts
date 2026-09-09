import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import {
  LeaseService,
  LeaseNotFoundError,
  LeaseAccessError,
  LeaseSigningEligibilityError,
} from "@/lib/services/lease";
import { generateSigningLink } from "@/lib/jwt";

/**
 * POST /api/landlord/leases/[leaseId]/signing-link
 *
 * Generates a secure signing link for:
 * 1. Tenant: remote signing link to send via chat/email (pending_tenant_signature / pending_signature / draft)
 * 2. Landlord: countersigning link (pending_landlord_signature)
 *
 * Requirements: TC-LM-027, TC-LM-028
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ leaseId: string }> }
) {
  const { leaseId } = await context.params;
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId: landlordId, supabase } = authContext;

  try {
    // Check if role is explicitly requested
    const url = new URL(request.url);
    let requestedRole = url.searchParams.get("role");
    
    try {
      const body = await request.clone().json().catch(() => ({}));
      if (body?.role) requestedRole = body.role;
    } catch {
      // Body may be empty
    }

    // Fetch lease to determine eligibility and role
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("id, status, landlord_id, tenant_id")
      .eq("id", leaseId)
      .maybeSingle();

    if (leaseError) {
      throw new Error(`Failed to fetch lease: ${leaseError.message}`);
    }

    if (!lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    if (lease.landlord_id !== landlordId) {
      return NextResponse.json(
        { error: "Unauthorized: You are not the landlord for this lease" },
        { status: 403 }
      );
    }

    // Determine whether to generate Tenant or Landlord signing link
    const isTenantRequest =
      requestedRole === "tenant" ||
      (!requestedRole &&
        (lease.status === "pending_tenant_signature" ||
          lease.status === "pending_signature" ||
          lease.status === "draft"));

    if (isTenantRequest) {
      if (!lease.tenant_id) {
        return NextResponse.json(
          { error: "No tenant assigned to this lease to generate a signing link" },
          { status: 400 }
        );
      }

      const signingUrl = generateSigningLink(lease.id, lease.tenant_id);

      return NextResponse.json({
        success: true,
        signingUrl,
        leaseId: lease.id,
        role: "tenant",
        status: lease.status,
      });
    }

    // Default: Landlord countersign link
    const leaseService = new LeaseService(supabase);
    const result = await leaseService.generateLandlordSigningLink(landlordId, leaseId);

    return NextResponse.json({
      success: true,
      signingUrl: result.signingUrl,
      leaseId: result.leaseId,
      role: "landlord",
      status: result.status,
    });
  } catch (error) {
    if (error instanceof LeaseNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof LeaseAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof LeaseSigningEligibilityError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("[landlord-signing-link] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to generate signing link" },
      { status: 500 }
    );
  }
}
