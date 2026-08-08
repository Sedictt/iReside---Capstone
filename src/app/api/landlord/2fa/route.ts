import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRegistrationOTP } from "@/lib/email";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/landlord/2fa/callback";
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

type TwoFactorSettings = {
    two_factor_enabled?: boolean | null;
    two_factor_email?: string | null;
    otp_code?: string | null;
    otp_expiry?: string | null;
};

type GmailToken = {
    access_token?: string | null;
    refresh_token?: string | null;
    token_expiry?: string | null;
};

async function getTwoFactorState(adminClient: ReturnType<typeof createAdminClient>, userId: string) {
    const [{ data: profile }, { data: settings }, { data: gmailToken }] = await Promise.all([
        adminClient
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .maybeSingle(),
        (adminClient as any)
            .from("user_security_settings")
            .select("two_factor_enabled, two_factor_email, otp_code, otp_expiry")
            .eq("profile_id", userId)
            .maybeSingle(),
        (adminClient as any)
            .from("external_account_tokens")
            .select("access_token, refresh_token, token_expiry")
            .eq("profile_id", userId)
            .eq("provider", "gmail")
            .maybeSingle(),
    ]);

    return {
        profile,
        settings: settings as TwoFactorSettings | null,
        gmailToken: gmailToken as GmailToken | null,
    };
}

async function upsertTwoFactorSettings(
    adminClient: ReturnType<typeof createAdminClient>,
    userId: string,
    values: Partial<TwoFactorSettings>,
) {
    return (adminClient as any)
        .from("user_security_settings")
        .upsert({
            profile_id: userId,
            ...values,
            updated_at: new Date().toISOString(),
        }, { onConflict: "profile_id" });
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    if (action === "status") {
        const adminClient = createAdminClient();
        const { profile, settings, gmailToken } = await getTwoFactorState(adminClient, userId);

        return NextResponse.json({
            enabled: settings?.two_factor_enabled || false,
            email: settings?.two_factor_email || null,
            hasGmailConnected: !!gmailToken?.access_token,
            userEmail: profile?.email,
        });
    }

    if (action === "google-auth") {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
        }

        const state = Buffer.from(JSON.stringify({ userId: userId })).toString("base64");
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
            const callbackUserId = decoded.userId || userId;

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

            const [{ error: tokenError }, { error: settingsError }] = await Promise.all([
                (adminClient as any)
                    .from("external_account_tokens")
                    .upsert({
                        profile_id: userId,
                        provider: "gmail",
                        access_token: tokens.access_token,
                        refresh_token: tokens.refresh_token,
                        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                        updated_at: new Date().toISOString(),
                    }, { onConflict: "profile_id,provider" }),
                upsertTwoFactorSettings(adminClient, userId, {
                    two_factor_email: profile?.email,
                }),
            ]);

            if (tokenError || settingsError) {
                console.error("[2fa-callback] 2FA state update error:", tokenError || settingsError);
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
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const adminClient = createAdminClient();
    const { profile, settings, gmailToken } = await getTwoFactorState(adminClient, userId);

    if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "send-otp") {
        if (!gmailToken?.access_token) {
            return NextResponse.json({ error: "Gmail not connected. Please connect Gmail first." }, { status: 400 });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        const { error: updateError } = await upsertTwoFactorSettings(adminClient, userId, {
            otp_code: otp,
            otp_expiry: otpExpiry,
        });

        if (updateError) {
            console.error("[2fa-send-otp] Update error:", updateError);
            return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
        }

        const existingEmail = settings?.two_factor_email || profile.email;
        
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

        if (!gmailToken?.access_token) {
            return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
        }

        const now = new Date();
        const otpExpiry = settings?.otp_expiry ? new Date(settings.otp_expiry) : null;

        if (!settings?.otp_code || !otpExpiry || now > otpExpiry) {
            return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
        }

        if (settings.otp_code !== otp) {
            return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
        }

        const existingEmail = settings.two_factor_email || profile.email;

        const { error: enableError } = await upsertTwoFactorSettings(adminClient, userId, {
            two_factor_enabled: true,
            two_factor_email: existingEmail,
            otp_code: null,
            otp_expiry: null,
        });

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

        const [{ error: settingsError }, { error: tokenError }] = await Promise.all([
            upsertTwoFactorSettings(adminClient, userId, {
                two_factor_enabled: false,
                two_factor_email: null,
                otp_code: null,
                otp_expiry: null,
            }),
            (adminClient as any)
                .from("external_account_tokens")
                .delete()
                .eq("profile_id", userId)
                .eq("provider", "gmail"),
        ]);

        if (settingsError || tokenError) {
            console.error("[2fa-disable] Disable error:", settingsError || tokenError);
            return NextResponse.json({ error: "Failed to disable 2FA" }, { status: 500 });
        }

        return NextResponse.json({ message: "2FA disabled successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
