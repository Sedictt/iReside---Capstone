import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseWithSchema } from "@/lib/validation/server";
import { isMoveOutChecklistComplete, moveOutChecklistSchema } from "@/lib/validation/schemas/tenant-lifecycle.schema";

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (!body || typeof body !== "object" || !(body as { checklist_data?: unknown }).checklist_data) {
      return NextResponse.json({ error: "Checklist data is required" }, { status: 400 });
    }
    const parsed = parseWithSchema(moveOutChecklistSchema, body);
    if (!parsed.ok) return parsed.response;
    const { checklist_data } = parsed.data;

    const { data: existingRequest, error: fetchError } = (await (supabase as any)
      .from("move_out_requests")
      .select("id, checklist_data")
      .eq("tenant_id", user.id)
      .eq("status", "approved")
      .single()) as { data: { id: string; checklist_data: Record<string, unknown> } | null; error: any };

    if (fetchError || !existingRequest) {
      return NextResponse.json({ 
        error: "No approved move-out request found. You can only update checklist after your request is approved." 
      }, { status: 404 });
    }

    const existingChecklist = existingRequest.checklist_data && typeof existingRequest.checklist_data === 'object'
      ? existingRequest.checklist_data
      : {};
    
    const mergedChecklist = { ...existingChecklist, ...checklist_data };

    // Handles both {key: bool|{completed}} and the client's {items: [{id, completed}]} shape.
    const allCompleted = isMoveOutChecklistComplete(mergedChecklist);

    const { error: updateError } = await supabase
      .from("move_out_requests" as any)
      .update({
        checklist_data: mergedChecklist,
        checklist_completed: allCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRequest.id);

    if (updateError) {
      console.error("[move-out-checklist] Update error:", updateError);
      return NextResponse.json({ error: "Failed to save checklist." }, { status: 500 });
    }

    if (allCompleted) {
      // Notification is best-effort; the checklist itself is already saved.
      try {
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "lease",
          title: "Move-Out Checklist Completed",
          message: "You have completed all move-out checklist items.",
          data: { move_out_request_id: existingRequest.id },
        });
      } catch (notifyError) {
        console.error("[move-out-checklist] Notification error:", notifyError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      checklist_completed: allCompleted,
      checklist_data: mergedChecklist 
    });
  } catch (e: unknown) {
    console.error("[move-out-checklist] Unexpected error:", e);
    return NextResponse.json({ error: "Failed to save checklist." }, { status: 500 });
  }
}