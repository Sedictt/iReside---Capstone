import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { generateSigningToken } from "@/lib/jwt";

const AWAITING_TENANT_SIGNATURE = ["pending_signature", "pending_tenant_signature"] as const;

/**
 * GET /api/tenant/lease/signing-link
 *
 * Returns the signed-in tenant's lease that is still waiting for their signature,
 * with a fresh signing link, so the portal can send them to sign without relying
 * on the link from their approval email. Returns `{ lease: null }` when nothing
 * is awaiting their signature.
 */
export async function GET(request: Request) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  try {
    const { data: lease, error } = await supabase
      .from("leases")
      .select("id, unit:units(name, property:properties(name))")
      .eq("tenant_id", userId)
      .in("status", [...AWAITING_TENANT_SIGNATURE])
      .is("tenant_signature", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[tenant-signing-link] Lookup error:", error);
      return NextResponse.json({ error: "Failed to look up lease" }, { status: 500 });
    }

    if (!lease) {
      return NextResponse.json({ lease: null });
    }

    const unit = Array.isArray(lease.unit) ? lease.unit[0] : lease.unit;
    const property = unit?.property ? (Array.isArray(unit.property) ? unit.property[0] : unit.property) : null;
    const token = generateSigningToken(lease.id, userId, "tenant");

    return NextResponse.json({
      lease: {
        id: lease.id,
        propertyName: property?.name ?? null,
        unitName: unit?.name ?? null,
        signingUrl: `/signing/tenant/${lease.id}?token=${encodeURIComponent(token)}`,
      },
    });
  } catch (error) {
    console.error("[tenant-signing-link] Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
