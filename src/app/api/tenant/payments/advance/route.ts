import { NextResponse } from "next/server";
import { z } from "zod";
import { createMultiMonthAdvancePayment } from "@/lib/billing/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

const advancePaymentSchema = z.object({
  targetMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  monthsCount: z.number().int().min(1).max(12).optional().default(1),
});

export async function POST(request: Request) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

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

    const result = await createMultiMonthAdvancePayment(supabase, userId, {
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
                { error: "Invalid parameters", details: error.issues },
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