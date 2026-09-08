import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_BRANDING, BrandConfig } from "@/context/BrandContext";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { queueBrandedInstaller } from "@/lib/desktop/queue-branded-installer";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/branding
 * Retrieves active property branding and theme tokens scoped to the caller's property/landlord.
 * Uses service role client so all tenants, guests, and landlords receive the correct branding.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = createServiceRoleSupabaseClient();
    const url = new URL(request.url);
    const queryPropertyId = url.searchParams.get("propertyId");
    const queryLandlordId = url.searchParams.get("landlordId");

    let targetLandlordId: string | null = queryLandlordId || null;
    let targetPropertyId: string | null = queryPropertyId || null;

    // 1. Resolve caller identity from session cookie if present
    try {
      const authSupabase = await createServerSupabaseClient();
      const { data: { user } } = await authSupabase.auth.getUser();
      if (user) {
        const { data: userProfile } = await admin
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle();

        if (userProfile?.role === "landlord" || userProfile?.role === "admin") {
          targetLandlordId = user.id;
        } else if (userProfile?.role === "tenant") {
          const { data: lease } = await admin
            .from("leases")
            .select("property_id, property:properties(id, landlord_id)")
            .eq("tenant_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          const prop = (lease as any)?.property;
          if (prop?.landlord_id) {
            targetLandlordId = prop.landlord_id;
            targetPropertyId = prop.id;
          }
        }
      }
    } catch {
      // Unauthenticated caller, will fall back below
    }

    let property = null;
    let landlordProfile = null;

    if (targetPropertyId) {
      const { data: p } = await admin
        .from("properties")
        .select("id, name, description, type, images, map_decorations, landlord_id")
        .eq("id", targetPropertyId)
        .maybeSingle();
      property = p;
      if (property?.landlord_id) {
        targetLandlordId = property.landlord_id;
      }
    }

    if (targetLandlordId) {
      if (!property) {
        const { data: p } = await admin
          .from("properties")
          .select("id, name, description, type, images, map_decorations, landlord_id")
          .eq("landlord_id", targetLandlordId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        property = p;
      }

      const { data: prof } = await admin
        .from("profiles")
        .select("business_name, full_name, socials")
        .eq("id", targetLandlordId)
        .maybeSingle();
      landlordProfile = prof;
    }

    // 2. Fallback to turnkey property if no user/landlord resolved (public guests)
    if (!property && !landlordProfile) {
      const { data: firstProp } = await admin
        .from("properties")
        .select("id, name, description, type, images, map_decorations, landlord_id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      property = firstProp;

      if (property?.landlord_id) {
        const { data: prof } = await admin
          .from("profiles")
          .select("business_name, full_name, socials")
          .eq("id", property.landlord_id)
          .maybeSingle();
        landlordProfile = prof;
      }
    }

    if (!property && !landlordProfile) {
      return NextResponse.json(DEFAULT_BRANDING);
    }

    // Extract custom decorations/theme if stored in map_decorations or profile socials
    const propertyTheme = (property?.map_decorations as Record<string, unknown>)?.branding as
      | Partial<BrandConfig>
      | undefined;
    const profileTheme = ((landlordProfile?.socials as Record<string, unknown>)?.branding as
      | Partial<BrandConfig>
      | undefined);

    const customTheme: Partial<BrandConfig> = {
      ...(profileTheme || {}),
      ...(propertyTheme || {}),
    };

    const brandingPayload: BrandConfig = {
      propertyName:
        property?.name || landlordProfile?.business_name || customTheme?.propertyName || DEFAULT_BRANDING.propertyName,
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
      .select("id, name, map_decorations, images")
      .eq("landlord_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!existingProperty) {
      const { data: firstProp } = await admin
        .from("properties")
        .select("id, name, map_decorations, images")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      existingProperty = firstProp;
    }

    const currentDecorations =
      (existingProperty?.map_decorations as Record<string, unknown>) || {};
    const currentBranding = currentDecorations.branding as Partial<BrandConfig> | undefined;
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

    // 2. Update all properties owned by this landlord with the branding tokens
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
        .eq("landlord_id", userId);
    }

    // 3. Update landlord profile with branding in profiles.socials and business_name
    const { data: userProfile } = await admin
      .from("profiles")
      .select("socials, business_name")
      .eq("id", userId)
      .maybeSingle();

    const existingSocials = (userProfile?.socials as Record<string, unknown>) || {};
    const updatedSocials = {
      ...existingSocials,
      branding: updatedBrandingMeta,
    };

    const profileUpdates: Record<string, unknown> = {
      socials: updatedSocials,
      updated_at: new Date().toISOString(),
    };
    if (body.propertyName) {
      profileUpdates.business_name = body.propertyName;
    }

    await admin
      .from("profiles")
      .update(profileUpdates as any)
      .eq("id", userId);

    const fullBranding: BrandConfig = {
      propertyName: body.propertyName || DEFAULT_BRANDING.propertyName,
      propertyTagline: body.propertyTagline || DEFAULT_BRANDING.propertyTagline,
      rentalArchetype: body.rentalArchetype || DEFAULT_BRANDING.rentalArchetype,
      primaryColor: body.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: body.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      logoUrl: body.logoUrl || null,
      bannerUrl: body.bannerUrl || null,
    };

    // A Windows installer cannot change its embedded icon or Start-menu name at
    // runtime. Queue a fresh branded package after an identity change, but do
    // not make a successful branding save depend on GitHub Actions availability.
    const previousPropertyName = existingProperty?.name || DEFAULT_BRANDING.propertyName;
    const previousLogoUrl =
      currentBranding?.logoUrl || (existingProperty?.images?.[0] ? existingProperty.images[0] : null);
    const identityChanged =
      (body.propertyName !== undefined && body.propertyName !== previousPropertyName) ||
      (body.logoUrl !== undefined && body.logoUrl !== previousLogoUrl);
    const desktopBuildQueued = identityChanged
      ? await queueBrandedInstaller(request.nextUrl.origin)
      : false;

    return NextResponse.json({ ...fullBranding, desktopBuildQueued });
  } catch (error: any) {
    console.error("[POST /api/branding] Error saving branding:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update branding" },
      { status: 500 }
    );
  }
}
