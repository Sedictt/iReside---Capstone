import { NextResponse } from "next/server";

import {
    ADVANCE_TEMPLATE_KEYS,
    DEPOSIT_TEMPLATE_KEYS,
    applyPaymentPendingExpiry,
    areRequiredPaymentRequestsCompleted,
    buildPortalToken,
    buildPortalUrl,
    logApplicationPaymentAudit,
    pickTemplateAmount,
    readPaymentPendingConfig,
    resolvePaymentPendingExpiry,
    withPaymentPendingConfig,
    type PaymentPendingLeaseData,
} from "@/lib/application-payment-pending";
import { sendLandlordCredentialsCopy, sendProspectPaymentRequestEmail, sendTenantCredentials } from "@/lib/email";
import { generateSigningLink } from "@/lib/jwt";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus, Json, PaymentMethod } from "@/types/database";

type ActionBody = {
    status?: ApplicationStatus;
    lease_data?: PaymentPendingLeaseData;
    advance_payment?: { amount?: number };
    security_deposit_payment?: { amount?: number };
};

const ALLOWED_STATUSES: ApplicationStatus[] = ["reviewing", "rejected", "payment_pending", "approved"];

const isAllowedStatus = (value: unknown): value is ApplicationStatus =>
    typeof value === "string" && ALLOWED_STATUSES.includes(value as ApplicationStatus);

function generateTempPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function normalizeObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}

function toPositiveNumber(value: unknown): number | null {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
}

function parseAndValidateLeaseData(leaseData: ActionBody["lease_data"]) {
    if (!leaseData) return null;

    const monthly = toPositiveNumber(leaseData.monthly_rent);
    const security = toPositiveNumber(leaseData.security_deposit);
    const startDate = typeof leaseData.start_date === "string" ? leaseData.start_date : "";
    const endDate = typeof leaseData.end_date === "string" ? leaseData.end_date : "";
    const landlordSignature =
        typeof leaseData.landlord_signature === "string" ? leaseData.landlord_signature.trim() : "";
    const terms = normalizeObject(leaseData.terms);

    if (!monthly || !security || !startDate || !endDate || !landlordSignature) {
        return null;
    }

    return {
        start_date: startDate,
        end_date: endDate,
        monthly_rent: monthly,
        security_deposit: security,
        terms,
        landlord_signature: landlordSignature,
    };
}

