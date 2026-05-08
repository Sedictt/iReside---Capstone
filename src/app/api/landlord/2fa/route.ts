import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRegistrationOTP } from "@/lib/email";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/landlord/2fa/callback";
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "status") {
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
            .from("profiles")
            .select("email, two_factor_enabled, two_factor_email, gmail_access_token")
            .eq("id", user.id)
            .maybeSingle();

        return NextResponse.json({
            enabled: profile?.two_factor_enabled || false,
            email: profile?.two_factor_email || null,
            hasGmailConnected: !!profile?.gmail_access_token,
            userEmail: profile?.email,
        });
    }

    if (action === "google-auth") {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
        }

        const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64");
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${GOOGLE_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
            `&response_type=code` +
            `&scope=openid email profile` +
            `&access_type=offline` +
            `&prompt=consent` +
            `&state=${state}`;

        return NextResponse.json({ authUrl });
    }

    if (action === "callback") {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=oauth_failed`);
        }

        if (!code) {
            return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=missing_code`);
        }

        try {
            const state = searchParams.get("state");
            const decoded = state ? JSON.parse(Buffer.from(state, "base64").toString()) : {};
            const userId = decoded.userId || user.id;

            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: GOOGLE_CLIENT_ID!,
                    client_secret: GOOGLE_CLIENT_SECRET!,
                    code,
                    grant_type: "authorization_code",
                    redirect_uri: GOOGLE_REDIRECT_URI,
                }),
            });

            const tokens = await tokenResponse.json();

            if (tokens.error) {
                console.error("[2fa-callback] Token exchange error:", tokens.error);
                return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=token_exchange_failed`);
            }

            const adminClient = createAdminClient();
            const { data: profile } = await adminClient
                .from("profiles")
                .select("email")
                .eq("id", userId)
                .maybeSingle();

            const { error: updateError } = await adminClient
                .from("profiles")
                .update({
                    gmail_access_token: tokens.access_token,
                    gmail_refresh_token: tokens.refresh_token,
                    gmail_token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                    two_factor_email: profile?.email,
                })
                .eq("id", userId);

            if (updateError) {
                console.error("[2fa-callback] Profile update error:", updateError);
                return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=save_failed`);
            }

            return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&gmail_connected=true`);
        } catch (err) {
            console.error("[2fa-callback] Error:", err);
            return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=callback_failed`);
        }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
        .from("profiles")
        .select("email, two_factor_enabled, two_factor_email, gmail_access_token, otp_code, otp_expiry")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "send-otp") {
        if (!profile.gmail_access_token) {
            return NextResponse.json({ error: "Gmail not connected. Please connect Gmail first." }, { status: 400 });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        const { error: updateError } = await adminClient
            .from("profiles")
            .update({
                otp_code: otp,
                otp_expiry: otpExpiry,
            })
            .eq("id", user.id);

        if (updateError) {
            console.error("[2fa-send-otp] Update error:", updateError);
            return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
        }

        const existingEmail = profile.two_factor_email || profile.email;
        
        try {
            await sendRegistrationOTP({
                to: existingEmail,
                otp,
            });
        } catch (err) {
            console.error("[2fa-send-otp] Email error:", err);
            return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 });
        }

        return NextResponse.json({ 
            message: "OTP sent to your email",
            email: existingEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
        });
    }

    if (action === "verify-otp") {
        const { otp } = body;

        if (!otp || otp.length !== 6) {
            return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
        }

        if (!profile.gmail_access_token) {
            return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
        }

        const now = new Date();
        const otpExpiry = profile.otp_expiry ? new Date(profile.otp_expiry) : null;

        if (!profile.otp_code || !otpExpiry || now > otpExpiry) {
            return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
        }

        if (profile.otp_code !== otp) {
            return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
        }

        const existingEmail = profile.two_factor_email || profile.email;

        const { error: enableError } = await adminClient
            .from("profiles")
            .update({
                two_factor_enabled: true,
                two_factor_email: existingEmail,
                otp_code: null,
                otp_expiry: null,
            })
            .eq("id", user.id);

        if (enableError) {
            console.error("[2fa-verify-otp] Enable error:", enableError);
            return NextResponse.json({ error: "Failed to enable 2FA" }, { status: 500 });
        }

        return NextResponse.json({ 
            message: "2FA enabled successfully",
            email: existingEmail,
        });
    }

    if (action === "disable") {
        const { password } = body;

        if (!password) {
            return NextResponse.json({ error: "Password required" }, { status: 400 });
        }

        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: profile.email,
            password,
        });

        if (verifyError) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        const { error: disableError } = await adminClient
            .from("profiles")
            .update({
                two_factor_enabled: false,
                two_factor_email: null,
                gmail_access_token: null,
                gmail_refresh_token: null,
                gmail_token_expiry: null,
                otp_code: null,
                otp_expiry: null,
            })
            .eq("id", user.id);

        if (disableError) {
            console.error("[2fa-disable] Disable error:", disableError);
            return NextResponse.json({ error: "Failed to disable 2FA" }, { status: 500 });
        }

        return NextResponse.json({ message: "2FA disabled successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}