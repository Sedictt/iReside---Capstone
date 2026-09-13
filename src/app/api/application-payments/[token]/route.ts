import { NextResponse } from "next/server";

import {
    applyPaymentPendingExpiry,
    hashPortalToken,
    logApplicationPaymentAudit,
} from "@/lib/application-payment-pending";
import { BILLING_BUCKETS, uploadBillingFile } from "@/lib/billing/storage";
import { NotificationService } from "@/lib/services/notification/notification.service";
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
            images: string[] | null;
            map_decorations: any;
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
    payment_proof_path: string | null;
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
                    name,
                    images,
                    map_decorations
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
    const [{ data: requests }, { data: destination }, { data: landlordProfile }] = await Promise.all([
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
        adminClient
            .from("profiles")
            .select("business_name, full_name, socials, email")
            .eq("id", application.landlord_id)
            .maybeSingle(),
    ]);

    const propertyDecorations = application.unit?.property?.map_decorations as Record<string, any> | undefined;
    const propertyTheme = propertyDecorations?.branding as Record<string, any> | undefined;
    const profileTheme = (landlordProfile?.socials as Record<string, any> | undefined)?.branding as Record<string, any> | undefined;

    const primaryColor = String(profileTheme?.primaryColor || propertyTheme?.primaryColor || "#c4b0ff");
    const secondaryColor = String(profileTheme?.secondaryColor || propertyTheme?.secondaryColor || "#8b5cf6");
    const logoUrl = (profileTheme?.logoUrl || propertyTheme?.logoUrl || application.unit?.property?.images?.[0] || null) as string | null;
    const propertyName = landlordProfile?.business_name || profileTheme?.propertyName || application.unit?.property?.name || "Property";

    return {
        application: {
            id: application.id,
            applicantName: application.applicant_name ?? "Applicant",
            propertyName,
            unitName: application.unit?.name ?? "Unit",
            deadline: application.payment_pending_expires_at,
        },
        branding: {
            primaryColor,
            secondaryColor,
            logoUrl,
            propertyName,
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

    if (!method) {
        return NextResponse.json({ error: "Method must be either GCash or Cash." }, { status: 400 });
    }

    // Determine target payment requests (unified single-submit vs specific request)
    const isUnified = !paymentRequestId || paymentRequestId === "all";

    const reqQuery = adminClient
        .from("application_payment_requests" as any)
        .select(REQUEST_SELECT)
        .eq("application_id", application.id);

    const { data: requestRows, error: requestError } = (await (isUnified
        ? reqQuery
        : reqQuery.eq("id", paymentRequestId)
    )) as any;

    if (requestError || !requestRows || (Array.isArray(requestRows) && requestRows.length === 0)) {
        return NextResponse.json({ error: "Payment request not found." }, { status: 404 });
    }

    const rows: PortalPaymentRequestRow[] = Array.isArray(requestRows) ? requestRows : [requestRows];
    const targetRows = rows.filter((r) => r.status !== "completed" && r.status !== "expired");

    if (targetRows.length === 0) {
        return NextResponse.json(
            { error: "All required payments are already confirmed or expired." },
            { status: 409 }
        );
    }

    const hasExistingProof = targetRows.some((r) => Boolean(r.payment_proof_url));
    if (method === "gcash" && !proofFile && !hasExistingProof) {
        return NextResponse.json({ error: "Proof upload is required for GCash submissions." }, { status: 400 });
    }

    let uploadResult: { path: string; publicUrl: string } | null = null;
    if (proofFile) {
        uploadResult = await uploadBillingFile({
            bucketName: BILLING_BUCKETS.paymentProofs,
            ownerId: application.id,
            scope: `application-payment/${application.id}`,
            file: proofFile,
        });
    }

    const nowIso = new Date().toISOString();
    const targetIds = targetRows.map((r) => r.id);

    const { data: updatedRows, error: updateError } = (await adminClient
        .from("application_payment_requests" as any)
        .update({
            method,
            status: "processing",
            reference_number: referenceNumber,
            payment_note: note,
            payment_proof_path: uploadResult?.path ?? targetRows[0]?.payment_proof_path ?? null,
            payment_proof_url: uploadResult?.publicUrl ?? targetRows[0]?.payment_proof_url ?? null,
            submitted_at: nowIso,
            reviewed_at: null,
            reviewed_by: null,
            review_note: null,
            bypassed: false,
            metadata: {
                submitted_via: "prospect_portal",
                batch_submission: isUnified,
            },
        })
        .in("id", targetIds)
        .eq("application_id", application.id)
        .select(REQUEST_SELECT)) as any;

    if (updateError || !updatedRows) {
        return NextResponse.json({ error: "Failed to submit payment proof." }, { status: 500 });
    }

    // Log audit events
    for (const req of targetRows) {
        await logApplicationPaymentAudit(adminClient, {
            application_id: application.id,
            payment_request_id: req.id,
            actor_role: "prospect",
            event_type: "proof_submitted",
            metadata: {
                method,
                reference_number: referenceNumber,
                has_proof: Boolean(uploadResult?.publicUrl || req.payment_proof_url),
                batch: isUnified,
            },
        });
    }

    const totalAmount = targetRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const formattedTotal = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(totalAmount);

    // In-app notification to landlord
    try {
        const notifService = new NotificationService(adminClient as any);
        await notifService.createNotification({
            userId: application.landlord_id,
            type: "payment",
            title: `Payment Proof Submitted - ${application.unit?.property?.name ?? "Property"}`,
            message: `${application.applicant_name || "Applicant"} submitted payment proof (${formattedTotal}) for ${application.unit?.name ?? "Unit"}. Reference: ${referenceNumber || "N/A"}.`,
            data: {
                applicationId: application.id,
                propertyId: application.unit?.property?.id,
                referenceNumber,
                method,
                totalAmount,
            },
        });
    } catch (notifErr) {
        console.warn("[POST application-payments] Landlord notification skipped:", notifErr);
    }

    // Email notification to landlord
    try {
        const { data: landlordProf } = await adminClient
            .from("profiles")
            .select("email, full_name, business_name")
            .eq("id", application.landlord_id)
            .maybeSingle();

        if (landlordProf?.email) {
            const { sendEmail } = await import("@/lib/email/transport");
            const propertyTitle = application.unit?.property?.name ?? landlordProf.business_name ?? "Property";
            const unitTitle = application.unit?.name ?? "Unit";
            const applicantTitle = application.applicant_name ?? "Applicant";

            await sendEmail({
                recipientEmail: landlordProf.email,
                subject: `Payment Proof Submitted — ${propertyTitle} (${unitTitle})`,
                htmlBody: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#090a0f;color:#e5e7eb;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#141721;border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;">
    <div style="background:#c4b0ff;padding:20px 24px;">
      <h1 style="margin:0;color:#000;font-size:20px;font-weight:900;letter-spacing:-0.5px;">iReside</h1>
      <p style="margin:2px 0 0;color:#000;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:0.8;">Move-In Payment Verification</p>
    </div>
    <div style="padding:24px;">
      <h2 style="margin:0 0 12px;color:#fff;font-size:18px;font-weight:700;">New Proof of Payment Received</h2>
      <p style="margin:0 0 20px;color:#94a3b8;font-size:14px;line-height:1.5;">
        <strong>${applicantTitle}</strong> has submitted payment verification for <strong>${propertyTitle} (${unitTitle})</strong>.
      </p>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Total Amount</p>
        <p style="margin:0 0 14px;font-size:22px;font-weight:900;color:#c4b0ff;">${formattedTotal}</p>
        <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;">
          <span style="font-size:13px;color:#94a3b8;">Method: <strong style="color:#fff;">${method === "gcash" ? "GCash" : "Cash (In-Person)"}</strong></span>
          ${referenceNumber ? `<span style="font-size:13px;color:#94a3b8;">Ref: <strong style="color:#fff;">${referenceNumber}</strong></span>` : ""}
        </div>
      </div>
      <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">
        Please review the submitted receipt in your Landlord Operations dashboard to confirm or decline the payment.
      </p>
    </div>
  </div>
</div>`,
                textBody: `Payment proof submitted by ${applicantTitle} for ${propertyTitle} (${unitTitle}).\nTotal Amount: ${formattedTotal}\nMethod: ${method}\nReference: ${referenceNumber || "N/A"}\nPlease log in to review.`,
            });
        }
    } catch (emailErr) {
        console.warn("[POST application-payments] Landlord email notification skipped:", emailErr);
    }

    const mapped = (updatedRows as unknown as PortalPaymentRequestRow[]).map((updated) => ({
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
    }));

    return NextResponse.json({
        success: true,
        request: mapped[0],
        requests: mapped,
    });
}
