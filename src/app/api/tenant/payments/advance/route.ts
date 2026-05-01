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
        const result = await createAdvancePayment(supabase, user.id);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error creating advance payment:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create advance payment" },
            { status: 500 }
        );
    }
}
