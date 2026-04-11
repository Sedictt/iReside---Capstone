import { NextResponse } from "next/server";
import { applyPaymentPendingExpiry } from "@/lib/application-payment-pending";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus, LeaseStatus } from "@/types/database";

type ApplicationResponse = {
    id: string;
    source: "walk_in_application" | "invite_link";
    applicant: {
        name: string;
        email: string;
        phone: string;
        occupation: string;
        monthlyIncome: number | null;
        creditScore: number | null;
        avatar: string | null;
    };
    propertyName: string;
    propertyContractTemplate: Record<string, unknown> | null;
    unitNumber: string;
    propertyImage: string;
    requestedMoveIn: string | null;
    monthlyRent: number | null;
    status: ApplicationStatus;
    paymentPendingStartedAt?: string | null;
    paymentPendingExpiresAt?: string | null;
    submittedDate: string;
    notes: string | null;
    documents: string[];
    emergencyContact?: {
        name: string | null;
        phone: string | null;
    };
    reference?: {
        name: string | null;
        contact: string | null;
    };
    complianceChecklist?: {
        valid_id: boolean;
        income_verified: boolean;
        application_completed: boolean;
        background_checked: boolean;
        payment_received: boolean;
        lease_signed: boolean;
        inspection_done: boolean;
    } | null;
    lease?: {
        id: string;
        status: LeaseStatus;
        signing_mode: "in_person" | "remote" | null;
        tenant_signature: string | null;
        landlord_signature: string | null;
        tenant_signed_at: string | null;
        landlord_signed_at: string | null;
        signing_link_token_hash: string | null;
        signing_link_expires_at: string | null;
    } | null;
    leaseAuditEvents?: Array<{
        id: string;
        created_at: string;
        event_type:
            | "signing_link_generated"
            | "signing_link_accessed"
            | "signing_link_expired"
            | "signing_link_regenerated"
            | "tenant_signed"
            | "landlord_signed"
            | "lease_activated"
            | "signing_failed";
        actor_label?: string | null;
        metadata?: Record<string, unknown> | null;
    }>;
    preApprovalPayments?: Array<{
        id: string;
        requirementType: "advance_rent" | "security_deposit";
        amount: number;
        dueAt: string | null;
        status: "pending" | "processing" | "completed" | "rejected" | "expired";
        method: "gcash" | "cash" | null;
        submittedAt: string | null;
        reviewedAt: string | null;
        proofUrl: string | null;
        reviewNote: string | null;
        bypassed: boolean;
    }>;
};

type LeaseRow = {
    id: string;
    status: LeaseStatus;
    signing_mode: "in_person" | "remote" | null;
    tenant_signature: string | null;
    landlord_signature: string | null;
    tenant_signed_at: string | null;
    landlord_signed_at: string | null;
    signing_link_token_hash: string | null;
    updated_at: string;
};

type AuditRow = {
    id: string;
    lease_id: string;
    event_type:
        | "signing_link_generated"
        | "signing_link_accessed"
        | "signing_link_expired"
        | "signing_link_regenerated"
        | "tenant_signed"
        | "landlord_signed"
        | "lease_activated"
        | "signing_failed";
    metadata: Record<string, unknown> | null;
    created_at: string;
    actor_id: string | null;
};

type ActorProfile = {
    id: string;
    full_name: string | null;
    email: string | null;
};

const FALLBACK_PROPERTY_IMAGE =
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&auto=format&fit=crop&q=80";

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

type PostgrestLikeError = {
    code?: string | null;
    message?: string | null;
};

function extractMissingColumn(error: PostgrestLikeError | null | undefined) {
    if (!error || !error.message) {
        return null;
    }

    // PostgREST schema cache error format (e.g., PGRST204)
    const postgrestMatch = error.message.match(/'([^']+)' column/);
    if (postgrestMatch?.[1]) {
        return postgrestMatch[1];
    }

    // PostgreSQL undefined column format (e.g., 42703: column applications.lease_id does not exist)
    const postgresMatch = error.message.match(/column\s+([a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)\s+does not exist/i);
    if (postgresMatch?.[2]) {
        return postgresMatch[2];
    }

    return null;
}

