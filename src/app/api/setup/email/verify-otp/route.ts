import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { logUserActivity } from "@/lib/audit/audit-logger";
import { z } from "zod";

const verifyOtpSchema = z.object({
  newEmail: z.string().trim().email("Please provide a valid email address."),
  otp: z.string().trim().length(6, "Verification code must be exactly 6 digits."),
});

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, userRole } = authContext;

    if (userRole !== "landlord" && userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only landlords can verify and link account emails." },
        { status: 403 }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const validation = verifyOtpSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid input fields." },
        { status: 400 }
      );
    }

    const { newEmail, otp } = validation.data;
    const normalizedEmail = newEmail.toLowerCase();
    const adminClient = createServiceRoleSupabaseClient();

    // Fetch stored OTP settings
    const { data: securitySettings, error: fetchErr } = await (adminClient as any)
      .from("user_security_settings")
      .select("otp_code, otp_expiry, two_factor_email")
      .eq("profile_id", userId)
      .maybeSingle();

    if (fetchErr || !securitySettings) {
      return NextResponse.json(
        { error: "No pending email verification code found. Please request a new code." },
        { status: 400 }
      );
    }

    // Check email match
    if (securitySettings.two_factor_email?.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { error: "Verification email mismatch. Please request a new code." },
        { status: 400 }
      );
    }

    // Check code match
    if (securitySettings.otp_code !== otp) {
      return NextResponse.json(
        { error: "Incorrect verification code. Please check and try again." },
        { status: 400 }
      );
    }

    // Check expiration
    if (!securitySettings.otp_expiry || new Date() > new Date(securitySettings.otp_expiry)) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // 1. Officially update Supabase Auth User Email & confirm it
    const { error: authUpdateErr } = await adminClient.auth.admin.updateUserById(
      userId,
      {
        email: normalizedEmail,
        email_confirm: true,
      }
    );

    if (authUpdateErr) {
      console.error("[Setup Verify OTP] Failed updating auth email:", authUpdateErr.message);
      return NextResponse.json(
        { error: "Failed to link email in authentication service: " + authUpdateErr.message },
        { status: 500 }
      );
    }

    // 2. Officially update Profile email
    const { error: profileErr } = await adminClient
      .from("profiles")
      .update({
        email: normalizedEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileErr) {
      console.warn("[Setup Verify OTP] Failed updating profiles table email:", profileErr.message);
    }

    // 3. Clear OTP from security settings
    await (adminClient as any)
      .from("user_security_settings")
      .update({
        otp_code: null,
        otp_expiry: null,
        two_factor_email: null,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", userId);

    // 4. Audit logging
    await logUserActivity({
      userId,
      userRole: "landlord",
      action: "email_updated",
      category: "security",
      title: "Email Address Linked",
      description: `Landlord successfully verified and linked new email address ${normalizedEmail} via OTP.`,
      severity: "info",
    });

    return NextResponse.json({
      success: true,
      message: `Email address ${normalizedEmail} has been successfully verified and linked.`,
      email: normalizedEmail,
    });
  } catch (err: any) {
    console.error("[POST /api/setup/email/verify-otp] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to verify code." },
      { status: 500 }
    );
  }
}
