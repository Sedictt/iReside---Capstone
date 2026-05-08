import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// VERSION: 1.0.2 - Fixed runtime error by using direct table query
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        // Querying auth.sessions directly because listUserSessions is missing in this version
        const { data: sessions, error } = await (admin as any)
            .schema("auth")
            .from("sessions")
            .select("*")
            .eq("user_id", user.id);

        if (error) throw error;

        // Get current session to mark it as ACTIVE
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        return NextResponse.json({ 
            sessions: (sessions || []).map((s: any) => ({
                id: s.id,
                created_at: s.created_at,
                updated_at: s.updated_at,
                last_sign_in_at: s.last_sign_in_at || s.created_at,
                is_current: s.id === (currentSession as any)?.id,
                user_agent: s.user_agent || "Unknown Browser",
                ip: s.ip || "Unknown IP"
            }))
        });
    } catch (error: any) {
        console.error("Session fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { sessionId, scope } = await req.json();
        const admin = createAdminClient();

        if (scope === "others") {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            
            const { error: deleteError } = await (admin as any)
                .schema("auth")
                .from("sessions")
                .delete()
                .eq("user_id", user.id)
                .neq("id", (currentSession as any)?.id);

            if (deleteError) throw deleteError;

            return NextResponse.json({ success: true });
        }

        if (sessionId) {
            const { error: deleteError } = await (admin as any)
                .schema("auth")
                .from("sessions")
                .delete()
                .eq("id", sessionId)
                .eq("user_id", user.id);

            if (deleteError) throw deleteError;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Missing sessionId or scope" }, { status: 400 });
    } catch (error: any) {
        console.error("Session revocation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
