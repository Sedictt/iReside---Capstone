import { NextResponse } from "next/server";
import { createMultiMonthAdvancePayment } from "@/lib/billing/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { parseJsonBody } from "@/lib/validation/server";
import { advancePaymentSchema } from "@/lib/validation/schemas/billing.schema";

export async function POST(request: Request) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  let targetMonth: string | undefined;
  let monthsCount = 1;

  const contentType = request.headers.get("content-type") || "";

  // The body is optional (the Finance Hub posts without one); when JSON is sent it must be valid.
  if (contentType.includes("application/json")) {
    const parsed = await parseJsonBody(request, advancePaymentSchema);
    if (!parsed.ok) return parsed.response;
    targetMonth = parsed.data.targetMonth;
    monthsCount = parsed.data.monthsCount;
  }

  try {
    const result = await createMultiMonthAdvancePayment(supabase, userId, {
      targetMonth,
      monthsCount,
    });

    // Return with explicit id for backward compatibility with frontend
    const response = {
      ...result,
      id: result.invoices?.[0]?.invoiceId || null,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Error creating advance payment:", error);

    const message = error instanceof Error ? error.message : "";
    if (message === "No active lease found for advance payment.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    // Never leak stack traces or raw database errors to the client.
    return NextResponse.json({ error: "Failed to create advance payment" }, { status: 500 });
  }
}
