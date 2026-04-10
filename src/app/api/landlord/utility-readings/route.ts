import { NextResponse } from "next/server";
import { z } from "zod";

import { recordUtilityReading } from "@/lib/billing/server";
import { BILLING_BUCKETS, uploadBillingFile } from "@/lib/billing/storage";
import { createClient } from "@/lib/supabase/server";

const readingSchema = z.object({
    leaseId: z.string().uuid(),
    utilityType: z.enum(["water", "electricity"]),
    billingPeriodStart: z.string(),
    billingPeriodEnd: z.string(),
    previousReading: z.coerce.number().min(0),
    currentReading: z.coerce.number().min(0),
    note: z.string().max(400).optional(),
});

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
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
                ownerId: user.id,
                scope: payload.leaseId,
                file: proof,
            })
            : null;

        const reading = await recordUtilityReading(supabase, user.id, {
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
