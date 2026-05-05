import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { checklist_data } = body;

    if (!checklist_data || typeof checklist_data !== "object") {
      return NextResponse.json({ error: "Checklist data is required" }, { status: 400 });
    }

    const { data: existingRequest, error: fetchError } = await supabase
      .from("move_out_requests")
      .select("id, checklist_data")
      .eq("tenant_id", user.id)
      .eq("status", "approved")
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json({ 
        error: "No approved move-out request found. You can only update checklist after your request is approved." 
      }, { status: 404 });
    }

    const existingChecklist = typeof existingRequest.checklist_data === 'object' 
      ? existingRequest.checklist_data 
      : {};
    
    const mergedChecklist = { ...existingChecklist, ...checklist_data };

    const allCompleted = Object.values(mergedChecklist).every(
      (item: unknown) => {
        if (typeof item === 'boolean') return item === true;
        if (typeof item === 'object' && item !== null) {
          return (item as Record<string, unknown>).completed === true;
        }
        return false;
      }
    );

    const { error: updateError } = await supabase
      .from("move_out_requests")
      .update({
        checklist_data: mergedChecklist,
        checklist_completed: allCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRequest.id);

    if (updateError) throw updateError;

    if (allCompleted) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "lease",
        title: "Move-Out Checklist Completed",
        message: "You have completed all move-out checklist items.",
        data: { move_out_request_id: existingRequest.id },
      });
    }

    return NextResponse.json({ 
      success: true, 
      checklist_completed: allCompleted,
      checklist_data: mergedChecklist 
    });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}