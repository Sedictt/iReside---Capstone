import { NextResponse } from "next/server";
import { z } from "zod";

import { recordUtilityReading } from "@/lib/billing/server";
import { BILLING_BUCKETS, uploadBillingFile } from "@/lib/billing/storage";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

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

    try {
        const contentType = request.headers.get("content-type");
        
        if (contentType?.includes("application/json")) {
            const body = await request.json();
            
            if (Array.isArray(body)) {
                const readings = bulkSchema.parse(body);
                const results = [];
                
                for (const payload of readings) {
                    const reading = await recordUtilityReading(supabase, userId, payload);
                    results.push(reading);
                }
                
                return NextResponse.json({ readings: results });
            } else {
                const payload = readingSchema.parse(body);
                const reading = await recordUtilityReading(supabase, userId, payload);
                return NextResponse.json({ reading });
            }
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
        const proofUpload = proof instanceof File && proof.size > 0
            ? await uploadBillingFile({
                bucketName: BILLING_BUCKETS.readingProofs,
                ownerId: userId,
                scope: payload.leaseId,
                file: proof,
            })
            : null;

        const reading = await recordUtilityReading(supabase, userId, {
            ...payload,
            proofImagePath: proofUpload?.path ?? null,
            proofImageUrl: proofUpload?.publicUrl ?? null,
        });

        return NextResponse.json({ reading });
    } catch (error) {
        console.error("Failed to record utility reading:", error);
        return NextResponse.json({ error: "Failed to record utility reading." }, { status: 500 });
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
        if (month) {
            const [year, monthNum] = month.split("-").map(Number);
            const startDate = new Date(year, monthNum - 1, 1).toISOString().slice(0, 10);
            const endDate = new Date(year, monthNum, 0).toISOString().slice(0, 10);
            query = query.gte("billing_period_start", startDate)
                         .lte("billing_period_end", endDate);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ readings: data });
    } catch (error) {
        console.error("Failed to fetch utility readings:", error);
        return NextResponse.json({ error: "Failed to fetch utility readings." }, { status: 500 });
    }
}
