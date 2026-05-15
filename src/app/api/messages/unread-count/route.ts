import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { count, error } = await adminClient
    .from("messages")
    .select("*", { count: "exact", head: true })
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("[unread-count] Failed to fetch unread message count:", error);
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
