import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_BRANDING, BrandConfig } from "@/context/BrandContext";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

/**
 * GET /api/branding
 * Public endpoint to retrieve the instance's active property branding and theme.
 * Uses service role client so all tenants, guests, and landlords receive the correct branding.
 */
export async function GET() {
  try {
    const admin = createServiceRoleSupabaseClient();

    // 1. Fetch first property as the primary turnkey property
    const { data: property } = await admin
      .from("properties")
      .select("id, name, description, type, images, map_decorations, landlord_id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    // 2. Fetch landlord business profile from profiles table
    let landlordProfile = null;
    if (property?.landlord_id) {
      const { data: prof } = await admin
        .from("profiles")
        .select("business_name, full_name")
        .eq("id", property.landlord_id)
        .maybeSingle();
      landlordProfile = prof;
    } else {
      const { data: prof } = await admin
        .from("profiles")
        .select("business_name, full_name")
        .eq("role", "landlord")
        .limit(1)
        .maybeSingle();
      landlordProfile = prof;
    }

    if (!property && !landlordProfile) {
      return NextResponse.json(DEFAULT_BRANDING);
    }

    // Extract custom decorations/theme if stored in map_decorations
    const customTheme = (property?.map_decorations as Record<string, unknown>)?.branding as
      | Partial<BrandConfig>
      | undefined;

    const brandingPayload: BrandConfig = {
      propertyName:
        property?.name || landlordProfile?.business_name || DEFAULT_BRANDING.propertyName,
      propertyTagline:
        property?.description ||
        customTheme?.propertyTagline ||
        DEFAULT_BRANDING.propertyTagline,
      rentalArchetype:
        (property?.type as BrandConfig["rentalArchetype"]) ||
        customTheme?.rentalArchetype ||
        DEFAULT_BRANDING.rentalArchetype,
      primaryColor: customTheme?.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: customTheme?.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      logoUrl: customTheme?.logoUrl || (property?.images?.[0] ? property.images[0] : null),
      bannerUrl: customTheme?.bannerUrl || (property?.images?.[0] ? property.images[0] : null),
    };

    return NextResponse.json(brandingPayload);
  } catch (error) {
    console.warn("[GET /api/branding] Error fetching branding:", error);
    return NextResponse.json(DEFAULT_BRANDING);
  }
}

/**
 * POST /api/branding
 * Landlord endpoint to update property branding and theme tokens in the cloud.
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    if (authContext.userRole !== "landlord" && authContext.userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only landlords and administrators can update brand personalization settings." },
        { status: 403 }
      );
    }
    const { userId } = authContext;

    const body = (await request.json()) as Partial<BrandConfig>;
    const admin = createServiceRoleSupabaseClient();

    // 1. Fetch current primary property for this landlord (or any property if shared)
    let { data: existingProperty } = await admin
      .from("properties")
      .select("id, map_decorations, images")
      .eq("landlord_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!existingProperty) {
      const { data: firstProp } = await admin
        .from("properties")
        .select("id, map_decorations, images")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      existingProperty = firstProp;
    }

    const currentDecorations =
      (existingProperty?.map_decorations as Record<string, unknown>) || {};
    const updatedBrandingMeta: Partial<BrandConfig> = {
      primaryColor: body.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: body.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      propertyTagline: body.propertyTagline || DEFAULT_BRANDING.propertyTagline,
      rentalArchetype: body.rentalArchetype || DEFAULT_BRANDING.rentalArchetype,
      logoUrl: body.logoUrl || null,
      bannerUrl: body.bannerUrl || null,
    };

    const newDecorations = {
      ...currentDecorations,
      branding: updatedBrandingMeta,
    };

    // 2. Update property record in cloud
    if (existingProperty) {
      await admin
        .from("properties")
        .update({
          name: body.propertyName || undefined,
          description: body.propertyTagline || undefined,
          type: body.rentalArchetype || undefined,
          map_decorations: newDecorations,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProperty.id);
    }

    // 3. Update landlord profile business name in profiles table
    if (body.propertyName) {
      await admin
        .from("profiles")
        .update({
          business_name: body.propertyName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }

    const fullBranding: BrandConfig = {
      propertyName: body.propertyName || DEFAULT_BRANDING.propertyName,
      propertyTagline: body.propertyTagline || DEFAULT_BRANDING.propertyTagline,
      rentalArchetype: body.rentalArchetype || DEFAULT_BRANDING.rentalArchetype,
      primaryColor: body.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: body.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      logoUrl: body.logoUrl || null,
      bannerUrl: body.bannerUrl || null,
    };

    return NextResponse.json(fullBranding);
  } catch (error: any) {
    console.error("[POST /api/branding] Error saving branding:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update branding" },
      { status: 500 }
    );
  }
}