async function createLeaseRecord(
    supabase: any,
    data: {
        unit_id: string;
        tenant_id: string;
        landlord_id: string;
        start_date: string;
        monthly_rent: number;
        security_deposit: number;
        landlord_signature: string;
        terms: Record<string, unknown>;
    }
) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 12);

    const { data: lease, error } = await supabase
        .from("leases")
        .insert({
            unit_id: data.unit_id,
            tenant_id: data.tenant_id,
            landlord_id: data.landlord_id,
            status: "pending_signature",
            start_date: data.start_date,
            end_date: endDate.toISOString().split("T")[0],
            monthly_rent: data.monthly_rent,
            security_deposit: data.security_deposit,
            terms: data.terms as Json,
            landlord_signature: data.landlord_signature,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Lease creation failed: ${error.message}`);
    }

    return lease;
}

async function rollbackTenantAccount(adminClient: any, tenantId: string) {
    try {
        await adminClient.from("profiles").delete().eq("id", tenantId);
        await adminClient.auth.admin.deleteUser(tenantId);
    } catch (error) {
        console.error("[application-actions] rollback tenant failed:", error);
    }
}

async function rollbackLeaseAndAccount(adminClient: any, leaseId: string, tenantId: string) {
    try {
        await adminClient.from("leases").delete().eq("id", leaseId);
    } catch (error) {
        console.error("[application-actions] rollback lease failed:", error);
    }
    await rollbackTenantAccount(adminClient, tenantId);
}

async function createCanonicalPaymentsFromRequests(
    supabase: any,
    args: {
        lease_id: string;
        tenant_id: string;
        landlord_id: string;
        start_date: string;
        requests: Array<{
            id: string;
            requirement_type: "advance_rent" | "security_deposit";
            amount: number;
            method: PaymentMethod | null;
            reference_number: string | null;
            payment_note: string | null;
            payment_proof_path: string | null;
            payment_proof_url: string | null;
            submitted_at: string | null;
            reviewed_at: string | null;
            metadata: Json;
        }>;
    }
) {
    const nowIso = new Date().toISOString();
    const paymentIds: { advance: string; deposit: string } = { advance: "", deposit: "" };

    for (const request of args.requests) {
        const isAdvance = request.requirement_type === "advance_rent";
        const description = isAdvance ? "Advance Rent - First Month" : "Security Deposit";
        const itemLabel = isAdvance ? "Advance Rent" : "Security Deposit";
        const itemCategory = isAdvance ? "rent" : "security_deposit";
        const paidAt = request.reviewed_at ?? request.submitted_at ?? nowIso;

        const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .insert({
                lease_id: args.lease_id,
                tenant_id: args.tenant_id,
                landlord_id: args.landlord_id,
                amount: request.amount,
                status: "completed",
                method: request.method,
                description,
                due_date: args.start_date,
                paid_at: paidAt,
                reference_number: request.reference_number,
                landlord_confirmed: true,
                paid_amount: request.amount,
                balance_remaining: 0,
                payment_submitted_at: request.submitted_at,
                payment_note: request.payment_note,
                payment_proof_path: request.payment_proof_path,
                payment_proof_url: request.payment_proof_url,
                metadata: {
                    source: "application_payment_request",
                    application_payment_request_id: request.id,
                    previous_metadata: request.metadata ?? {},
                },
            })
            .select()
            .single();

        if (paymentError || !payment) {
            throw new Error(`Failed to create canonical payment: ${paymentError?.message ?? "Unknown error"}`);
        }

        const { error: itemError } = await supabase.from("payment_items").insert({
            payment_id: payment.id,
            label: itemLabel,
            amount: request.amount,
            category: itemCategory,
        });

        if (itemError) {
            throw new Error(`Failed to create payment item: ${itemError.message}`);
        }

        await supabase
            .from("application_payment_requests")
            .update({
                linked_payment_id: payment.id,
                metadata: {
                    ...(normalizeObject(request.metadata) ?? {}),
                    canonical_payment_id: payment.id,
                },
            })
            .eq("id", request.id);

        if (isAdvance) paymentIds.advance = payment.id;
        else paymentIds.deposit = payment.id;
    }

    return paymentIds;
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

    const reviewedAt = new Date().toISOString();

    const { data: initialApplication, error: applicationError } = await supabase
        .from("applications")
        .select(
            `
            id,
            status,
            applicant_name,
            applicant_email,
            applicant_phone,
            unit_id,
            move_in_date,
            compliance_checklist,
            requirements_checklist,
            payment_pending_started_at,
            payment_pending_expires_at,
            payment_portal_token_hash,
            payment_portal_token_expires_at,
            unit:units (
                id,
                name,
                rent_amount,
                property:properties (
                    id,
                    name,
                    contract_template
                )
            )
        `
        )
        .eq("id", applicationId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (applicationError) {
        return NextResponse.json({ error: "Failed to load application." }, { status: 500 });
    }
    let application = initialApplication;
    if (!application) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }
    if (application.status === "withdrawn") {
        return NextResponse.json({ error: "Application has been withdrawn." }, { status: 409 });
    }

    if (application.status === "payment_pending") {
        const expiryResult = await applyPaymentPendingExpiry(adminClient, application.id);
        if (expiryResult.expired) {
            const { data: refreshed } = await supabase
                .from("applications")
                .select(
                    `
                    id,
                    status,
                    applicant_name,
                    applicant_email,
                    applicant_phone,
                    unit_id,
                    move_in_date,
                    compliance_checklist,
                    requirements_checklist,
                    payment_pending_started_at,
                    payment_pending_expires_at,
                    payment_portal_token_hash,
                    payment_portal_token_expires_at,
                    unit:units (
                        id,
                        name,
                        rent_amount,
                        property:properties (
                            id,
                            name,
                            contract_template
                        )
                    )
                `
                )
                .eq("id", applicationId)
                .eq("landlord_id", user.id)
                .maybeSingle();
            if (refreshed) {
                application = refreshed;
            }
        }
    }

    if (body.status === "reviewing" || body.status === "rejected") {
        const clearingPaymentPending = application.status === "payment_pending";
        const { error: updateError } = await supabase
            .from("applications")
            .update({
                status: body.status,
                reviewed_at: reviewedAt,
                ...(clearingPaymentPending
                    ? {
                          payment_pending_started_at: null,
                          payment_pending_expires_at: null,
                          payment_portal_token_hash: null,
                          payment_portal_token_expires_at: null,
                      }
                    : {}),
            })
            .eq("id", applicationId)
            .eq("landlord_id", user.id);

        if (updateError) {
            return NextResponse.json({ error: "Failed to update application status." }, { status: 500 });
        }

        if (clearingPaymentPending) {
            await adminClient
                .from("application_payment_requests")
                .update({ status: "expired" })
                .eq("application_id", application.id)
                .in("status", ["pending", "processing"]);
        }

        return NextResponse.json({
            success: true,
            status: body.status,
            reviewedAt,
        });
    }

    if (body.status === "payment_pending") {
        if (application.status !== "pending" && application.status !== "reviewing") {
            return NextResponse.json(
                {
                    error: `Application must be pending or reviewing before requesting payments. Current status: ${application.status}`,
                },
                { status: 409 }
            );
        }

        const leaseData = parseAndValidateLeaseData(body.lease_data);
        if (!leaseData) {
            return NextResponse.json(
                {
                    error: "Lease details are required before requesting payments.",
                },
                { status: 400 }
            );
        }

        const propertyTemplate =
            normalizeObject((application as any).unit?.property?.contract_template) ?? null;
        const monthlyRentFallback = Number((application as any).unit?.rent_amount ?? 0);
        const advanceDefault =
            pickTemplateAmount(propertyTemplate, ADVANCE_TEMPLATE_KEYS, leaseData.monthly_rent || monthlyRentFallback) ??
            leaseData.monthly_rent;
        const securityDefault =
            pickTemplateAmount(propertyTemplate, DEPOSIT_TEMPLATE_KEYS, leaseData.monthly_rent || monthlyRentFallback) ??
            leaseData.security_deposit;

        const advanceAmount =
            toPositiveNumber(body.advance_payment?.amount ?? advanceDefault) ?? null;
        const securityAmount =
            toPositiveNumber(body.security_deposit_payment?.amount ?? securityDefault) ?? null;

        if (!advanceAmount || !securityAmount) {
            return NextResponse.json(
                {
                    error: "Advance and security amounts must both be greater than zero.",
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const expiry = resolvePaymentPendingExpiry(now);

        const { data: blocking } = await adminClient
            .from("applications")
            .select("id")
            .eq("unit_id", application.unit_id)
            .eq("status", "payment_pending")
            .gt("payment_pending_expires_at", now.toISOString())
            .neq("id", application.id)
            .limit(1);

        if ((blocking ?? []).length > 0) {
            return NextResponse.json(
                {
                    error: "Another applicant currently has an active payment window for this unit.",
                },
                { status: 409 }
            );
        }

        const portal = buildPortalToken();
        const pendingConfig = withPaymentPendingConfig(application.compliance_checklist, {
            created_at: now.toISOString(),
            lease_data: leaseData,
            advance_amount: advanceAmount,
            security_amount: securityAmount,
        });

        const existingChecklist = normalizeObject(application.requirements_checklist);

        const { error: appUpdateError } = await adminClient
            .from("applications")
            .update({
                status: "payment_pending",
                reviewed_at: reviewedAt,
                compliance_checklist: pendingConfig as Json,
                requirements_checklist: {
                    ...existingChecklist,
                    move_in_payment: false,
                },
                payment_pending_started_at: now.toISOString(),
                payment_pending_expires_at: expiry.toISOString(),
                payment_portal_token_hash: portal.hash,
                payment_portal_token_expires_at: expiry.toISOString(),
            })
            .eq("id", application.id)
            .eq("landlord_id", user.id);

        if (appUpdateError) {
            return NextResponse.json({ error: "Failed to set payment pending status." }, { status: 500 });
        }

        const requestRows = [
            {
                application_id: application.id,
                landlord_id: user.id,
                requirement_type: "advance_rent" as const,
                amount: advanceAmount,
                due_at: leaseData.start_date,
                status: "pending" as const,
                method: null,
                reference_number: null,
                payment_note: null,
                payment_proof_path: null,
                payment_proof_url: null,
                submitted_at: null,
                reviewed_at: null,
                reviewed_by: null,
                review_note: null,
                bypassed: false,
                linked_payment_id: null,
                metadata: {},
            },
            {
                application_id: application.id,
                landlord_id: user.id,
                requirement_type: "security_deposit" as const,
                amount: securityAmount,
                due_at: leaseData.start_date,
                status: "pending" as const,
                method: null,
                reference_number: null,
                payment_note: null,
                payment_proof_path: null,
                payment_proof_url: null,
                submitted_at: null,
                reviewed_at: null,
                reviewed_by: null,
                review_note: null,
                bypassed: false,
                linked_payment_id: null,
                metadata: {},
            },
        ];

        const { data: insertedRequests, error: insertRequestsError } = await adminClient
            .from("application_payment_requests")
            .upsert(requestRows, {
                onConflict: "application_id,requirement_type",
            })
            .select("id, requirement_type, amount, status, due_at");

        if (insertRequestsError) {
            await adminClient
                .from("applications")
                .update({
                    status: application.status,
                    payment_pending_started_at: null,
                    payment_pending_expires_at: null,
                    payment_portal_token_hash: null,
                    payment_portal_token_expires_at: null,
                })
                .eq("id", application.id)
                .eq("landlord_id", user.id);
            return NextResponse.json({ error: "Failed to create payment requests." }, { status: 500 });
        }

        await Promise.all(
            (insertedRequests ?? []).map((requestRow: any) =>
                logApplicationPaymentAudit(adminClient, {
                    application_id: application.id,
                    payment_request_id: requestRow.id,
                    actor_id: user.id,
                    actor_role: "landlord",
                    event_type: "request_generated",
                    metadata: {
                        requirement_type: requestRow.requirement_type,
                        amount: requestRow.amount,
                    },
                })
            )
        );

        const origin = new URL(request.url).origin;
        const portalUrl = buildPortalUrl(origin, portal.token);

        const applicantEmail = application.applicant_email?.trim();
        if (applicantEmail) {
            try {
                await sendProspectPaymentRequestEmail({
                    to: applicantEmail,
                    applicantName: application.applicant_name?.trim() || "Applicant",
                    propertyName: (application as any).unit?.property?.name ?? "Property",
                    unitName: (application as any).unit?.name ?? "Unit",
                    paymentPortalUrl: portalUrl,
                    expiresAt: expiry,
                    advanceAmount,
                    securityAmount,
                });
            } catch (emailError) {
                console.error("[application-actions] failed to send payment portal email:", emailError);
            }
        }

        return NextResponse.json({
            success: true,
            status: "payment_pending",
            reviewedAt,
            payment_pending_expires_at: expiry.toISOString(),
            payment_portal_url: portalUrl,
            payment_requests: insertedRequests ?? [],
        });
    }

    if (body.status === "approved") {
        if (application.status !== "payment_pending") {
            return NextResponse.json(
                {
                    error: `Only payment-pending applications can be approved. Current status: ${application.status}`,
                },
                { status: 409 }
            );
        }

        const expiryResult = await applyPaymentPendingExpiry(adminClient, application.id);
        if (expiryResult.expired) {
            return NextResponse.json(
                { error: "Payment window has expired and the application was moved back to reviewing." },
                { status: 409 }
            );
        }

        const { data: blocking } = await adminClient
            .from("applications")
            .select("id")
            .eq("unit_id", application.unit_id)
            .eq("status", "payment_pending")
            .gt("payment_pending_expires_at", new Date().toISOString())
            .neq("id", application.id)
            .limit(1);

        if ((blocking ?? []).length > 0) {
            return NextResponse.json(
                { error: "Another applicant currently has an active payment window for this unit." },
                { status: 409 }
            );
        }

        const { data: requestRows, error: requestRowsError } = await adminClient
            .from("application_payment_requests")
            .select(
                "id, requirement_type, amount, method, reference_number, payment_note, payment_proof_path, payment_proof_url, submitted_at, reviewed_at, status, metadata"
            )
            .eq("application_id", application.id);

        if (requestRowsError) {
            return NextResponse.json({ error: "Failed to load payment request status." }, { status: 500 });
        }

        const paymentRequests = (requestRows ?? []) as Array<{
            id: string;
            requirement_type: "advance_rent" | "security_deposit";
            amount: number;
            method: PaymentMethod | null;
            reference_number: string | null;
            payment_note: string | null;
            payment_proof_path: string | null;
            payment_proof_url: string | null;
            submitted_at: string | null;
            reviewed_at: string | null;
            status: string;
            metadata: Json;
        }>;

        if (paymentRequests.length < 2 || !areRequiredPaymentRequestsCompleted(paymentRequests)) {
            return NextResponse.json(
                { error: "Both advance and security payments must be confirmed before final approval." },
                { status: 409 }
            );
        }

        const pendingConfig = readPaymentPendingConfig(application.compliance_checklist);
        if (!pendingConfig) {
            return NextResponse.json(
                { error: "Missing payment-pending lease configuration. Request payments again." },
                { status: 409 }
            );
        }

        const tenantEmail = application.applicant_email?.trim();
        const tenantName = application.applicant_name?.trim() ?? "Tenant";

        if (!tenantEmail) {
            return NextResponse.json({ error: "Applicant email is required for approval." }, { status: 400 });
        }

        let tenantAccountInfo: {
            email: string;
            tempPassword: string;
            inviteUrl?: string;
            landlordNotified: boolean;
            signing_link?: string;
        } | null = null;
        let leaseId: string | null = null;
        let paymentIds: { advance: string; deposit: string } | null = null;

        try {
            const { data: existingUsers } = await adminClient.auth.admin.listUsers();
            const alreadyExists = existingUsers?.users?.some(
                (listedUser) => listedUser.email?.toLowerCase() === tenantEmail.toLowerCase()
            );
            if (alreadyExists) {
                return NextResponse.json(
                    { error: "A user with this email already exists." },
                    { status: 409 }
                );
            }

            const tempPassword = generateTempPassword();

            const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                email: tenantEmail,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: tenantName,
                    role: "tenant",
                    onboarding_source: "invite_application",
                    application_id: application.id,
                },
            });

            if (createError || !newUser?.user) {
                return NextResponse.json(
                    { error: "Failed to create tenant account. Please try again." },
                    { status: 500 }
                );
            }

            const tenantId = newUser.user.id;

            try {
                await adminClient.from("profiles").upsert(
                    {
                        id: tenantId,
                        full_name: tenantName,
                        email: tenantEmail,
                        role: "tenant",
                    },
                    { onConflict: "id" }
                );

                const unit = (application as any).unit;
                const property = unit?.property;
                const contractTemplate = normalizeObject(property?.contract_template);
                const leaseTerms = {
                    ...contractTemplate,
                    ...pendingConfig.lease_data.terms,
                };

                const lease = await createLeaseRecord(adminClient, {
                    unit_id: application.unit_id,
                    tenant_id: tenantId,
                    landlord_id: user.id,
                    start_date: pendingConfig.lease_data.start_date,
                    monthly_rent: pendingConfig.lease_data.monthly_rent,
                    security_deposit: pendingConfig.lease_data.security_deposit,
                    landlord_signature: pendingConfig.lease_data.landlord_signature,
                    terms: leaseTerms,
                });

                leaseId = lease.id;

                paymentIds = await createCanonicalPaymentsFromRequests(adminClient, {
                    lease_id: lease.id,
                    tenant_id: tenantId,
                    landlord_id: user.id,
                    start_date: pendingConfig.lease_data.start_date,
                    requests: paymentRequests,
                });

                const existingChecklist = normalizeObject(application.requirements_checklist);
                const { error: linkError } = await adminClient
                    .from("applications")
                    .update({
                        status: "approved",
                        reviewed_at: reviewedAt,
                        applicant_id: tenantId,
                        lease_id: lease.id,
                        requirements_checklist: {
                            ...existingChecklist,
                            move_in_payment: true,
                        },
                        payment_pending_started_at: null,
                        payment_pending_expires_at: null,
                        payment_portal_token_hash: null,
                        payment_portal_token_expires_at: null,
                    })
                    .eq("id", application.id)
                    .eq("landlord_id", user.id);

                if (linkError) {
                    throw new Error(`Failed to link lease to application: ${linkError.message}`);
                }

                const signingLink = generateSigningLink(lease.id, tenantId);
                const { data: linkData, error: resetLinkError } = await adminClient.auth.admin.generateLink({
                    type: "recovery",
                    email: tenantEmail,
                });
                if (resetLinkError) {
                    console.error("[application-actions] generate recovery link failed:", resetLinkError);
                }
                const inviteUrl = linkData?.properties?.action_link ?? undefined;

                const { data: landlordProfile } = await adminClient
                    .from("profiles")
                    .select("email, full_name")
                    .eq("id", user.id)
                    .maybeSingle();

                tenantAccountInfo = {
                    email: tenantEmail,
                    tempPassword,
                    inviteUrl,
                    signing_link: signingLink,
                    landlordNotified: !!landlordProfile?.email,
                };

                await logApplicationPaymentAudit(adminClient, {
                    application_id: application.id,
                    actor_id: user.id,
                    actor_role: "landlord",
                    event_type: "finalized",
                    metadata: {
                        lease_id: lease.id,
                        payment_ids: paymentIds,
                    },
                });

                const leaseDetails = {
                    property_name: property?.name || "Property",
                    unit_name: unit?.name || "Unit",
                    move_in_date: pendingConfig.lease_data.start_date,
                    monthly_rent: pendingConfig.lease_data.monthly_rent,
                };

                try {
                    await sendTenantCredentials({
                        to: tenantEmail,
                        tenantName,
                        tempPassword,
                        inviteUrl,
                        leaseDetails,
                        signingLink,
                    });
                } catch (emailError) {
                    console.error("[application-actions] send tenant credentials failed:", emailError);
                }

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
                    } catch (emailError) {
                        console.error("[application-actions] send landlord copy failed:", emailError);
                    }
                }
            } catch (finalizeError: any) {
                await rollbackLeaseAndAccount(adminClient, leaseId ?? "", tenantId);
                return NextResponse.json(
                    { error: finalizeError.message || "Failed to finalize approval." },
                    { status: 500 }
                );
            }
        } catch (error: any) {
            console.error("[application-actions] approval failure:", error);
            return NextResponse.json(
                { error: "Failed to approve application. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            status: "approved",
            reviewedAt,
            ...(leaseId ? { lease_id: leaseId } : {}),
            ...(paymentIds ? { payment_ids: paymentIds } : {}),
            ...(tenantAccountInfo ? { tenant_account: tenantAccountInfo } : {}),
        });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
