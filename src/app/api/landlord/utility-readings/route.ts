import { NextResponse } from "next/server";
import { BILLING_BUCKETS, uploadBillingFile } from "@/lib/billing/storage";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { BillingService } from "@/lib/services/payment";
import { PaymentError } from "@/lib/services/payment/payment.errors";
import { databaseErrorResponse, parseWithSchema } from "@/lib/validation/server";
import {
  PROOF_LIMITS,
  billingMonthRule,
  isUuid,
  proofFileRule, proofContentRule,
  utilityReadingBulkSchema,
  utilityReadingSchema,
  type UtilityReadingInput,
} from "@/lib/validation/schemas/billing.schema";

export const dynamic = "force-dynamic";

function badRequest(message: string, fieldErrors: Record<string, string> = {}) {
  return NextResponse.json({ error: message, fieldErrors }, { status: 400 });
}

/** Service errors carry safe, user-facing messages and their own status; anything else is generic. */
function readingErrorResponse(error: unknown) {
  if (error instanceof PaymentError) {
    return NextResponse.json({ error: error.message }, { status: error.httpStatus });
  }
  const code = (error as { code?: string } | null)?.code;
  if (code === "23514") {
    return badRequest("Check the readings: the current reading must not be lower than the previous one and the period end must not be before its start.");
  }
  if (code) return databaseErrorResponse(error as { code?: string }, "Failed to record utility reading.");
  return NextResponse.json({ error: "Failed to record utility reading." }, { status: 500 });
}

export async function POST(request: Request) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;
  const billingService = new BillingService(supabase);

  const contentType = request.headers.get("content-type") ?? "";
  const { searchParams } = new URL(request.url);
  const postInvoicesParam = searchParams.get("postInvoices") === "true";
  const monthParam = searchParams.get("month") ?? undefined;
  const monthParamError = billingMonthRule(monthParam, { label: "Month" });
  if (monthParamError) return badRequest(monthParamError, { month: monthParamError });

  if (contentType.includes("application/json")) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }

    const isBulk = Array.isArray(body) || (!!body && typeof body === "object" && Array.isArray((body as { readings?: unknown }).readings));

    if (!isBulk) {
      const parsed = parseWithSchema(utilityReadingSchema, body);
      if (!parsed.ok) return parsed.response;
      const payload = parsed.data;

      try {
        const reading = await billingService.recordUtilityReading(userId, toServiceInput(payload));

        let invoiceResult = null;
        if (postInvoicesParam) {
          const { generateMonthlyInvoices } = await import("@/lib/billing/server");
          const month = monthParam || payload.billingPeriodStart.slice(0, 7);
          invoiceResult = await generateMonthlyInvoices(supabase, userId, month, [reading.lease_id || payload.leaseId]);
        }

        return NextResponse.json({ reading, invoiceResult });
      } catch (error) {
        console.error("Failed to record utility reading:", error);
        return readingErrorResponse(error);
      }
    }

    const parsed = parseWithSchema(utilityReadingBulkSchema, Array.isArray(body) ? { readings: body } : body);
    if (!parsed.ok) return parsed.response;
    const { readings } = parsed.data;
    const shouldPostInvoices = parsed.data.postInvoices ?? postInvoicesParam;
    const specifiedMonth = parsed.data.month ?? monthParam;

    try {
      const results = [];
      for (const payload of readings) {
        const reading = await billingService.recordUtilityReading(userId, toServiceInput(payload));
        results.push(reading);
      }

      let invoiceResult = null;
      if (shouldPostInvoices && results.length > 0) {
        const { generateMonthlyInvoices } = await import("@/lib/billing/server");
        const month = specifiedMonth || readings[0]?.billingPeriodStart?.slice(0, 7);
        const leaseIds = Array.from(
          new Set(results.map((r) => r.lease_id).filter((id): id is string => isUuid(id))),
        );
        invoiceResult = await generateMonthlyInvoices(supabase, userId, month, leaseIds);
      }

      return NextResponse.json({ readings: results, invoiceResult });
    } catch (error) {
      console.error("Failed to record utility readings:", error);
      return readingErrorResponse(error);
    }
  }

  // Fallback to FormData (for single reading with proof image)
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return badRequest("Request body is invalid.");
  }

  const parsed = parseWithSchema(utilityReadingSchema, {
    leaseId: formData.get("leaseId"),
    unitId: formData.get("unitId"),
    utilityType: formData.get("utilityType"),
    billingPeriodStart: formData.get("billingPeriodStart"),
    billingPeriodEnd: formData.get("billingPeriodEnd"),
    previousReading: formData.get("previousReading"),
    currentReading: formData.get("currentReading"),
    note: formData.get("note"),
  });
  if (!parsed.ok) return parsed.response;
  const payload = parsed.data;

  const proofEntry = formData.get("proof");
  const proof = proofEntry instanceof File && proofEntry.size > 0 ? proofEntry : null;
  const proofError = proofFileRule(proof, { label: "Reading proof", maxBytes: PROOF_LIMITS.readingProofMaxBytes }) ?? (await proofContentRule(proof, { label: "Reading proof" }));
  if (proofError) return badRequest(proofError, { proof: proofError });

  try {
    const proofUpload = proof
      ? await uploadBillingFile({
          bucketName: BILLING_BUCKETS.readingProofs,
          ownerId: userId,
          // Never build storage paths from free-form input.
          scope: isUuid(payload.leaseId) ? payload.leaseId : "unassigned",
          file: proof,
        })
      : null;

    const reading = await billingService.recordUtilityReading(userId, {
      ...toServiceInput(payload),
      proofImagePath: proofUpload?.path ?? null,
      proofImageUrl: proofUpload?.publicUrl ?? null,
    });

    return NextResponse.json({ reading });
  } catch (error) {
    console.error("Failed to record utility reading:", error);
    return readingErrorResponse(error);
  }
}

function toServiceInput(payload: UtilityReadingInput) {
  return {
    leaseId: payload.leaseId,
    unitId: payload.unitId ?? null,
    utilityType: payload.utilityType,
    billingPeriodStart: payload.billingPeriodStart,
    billingPeriodEnd: payload.billingPeriodEnd,
    previousReading: payload.previousReading,
    currentReading: payload.currentReading,
    note: payload.note ?? null,
  };
}

export async function GET(request: Request) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const leaseId = searchParams.get("leaseId");
  const month = searchParams.get("month"); // YYYY-MM

  try {
    let query = supabase
      .from("utility_readings")
      .select("*")
      .eq("landlord_id", userId);

    if (propertyId) {
      query = query.eq("property_id", propertyId);
    }
    if (leaseId) {
      query = query.eq("lease_id", leaseId);
    }
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yearStr, monthStr] = month.split("-");
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const lastDay = new Date(y, m, 0).getDate();
      query = query
        .gte("billing_period_start", `${month}-01`)
        .lte("billing_period_start", `${month}-${String(lastDay).padStart(2, "0")}`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ readings: data });
  } catch (error) {
    console.error("Failed to fetch utility readings:", error);
    return NextResponse.json({ error: "Failed to fetch utility readings." }, { status: 500 });
  }
}

