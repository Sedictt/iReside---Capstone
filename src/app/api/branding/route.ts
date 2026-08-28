import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DEFAULT_BRANDING, BrandConfig } from "@/context/BrandContext";

async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in route handlers
          }
        },
      },
    }
  );
}

/**
 * GET /api/branding
 * Public endpoint to retrieve the instance's active property branding and theme.
 */
export async function GET() {
  try {
    const supabase = await getSupabaseServer();

    // 1. Fetch first property as the primary turnkey property
    const { data: property } = await supabase
      .from("properties")
      .select("id, name, description, type, images, map_decorations")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    // 2. Fetch landlord business profile
    const { data: businessProfile } = await supabase
      .from("landlord_business_profiles")
      .select("business_name, business_permit_number, business_permit_url")
      .limit(1)
      .maybeSingle();

    if (!property && !businessProfile) {
      return NextResponse.json(DEFAULT_BRANDING);
    }

    // Extract custom decorations/theme if stored in map_decorations or property description
    const customTheme = (property?.map_decorations as Record<string, unknown>)?.branding as
      | Partial<BrandConfig>
      | undefined;

    const brandingPayload: BrandConfig = {
      propertyName:
        property?.name || businessProfile?.business_name || DEFAULT_BRANDING.propertyName,
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
      bannerUrl: customTheme?.bannerUrl || null,
    };

    return NextResponse.json(brandingPayload);
  } catch (error) {
    console.warn("[GET /api/branding] Error fetching branding:", error);
    return NextResponse.json(DEFAULT_BRANDING);
  }
}

/**
 * POST /api/branding
 * Landlord endpoint to update property branding and theme tokens.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<BrandConfig>;

    // 1. Fetch current primary property for this landlord
    const { data: existingProperty } = await supabase
      .from("properties")
      .select("id, map_decorations, images")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

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

    // 2. Update property record if exists
    if (existingProperty) {
      await supabase
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

    // 3. Update landlord business profile
    if (body.propertyName) {
      await supabase
        .from("landlord_business_profiles")
        .upsert(
          {
            profile_id: user.id,
            business_name: body.propertyName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "profile_id" }
        );
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
