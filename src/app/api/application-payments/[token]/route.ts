import { NextResponse } from "next/server";

import {
    applyPaymentPendingExpiry,
    hashPortalToken,
    logApplicationPaymentAudit,
} from "@/lib/application-payment-pending";
import { BILLING_BUCKETS, uploadBillingFile } from "@/lib/billing/storage";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
    params: Promise<{ token: string }>;
};

type PaymentMethodInput = "gcash" | "cash";

type PortalApplication = {
    id: string;
    status: string;
    applicant_name: string | null;
    payment_pending_expires_at: string | null;
    payment_portal_token_hash: string | null;
    payment_portal_token_expires_at: string | null;
    landlord_id: string;
    unit: {
        id: string;
        name: string | null;
        property: {
            id: string;
            name: string | null;
        } | null;
    } | null;
};

type PortalPaymentRequestRow = {
    id: string;
    requirement_type: "advance_rent" | "security_deposit";
    amount: number;
    due_at: string | null;
    status: "pending" | "processing" | "completed" | "rejected" | "expired";
    method: "gcash" | "cash" | null;
    reference_number: string | null;
    payment_note: string | null;
    payment_proof_url: string | null;
    review_note: string | null;
    bypassed: boolean;
    submitted_at: string | null;
    reviewed_at: string | null;
};

const REQUEST_SELECT = `
    id,
    application_id,
    requirement_type,
    amount,
    due_at,
    status,
    method,
    reference_number,
    payment_note,
    payment_proof_path,
    payment_proof_url,
    submitted_at,
    reviewed_at,
    review_note,
    bypassed,
    metadata
`;

function toRequirementLabel(type: string) {
    if (type === "advance_rent") return "Advance Rent";
    if (type === "security_deposit") return "Security Deposit";
    return type;
}

async function loadApplicationByToken(token: string) {
    const adminClient = createAdminClient();
    const tokenHash = hashPortalToken(token);
    const { data, error } = await adminClient
        .from("applications")
        .select(
            `
            id,
            status,
            applicant_name,
            payment_pending_expires_at,
            payment_portal_token_hash,
            payment_portal_token_expires_at,
            landlord_id,
            unit:units (
                id,
                name,
                property:properties (
                    id,
                    name
                )
            )
        `
        )
        .eq("payment_portal_token_hash", tokenHash)
        .maybeSingle();

    if (error || !data) return null;

    const application = data as unknown as PortalApplication;
    if (!application.payment_portal_token_hash || application.payment_portal_token_hash !== tokenHash) {
        return null;
    }

    return application;
}

async function resolvePortalContext(token: string) {
    const adminClient = createAdminClient();
    const application = await loadApplicationByToken(token);
    if (!application) {
        return { error: NextResponse.json({ error: "Payment portal link is invalid." }, { status: 404 }) };
    }

    const expiryResult = await applyPaymentPendingExpiry(adminClient, application.id);
    if (expiryResult.expired) {
        return {
            error: NextResponse.json(
                { error: "Payment window has expired. Please contact your landlord for a new request." },
                { status: 410 }
            ),
        };
    }

    if (application.status !== "payment_pending") {
        return {
            error: NextResponse.json(
                { error: "This payment request is no longer active." },
                { status: 409 }
            ),
        };
    }

    const tokenExpiresAt = application.payment_portal_token_expires_at
        ? new Date(application.payment_portal_token_expires_at)
        : null;

    if (!tokenExpiresAt || Number.isNaN(tokenExpiresAt.getTime()) || tokenExpiresAt.getTime() <= Date.now()) {
        return {
            error: NextResponse.json(
                { error: "Payment portal link has expired. Please request a new link from the landlord." },
                { status: 410 }
            ),
        };
    }

    return { adminClient, application };
}

async function fetchPortalPayload(adminClient: ReturnType<typeof createAdminClient>, application: PortalApplication) {
    const [{ data: requests }, { data: destination }] = await Promise.all([
        (adminClient
            .from("application_payment_requests" as any)
            .select(REQUEST_SELECT) as any)
            .eq("application_id", application.id)
            .order("requirement_type", { ascending: true }),
        (adminClient
            .from("landlord_payment_destinations") as any)
            .select("account_name, account_number, qr_image_url, is_enabled")
            .eq("landlord_id", application.landlord_id)
            .eq("provider", "gcash")
            .maybeSingle(),
    ]);

    return {
        application: {
            id: application.id,
            applicantName: application.applicant_name ?? "Applicant",
            propertyName: application.unit?.property?.name ?? "Property",
            unitName: application.unit?.name ?? "Unit",
            deadline: application.payment_pending_expires_at,
        },
        destination: destination && destination.is_enabled
            ? {
                  accountName: destination.account_name ?? null,
                  accountNumber: destination.account_number ?? null,
                  qrImageUrl: destination.qr_image_url ?? null,
              }
            : null,
        requests: ((requests ?? []) as unknown as PortalPaymentRequestRow[]).map((request) => ({
            id: request.id,
            requirementType: request.requirement_type,
            label: toRequirementLabel(request.requirement_type),
            amount: Number(request.amount ?? 0),
            dueAt: request.due_at,
            status: request.status,
            method: request.method,
            referenceNumber: request.reference_number,
            note: request.payment_note,
            proofUrl: request.payment_proof_url,
            reviewNote: request.review_note,
            bypassed: Boolean(request.bypassed),
            submittedAt: request.submitted_at,
            reviewedAt: request.reviewed_at,
        })),
        methods: ["gcash", "cash"] satisfies PaymentMethodInput[],
    };
}

