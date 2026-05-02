import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createMultiMonthAdvancePayment } from "@/lib/billing/server";

const advancePaymentSchema = z.object({
    targetMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    monthsCount: z.number().int().min(1).max(12).optional().default(1),
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
        let targetMonth: string | undefined;
        let monthsCount = 1;

        const contentType = request.headers.get("content-type") || "";
        
        if (contentType.includes("application/json")) {
            const body = await request.json();
            const parsed = advancePaymentSchema.parse(body);
            targetMonth = parsed.targetMonth;
            monthsCount = parsed.monthsCount;
        }

        console.log("Creating advance payment for user:", user.id, { targetMonth, monthsCount });
        
        const result = await createMultiMonthAdvancePayment(supabase, user.id, {
            targetMonth,
            monthsCount,
        });
        
        console.log("Advance payment created successfully:", result);
        
        // Return with explicit id for backward compatibility with frontend
        const response = {
            ...result,
            id: result.invoices?.[0]?.invoiceId || null
        };
        
        return NextResponse.json(response);
    } catch (error: any) {
        console.error("CRITICAL ERROR in advance payment API:", error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid parameters", details: error.errors },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            { 
                error: error.message || "Failed to create advance payment",
                stack: error.stack,
                details: error
            },
            { status: 500 }
        );
    }
}