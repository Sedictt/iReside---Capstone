import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLandlordCredentialsCopy, sendTenantOnboardingReminder } from "@/lib/email";
import { generateSigningLink } from "@/lib/jwt";
import {
    ensureOnboardingReadyForReminder,
    ensureTenantOnboardingState,
    registerReminderAttempt,
} from "@/lib/onboarding";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function generateTempPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const reminderErrorStatus = (reason: "completed" | "cooldown" | "daily_limit") => {
    if (reason === "completed") return 409;
    return 429;
};

export async function POST(_request: Request, context: { params: Promise<{ applicationId: string }> }) {
    const { applicationId } = await context.params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: application, error: appError } = await supabase
        .from("applications")
        .select(
            `
            id, 
            status, 
            applicant_name, 
            applicant_email,
            unit_id,
            unit:units (
                id,
                name,
                rent_amount,
                property:properties (
                    id,
                    name
                )
            )
        `
        )
        .eq("id", applicationId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (appError) {
        console.error("[resend-credentials] app fetch error:", appError);
        return NextResponse.json({ error: "Failed to load application." }, { status: 500 });
    }
    if (!application) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }
    if (application.status !== "approved") {
        return NextResponse.json({ error: "Credentials can only be sent for approved applications." }, { status: 409 });
    }

    const tenantEmail = application.applicant_email?.trim();
    const tenantName = application.applicant_name?.trim() ?? "Tenant";
    if (!tenantEmail) {
        return NextResponse.json({ error: "No email address on file for this applicant." }, { status: 422 });
    }

    const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("email", tenantEmail)
        .maybeSingle();

    const accountExisted = Boolean(existingProfile?.id);
    let tenantId = existingProfile?.id ?? null;
    let tempPassword: string | null = null;
    let inviteUrl: string | null = null;

    if (accountExisted && tenantId) {
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: "recovery",
            email: tenantEmail,
        });
        if (linkError) {
            console.error("[resend-credentials] generateLink error:", linkError);
        } else {
            inviteUrl = linkData?.properties?.action_link ?? null;
        }

        tempPassword = generateTempPassword();
        await adminClient.auth.admin
            .updateUserById(tenantId, {
                password: tempPassword,
            })
            .catch((error) => console.error("[resend-credentials] updateUserById error:", error));
    } else {
        tempPassword = generateTempPassword();

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: tenantEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                full_name: tenantName,
                role: "tenant",
                onboarding_source: "walk_in_application",
                application_id: applicationId,
            },
        });

        if (createError || !newUser?.user) {
            console.error("[resend-credentials] createUser error:", createError);
            return NextResponse.json({ error: "Failed to create tenant account." }, { status: 500 });
        }

        tenantId = newUser.user.id;

        await adminClient
            .from("profiles")
            .upsert(
                {
                    id: tenantId,
                    full_name: tenantName,
                    email: tenantEmail,
                    role: "tenant" as const,
                },
                { onConflict: "id" }
            )
            .then(({ error }) => {
                if (error) console.error("[resend-credentials] profile upsert error:", error);
            });

        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: "recovery",
            email: tenantEmail,
        });
        if (linkError) {
            console.error("[resend-credentials] generateLink error:", linkError);
        } else {
            inviteUrl = linkData?.properties?.action_link ?? null;
        }
    }

    if (!tenantId) {
        return NextResponse.json({ error: "Unable to resolve tenant account." }, { status: 500 });
    }

    const onboardingState = await ensureTenantOnboardingState(adminClient as any, tenantId);
    const reminderEligibility = ensureOnboardingReadyForReminder(onboardingState);
    if (!reminderEligibility.eligible) {
        return NextResponse.json(
            {
                error:
                    reminderEligibility.reason === "completed"
                        ? "Tenant onboarding is already completed."
                        : "Reminder limit reached. Try again later.",
                code:
                    reminderEligibility.reason === "completed"
                        ? "ONBOARDING_ALREADY_COMPLETED"
                        : "REMINDER_THROTTLED",
                next_eligible_at: reminderEligibility.nextEligibleAt,
            },
            { status: reminderErrorStatus(reminderEligibility.reason) }
        );
    }

    const { data: landlordProfile } = await adminClient
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .maybeSingle();

    let signingLink: string | undefined;
    const { data: lease } = await adminClient
        .from("leases")
        .select("id, start_date, monthly_rent, status")
        .eq("tenant_id", tenantId)
        .eq("unit_id", application.unit_id)
        .maybeSingle();

    if (lease && (lease.status === "pending_signature" || lease.status === "pending_tenant_signature")) {
        signingLink = generateSigningLink(lease.id, tenantId);
    }

    const onboardingUrl = `${APP_URL}/tenant/onboarding`;

    try {
        await sendTenantOnboardingReminder({
            to: tenantEmail,
            tenantName,
            onboardingUrl,
            tempPassword,
            inviteUrl,
        });

        await registerReminderAttempt(adminClient as any, {
            tenantId,
            actorId: user.id,
            triggerSource: "manual",
            success: true,
            metadata: {
                application_id: applicationId,
                account_existed: accountExisted,
                has_signing_link: Boolean(signingLink),
            },
        });
    } catch (error) {
        console.error("[resend-credentials] send reminder error:", error);
        await registerReminderAttempt(adminClient as any, {
            tenantId,
            actorId: user.id,
            triggerSource: "manual",
            success: false,
            metadata: {
                application_id: applicationId,
                account_existed: accountExisted,
                error: error instanceof Error ? error.message : "unknown_send_error",
            },
        });
        return NextResponse.json({ error: "Failed to send email to tenant." }, { status: 500 });
    }

    if (landlordProfile?.email) {
        try {
            await sendLandlordCredentialsCopy({
                to: landlordProfile.email,
                landlordName: landlordProfile.full_name ?? "Landlord",
                tenantName,
                tenantEmail,
                tempPassword: tempPassword ?? "not-reset",
                inviteUrl,
            });
        } catch (error) {
            console.error("[resend-credentials] send landlord copy error:", error);
            // Non-fatal
        }
    }

    return NextResponse.json({
        success: true,
        email: tenantEmail,
        tempPassword,
        inviteUrl,
        accountExisted,
        onboarding_status: onboardingState.status,
    });
}
