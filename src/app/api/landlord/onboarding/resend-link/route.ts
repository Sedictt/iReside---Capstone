import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

const resendSchema = z.object({
    email: z.string().email("Valid email is required"),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = resendSchema.parse(body);

        const adminClient = createAdminClient();

        // Find the application
        const { data: application, error: appError } = await adminClient
            .from("landlord_applications")
            .select("*")
            .ilike("email", email.toLowerCase())
            .eq("status", "approved")
            .maybeSingle();

        if (appError || !application) {
            return NextResponse.json({ 
                error: "No approved application found for this email" 
            }, { status: 404 });
        }

        // Check if onboarding is already completed
        if (application.onboarding_completed_at) {
            return NextResponse.json({ 
                error: "Onboarding is already completed. Please log in." 
            }, { status: 400 });
        }

        // Generate new token
        const onboardingToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours

        // Update with new token
        const { error: updateError } = await adminClient
            .from("landlord_applications")
            .update({
                onboarding_token: onboardingToken,
                onboarding_token_expires_at: expiresAt,
                updated_at: new Date().toISOString(),
            })
            .eq("id", application.id);

        if (updateError) {
            console.error("[Resend] Failed to update token:", updateError);
            return NextResponse.json({ error: "Failed to generate new link" }, { status: 500 });
        }

        // Send new magic link email
        const onboardingUrl = process.env.NEXT_PUBLIC_BASE_URL 
            ? `${process.env.NEXT_PUBLIC_BASE_URL}/landlord/onboarding/${onboardingToken}` 
            : `https://ireside.app/landlord/onboarding/${onboardingToken}`;

        const expiresAtFormatted = new Date(expiresAt).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        const { sendLandlordOnboardingMagicLink } = await import("@/lib/email");
        
        await sendLandlordOnboardingMagicLink({
            to: application.email!,
            landlordName: application.full_name!,
            onboardingUrl,
            expiresAt: expiresAtFormatted,
        });

        return NextResponse.json({
            success: true,
            message: "New onboarding link has been sent to your email",
        });

    } catch (error: any) {
        console.error("[Resend] Error:", error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: "Invalid email address" 
            }, { status: 400 });
        }

        return NextResponse.json({ 
            error: error.message || "Failed to resend link" 
        }, { status: 500 });
    }
}