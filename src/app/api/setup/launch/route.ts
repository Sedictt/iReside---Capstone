import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { DEFAULT_BRANDING, BrandConfig } from "@/context/BrandContext";
import { generateSecurityKey, encryptSecurityKey } from "@/lib/security/recovery-keys";
import { logUserActivity } from "@/lib/audit/audit-logger";
import { setupLaunchSchema } from "@/lib/validation/brand-setup";

interface SetupLaunchPayload {
  branding: {
    propertyName: string;
    propertyTagline?: string;
    rentalArchetype?: "apartment" | "dormitory" | "boarding_house";
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string | null;
    propertyAddress?: string;
    totalUnits?: string | number;
  };
  admin: {
    fullName: string;
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
    const rentalArchetype = body.branding.rentalArchetype;
    const primaryColor = body.branding.primaryColor;
    const secondaryColor = body.branding.secondaryColor;
    const logoUrl = body.branding.logoUrl || null;
    const propertyAddress = body.branding.propertyAddress;
    const totalUnitsCount = body.branding.totalUnits;


    // 1. Account Claiming: Update Supabase Auth Credentials if requested
    const updatesToAuth: { password?: string; email?: string } = {};
    const newPassword = body.admin?.password?.trim();
    if (newPassword && newPassword.length >= 6 && !newPassword.includes("•")) {
      updatesToAuth.password = newPassword;
    }

    const newEmail = body.admin?.email?.trim();
    if (newEmail && newEmail.includes("@") && !newEmail.includes("turnkey.local")) {
      updatesToAuth.email = newEmail;
    }

    if (Object.keys(updatesToAuth).length > 0) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
        userId,
        updatesToAuth
      );
      if (authUpdateError) {
        console.warn("[Setup Launch] Failed updating auth credentials:", authUpdateError.message);
      }
    }

    // 2. Account Profile Updates: Name, Phone & Business Name
    const adminFullName = body.admin?.fullName?.trim();
    const adminPhone = body.admin?.phone?.trim();

    const profileUpdates: Record<string, unknown> = {
      business_name: propertyName,
      updated_at: timestamp,
    };
    if (adminFullName) profileUpdates.full_name = adminFullName;
    if (adminPhone) profileUpdates.phone = adminPhone;
    if (newEmail) profileUpdates.email = newEmail;

    const { error: profileError } = await adminClient
      .from("profiles")
      .update(profileUpdates as any)
      .eq("id", userId);

    if (profileError) {
      console.warn("[Setup Launch] Failed updating profile record:", profileError.message);
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
        .eq("id", existingProperty.id);
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

    // 5. Generate and encrypt initial single-use security recovery key for Landlord
    const plaintextSecurityKey = generateSecurityKey();
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

    return NextResponse.json({
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
  } catch (error: any) {
    console.error("[POST /api/setup/launch] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during setup launch" },
      { status: 500 }
    );
  }
}
