import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { databaseErrorResponse, parseJsonBody } from "@/lib/validation/server";
import {
  LEASE_YEAR_MAX_DATE,
  LEASE_YEAR_MIN_DATE,
  isId,
  leaseEndDateRule,
} from "@/lib/validation/schemas/tenant-lifecycle.schema";
import { zIsoDate } from "@/lib/validation/zod-fields";

/**
 * PATCH /api/landlord/leases/[leaseId]/term
 *
 * Switches a lease between open-ended (month-to-month, no end date) and a
 * fixed term (dated end). Landlord-only; the lease must belong to the caller
 * and still be live (active or awaiting signatures). Expired/terminated
 * leases are immutable here.
 *
 * Body:
 *   { term_type: "open_ended" }                 -> end_date cleared
 *   { term_type: "fixed", end_date: "YYYY-MM-DD" } -> end_date must be after start_date
 */

const leaseTermUpdateSchema = z.discriminatedUnion(
  "term_type",
  [
    z.object({ term_type: z.literal("open_ended") }),
    z.object({
      term_type: z.literal("fixed"),
      end_date: zIsoDate("Lease end date", { min: LEASE_YEAR_MIN_DATE, max: LEASE_YEAR_MAX_DATE }),
    }),
  ],
  { error: "Lease term must be open-ended or fixed." },
);

/** Statuses whose term may still be edited. */
const EDITABLE_LEASE_STATUSES = [
  "draft",
  "pending_signature",
  "pending_tenant_signature",
  "pending_landlord_signature",
  "active",
] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ leaseId: string }> },
) {
  const { leaseId } = await context.params;
  if (!isId(leaseId)) {
    return NextResponse.json({ error: "Lease not found" }, { status: 404 });
  }

  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, userRole, supabase } = authContext;

  if (userRole !== "landlord") {
    return NextResponse.json({ error: "Only landlords can change a lease term." }, { status: 403 });
  }

  const parsed = await parseJsonBody(request, leaseTermUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const { data: lease, error: leaseError } = await supabase
    .from("leases")
    .select("id, landlord_id, status, start_date, end_date, term_type")
    .eq("id", leaseId)
    .maybeSingle();

  if (leaseError) {
    console.error("[lease-term] Failed to load lease:", leaseError);
    return NextResponse.json({ error: "Failed to load lease." }, { status: 500 });
  }

  // Not found and not-owned are indistinguishable to the caller.
  if (!lease || lease.landlord_id !== userId) {
    return NextResponse.json({ error: "Lease not found" }, { status: 404 });
  }

  if (!(EDITABLE_LEASE_STATUSES as readonly string[]).includes(lease.status)) {
    return NextResponse.json(
      { error: `The term of a ${lease.status} lease cannot be changed.` },
      { status: 409 },
    );
  }

  let update: { term_type: "open_ended" | "fixed"; end_date: string | null };
  if (body.term_type === "fixed") {
    const problem = leaseEndDateRule(body.end_date, lease.start_date);
    if (problem) {
      return NextResponse.json({ error: problem, fieldErrors: { end_date: problem } }, { status: 400 });
    }
    update = { term_type: "fixed", end_date: body.end_date };
  } else {
    // An approved move-out date is not a term; keep it so "Moving out on X" survives the switch.
    const { data: approvedMoveOut } = await supabase
      .from("move_out_requests")
      .select("requested_date")
      .eq("lease_id", leaseId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    update = { term_type: "open_ended", end_date: approvedMoveOut?.requested_date ?? null };
  }

  const { data: updated, error: updateError } = await supabase
    .from("leases")
    .update(update)
    .eq("id", leaseId)
    .eq("landlord_id", userId)
    .select()
    .single();

  if (updateError) {
    console.error("[lease-term] Failed to update lease term:", updateError);
    return databaseErrorResponse(updateError, "Failed to update lease term.");
  }

  return NextResponse.json({ success: true, lease: updated });
}
