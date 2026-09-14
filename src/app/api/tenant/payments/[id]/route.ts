import { NextResponse } from "next/server";
import { expireInPersonIntents } from "@/lib/billing/workflow";
import { getInvoiceDetailForActor } from "@/lib/billing/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId } = authContext;
  const adminClient = createServiceRoleSupabaseClient();

  try {
    // Parallelize: expireInPersonIntents and getInvoiceDetailForActor are independent.
    // Using adminClient avoids restrictive RLS joining issues on landlord/unit/property tables,
    // while explicitly enforcing tenant isolation through actor.tenantId.
    const [_, invoice] = await Promise.all([
      expireInPersonIntents(adminClient, userId, { tenantId: userId, paymentId: id }),
      getInvoiceDetailForActor(adminClient, id, { tenantId: userId }),
    ]);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Failed to load tenant invoice:", error);
    return NextResponse.json({ error: "Failed to load invoice." }, { status: 500 });
  }
}

