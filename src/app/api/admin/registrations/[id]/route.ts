import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApplicationStatus, UserRole } from "@/types/database";

const MUTABLE_STATUSES: ApplicationStatus[] = ["pending", "reviewing", "approved", "rejected"];

interface RegistrationRecord {
    id: string;
    profile_id: string;
    phone: string;
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

    if (status === "approved" && previousRole !== "landlord") {
        const timestamp = new Date().toISOString();
        const { error: profileError } = await adminClient
            .from("profiles")
            .update({
                role: "landlord",
                phone: applicant?.phone ?? typedRegistration.phone,
                updated_at: timestamp,
            })
            .eq("id", typedRegistration.profile_id);

        if (profileError) {
            return NextResponse.json({ error: "Failed to promote the applicant profile." }, { status: 500 });
        }

        const {
            data: { user: authUser },
            error: authUserError,
        } = await adminClient.auth.admin.getUserById(typedRegistration.profile_id);

        if (authUserError || !authUser) {
            await adminClient.from("profiles").update({ role: previousRole, updated_at: timestamp }).eq("id", typedRegistration.profile_id);
            return NextResponse.json({ error: "Failed to load the applicant auth account." }, { status: 500 });
        }

        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(typedRegistration.profile_id, {
            user_metadata: {
                ...(authUser.user_metadata ?? {}),
                role: "landlord",
            },
        });

        if (authUpdateError) {
            await adminClient.from("profiles").update({ role: previousRole, updated_at: timestamp }).eq("id", typedRegistration.profile_id);
            return NextResponse.json({ error: "Failed to sync the applicant auth role." }, { status: 500 });
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
