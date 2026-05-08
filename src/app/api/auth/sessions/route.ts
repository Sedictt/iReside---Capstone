import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: { sessions }, error } = await (admin.auth.admin as any).listUserSessions(user.id);
        if (error) throw error;

        // Get current session to mark it as ACTIVE
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        return NextResponse.json({ 
            sessions: (sessions as any[]).map(s => ({
                id: s.id,
                created_at: s.created_at,
                updated_at: s.updated_at,
                last_sign_in_at: s.last_sign_in_at,
                is_current: s.id === (currentSession as any)?.id,
                user_agent: s.user_agent,
                ip: s.ip
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
            const { data: { sessions }, error: listError } = await (admin.auth.admin as any).listUserSessions(user.id);
            if (listError) throw listError;
            
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            
            const results = await Promise.all(
                (sessions as any[])
                    .filter(s => s.id !== (currentSession as any)?.id)
                    .map(s => (admin.auth.admin as any).deleteSession(s.id))
            );

            const errors = results.filter((r: any) => r.error);
            if (errors.length > 0) {
                console.error("Errors revoking some sessions:", errors);
            }

            return NextResponse.json({ success: true, revokedCount: results.length });
        }

        if (sessionId) {
            const { error } = await (admin.auth.admin as any).deleteSession(sessionId);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Missing sessionId or scope" }, { status: 400 });
    } catch (error: any) {
        console.error("Session revocation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
