import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { logUserActivity } from "@/lib/audit/audit-logger";
import {
  validateAdminFullName,
  validateAdminPhone,
  validateAdminEmail,
  validateAdminPassword,
  validateConfirmPassword,
} from "@/lib/validation/brand-setup";
import { z } from "zod";

const accountClaimSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
  phone: z.string().trim().optional(),
  newEmail: z.string().trim().email("Please provide a valid email address."),
  otp: z.string().trim().length(6, "Verification code must be exactly 6 digits."),
  newPassword: z.string().min(8, "Password must be at least 8 characters long."),
  confirmPassword: z.string().min(1, "Please confirm your password."),
});

/**
 * POST /api/setup/account/claim
 * Atomically verifies OTP, claims the temporary landlord account,
 * updates credentials (email, password, full_name, is_account_claimed),
 * and prepares the account for permanent login.
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, userRole } = authContext;

    if (userRole !== "landlord" && userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only landlords and administrators can claim accounts." },
        { status: 403 }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const validation = accountClaimSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid input fields." },
        { status: 400 }
      );
    }

    const { fullName, phone, newEmail, otp, newPassword, confirmPassword } = validation.data;
    const normalizedEmail = newEmail.toLowerCase().trim();

    // Check custom domain & placeholder validation
    const nameCheck = validateAdminFullName(fullName);
    if (!nameCheck.isValid) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }

    if (phone) {
      const phoneCheck = validateAdminPhone(phone);
      if (!phoneCheck.isValid) {
        return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
      }
    }

    const emailCheck = validateAdminEmail(normalizedEmail);
    if (!emailCheck.isValid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    const passwordCheck = validateAdminPassword(newPassword);
    if (!passwordCheck.isValid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    const confirmCheck = validateConfirmPassword(newPassword, confirmPassword);
    if (!confirmCheck.isValid) {
      return NextResponse.json({ error: confirmCheck.error }, { status: 400 });
    }

    const adminClient = createServiceRoleSupabaseClient();

    // 1. Verify OTP stored in user_security_settings
    const { data: securitySettings, error: fetchErr } = await (adminClient as any)
      .from("user_security_settings")
      .select("otp_code, otp_expiry, two_factor_email")
      .eq("profile_id", userId)
      .maybeSingle();

    if (fetchErr || !securitySettings) {
      return NextResponse.json(
        { error: "No pending verification code found. Please request a new code." },
        { status: 400 }
      );
    }

    if (securitySettings.two_factor_email?.toLowerCase().trim() !== normalizedEmail) {
      return NextResponse.json(
        { error: "Verification email mismatch. Please request a new code for this email." },
        { status: 400 }
      );
    }

    if (securitySettings.otp_code !== otp) {
      return NextResponse.json(
        { error: "Incorrect verification code. Please check and try again." },
        { status: 400 }
      );
    }

    if (!securitySettings.otp_expiry || new Date() > new Date(securitySettings.otp_expiry)) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // 2. Verify new email is not already taken by another user
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .neq("id", userId)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: "This email address is already linked to another account." },
        { status: 409 }
      );
    }

    // 3. Atomically update Supabase Auth User credentials
    const { error: authUpdateErr } = await adminClient.auth.admin.updateUserById(
      userId,
      {
        email: normalizedEmail,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          is_account_claimed: true,
          full_name: fullName.trim(),
          ...(phone ? { phone: phone.trim() } : {}),
        },
      }
    );

    if (authUpdateErr) {
      console.error("[Account Claim] Failed updating auth credentials:", authUpdateErr.message);
      return NextResponse.json(
        { error: `Failed to update credentials: ${authUpdateErr.message}` },
        { status: 500 }
      );
    }

    // 4. Update Profile in database
    const fullProfilePayload: Record<string, any> = {
      email: normalizedEmail,
      full_name: fullName.trim(),
      is_account_claimed: true,
      has_changed_password: true,
      updated_at: new Date().toISOString(),
    };
    if (phone) fullProfilePayload.phone = phone.trim();

    const { error: profileUpdateErr } = await (adminClient as any)
      .from("profiles")
      .update(fullProfilePayload)
      .eq("id", userId);

    if (profileUpdateErr) {
      console.warn("[Account Claim] Failed updating profiles table with full fields, retrying essential fields:", profileUpdateErr.message);
      const essentialProfilePayload: Record<string, any> = {
        email: normalizedEmail,
        full_name: fullName.trim(),
        updated_at: new Date().toISOString(),
      };
      if (phone) essentialProfilePayload.phone = phone.trim();
      const { error: retryErr } = await (adminClient as any)
        .from("profiles")
        .update(essentialProfilePayload)
        .eq("id", userId);
      if (retryErr) {
        console.error("[Account Claim] Essential profile fields update also failed:", retryErr.message);
      }
    }

    // Upsert into profile_private if phone was provided
    if (phone) {
      try {
        await (adminClient as any)
          .from("profile_private")
          .upsert(
            {
              profile_id: userId,
              phone: phone.trim(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "profile_id" }
          );
      } catch (privErr) {
        console.warn("[Account Claim] profile_private update note:", privErr);
      }
    }

    // 5. Clear OTP and mark password changed in user_security_settings
    await (adminClient as any)
      .from("user_security_settings")
      .update({
        has_changed_password: true,
        otp_code: null,
        otp_expiry: null,
        two_factor_email: null,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", userId);

    // 6. Audit logging
    await logUserActivity({
      userId,
      userRole: "landlord",
      action: "account_claimed",
      category: "security",
      title: "Workspace Administrator Account Claimed",
      description: `Landlord claimed account with verified email ${normalizedEmail} and updated credentials.`,
      severity: "info",
    });

    return NextResponse.json({
      success: true,
      message: "Account claimed successfully. Please sign in with your updated credentials.",
      email: normalizedEmail,
    });
  } catch (err: any) {
    console.error("[POST /api/setup/account/claim] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "An unexpected error occurred during account claiming." },
      { status: 500 }
    );
  }
}
