import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: RouteContext) {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { error } = await supabase
            .from("payments")
            .update({
                reminder_sent_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("landlord_id", user.id);

        if (error) throw error;

        return NextResponse.json({ ok: true, remindedAt: new Date().toISOString() });
    } catch (error) {
        console.error("Failed to send invoice reminder:", error);
        return NextResponse.json({ error: "Failed to send reminder." }, { status: 500 });
    }
}
