import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApplicationStatus } from "@/types/database";
import { sendTenantCredentials, sendLandlordCredentialsCopy } from "@/lib/email";

type ActionBody = {
    status?: ApplicationStatus;
};

const ALLOWED_STATUSES: ApplicationStatus[] = ["reviewing", "approved", "rejected"];

const isAllowedStatus = (value: unknown): value is ApplicationStatus =>
    typeof value === "string" && ALLOWED_STATUSES.includes(value as ApplicationStatus);

/** Generate a random temporary password */
function generateTempPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(
    request: Request,
    context: { params: Promise<{ applicationId: string }> }
) {
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

    let body: ActionBody = {};
    try {
        body = (await request.json()) as ActionBody;
    } catch {
        body = {};
    }

    if (!isAllowedStatus(body.status)) {
        return NextResponse.json({ error: "Invalid application status." }, { status: 400 });
    }

    const { data: application, error: applicationError } = await supabase
        .from("applications")
        .select("id, status, applicant_name, applicant_email, applicant_phone")
        .eq("id", applicationId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (applicationError) {
        return NextResponse.json({ error: "Failed to load application." }, { status: 500 });
    }

    if (!application) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (application.status === "withdrawn") {
        return NextResponse.json({ error: "Application has been withdrawn." }, { status: 409 });
    }

    const reviewedAt = new Date().toISOString();
    const { error: updateError } = await supabase
        .from("applications")
        .update({
            status: body.status,
            reviewed_at: reviewedAt,
        })
        .eq("id", applicationId)
        .eq("landlord_id", user.id);

    if (updateError) {
        return NextResponse.json({ error: "Failed to update application status." }, { status: 500 });
    }

    // ── Auto-provision tenant account on approval ──────────────────────
    let tenantAccountInfo: {
        email: string;
        tempPassword: string;
        inviteUrl?: string;
        landlordNotified: boolean;
    } | null = null;

    if (body.status === "approved") {
        const tenantEmail = application.applicant_email?.trim();
        const tenantName = application.applicant_name?.trim() ?? "Tenant";

        if (tenantEmail) {
            try {
                // Check if user already exists
                const { data: existingUsers } = await adminClient.auth.admin.listUsers();
                const alreadyExists = existingUsers?.users?.some(
                    (u) => u.email?.toLowerCase() === tenantEmail.toLowerCase()
                );

                if (!alreadyExists) {
                    const tempPassword = generateTempPassword();

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

                    if (!createError && newUser?.user) {
                        await adminClient.from("profiles").upsert({
                            id: newUser.user.id,
                            full_name: tenantName,
                            email: tenantEmail,
                            role: "tenant",
                        }, { onConflict: "id" });

                        // Generate password reset link
                        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
                            type: "recovery",
                            email: tenantEmail,
                        });
                        if (linkError) {
                            console.error("[actions] generateLink error:", linkError);
                        }

                        const inviteUrl = linkData?.properties?.action_link ?? undefined;

                        // Fetch landlord profile
                        const { data: landlordProfile } = await adminClient
                            .from("profiles")
                            .select("email, full_name")
                            .eq("id", user.id)
                            .maybeSingle();

                        tenantAccountInfo = {
                            email: tenantEmail,
                            tempPassword,
                            inviteUrl,
                            landlordNotified: !!landlordProfile?.email,
                        };

                        // Send email to tenant via nodemailer
                        try {
                            await sendTenantCredentials({ to: tenantEmail, tenantName, tempPassword, inviteUrl });
                        } catch (e) {
                            console.error("[actions] sendTenantCredentials error:", e);
                        }

                        // Send copy to landlord
                        if (landlordProfile?.email) {
                            try {
                                await sendLandlordCredentialsCopy({
                                    to: landlordProfile.email,
                                    landlordName: landlordProfile.full_name ?? "Landlord",
                                    tenantName,
                                    tenantEmail,
                                    tempPassword,
                                    inviteUrl,
                                });
                            } catch (e) {
                                console.error("[actions] sendLandlordCredentialsCopy error:", e);
                            }
                        }
                    }
                } else {
                    tenantAccountInfo = {
                        email: tenantEmail,
                        tempPassword: "",
                        landlordNotified: false,
                    };
                }
            } catch {
                // Non-fatal — status update already succeeded
            }
        }
    }

    return NextResponse.json({
        success: true,
        status: body.status,
        reviewedAt,
        ...(tenantAccountInfo ? { tenantAccount: tenantAccountInfo } : {}),
    });
}
