import { NextResponse } from "next/server";
import { z } from "zod";
import { BILLING_BUCKETS, uploadBillingFile } from "@/lib/billing/storage";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { BillingService } from "@/lib/services/payment";

const readingSchema = z.object({
  leaseId: z.string().uuid(),
  utilityType: z.enum(["water", "electricity"]),
  billingPeriodStart: z.string(),
  billingPeriodEnd: z.string(),
  previousReading: z.coerce.number().min(0),
  currentReading: z.coerce.number().min(0),
  note: z.string().max(400).optional().nullable(),
});

const bulkSchema = z.array(readingSchema);

export async function POST(request: Request) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;
  const billingService = new BillingService(supabase);

  try {
    const contentType = request.headers.get("content-type");

    const { searchParams } = new URL(request.url);
    const postInvoicesParam = searchParams.get("postInvoices") === "true";

    if (contentType?.includes("application/json")) {
      const body = await request.json();

      let readingsPayload: any[] = [];
      let shouldPostInvoices = postInvoicesParam;
      let specifiedMonth: string | undefined = searchParams.get("month") ?? undefined;

      if (Array.isArray(body)) {
        readingsPayload = body;
      } else if (body && typeof body === "object" && Array.isArray(body.readings)) {
        readingsPayload = body.readings;
        if (body.postInvoices !== undefined) {
          shouldPostInvoices = Boolean(body.postInvoices);
        }
        if (body.month) {
          specifiedMonth = String(body.month);
        }
      } else {
        const payload = readingSchema.parse(body);
        const reading = await billingService.recordUtilityReading(userId, payload);

        let invoiceResult = null;
        if (shouldPostInvoices) {
          const { generateMonthlyInvoices } = await import("@/lib/billing/server");
          const month = specifiedMonth || payload.billingPeriodStart.slice(0, 7);
          invoiceResult = await generateMonthlyInvoices(supabase, userId, month, [payload.leaseId]);
        }

        return NextResponse.json({ reading, invoiceResult });
      }

      const readings = bulkSchema.parse(readingsPayload);
      const results = [];

      for (const payload of readings) {
        const reading = await billingService.recordUtilityReading(userId, payload);
        results.push(reading);
      }

      let invoiceResult = null;
      if (shouldPostInvoices && results.length > 0) {
        const { generateMonthlyInvoices } = await import("@/lib/billing/server");
        const month = specifiedMonth || readings[0]?.billingPeriodStart?.slice(0, 7);
        const leaseIds = Array.from(new Set(readings.map((r) => r.leaseId)));
        invoiceResult = await generateMonthlyInvoices(supabase, userId, month, leaseIds);
      }

      return NextResponse.json({ readings: results, invoiceResult });
    }

    // Fallback to FormData (for single reading with proof image)
    const formData = await request.formData();
    const payload = readingSchema.parse({
      leaseId: formData.get("leaseId"),
      utilityType: formData.get("utilityType"),
      billingPeriodStart: formData.get("billingPeriodStart"),
      billingPeriodEnd: formData.get("billingPeriodEnd"),
      previousReading: formData.get("previousReading"),
      currentReading: formData.get("currentReading"),
      note: formData.get("note"),
    });

    const proof = formData.get("proof");
    const proofUpload =
      proof instanceof File && proof.size > 0
        ? await uploadBillingFile({
            bucketName: BILLING_BUCKETS.readingProofs,
            ownerId: userId,
            scope: payload.leaseId,
            file: proof,
          })
        : null;

    const reading = await billingService.recordUtilityReading(userId, {
      ...payload,
      proofImagePath: proofUpload?.path ?? null,
      proofImageUrl: proofUpload?.publicUrl ?? null,
    });

    return NextResponse.json({ reading });
  } catch (error: any) {
    console.error("Failed to record utility reading:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record utility reading." },
      { status: 500 },
    );
  }
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
      query = query.gte("billing_period_start", `${month}-01`).lte("billing_period_start", `${month}-31`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ readings: data });
  } catch (error) {
    console.error("Failed to fetch utility readings:", error);
    return NextResponse.json({ error: "Failed to fetch utility readings." }, { status: 500 });
  }
}