export async function GET(_request: Request, context: RouteContext) {
    const { token } = await context.params;
    const portalContext = await resolvePortalContext(token);
    if ("error" in portalContext) return portalContext.error;

    const { adminClient, application } = portalContext;
    await logApplicationPaymentAudit(adminClient, {
        application_id: application.id,
        actor_role: "prospect",
        event_type: "portal_opened",
    });

    const payload = await fetchPortalPayload(adminClient, application);
    return NextResponse.json(payload);
}

export async function POST(request: Request, context: RouteContext) {
    const { token } = await context.params;
    const portalContext = await resolvePortalContext(token);
    if ("error" in portalContext) return portalContext.error;

    const { adminClient, application } = portalContext;

    let paymentRequestId = "";
    let method: PaymentMethodInput | null = null;
    let referenceNumber: string | null = null;
    let note: string | null = null;
    let proofFile: File | null = null;

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        paymentRequestId = String(formData.get("paymentRequestId") ?? "").trim();
        const methodRaw = String(formData.get("method") ?? "").trim().toLowerCase();
        if (methodRaw === "gcash" || methodRaw === "cash") method = methodRaw;
        referenceNumber = String(formData.get("referenceNumber") ?? "").trim() || null;
        note = String(formData.get("note") ?? "").trim() || null;
        const uploadedProof = formData.get("proof");
        proofFile = uploadedProof instanceof File && uploadedProof.size > 0 ? uploadedProof : null;
    } else {
        const body = (await request.json()) as {
            paymentRequestId?: string;
            method?: string;
            referenceNumber?: string;
            note?: string;
        };
        paymentRequestId = String(body.paymentRequestId ?? "").trim();
        const methodRaw = String(body.method ?? "").trim().toLowerCase();
        if (methodRaw === "gcash" || methodRaw === "cash") method = methodRaw;
        referenceNumber = typeof body.referenceNumber === "string" ? body.referenceNumber.trim() || null : null;
        note = typeof body.note === "string" ? body.note.trim() || null : null;
    }

    if (!paymentRequestId) {
        return NextResponse.json({ error: "paymentRequestId is required." }, { status: 400 });
    }
    if (!method) {
        return NextResponse.json({ error: "method must be either gcash or cash." }, { status: 400 });
    }
    const reqQuery = adminClient
            .from("application_payment_requests" as any)
            .select(REQUEST_SELECT);

        const { data: requestRow, error: requestError } = await reqQuery
            .eq("id", paymentRequestId)
            .eq("application_id", application.id)
            .maybeSingle() as any;

    if (requestError || !requestRow) {
        return NextResponse.json({ error: "Payment request not found." }, { status: 404 });
    }

    if (requestRow.status === "completed") {
        return NextResponse.json({ error: "This payment request is already confirmed." }, { status: 409 });
    }
    if (requestRow.status === "expired") {
        return NextResponse.json({ error: "This payment request has expired." }, { status: 409 });
    }
    if (method === "gcash" && !proofFile && !requestRow.payment_proof_url) {
        return NextResponse.json({ error: "Proof upload is required for GCash submissions." }, { status: 400 });
    }

    let uploadResult: { path: string; publicUrl: string } | null = null;
    if (proofFile) {
        uploadResult = await uploadBillingFile({
            bucketName: BILLING_BUCKETS.paymentProofs,
            ownerId: application.id,
            scope: `application-payment-request/${requestRow.id}`,
            file: proofFile,
        });
    }

    const nowIso = new Date().toISOString();
    const updateResult = await adminClient
        .from("application_payment_requests" as any)
        .update({
            method,
            status: "processing",
            reference_number: referenceNumber,
            payment_note: note,
            payment_proof_path: uploadResult?.path ?? requestRow.payment_proof_path ?? null,
            payment_proof_url: uploadResult?.publicUrl ?? requestRow.payment_proof_url ?? null,
            submitted_at: nowIso,
            reviewed_at: null,
            reviewed_by: null,
            review_note: null,
            bypassed: false,
            metadata: {
                ...(typeof requestRow.metadata === "object" && requestRow.metadata ? requestRow.metadata : {}),
                submitted_via: "prospect_portal",
            },
        })
        .eq("id", requestRow.id)
        .eq("application_id", application.id)
        .select(REQUEST_SELECT)
        .single();
    const { data: updated, error: updateError } = updateResult as any;

    if (updateError || !updated) {
        return NextResponse.json({ error: "Failed to submit payment proof." }, { status: 500 });
    }

    await logApplicationPaymentAudit(adminClient, {
        application_id: application.id,
        payment_request_id: requestRow.id,
        actor_role: "prospect",
        event_type: "proof_submitted",
        metadata: {
            method,
            has_proof: Boolean(updated.payment_proof_url),
        },
    });

    return NextResponse.json({
        request: {
            id: updated.id,
            requirementType: updated.requirement_type,
            label: toRequirementLabel(updated.requirement_type),
            amount: Number(updated.amount ?? 0),
            dueAt: updated.due_at,
            status: updated.status,
            method: updated.method,
            referenceNumber: updated.reference_number,
            note: updated.payment_note,
            proofUrl: updated.payment_proof_url,
            reviewNote: updated.review_note,
            bypassed: Boolean(updated.bypassed),
            submittedAt: updated.submitted_at,
            reviewedAt: updated.reviewed_at,
        },
    });
}
