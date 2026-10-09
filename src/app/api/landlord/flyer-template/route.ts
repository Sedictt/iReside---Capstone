import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { parseJsonBody } from "@/lib/validation/server";
import { flyerPropertyKeySchema, flyerTemplateSaveSchema } from "@/lib/validation/schemas/properties.schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    // Check query params for optional propertyId
    const { searchParams } = new URL(request.url);
    const requestedKey = searchParams.get("propertyId") || "default";
    // Unknown/malformed keys fall back to the landlord's default template rather than querying with them.
    const propertyId = flyerPropertyKeySchema.safeParse(requestedKey).success ? requestedKey : "default";

    // 1. Try to load from specific property map_decorations if propertyId provided
    if (propertyId && propertyId !== "default") {
      const { data: property } = await supabase
        .from("properties")
        .select("map_decorations")
        .eq("id", propertyId)
        .eq("landlord_id", userId)
        .maybeSingle();

      const propTemplate = (property?.map_decorations as Record<string, unknown>)?.flyer_template;
      if (propTemplate) {
        return NextResponse.json({ template: propTemplate });
      }
    }

    // 2. Try to load from any property belonging to the landlord
    const { data: landlordProps } = await supabase
      .from("properties")
      .select("map_decorations")
      .eq("landlord_id", userId)
      .limit(5);

    if (landlordProps && landlordProps.length > 0) {
      for (const prop of landlordProps) {
        const propTemplate = (prop?.map_decorations as Record<string, unknown>)?.flyer_template;
        if (propTemplate) {
          return NextResponse.json({ template: propTemplate });
        }
      }
    }

    // 3. Fallback to user metadata (legacy)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ template: null });
    }

    const templates = user.user_metadata?.flyer_templates || {};
    const template = templates[propertyId] || templates["default"] || null;

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching flyer template:", error);
    return NextResponse.json({ template: null }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const parsed = await parseJsonBody(request, flyerTemplateSaveSchema);
    if (!parsed.ok) return parsed.response;
    const { propertyId, template } = parsed.data;

    const updatedTemplateWithDate = {
      ...template,
      updatedAt: new Date().toISOString(),
    };

    // 1. Persist to properties.map_decorations
    let targetPropertyId = propertyId;
    if (targetPropertyId === "default") {
      const { data: firstProp } = await supabase
        .from("properties")
        .select("id, map_decorations")
        .eq("landlord_id", userId)
        .limit(1)
        .maybeSingle();

      if (firstProp?.id) {
        targetPropertyId = firstProp.id;
        const currentDecorations = (firstProp.map_decorations as Record<string, unknown>) || {};
        await supabase
          .from("properties")
          .update({
            map_decorations: {
              ...currentDecorations,
              flyer_template: updatedTemplateWithDate,
            } as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetPropertyId);
      }
    } else {
      const { data: prop } = await supabase
        .from("properties")
        .select("map_decorations")
        .eq("id", targetPropertyId)
        .eq("landlord_id", userId)
        .maybeSingle();

      if (!prop) {
        return NextResponse.json({ error: "Property not found or access denied." }, { status: 404 });
      }

      const currentDecorations = (prop.map_decorations as Record<string, unknown>) || {};
      await supabase
        .from("properties")
        .update({
          map_decorations: {
            ...currentDecorations,
            flyer_template: updatedTemplateWithDate,
          } as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetPropertyId);
    }

    // 2. Clean up legacy flyer_templates from auth user_metadata so JWT cookie doesn't exceed 8KB/16KB limit (HTTP 431)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.user_metadata?.flyer_templates) {
        await supabase.auth.updateUser({
          data: {
            flyer_templates: null,
          },
        });
      }
    } catch {
      // Non-blocking cleanup
    }

    return NextResponse.json({ success: true, template: updatedTemplateWithDate });
  } catch (error) {
    console.error("Error saving flyer template:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
