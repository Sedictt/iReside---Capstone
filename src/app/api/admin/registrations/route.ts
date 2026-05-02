import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApplicationStatus, UserRole } from "@/types/database";

interface ApplicantProfile {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    role: UserRole;
}

interface RegistrationRow {
    id: string;
    profile_id: string;
    phone: string;
    identity_document_url: string | null;
    ownership_document_url: string | null;
    business_permit_url: string | null;
    business_permit_card_url: string | null;
    liveness_document_url: string | null;
    status: ApplicationStatus;
    admin_notes: string | null;
    business_name: string | null;
    business_address: string | null;
    verification_status: string | null;
    verification_data: unknown | null;
    verification_checked_at: string | null;
    verification_notes: string | null;
    created_at: string;
    updated_at: string;
}

interface RegistrationWithApplicant extends RegistrationRow {
    applicant: ApplicantProfile | null;
}

async function assertAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) return { error: "Unauthorized" as const };

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).maybeSingle();

    if (profile?.role !== "admin") return { error: "Forbidden" as const };

    return { error: null };
}

const summarizeStatuses = (statuses: ApplicationStatus[]) => {
    const summary = {
        total: statuses.length,
        pending: 0,
        reviewing: 0,
        payment_pending: 0,
        approved: 0,
        rejected: 0,
        withdrawn: 0,
    };

    for (const status of statuses) {
        summary[status] += 1;
    }

    return summary;
};

export async function GET() {
    const auth = await assertAdmin();
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
        .from("landlord_applications")
        .select(`*`)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Landlord applications query error:", error);
        return NextResponse.json({ error: "Failed to load registrations." }, { status: 500 });
    }

    const baseRegistrations = (data ?? []) as unknown as RegistrationRow[];
    const applicantIds = [...new Set(baseRegistrations.map((registration) => registration.profile_id))];
    const { data: applicants, error: applicantsError } =
        applicantIds.length > 0
            ? await adminClient
                  .from("profiles")
                  .select("id, full_name, email, avatar_url, role")
                  .in("id", applicantIds)
            : { data: [], error: null };

    if (applicantsError) {
        return NextResponse.json({ error: "Failed to load applicant profiles." }, { status: 500 });
    }

    const applicantMap = new Map<string, ApplicantProfile>(
        ((applicants ?? []) as ApplicantProfile[]).map((applicant) => [applicant.id, applicant])
    );

    const registrations = baseRegistrations
        .map((registration): RegistrationWithApplicant => ({
            ...registration,
            applicant: applicantMap.get(registration.profile_id) ?? null,
        }))
        .sort((left, right) => {
        const statusRank: Record<ApplicationStatus, number> = {
            pending: 0,
            reviewing: 1,
            payment_pending: 2,
            approved: 3,
            rejected: 4,
            withdrawn: 5,
        };

        const rankDiff = statusRank[left.status as ApplicationStatus] - statusRank[right.status as ApplicationStatus];
        if (rankDiff !== 0) return rankDiff;

        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });

    return NextResponse.json({
        registrations,
        summary: summarizeStatuses(registrations.map((registration) => registration.status)),
    });
}
