import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { sendEmailVerificationOTP } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

const sendOtpSchema = z.object({
  newEmail: z.string().trim().email("Please provide a valid email address."),
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

    const validation = sendOtpSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid email address" },
        { status: 400 }
      );
    }

    const newEmail = validation.data.newEmail.toLowerCase();
    const adminClient = createServiceRoleSupabaseClient();

    // Verify this email is not already claimed by a DIFFERENT profile
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .ilike("email", newEmail)
      .neq("id", userId)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: "This email address is already linked to another account." },
        { status: 409 }
      );
    }

    // Generate 6-digit OTP and 10-minute expiry
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store OTP in user_security_settings for the user
    await (adminClient as any)
      .from("user_security_settings")
      .upsert(
        {
          profile_id: userId,
          otp_code: otpCode,
          otp_expiry: expiresAt,
          two_factor_email: newEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id" }
      );

    console.info(`[Setup Email OTP] Generated code for user ${userId} -> ${newEmail}: ${otpCode}`);

    // Dispatch verification email
    try {
      await sendEmailVerificationOTP({
        to: newEmail,
        otp: otpCode,
      });
    } catch (emailErr: any) {
      console.error("[Setup Email OTP] Failed to send email via provider:", emailErr?.message);
      // In dev or prototype environment, don't completely crash if email service fails
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${newEmail}.`,
    });
  } catch (err: any) {
    console.error("[POST /api/setup/email/send-otp] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send verification code." },
      { status: 500 }
    );
  }
}
