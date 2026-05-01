import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdvancePayment } from "@/lib/billing/server";

export async function POST() {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("Creating advance payment for user:", user.id);
        const result = await createAdvancePayment(supabase, user.id);
        console.log("Advance payment created successfully:", result);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("CRITICAL ERROR in advance payment API:", error);
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
