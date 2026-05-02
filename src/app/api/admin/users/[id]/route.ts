import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const adminClient = createAdminClient();

        // Get user profile
        const { data: profile, error: profileError } = await adminClient
            .from("profiles")
            .select("*")
            .eq("id", id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get landlord application if user is a landlord
        let application = null;
        if (profile.role === "landlord") {
            const { data: appData } = await adminClient
                .from("landlord_applications")
                .select(`
                    *,
                    landlord:profiles!landlord_applications_profile_id_fkey(full_name, email, phone)
                `)
                .eq("profile_id", id)
                .maybeSingle();

            if (appData) {
                application = appData;
            }
        }

        return NextResponse.json({
            profile,
            application,
        });

    } catch (error) {
        console.error("Failed to get user details:", error);
        return NextResponse.json({ error: "Failed to get user details" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action } = body;

        const adminClient = createAdminClient();

        if (action === "resend_onboarding") {
            // Get the user's profile and application
            const { data: profile } = await adminClient
                .from("profiles")
                .select("email, full_name")
                .eq("id", id)
                .single();

            if (!profile) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            // Get the landlord application
            const { data: application } = await adminClient
                .from("landlord_applications")
                .select("id, onboarding_token, onboarding_token_expires_at")
                .eq("profile_id", id)
                .maybeSingle();

            if (!application) {
                return NextResponse.json({ error: "No landlord application found" }, { status: 404 });
            }

            // Generate new onboarding token (72 hours expiry)
            const crypto = await import("crypto");
            const onboardingToken = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

            // Update application with new token and clear completion status
            const { error: updateError } = await adminClient
                .from("landlord_applications")
                .update({
                    onboarding_token: onboardingToken,
                    onboarding_token_expires_at: expiresAt,
                    onboarding_completed_at: null, // Reset completion status
                    updated_at: new Date().toISOString(),
                })
                .eq("id", application.id);

            if (updateError) {
                console.error("Failed to update onboarding token:", updateError);
                return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
            }

            // Send the onboarding email
            const { sendLandlordOnboardingMagicLink } = await import("@/lib/email");
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ireside.app";
            const onboardingUrl = `${baseUrl}/landlord/onboarding/${onboardingToken}`;

            const expiresAtFormatted = new Date(expiresAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });

            await sendLandlordOnboardingMagicLink({
                to: profile.email,
                landlordName: profile.full_name,
                onboardingUrl,
                expiresAt: expiresAtFormatted,
            });

            return NextResponse.json({ success: true, message: "Onboarding email sent" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Failed to perform action:", error);
        return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
    }
}