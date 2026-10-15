import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { parseJsonBody, parseWithSchema } from "@/lib/validation/server";
import { propertyIdSchema, renewalSettingsPatchSchema } from "@/lib/validation/schemas/properties.schema";

/**
 * GET /api/landlord/properties/[id]/renewal-settings
 * Fetch renewal settings for a specific property.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  const idCheck = parseWithSchema(propertyIdSchema, id);
  if (!idCheck.ok) return idCheck.response;

  try {
    const { data: property, error } = await supabase
      .from("properties")
      .select("renewal_settings")
      .eq("id", id)
      .eq("landlord_id", userId)
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
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  const idCheck = parseWithSchema(propertyIdSchema, id);
  if (!idCheck.ok) return idCheck.response;

  const parsed = await parseJsonBody(request, renewalSettingsPatchSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const { data, error } = await supabase
      .from("properties")
      .update({ renewal_settings: parsed.data.settings })
      .eq("id", id)
      .eq("landlord_id", userId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json(data.renewal_settings);
  } catch {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