export async function GET() {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appFields = [
        "id",
        "status",
        "message",
        "monthly_income",
        "employment_status",
        "move_in_date",
        "documents",
        "created_at",
        "applicant_id",
        "unit_id",
        "lease_id",
        "payment_pending_started_at",
        "payment_pending_expires_at",
        "emergency_contact_name",
        "emergency_contact_phone",
        "reference_name",
        "reference_phone",
        "compliance_checklist",
        "requirements_checklist",
        "applicant_name",
        "applicant_email",
        "applicant_phone",
        "application_source",
    ];

    let appSelect = appFields.join(", ");
    let applicationRowsRaw: unknown[] | null = null;
    let applicationsError: PostgrestLikeError | null = null;

    for (let attempt = 0; attempt < 4; attempt += 1) {
        const { data, error } = await supabase
            .from("applications")
            .select(appSelect)
            .eq("landlord_id", user.id)
            .order("created_at", { ascending: false });

        if (!error) {
            applicationRowsRaw = data;
            applicationsError = null;
            break;
        }

        const missingColumn = extractMissingColumn(error);
        if (missingColumn && appSelect.includes(missingColumn)) {
            appSelect = appSelect
                .split(",")
                .map((field) => field.trim())
                .filter((field) => field !== missingColumn)
                .join(", ");
            continue;
        }

        applicationsError = error;
        break;
    }

    if (applicationsError) {
        console.error("[applications GET] Supabase error:", applicationsError);
        console.error("[applications GET] Error details:", JSON.stringify(applicationsError, null, 2));
        return NextResponse.json({
            error: "Failed to load applications.",
            details: applicationsError.message
        }, { status: 500 });
    }

    if (!applicationRowsRaw || applicationRowsRaw.length === 0) {
        return NextResponse.json({ applications: [] satisfies ApplicationResponse[] });
    }
    const applicationRows = applicationRowsRaw as any[];

    const paymentPendingRows = applicationRows.filter((row) => row.status === "payment_pending");
    if (paymentPendingRows.length > 0) {
        const expiryResults = await Promise.all(
            paymentPendingRows.map((row) => applyPaymentPendingExpiry(adminClient, row.id))
        );
        const expiryMap = new Map(
            expiryResults
                .filter((result) => result.expired && result.application)
                .map((result) => [result.application.id, result.application])
        );

        if (expiryMap.size > 0) {
            for (let idx = 0; idx < applicationRows.length; idx += 1) {
                const updated = expiryMap.get(applicationRows[idx].id);
                if (!updated) continue;
                applicationRows[idx] = {
                    ...applicationRows[idx],
                    status: updated.status,
                    payment_pending_started_at: updated.payment_pending_started_at,
                    payment_pending_expires_at: updated.payment_pending_expires_at,
                    requirements_checklist: updated.requirements_checklist ?? applicationRows[idx].requirements_checklist,
                };
            }
        }
    }

    const applicantIds = Array.from(
        new Set(applicationRows.map((row) => row.applicant_id).filter((value): value is string => Boolean(value)))
    );
    const unitIds = Array.from(
        new Set(applicationRows.map((row) => row.unit_id).filter((value): value is string => Boolean(value)))
    );

    const { data: applicantRows, error: applicantsError } =
        applicantIds.length > 0
            ? await supabase
                  .from("profiles")
                  .select("id, full_name, email, phone, avatar_url")
                  .in("id", applicantIds)
            : { data: [], error: null };

    if (applicantsError) {
        return NextResponse.json({ error: "Failed to load applicant profiles." }, { status: 500 });
    }

    const { data: unitRows, error: unitsError } =
        unitIds.length > 0
            ? await supabase
                  .from("units")
                  .select("id, name, rent_amount, property_id")
                  .in("id", unitIds)
            : { data: [], error: null };

    if (unitsError) {
        return NextResponse.json({ error: "Failed to load units." }, { status: 500 });
    }

    const propertyIds = Array.from(
        new Set((unitRows ?? []).map((row) => row.property_id).filter((value): value is string => Boolean(value)))
    );

    const { data: propertyRows, error: propertiesError } =
        propertyIds.length > 0
            ? await supabase.from("properties").select("id, name, images, contract_template").in("id", propertyIds)
            : { data: [], error: null };

    if (propertiesError) {
        return NextResponse.json({ error: "Failed to load properties." }, { status: 500 });
    }

    const applicantMap = new Map((applicantRows ?? []).map((row) => [row.id, row]));
    const unitMap = new Map((unitRows ?? []).map((row) => [row.id, row]));
    const propertyMap = new Map((propertyRows ?? []).map((row) => [row.id, row]));

    const leaseIdsFromApplications = Array.from(
        new Set(applicationRows.map((row) => row.lease_id).filter((value): value is string => Boolean(value)))
    );
    let leasesRows: LeaseRow[] = [];
    if (leaseIdsFromApplications.length > 0) {
        const leaseFields = [
            "id",
            "status",
            "signing_mode",
            "tenant_signature",
            "landlord_signature",
            "tenant_signed_at",
            "landlord_signed_at",
            "signing_link_token_hash",
            "updated_at",
        ];
        let leaseSelect = leaseFields.join(", ");

        for (let attempt = 0; attempt < 4; attempt += 1) {
            const { data, error } = await supabase
                .from("leases")
                .select(leaseSelect)
                .in("id", leaseIdsFromApplications);

            if (!error) {
                leasesRows = (data as unknown) as LeaseRow[];
                break;
            }

            const missingColumn = extractMissingColumn(error);
            if (missingColumn && leaseSelect.includes(missingColumn)) {
                leaseSelect = leaseSelect
                    .split(",")
                    .map((field) => field.trim())
                    .filter((field) => field !== missingColumn)
                    .join(", ");
                continue;
            }

            console.error("[applications GET] Lease enrichment skipped:", error);
            leasesRows = [];
            break;
        }
    }

    const leaseById = new Map(leasesRows.map((leaseRow) => [leaseRow.id, leaseRow]));

    const leaseIds = Array.from(new Set(leasesRows.map((leaseRow) => leaseRow.id).filter(Boolean)));
    const { data: auditRowsRaw } = leaseIds.length
        ? await supabase
              .from("lease_signing_audit")
              .select("id, lease_id, event_type, metadata, created_at, actor_id")
              .in("lease_id", leaseIds as string[])
              .order("created_at", { ascending: false })
        : { data: [] as AuditRow[] };
    const auditRows = (auditRowsRaw ?? []) as AuditRow[];

    const actorIds = Array.from(new Set(auditRows.map((row) => row.actor_id).filter((value): value is string => Boolean(value))));
    const { data: actorProfilesRaw } = actorIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds as string[])
        : { data: [] as ActorProfile[] };
    const actorProfiles = (actorProfilesRaw ?? []) as ActorProfile[];
    const actorMap = new Map(actorProfiles.map((profile) => [profile.id, profile]));

    const applicationIds = applicationRows.map((row) => row.id).filter(Boolean);
    const { data: paymentRequestRowsRaw } = applicationIds.length
        ? await supabase
              .from("application_payment_requests")
              .select(
                  "id, application_id, requirement_type, amount, due_at, status, method, submitted_at, reviewed_at, payment_proof_url, review_note, bypassed"
              )
              .in("application_id", applicationIds)
        : { data: [] as any[] };
    const paymentRequestRows = (paymentRequestRowsRaw ?? []) as Array<{
        id: string;
        application_id: string;
        requirement_type: "advance_rent" | "security_deposit";
        amount: number;
        due_at: string | null;
        status: "pending" | "processing" | "completed" | "rejected" | "expired";
        method: "gcash" | "cash" | null;
        submitted_at: string | null;
        reviewed_at: string | null;
        payment_proof_url: string | null;
        review_note: string | null;
        bypassed: boolean;
    }>;
    const paymentRequestsByApplication = new Map<
        string,
        ApplicationResponse["preApprovalPayments"]
    >();
    for (const row of paymentRequestRows) {
        const current = paymentRequestsByApplication.get(row.application_id) ?? [];
        current.push({
            id: row.id,
            requirementType: row.requirement_type,
            amount: Number(row.amount ?? 0),
            dueAt: row.due_at,
            status: row.status,
            method: row.method,
            submittedAt: row.submitted_at,
            reviewedAt: row.reviewed_at,
            proofUrl: row.payment_proof_url,
            reviewNote: row.review_note,
            bypassed: Boolean(row.bypassed),
        });
        paymentRequestsByApplication.set(row.application_id, current);
    }

    const auditByLeaseId = new Map<string, ApplicationResponse["leaseAuditEvents"]>();
    auditRows.forEach((row) => {
        const current = auditByLeaseId.get(row.lease_id) ?? [];
        const actorProfile = row.actor_id ? actorMap.get(row.actor_id) : null;
        current.push({
            id: row.id,
            created_at: row.created_at,
            event_type: row.event_type,
            metadata: row.metadata as Record<string, unknown> | null,
            actor_label: actorProfile?.full_name || actorProfile?.email || null,
        });
        auditByLeaseId.set(row.lease_id, current);
    });

    const applications: ApplicationResponse[] = (applicationRows.map((row) => {
        const applicant = row.applicant_id ? applicantMap.get(row.applicant_id) : undefined;
        const unit = unitMap.get(row.unit_id);
        const property = unit ? propertyMap.get(unit.property_id) : null;
        const propertyImages = property?.images;
        const propertyImage =
            Array.isArray(propertyImages) && isNonEmptyString(propertyImages[0])
                ? propertyImages[0]
                : FALLBACK_PROPERTY_IMAGE;

        // For walk-in applications, prefer the walk-in-specific fields over the profile lookup.
        const walkInName = isNonEmptyString(row.applicant_name) ? row.applicant_name : null;
        const walkInEmail = isNonEmptyString(row.applicant_email) ? row.applicant_email : null;
        const walkInPhone = isNonEmptyString(row.applicant_phone) ? row.applicant_phone : null;

        const lease = row.lease_id ? leaseById.get(row.lease_id) : undefined;
        const leaseExpiryDate =
            lease?.updated_at && lease?.signing_link_token_hash
                ? new Date(new Date(lease.updated_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
                : null;

        return {
            id: row.id,
            source: row.application_source === "invite_link" ? "invite_link" : "walk_in_application",
            applicant: {
                name: walkInName ?? applicant?.full_name ?? "Unknown applicant",
                email: walkInEmail ?? applicant?.email ?? "Not provided",
                phone: walkInPhone ?? applicant?.phone ?? "Not provided",
                occupation: row.employment_status ?? "Not provided",
                monthlyIncome: row.monthly_income ?? null,
                creditScore: null,
                avatar: applicant?.avatar_url ?? null,
            },
            propertyName: property?.name ?? unit?.name ?? "Property",
            propertyContractTemplate:
                property?.contract_template && typeof property.contract_template === "object" && !Array.isArray(property.contract_template)
                    ? (property.contract_template as Record<string, unknown>)
                    : null,
            unitNumber: unit?.name ?? "Unit",
            propertyImage,
            requestedMoveIn: row.move_in_date ?? null,
            monthlyRent: unit?.rent_amount ?? null,
            status: row.status,
            paymentPendingStartedAt: row.payment_pending_started_at ?? null,
            paymentPendingExpiresAt: row.payment_pending_expires_at ?? null,
            submittedDate: row.created_at,
            notes: row.message ?? null,
            documents: Array.isArray(row.documents)
                ? row.documents.filter((doc: string): doc is string => isNonEmptyString(doc))
                : [],
            emergencyContact: {
                name: row.emergency_contact_name ?? null,
                phone: row.emergency_contact_phone ?? null,
            },
            reference: {
                name: row.reference_name ?? null,
                contact: row.reference_phone ?? null,
            },
            complianceChecklist: {
                ...(row.compliance_checklist as Record<string, boolean> | null ?? {}),
                ...(row.requirements_checklist as Record<string, boolean> | null ?? {}),
            },
            lease: lease
                ? {
                      id: lease.id,
                      status: lease.status,
                      signing_mode: lease.signing_mode,
                      tenant_signature: lease.tenant_signature,
                      landlord_signature: lease.landlord_signature,
                      tenant_signed_at: lease.tenant_signed_at,
                      landlord_signed_at: lease.landlord_signed_at,
                      signing_link_token_hash: lease.signing_link_token_hash,
                      signing_link_expires_at: leaseExpiryDate,
                  }
                : null,
            leaseAuditEvents: lease ? auditByLeaseId.get(lease.id) ?? [] : [],
            preApprovalPayments: paymentRequestsByApplication.get(row.id) ?? [],
        };
    }) as any[]);

    return NextResponse.json({ applications });
}
