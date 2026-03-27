import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTenantCredentials, sendLandlordCredentialsCopy } from "@/lib/email";

function generateTempPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(
    _request: Request,
    context: { params: Promise<{ applicationId: string }> }
) {
    const { applicationId } = await context.params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify landlord owns this application
    const { data: application, error: appError } = await supabase
        .from("applications")
        .select("id, status, applicant_name, applicant_email")
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

    // Check if auth user already exists
    const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("email", tenantEmail)
        .maybeSingle();

    const accountExisted = !!existingProfile;
    let tempPassword: string | null = null;
    let inviteUrl: string | null = null;

    if (accountExisted) {
        // Generate a password reset link
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: "recovery",
            email: tenantEmail,
        });
        if (linkError) {
            console.error("[resend-credentials] generateLink error:", linkError);
        } else {
            inviteUrl = linkData?.properties?.action_link ?? null;
        }
        // For existing users, generate a new temp password so landlord has something to share
        tempPassword = generateTempPassword();
        // Update their password
        if (existingProfile?.id) {
            await adminClient.auth.admin.updateUserById(existingProfile.id, {
                password: tempPassword,
            }).catch((e) => console.error("[resend-credentials] updateUserById error:", e));
        }
    } else {
        // Create new account
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

        await adminClient.from("profiles").upsert({
            id: newUser.user.id,
            full_name: tenantName,
            email: tenantEmail,
            role: "tenant" as const,
        }, { onConflict: "id" }).then(({ error }) => {
            if (error) console.error("[resend-credentials] profile upsert error:", error);
        });

        // Generate a password reset link
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

    // Fetch landlord profile for the copy email
    const { data: landlordProfile } = await adminClient
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .maybeSingle();

    // Send email to tenant via nodemailer
    try {
        await sendTenantCredentials({
            to: tenantEmail,
            tenantName,
            tempPassword: tempPassword!,
            inviteUrl,
        });
    } catch (e) {
        console.error("[resend-credentials] sendTenantCredentials error:", e);
        return NextResponse.json({ error: "Failed to send email to tenant." }, { status: 500 });
    }

    // Send copy to landlord
    if (landlordProfile?.email) {
        try {
            await sendLandlordCredentialsCopy({
                to: landlordProfile.email,
                landlordName: landlordProfile.full_name ?? "Landlord",
                tenantName,
                tenantEmail,
                tempPassword: tempPassword!,
                inviteUrl,
            });
        } catch (e) {
            console.error("[resend-credentials] sendLandlordCredentialsCopy error:", e);
            // Non-fatal
        }
    }

    return NextResponse.json({
        success: true,
        email: tenantEmail,
        tempPassword,
        inviteUrl,
        accountExisted,
    });
}
