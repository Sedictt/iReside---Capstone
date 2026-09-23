import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_BRANDING, BrandConfig } from "@/context/BrandContext";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { queueBrandedInstaller } from "@/lib/desktop/queue-branded-installer";
import { brandingUpdateSchema } from "@/lib/validation/brand-setup";
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

    // 3. Fallback to primary landlord profile if property is not yet created
    if (!property && !landlordProfile) {
      const { data: primaryLandlord } = await admin
        .from("profiles")
        .select("business_name, full_name, socials")
        .eq("role", "landlord")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (primaryLandlord) {
        landlordProfile = primaryLandlord;
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

    const cleanObject = (obj: any): Record<string, unknown> => {
      if (!obj || typeof obj !== "object") return {};
      const res: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null && v !== "") {
          res[k] = v;
        }
      }
      return res;
    };

    const customTheme: Partial<BrandConfig> = {
      ...cleanObject(profileTheme),
      ...cleanObject(propertyTheme),
    };

    const brandingPayload: BrandConfig = {
      propertyName:
        landlordProfile?.business_name ||
        customTheme?.propertyName ||
        property?.name ||
        DEFAULT_BRANDING.propertyName,
      propertyTagline:
        customTheme?.propertyTagline ||
        property?.description ||
        DEFAULT_BRANDING.propertyTagline,
      rentalArchetype:
        customTheme?.rentalArchetype ||
        (property?.type as BrandConfig["rentalArchetype"]) ||
        DEFAULT_BRANDING.rentalArchetype,
      primaryColor:
        customTheme?.primaryColor ||
        profileTheme?.primaryColor ||
        propertyTheme?.primaryColor ||
        DEFAULT_BRANDING.primaryColor,
      secondaryColor:
        customTheme?.secondaryColor ||
        profileTheme?.secondaryColor ||
        propertyTheme?.secondaryColor ||
        DEFAULT_BRANDING.secondaryColor,
      logoUrl: customTheme?.logoUrl !== undefined ? customTheme.logoUrl : (property?.images?.[0] ? property.images[0] : null),
      bannerUrl: customTheme?.bannerUrl !== undefined ? customTheme.bannerUrl : (property?.images?.[0] ? property.images[0] : null),
      setupCompleted: (customTheme as any)?.setup_completed ?? (customTheme as any)?.setupCompleted ?? false,
      setupCompletedAt: (customTheme as any)?.setup_completed_at ?? (customTheme as any)?.setupCompletedAt ?? null,
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
    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const validationResult = brandingUpdateSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return NextResponse.json(
        { error: "Validation failed: Please check your branding fields.", details: fieldErrors },
        { status: 400 }
      );
    }

    const body = validationResult.data;
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
    const currentBranding = currentDecorations.branding as (Partial<BrandConfig> & Record<string, unknown>) | undefined;
    const updatedBrandingMeta: Record<string, unknown> = {
      propertyName: body.propertyName || DEFAULT_BRANDING.propertyName,
      primaryColor: body.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: body.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      propertyTagline: body.propertyTagline || DEFAULT_BRANDING.propertyTagline,
      rentalArchetype: body.rentalArchetype || DEFAULT_BRANDING.rentalArchetype,
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : (currentBranding?.logoUrl ?? null),
      bannerUrl: body.bannerUrl !== undefined ? body.bannerUrl : (currentBranding?.bannerUrl ?? null),
      setup_completed: body.setupCompleted !== undefined ? body.setupCompleted : currentBranding?.setup_completed ?? false,
      setup_completed_at: body.setupCompletedAt !== undefined ? body.setupCompletedAt : currentBranding?.setup_completed_at ?? null,
    };

    const newDecorations = {
      ...currentDecorations,
      branding: updatedBrandingMeta,
    };

    // 2. Update properties owned by this landlord with the branding tokens in map_decorations
    // Do NOT overwrite distinct property names or descriptions across the landlord's entire portfolio
    if (existingProperty) {
      await admin
        .from("properties")
        .update({
          map_decorations: newDecorations as any,
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
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : (currentBranding?.logoUrl ?? null),
      bannerUrl: body.bannerUrl !== undefined ? body.bannerUrl : (currentBranding?.bannerUrl ?? null),
    };

    // A Windows installer cannot change its embedded icon or Start-menu name at
    // runtime. Queue a fresh branded package after an identity change, but do
    // not make a successful branding save depend on GitHub Actions availability.
    const previousPropertyName =
      currentBranding?.propertyName || existingProperty?.name || DEFAULT_BRANDING.propertyName;
    const previousLogoUrl = currentBranding?.logoUrl ?? null;
    const identityChanged =
      (body.propertyName !== undefined && body.propertyName !== previousPropertyName) ||
      (body.logoUrl !== undefined && body.logoUrl !== previousLogoUrl);

    let desktopBuildQueued = false;
    if (identityChanged) {
      // Fire-and-forget so branding save response returns immediately without waiting for GitHub API
      queueBrandedInstaller(request.nextUrl.origin).catch((err) => {
        console.warn("[POST /api/branding] Non-blocking queueBrandedInstaller error:", err);
      });
      desktopBuildQueued = true;
    }

    return NextResponse.json({ ...fullBranding, desktopBuildQueued });
  } catch (error: any) {
    console.error("[POST /api/branding] Error saving branding:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update branding" },
      { status: 500 }
    );
  }
}
