import { NextResponse } from "next/server";
import {
    ADVANCE_TEMPLATE_KEYS,
    DEPOSIT_TEMPLATE_KEYS,
    pickTemplateAmount,
} from "@/lib/application-payment-pending";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_CHECKLIST } from "@/lib/application-intake";
import {
    TENANT_INVITE_REQUIREMENT_KEYS,
    getInviteAvailability,
    hashInviteToken,
    type TenantInviteApplicationType,
    type TenantInviteRequirementKey,
} from "@/lib/tenant-intake-invites";
import {
    calculatePaymentPreview,
    sanitizePaymentTerms,
    type InvitePaymentTerms,
} from "@/lib/tenant-invite-payment-terms";
import { sendNewApplicationReceivedEmail } from "@/lib/email";
import type { Database } from "@/types/database";
import { parseJsonBody } from "@/lib/validation/server";
import { inviteApplicationSchema, isUrlToken } from "@/lib/validation/schemas/tenant-lifecycle.schema";

type InviteRecord = {
    id: string;
    landlord_id: string;
    property_id: string;
    unit_id: string | null;
    mode: "property" | "unit";
    application_type: TenantInviteApplicationType;
    required_requirements: TenantInviteRequirementKey[] | null;
    public_token: string;
    token_hash: string;
    status: "active" | "revoked" | "expired" | "consumed";
    max_uses: number;
    use_count: number;
    expires_at: string | null;
    payment_terms?: InvitePaymentTerms | null;
};

async function loadInviteRecord(token: string) {
    const adminClient = createAdminClient();
    let data: any = null;
    let error: any = null;

    const resWithTerms = await (adminClient
        .from("tenant_intake_invites" as any)
        .select("id, landlord_id, property_id, unit_id, mode, application_type, required_requirements, public_token, token_hash, status, max_uses, use_count, expires_at, payment_terms")
        .eq("public_token", token)
        .maybeSingle() as any);

    if (resWithTerms.error && (resWithTerms.error.message?.includes("payment_terms") || resWithTerms.error.code === "42703" || resWithTerms.error.code === "PGRST204")) {
        const fallbackRes = await (adminClient
            .from("tenant_intake_invites" as any)
            .select("id, landlord_id, property_id, unit_id, mode, application_type, required_requirements, public_token, token_hash, status, max_uses, use_count, expires_at")
            .eq("public_token", token)
            .maybeSingle() as any);
        data = fallbackRes.data;
        error = fallbackRes.error;
    } else {
        data = resWithTerms.data;
        error = resWithTerms.error;
    }

    if (error) {
        throw error;
    }

    if (!data) {
        return null;
    }

    const invite = data as InviteRecord;
    if (invite.token_hash !== hashInviteToken(token)) {
        return null;
    }

    return invite;
}

async function expireInviteIfNeeded(invite: InviteRecord) {
    const adminClient = createAdminClient();
    const availability = getInviteAvailability({
        status: invite.status,
        expiresAt: invite.expires_at,
        useCount: invite.use_count,
        maxUses: invite.max_uses,
    });

    if (availability.expired && invite.status !== "expired") {
        await adminClient.from("tenant_intake_invites" as any).update({ status: "expired" }).eq("id", invite.id);
        await adminClient.from("tenant_intake_invite_events" as any).insert({
            invite_id: invite.id,
            event_type: "expired",
            metadata: {},
        });
    }

    return availability;
}

