import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Not authenticated", userError });
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, email")
        .eq("id", user.id)
        .single();

    return NextResponse.json({
        userId: user.id,
        userMetadataRole: user.user_metadata?.role,
        profile,
        profileError,
    });
}
