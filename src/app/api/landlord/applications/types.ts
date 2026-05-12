import type { ApplicationStatus, LeaseStatus } from "@/types/database";

export type ApplicationResponse = {
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
        avatarBgColor: string | null;
    };
    propertyName: string;
    propertyId?: string | null;
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

export type LeaseRow = {
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

export type AuditRow = {
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

export type ActorProfile = {
    id: string;
    full_name: string | null;
    email: string | null;
};

export type ComplianceChecklist = NonNullable<ApplicationResponse["complianceChecklist"]>;

export type ApplicationRow = {
    id: string;
    status: ApplicationStatus;
    message: string | null;
    monthly_income: number | null;
    employment_status: string | null;
    move_in_date: string | null;
    documents: unknown;
    created_at: string;
    applicant_id: string | null;
    unit_id: string | null;
    lease_id: string | null;
    payment_pending_started_at: string | null;
    payment_pending_expires_at: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    reference_name: string | null;
    reference_phone: string | null;
    compliance_checklist: Record<string, boolean> | null;
    requirements_checklist: Record<string, boolean> | null;
    applicant_name: string | null;
    applicant_email: string | null;
    applicant_phone: string | null;
    application_source: "invite_link" | "walk_in_application" | string | null;
};

export type PaymentRequestRow = {
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
};

export type PostgrestLikeError = {
    code?: string | null;
    message?: string | null;
};