export async function GET(
    _request: Request,
    context: { params: Promise<{ token: string }> }
) {
    const { token } = await context.params;
    const adminClient = createAdminClient();

    if (!isUrlToken(token)) {
        return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }

    try {
        const invite = await loadInviteRecord(token);
        if (!invite) {
            return NextResponse.json({ error: "Invite not found." }, { status: 404 });
        }

        const availability = await expireInviteIfNeeded(invite);
        if (!availability.active) {
            return NextResponse.json({ error: "Invite is no longer available." }, { status: 410 });
        }

        const { data: property } = await adminClient
            .from("properties")
            .select("id, name, contract_template")
            .eq("id", invite.property_id)
            .maybeSingle();

        const { data: units } = await adminClient
            .from("units")
            .select("id, property_id, name, rent_amount, status")
            .eq("property_id", invite.property_id)
            .eq("status", "vacant")
            .order("name", { ascending: true });

        const contractTemplate =
            property?.contract_template && typeof property.contract_template === "object" && !Array.isArray(property.contract_template)
                ? (property.contract_template as Record<string, unknown>)
                : null;

        const paymentTerms = invite.payment_terms ? sanitizePaymentTerms(invite.payment_terms) : null;

        const eligibleUnits = (units ?? [])
            .filter((unit) => invite.mode === "property" || unit.id === invite.unit_id)
            .map((unit) => ({
                id: unit.id,
                name: unit.name,
                rent_amount: Number(unit.rent_amount ?? 0),
                property_id: unit.property_id,
                property_name: property?.name ?? "Property",
                paymentPreview: calculatePaymentPreview({
                    monthlyRent: Number(unit.rent_amount ?? 0),
                    terms: paymentTerms,
                    contractTemplate,
                }),
            }));

        const selectedUnit = invite.mode === "unit" ? eligibleUnits[0] ?? null : null;
        const fallbackPreviewUnit = selectedUnit ?? eligibleUnits[0] ?? null;

        await adminClient.from("tenant_intake_invite_events" as any).insert({
            invite_id: invite.id,
            event_type: "opened",
            metadata: { mode: invite.mode },
        });

        return NextResponse.json({
            invite: {
                id: invite.id,
                mode: invite.mode,
                applicationType: invite.application_type ?? "face_to_face",
                requiredRequirements: Array.isArray(invite.required_requirements)
                    ? invite.required_requirements.filter((item): item is TenantInviteRequirementKey =>
                        typeof item === "string" && TENANT_INVITE_REQUIREMENT_KEYS.includes(item as TenantInviteRequirementKey)
                    )
                    : [],
                paymentTerms,
                propertyId: invite.property_id,
                propertyName: property?.name ?? "Property",
                unitId: invite.unit_id,
                selectedUnit,
                units: eligibleUnits,
                paymentPreview: fallbackPreviewUnit?.paymentPreview ?? null,
                expiresAt: invite.expires_at,
            },
        });
    } catch {
        return NextResponse.json({ error: "Failed to validate invite." }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ token: string }> }
) {
    const { token } = await context.params;
    const adminClient = createAdminClient();

    if (!isUrlToken(token)) {
        return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }

    try {
        const invite = await loadInviteRecord(token);
        if (!invite) {
            return NextResponse.json({ error: "Invite not found." }, { status: 404 });
        }

        const availability = await expireInviteIfNeeded(invite);
        if (!availability.active) {
            return NextResponse.json({ error: "Invite is no longer available." }, { status: 410 });
        }

        const parsed = await parseJsonBody(request, inviteApplicationSchema);
        if (!parsed.ok) return parsed.response;
        const body = parsed.data;

        const { occupation, employer, monthly_income: monthlyIncome } = body.employment_info;
        const applicantName = body.applicant_name;
        const applicantEmail = body.applicant_email;

        let resolvedUnitId = invite.unit_id;
        if (invite.mode === "property") {
            resolvedUnitId = body.unit_id ?? null;
        }

        if (!resolvedUnitId) {
            return NextResponse.json({ error: "A unit must be selected." }, { status: 400 });
        }

        const { data: unit } = await adminClient
            .from("units")
            .select("id, property_id, status")
            .eq("id", resolvedUnitId)
            .maybeSingle();

        if (!unit || unit.property_id !== invite.property_id || unit.status !== "vacant") {
            return NextResponse.json({ error: "Selected unit is no longer available." }, { status: 400 });
        }

        // Duplicate-submission guard: the same applicant cannot submit twice on one invite link.
        const { data: existingApplication } = await adminClient
            .from("applications")
            .select("id")
            .eq("invite_id", invite.id)
            .ilike("applicant_email", applicantEmail)
            .in("status", ["pending", "reviewing", "payment_pending", "approved"])
            .limit(1)
            .maybeSingle();

        if (existingApplication) {
            return NextResponse.json(
                { error: "An application from this email was already submitted through this invite." },
                { status: 409 }
            );
        }

        const inviteChecklist = {
            ...DEFAULT_CHECKLIST,
            ...(body.requirements_checklist ?? {}),
            application_form: true,
            // Move-in payment is only completed after invoice confirmation, never at application submission.
            move_in_payment: false,
        };
        // Only accept proof links that point at this invite's own upload folder.
        const submittedDocuments = (body.uploaded_documents ?? []).filter((doc) =>
            doc.url.includes(`/tenant-invite-documents/${invite.id}/`)
        );

        if (invite.application_type === "online") {
            const requiredKeys = Array.isArray(invite.required_requirements)
                ? invite.required_requirements.filter((item): item is TenantInviteRequirementKey =>
                    typeof item === "string" && TENANT_INVITE_REQUIREMENT_KEYS.includes(item as TenantInviteRequirementKey)
                )
                : [];

            if (requiredKeys.length === 0) {
                return NextResponse.json({ error: "Online invite is missing required checklist configuration." }, { status: 400 });
            }

            for (const key of requiredKeys) {
                if (key === "move_in_payment") {
                    // Payment proof is handled after approval via invoices, not during application submission.
                    continue;
                }

                if (!inviteChecklist[key]) {
                    return NextResponse.json({ error: `Please mark ${key.replaceAll("_", " ")} as provided.` }, { status: 400 });
                }

                if (key !== "application_form") {
                    const hasProof = submittedDocuments.some((doc) => doc.requirementKey === key);
                    if (!hasProof) {
                        return NextResponse.json({ error: `Upload at least one photo for ${key.replaceAll("_", " ")}.` }, { status: 400 });
                    }
                }
            }
        }

        const insertPayload = {
            unit_id: resolvedUnitId,
            landlord_id: invite.landlord_id,
            invite_id: invite.id,
            applicant_name: applicantName,
            applicant_email: applicantEmail,
            applicant_phone: body.applicant_phone,
            move_in_date: body.move_in_date,
            emergency_contact_name: body.emergency_contact_name,
            emergency_contact_phone: body.emergency_contact_phone,
            employment_info: {
                occupation,
                employer,
                monthly_income: monthlyIncome,
            },
            employment_status: occupation,
            monthly_income: monthlyIncome,
            documents: submittedDocuments.map((doc) => doc.url),
            requirements_checklist: {
                ...inviteChecklist,
                payment_terms: invite.payment_terms ? sanitizePaymentTerms(invite.payment_terms) : null,
            },
            message: body.message,
            status: "pending",
            application_source: "invite_link",
        } as any;

        // applicant_id and created_by are intentionally omitted — they are assigned by the auth flow
        // Cast applicant_id as null since it is only set when the applicant logs in
        (insertPayload as any).applicant_id = null;
        (insertPayload as any).created_by = null;

        const { data: application, error: insertError } = await adminClient
            .from("applications")
            .insert(insertPayload as any)
            .select("id, status, created_at")
            .single();

        if (insertError || !application) {
            return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
        }

        const nextUseCount = invite.use_count + 1;
        const nextStatus = nextUseCount >= invite.max_uses ? "consumed" : invite.status;

        await adminClient
            .from("tenant_intake_invites" as any)
            .update({
                use_count: nextUseCount,
                status: nextStatus,
                last_used_at: new Date().toISOString(),
            })
            .eq("id", invite.id);

        await adminClient.from("tenant_intake_invite_events" as any).insert({
            invite_id: invite.id,
            event_type: nextStatus === "consumed" ? "consumed" : "submitted",
            metadata: {
                applicationId: application.id,
                unitId: resolvedUnitId,
            },
        });

        // 1. Resolve unit & property labels for landlord notification
        let resolvedPropertyName = "Property";
        let resolvedUnitName = "Unit";
        try {
            const { data: unitData } = await adminClient
                .from("units")
                .select("name, property:properties(name)")
                .eq("id", resolvedUnitId)
                .maybeSingle();

            if (unitData) {
                resolvedUnitName = unitData.name || "Unit";
                resolvedPropertyName = (unitData.property as any)?.name || "Property";
            }
        } catch (unitErr) {
            console.error("[POST invites] Failed to resolve unit labels for notification:", unitErr);
        }

        // 2. Dispatch in-app notification to landlord
        try {
            const notifPayload = {
                user_id: invite.landlord_id,
                type: "application" as const,
                title: `New Application — ${resolvedPropertyName}`,
                message: `${applicantName} submitted a rental application for ${resolvedUnitName}. Review the dossier now.`,
                data: {
                    applicationId: application.id,
                    propertyId: invite.property_id,
                    unitId: resolvedUnitId,
                    applicantName,
                    applicantEmail,
                    propertyName: resolvedPropertyName,
                    unitName: resolvedUnitName,
                },
                read: false,
            };

            const { error: notifErr } = await adminClient
                .from("notifications")
                .insert(notifPayload as any);

            if (notifErr) {
                console.error("[POST invites] In-app notification insert error:", notifErr);
            } else {
                console.log(`[POST invites] In-app notification created for landlord ${invite.landlord_id}`);
            }
        } catch (notifEx) {
            console.error("[POST invites] Unhandled exception creating in-app notification:", notifEx);
        }

        // 3. Dispatch email notification to landlord (with fallback resolution)
        try {
            let landlordEmail: string | null = null;
            let landlordFullName: string = "Landlord";

            const { data: landlordProf } = await adminClient
                .from("profiles")
                .select("email, full_name")
                .eq("id", invite.landlord_id)
                .maybeSingle();

            if (landlordProf) {
                landlordEmail = landlordProf.email?.trim() || null;
                if (landlordProf.full_name) landlordFullName = landlordProf.full_name;
            }

            if (!landlordEmail && invite.landlord_id) {
                const { data: authUser, error: authErr } = await adminClient.auth.admin.getUserById(invite.landlord_id);
                if (!authErr && authUser?.user?.email) {
                    landlordEmail = authUser.user.email.trim();
                }
            }

            if (landlordEmail) {
                const reqUrl = new URL(request.url);
                const dossierUrl = `${reqUrl.origin}/landlord/applications?id=${application.id}`;

                await sendNewApplicationReceivedEmail({
                    to: landlordEmail,
                    landlordName: landlordFullName,
                    applicantName,
                    applicantEmail,
                    applicantPhone: body.applicant_phone,
                    propertyName: resolvedPropertyName,
                    unitName: resolvedUnitName,
                    moveInDate: body.move_in_date,
                    dossierUrl,
                });
                console.log(`[POST invites] Dispatched new application email to landlord ${landlordEmail}`);
            }
        } catch (emailErr) {
            console.error("[POST invites] Failed to send new application email to landlord:", emailErr);
        }

        return NextResponse.json({
            application: {
                id: application.id,
                status: application.status,
                createdAt: application.created_at,
            },
        });
    } catch {
        return NextResponse.json({ error: "Failed to submit invite application." }, { status: 500 });
    }
}
type ApplicationInsert = Database["public"]["Tables"]["applications"]["Insert"];
