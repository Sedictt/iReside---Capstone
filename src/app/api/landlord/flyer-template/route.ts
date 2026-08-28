import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    // Check query params for optional propertyId
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId") || "default";

    // 1. Try to load from property map_decorations if propertyId provided
    if (propertyId && propertyId !== "default") {
      const { data: property } = await supabase
        .from("properties")
        .select("map_decorations")
        .eq("id", propertyId)
        .maybeSingle();

      const propTemplate = (property?.map_decorations as Record<string, unknown>)?.flyer_template;
      if (propTemplate) {
        return NextResponse.json({ template: propTemplate });
      }
    }

    // 2. Fallback to user metadata
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

    const body = await request.json();
    const { propertyId = "default", template } = body;

    if (!template) {
      return NextResponse.json({ error: "Template data is required." }, { status: 400 });
    }

    // Retrieve existing user metadata
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "User not authenticated." }, { status: 401 });
    }

    const existingTemplates = user.user_metadata?.flyer_templates || {};
    const updatedTemplateWithDate = {
      ...template,
      updatedAt: new Date().toISOString(),
    };

    const updatedTemplates = {
      ...existingTemplates,
      [propertyId]: updatedTemplateWithDate,
    };

    // 1. Update user metadata in Supabase Auth
    await supabase.auth.updateUser({
      data: {
        flyer_templates: updatedTemplates,
      },
    });

    // 2. Also persist to properties.map_decorations if valid property
    if (propertyId && propertyId !== "default") {
      const { data: prop } = await supabase
        .from("properties")
        .select("map_decorations")
        .eq("id", propertyId)
        .maybeSingle();

      if (prop) {
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
          .eq("id", propertyId);
      }
    }

    return NextResponse.json({ success: true, template: updatedTemplateWithDate });
  } catch (error) {
    console.error("Error saving flyer template:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
