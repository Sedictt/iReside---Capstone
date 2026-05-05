import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const propertyId = searchParams.get("property_id");

    let query = supabase
      .from("move_out_requests")
      .select(`
        *,
        lease:leases(
          id,
          unit_id,
          units:units(
            id,
            name,
            property_id,
            properties:properties(id, name)
          )
        ),
        tenant:profiles!move_out_requests_tenant_id_fkey(id, full_name, email, phone)
      `)
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status as any);
    }

    if (propertyId) {
      query = query.eq("lease.units.properties.id", propertyId);
    }

    const { data: requests, error: fetchError } = await (query as any);

    if (fetchError) throw fetchError;

    const formattedRequests = (requests as any[])?.map((req: any) => ({
      id: req.id,
      tenant_name: req.tenant?.full_name || "Unknown",
      tenant_email: req.tenant?.email,
      tenant_phone: req.tenant?.phone,
      unit_name: req.lease?.units?.name || "Unknown Unit",
      property_name: req.lease?.units?.properties?.name || "Unknown Property",
      requested_date: req.requested_date,
      reason: req.reason,
      status: req.status,
      created_at: req.created_at,
      approved_at: req.approved_at,
      denied_at: req.denied_at,
      completed_at: req.completed_at,
    })) || [];

    return NextResponse.json({ requests: formattedRequests });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}