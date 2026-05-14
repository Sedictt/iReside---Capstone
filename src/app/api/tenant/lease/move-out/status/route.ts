import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: request, error: fetchError } = await (supabase
      .from("move_out_requests" as any)
      .select(`
        *,
        landlord:profiles(id, full_name, email)
      `)
      .eq("tenant_id", user.id)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single() as any);

    if (fetchError || !request) {
      return NextResponse.json({ hasRequest: false, request: null });
    }

    return NextResponse.json({
      hasRequest: true,
      request: {
        id: request.id,
        status: request.status,
        requested_date: request.requested_date,
        reason: request.reason,
        created_at: request.created_at,
        approved_at: request.approved_at,
        inspection_date: request.inspection_date,
        inspection_notes: request.inspection_notes,
        deposit_deductions: request.deposit_deductions,
        deposit_refund_amount: request.deposit_refund_amount,
        checklist_completed: request.checklist_completed,
        checklist_data: request.checklist_data,
        landlord_name: request.landlord?.full_name,
      },
    });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}