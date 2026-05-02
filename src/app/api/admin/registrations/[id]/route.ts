import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApplicationStatus, UserRole } from "@/types/database";
import crypto from "crypto";

const MUTABLE_STATUSES: ApplicationStatus[] = ["pending", "reviewing", "approved", "rejected"];

interface RegistrationRecord {
    id: string;
    profile_id: string;
    phone: string;
    email: string | null;
    full_name: string | null;
    status: ApplicationStatus;
    business_name?: string | null;
    business_address?: string | null;
    verification_status?: string | null;
    verification_data?: unknown | null;
    verification_checked_at?: string | null;
    verification_notes?: string | null;
}

async function assertAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) return { user: null, error: "Unauthorized" as const };

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).maybeSingle();

    if (profile?.role !== "admin") return { user: null, error: "Forbidden" as const };

    return { user, error: null };
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const auth = await assertAdmin();
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const status = body?.status as ApplicationStatus | undefined;
    const adminNotes =
        typeof body?.adminNotes === "string"
            ? body.adminNotes.trim()
            : body?.adminNotes == null
              ? null
              : undefined;

    if (!status || !MUTABLE_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid registration status." }, { status: 400 });
    }

    if (adminNotes === undefined) {
        return NextResponse.json({ error: "Invalid admin notes." }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: registration, error: registrationError } = await adminClient
        .from("landlord_applications")
        .select(`
            id,
            profile_id,
            phone,
            email,
            full_name,
            status,
            business_name,
            business_address,
            verification_status,
            verification_data,
            verification_checked_at,
            verification_notes
        `)
        .eq("id", id)
        .maybeSingle();

    if (registrationError || !registration) {
        return NextResponse.json({ error: "Registration not found." }, { status: 404 });
    }

    const typedRegistration = registration as RegistrationRecord;
    const { data: applicant, error: applicantError } = await adminClient
        .from("profiles")
        .select("id, full_name, email, avatar_url, role, phone")
        .eq("id", typedRegistration.profile_id)
        .maybeSingle();

    if (applicantError || !applicant) {
        return NextResponse.json({ error: "Failed to load the applicant profile." }, { status: 500 });
    }

    const previousRole = (applicant?.role as UserRole | undefined) ?? "tenant";

    if (registration.status === "approved" && status !== "approved") {
        return NextResponse.json(
            { error: "Approved registrations cannot be downgraded automatically because the account has already been promoted." },
            { status: 409 }
        );
    }

    // Generate onboarding token for new landlords (without existing auth account)
    if (status === "approved" && previousRole !== "landlord") {
        const timestamp = new Date().toISOString();
        
        // Generate unique onboarding token (72-hour expiry)
        const onboardingToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours
        
        // Update application with onboarding token
        // Note: Profile and auth user will be created during onboarding flow
        const { error: tokenError } = await adminClient
            .from("landlord_applications")
            .update({
                onboarding_token: onboardingToken,
                onboarding_token_expires_at: expiresAt,
                updated_at: timestamp,
            })
            .eq("id", id);

        if (tokenError) {
            console.error("[Admin Registration] Failed to generate onboarding token:", tokenError);
            // Continue - don't fail the approval
        }

        // Send onboarding magic link email (instead of immediate login)
        const targetEmail = typedRegistration.email || applicant?.email;
        const targetName = typedRegistration.full_name || applicant?.full_name;

        console.log(`[Admin Registration] Attempting to send onboarding email to ${targetEmail} (${targetName})`);

        if (targetEmail && targetName) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ireside.app";
            const onboardingUrl = `${baseUrl}/landlord/onboarding/${onboardingToken}`;
            
            const expiresAtFormatted = new Date(expiresAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
            
            // Send email
            try {
                const { sendLandlordOnboardingMagicLink } = await import("@/lib/email");
                await sendLandlordOnboardingMagicLink({
                    to: targetEmail,
                    landlordName: targetName,
                    onboardingUrl,
                    expiresAt: expiresAtFormatted,
                });
                console.log(`[Admin Registration] Onboarding email sent successfully to ${targetEmail}`);
            } catch (emailError) {
                console.error("[Admin Registration] Failed to send onboarding email:", emailError);
            }
        } else {
            console.warn("[Admin Registration] Could not send onboarding email: email or name missing", { targetEmail, targetName });
        }
    }

    const { data: updatedRegistration, error: updateError } = await adminClient
        .from("landlord_applications")
        .update({
            status,
            admin_notes: adminNotes,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(`
            id,
            profile_id,
            phone,
            identity_document_url,
            ownership_document_url,
            liveness_document_url,
            status,
            admin_notes,
            business_name,
            business_address,
            verification_status,
            verification_data,
            verification_checked_at,
            verification_notes,
            created_at,
            updated_at
        `)
        .maybeSingle();

    if (updateError || !updatedRegistration) {
        return NextResponse.json({ error: "Failed to update the registration." }, { status: 500 });
    }

    const { data: refreshedApplicant, error: refreshedApplicantError } = await adminClient
        .from("profiles")
        .select("id, full_name, email, avatar_url, role")
        .eq("id", typedRegistration.profile_id)
        .maybeSingle();

    if (refreshedApplicantError || !refreshedApplicant) {
        return NextResponse.json({ error: "Failed to refresh the applicant profile." }, { status: 500 });
    }

    return NextResponse.json({
        registration: {
            ...updatedRegistration,
            applicant: refreshedApplicant,
        },
    });
}
