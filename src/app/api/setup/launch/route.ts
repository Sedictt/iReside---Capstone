import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_BRANDING, BrandConfig } from "@/context/BrandContext";
import { generateSecurityKey, encryptSecurityKey } from "@/lib/security/recovery-keys";
import { logUserActivity } from "@/lib/audit/audit-logger";
import { setupLaunchSchema, DISALLOWED_PRESEEDED_DATA, isPreseededPhone } from "@/lib/validation/brand-setup";

interface SetupLaunchPayload {
  branding: {
    propertyName: string;
    propertyTagline?: string;
    rentalArchetype?: "apartment" | "dormitory" | "boarding_house" | null;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string | null;
    propertyAddress?: string;
    totalUnits?: string | number;
  };
  admin?: {
    fullName?: string;
    email?: string;
    password?: string;
    phone?: string;
  };
}

/**
 * POST /api/setup/launch
 * Atomic endpoint for Turnkey Landlord claiming & first-run workspace completion.
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    if (authContext.userRole !== "landlord" && authContext.userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only landlords and administrators can claim and launch workspace setup." },
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

    const validationResult = setupLaunchSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const path = issue.path.join(".");
        fieldErrors[path] = issue.message;
      }
      return NextResponse.json(
        {
          error: "Validation failed: Please check your input fields.",
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const body = validationResult.data;
    const adminClient = createServiceRoleSupabaseClient();
    const timestamp = new Date().toISOString();

    const propertyName = body.branding.propertyName;
    const propertyTagline = body.branding.propertyTagline || DEFAULT_BRANDING.propertyTagline;
    const rentalArchetype = body.branding.rentalArchetype || null;
    const primaryColor = body.branding.primaryColor;
    const secondaryColor = body.branding.secondaryColor;
    const logoUrl = body.branding.logoUrl || null;
    const propertyAddress = body.branding.propertyAddress;
    const totalUnitsCount = body.branding.totalUnits;


    // 1. Account Claiming: Update Supabase Auth Credentials if requested
    const adminFullName = body.admin?.fullName?.trim();
    const adminPhone = body.admin?.phone?.trim();

    const newPassword = body.admin?.password?.trim();
    const newEmail = body.admin?.email?.trim();

    const hasPasswordUpdate = Boolean(newPassword && newPassword.length >= 6 && !newPassword.includes("•"));
    const hasEmailUpdate = Boolean(newEmail && newEmail.includes("@") && !newEmail.includes("turnkey.local") && newEmail !== authContext.userEmail);

    if (hasPasswordUpdate || hasEmailUpdate) {
      const authUpdates: { password?: string; email?: string; user_metadata: Record<string, any> } = {
        user_metadata: {
          role: "landlord",
          is_account_claimed: true,
          is_setup_completed: true,
          setup_completed: true,
          ...(adminFullName ? { full_name: adminFullName } : {}),
        },
      };

      if (hasPasswordUpdate && newPassword) {
        authUpdates.password = newPassword;
      }
      if (hasEmailUpdate && newEmail) {
        authUpdates.email = newEmail;
      }

      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
        userId,
        authUpdates
      );
      if (authUpdateError) {
        console.warn("[Setup Launch] Failed updating auth credentials:", authUpdateError.message);
        return NextResponse.json(
          { error: `Failed to update account email: ${authUpdateError.message}` },
          { status: 400 }
        );
      } else if (hasPasswordUpdate && newPassword) {
        const targetEmail = newEmail || authContext.userEmail;
        if (targetEmail) {
          try {
            const authSupabase = await createServerSupabaseClient();
            await authSupabase.auth.signInWithPassword({
              email: targetEmail,
              password: newPassword,
            });
          } catch {
            // Non-critical session refresh; credentials already updated via admin client
          }
        }
      }
    }

    // 3. Brand & Setup Completion Metadata
    const brandingMeta = {
      propertyName,
      propertyTagline,
      rentalArchetype,
      primaryColor,
      secondaryColor,
      logoUrl,
      bannerUrl: null,
      setup_completed: true,
      setup_completed_at: timestamp,
    };

    // Fetch existing profile socials to preserve any preexisting social handles
    let existingSocials: Record<string, unknown> = {};
    try {
      const { data: currentProfile } = await adminClient
        .from("profiles")
        .select("socials")
        .eq("id", userId)
        .maybeSingle();
      if (currentProfile?.socials && typeof currentProfile.socials === "object") {
        existingSocials = currentProfile.socials as Record<string, unknown>;
      }
    } catch {
      // Fallback safely if select query is unavailable in testing mocks
    }
    const updatedSocials = {
      ...existingSocials,
      branding: brandingMeta,
    };

    const effectiveEmail = newEmail || (
      authContext.userEmail &&
      !authContext.userEmail.includes("turnkey.local") &&
      !DISALLOWED_PRESEEDED_DATA.emails.includes(authContext.userEmail.toLowerCase().trim())
        ? authContext.userEmail.toLowerCase().trim()
        : undefined
    );

    const effectivePhone = adminPhone && !isPreseededPhone(adminPhone) ? adminPhone : undefined;
    let shouldClearPhone = Boolean(adminPhone && isPreseededPhone(adminPhone));

    if (!adminPhone) {
      try {
        const { data: curProf } = await adminClient
          .from("profiles")
          .select("phone")
          .eq("id", userId)
          .maybeSingle();
        if (isPreseededPhone(curProf?.phone)) {
          shouldClearPhone = true;
        }
      } catch {
        // ignore
      }
    }

    const profileUpdates: Record<string, unknown> = {
      business_name: propertyName,
      socials: updatedSocials,
      has_changed_password: true,
      updated_at: timestamp,
    };
    if (adminFullName) profileUpdates.full_name = adminFullName;
    if (effectivePhone) {
      profileUpdates.phone = effectivePhone;
    } else if (shouldClearPhone) {
      profileUpdates.phone = null;
    }
    if (effectiveEmail) profileUpdates.email = effectiveEmail;

    const { error: profileError } = await adminClient
      .from("profiles")
      .update(profileUpdates as any)
      .eq("id", userId);

    if (profileError) {
      console.warn("[Setup Launch] Failed updating profile record, attempting resilient update:", profileError.message);
      const fallbackUpdates: Record<string, unknown> = {
        business_name: propertyName,
        updated_at: timestamp,
      };
      if (adminFullName) fallbackUpdates.full_name = adminFullName;
      if (effectivePhone) {
        fallbackUpdates.phone = effectivePhone;
      } else if (shouldClearPhone) {
        fallbackUpdates.phone = null;
      }
      if (effectiveEmail) fallbackUpdates.email = effectiveEmail;
      const { error: fallbackError } = await adminClient
        .from("profiles")
        .update(fallbackUpdates as any)
        .eq("id", userId);
      if (fallbackError) {
        console.error("[Setup Launch] Resilient profile update failed:", fallbackError.message);
      }
    }

    // Clean up pre-seeded phone from profile_private if needed
    if (shouldClearPhone) {
      try {
        await (adminClient as any)
          .from("profile_private")
          .update({ phone: null, updated_at: timestamp })
          .eq("profile_id", userId);
      } catch {
        // ignore
      }
    }

    // 4. Update existing property branding if landlord already has an active property, otherwise do NOT auto-create a phantom property
    const { data: existingProperty } = await adminClient
      .from("properties")
      .select("id, map_decorations")
      .eq("landlord_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingProperty) {
      const currentDecorations =
        (existingProperty.map_decorations as Record<string, unknown>) || {};
      const newDecorations = {
        ...currentDecorations,
        branding: brandingMeta,
      };

      await adminClient
        .from("properties")
        .update({
          map_decorations: newDecorations as any,
          updated_at: timestamp,
        })
        .eq("landlord_id", userId);
    }

    // Always sync business brand to landlord_business_profiles
    await (adminClient as any)
      .from("landlord_business_profiles")
      .upsert(
        {
          profile_id: userId,
          business_name: propertyName,
          updated_at: timestamp,
        },
        { onConflict: "profile_id" }
      );

    // 5. Generate and encrypt initial single-use security recovery key for Landlord if not already present
    let plaintextSecurityKey: string | null = null;
    let hasExistingKey = false;
    try {
      const { data: existingSecSettings } = await (adminClient as any)
        .from("user_security_settings")
        .select("security_key_encrypted")
        .eq("profile_id", userId)
        .maybeSingle();
      if (existingSecSettings?.security_key_encrypted) {
        hasExistingKey = true;
      }
    } catch {
      // ignore
    }

    if (!hasExistingKey) {
      plaintextSecurityKey = generateSecurityKey();
      const encryptedKey = encryptSecurityKey(plaintextSecurityKey);

      await (adminClient as any)
        .from("user_security_settings")
        .upsert(
          {
            profile_id: userId,
            security_key_encrypted: encryptedKey.encrypted,
            security_key_iv: encryptedKey.iv,
            security_key_auth_tag: encryptedKey.authTag,
            security_key_updated_at: timestamp,
            security_key_failed_attempts: 0,
            security_key_locked_until: null,
            has_changed_password: true,
            updated_at: timestamp,
          },
          { onConflict: "profile_id" }
        );

      await logUserActivity({
        userId,
        userRole: "landlord",
        action: "security_key_generated",
        category: "security",
        title: "Security Recovery Key Created",
        description: "Landlord initial security recovery key generated during workspace launch.",
        severity: "info",
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Workspace personalization claimed and finalized successfully.",
      securityKey: plaintextSecurityKey,
      branding: {
        propertyName,
        propertyTagline,
        rentalArchetype,
        primaryColor,
        secondaryColor,
        logoUrl,
        setupCompleted: true,
        setupCompletedAt: timestamp,
      },
    });

    response.cookies.set("ireside_setup_completed", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("[POST /api/setup/launch] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during setup launch" },
      { status: 500 }
    );
  }
}
