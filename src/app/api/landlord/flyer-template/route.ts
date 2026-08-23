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

    // Retrieve user metadata for flyer templates
    const { data: { user }, error } = await supabase.auth.getUser();
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "User not authenticated." }, { status: 401 });
    }

    const existingTemplates = user.user_metadata?.flyer_templates || {};
    const updatedTemplates = {
      ...existingTemplates,
      [propertyId]: {
        ...template,
        updatedAt: new Date().toISOString(),
      },
    };

    // Update user metadata in Supabase Auth (synchronized across all devices)
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        flyer_templates: updatedTemplates,
      },
    });

    if (updateError) {
      console.error("Error updating flyer template metadata:", updateError);
      return NextResponse.json({ error: "Failed to save template to cloud." }, { status: 500 });
    }

    return NextResponse.json({ success: true, template: updatedTemplates[propertyId] });
  } catch (error) {
    console.error("Error saving flyer template:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
