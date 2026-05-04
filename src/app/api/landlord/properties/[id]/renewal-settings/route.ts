import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/landlord/properties/[id]/renewal-settings
 * Fetch renewal settings for a specific property.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: property, error } = await supabase
      .from("properties")
      .select("renewal_settings")
      .eq("id", id)
      .eq("landlord_id", user.id)
      .single();

    if (error || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json(property.renewal_settings);
  } catch (error) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

/**
 * PATCH /api/landlord/properties/[id]/renewal-settings
 * Update renewal settings for a specific property.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { settings } = body;

    const { data, error } = await supabase
      .from("properties")
      .update({ renewal_settings: settings })
      .eq("id", id)
      .eq("landlord_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json(data.renewal_settings);
  } catch (error) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
