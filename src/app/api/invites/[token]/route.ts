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
import type { Database } from "@/types/database";

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
};

async function loadInviteRecord(token: string) {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
        .from("tenant_intake_invites")
        .select("id, landlord_id, property_id, unit_id, mode, application_type, required_requirements, public_token, token_hash, status, max_uses, use_count, expires_at")
        .eq("public_token", token)
        .maybeSingle();

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
        await adminClient.from("tenant_intake_invites").update({ status: "expired" }).eq("id", invite.id);
        await adminClient.from("tenant_intake_invite_events").insert({
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

        const eligibleUnits = (units ?? [])
            .filter((unit) => invite.mode === "property" || unit.id === invite.unit_id)
            .map((unit) => ({
                id: unit.id,
                name: unit.name,
                rent_amount: Number(unit.rent_amount ?? 0),
                property_id: unit.property_id,
                property_name: property?.name ?? "Property",
                paymentPreview: {
                    advanceAmount:
                        pickTemplateAmount(contractTemplate, ADVANCE_TEMPLATE_KEYS, Number(unit.rent_amount ?? 0)) ??
                        Number(unit.rent_amount ?? 0),
                    securityDepositAmount:
                        pickTemplateAmount(contractTemplate, DEPOSIT_TEMPLATE_KEYS, Number(unit.rent_amount ?? 0)) ??
                        Number(unit.rent_amount ?? 0),
                    estimated: true,
                    disclaimer: "Estimate only. Final payment requests are generated after landlord review.",
                },
            }));

        const selectedUnit = invite.mode === "unit" ? eligibleUnits[0] ?? null : null;
        const fallbackPreviewUnit = selectedUnit ?? eligibleUnits[0] ?? null;

        await adminClient.from("tenant_intake_invite_events").insert({
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

    try {
        const invite = await loadInviteRecord(token);
        if (!invite) {
            return NextResponse.json({ error: "Invite not found." }, { status: 404 });
        }

        const availability = await expireInviteIfNeeded(invite);
        if (!availability.active) {
            return NextResponse.json({ error: "Invite is no longer available." }, { status: 410 });
        }

        const body = (await request.json()) as {
            unit_id?: string;
            applicant_name?: string;
            applicant_phone?: string;
            applicant_email?: string;
            move_in_date?: string | null;
            emergency_contact_name?: string | null;
            emergency_contact_phone?: string | null;
            employment_info?: {
                occupation?: string;
                employer?: string;
                monthly_income?: number;
            };
            requirements_checklist?: Record<string, boolean>;
            uploaded_documents?: Array<{
                requirementKey?: string;
                url?: string;
            }>;
            message?: string;
        };

        const occupation = body.employment_info?.occupation?.trim() ?? "";
        const employer = body.employment_info?.employer?.trim() ?? "";
        const monthlyIncome = Number(body.employment_info?.monthly_income ?? 0);

        if (!body.applicant_name?.trim() || !body.applicant_email?.trim()) {
            return NextResponse.json({ error: "Applicant name and email are required." }, { status: 400 });
        }

        if (!occupation || !employer || !Number.isFinite(monthlyIncome) || monthlyIncome <= 0) {
            return NextResponse.json({ error: "Employment details are incomplete." }, { status: 400 });
        }

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

        const inviteChecklist = {
            ...DEFAULT_CHECKLIST,
            ...(body.requirements_checklist ?? {}),
            application_form: true,
            // Move-in payment is only completed after invoice confirmation, never at application submission.
            move_in_payment: false,
        };
        const submittedDocuments = Array.isArray(body.uploaded_documents)
            ? body.uploaded_documents
                .map((doc) => ({
                    requirementKey: typeof doc?.requirementKey === "string" ? doc.requirementKey : null,
                    url: typeof doc?.url === "string" ? doc.url.trim() : "",
                }))
                .filter((doc) => doc.url.length > 0 && /^https?:\/\//i.test(doc.url))
            : [];

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

        const insertPayload: ApplicationInsert = {
            unit_id: resolvedUnitId,
            applicant_id: null,
            landlord_id: invite.landlord_id,
            created_by: null,
            applicant_name: body.applicant_name.trim(),
            applicant_email: body.applicant_email.trim(),
            applicant_phone: body.applicant_phone?.trim() || null,
            move_in_date: body.move_in_date || null,
            emergency_contact_name: body.emergency_contact_name?.trim() || null,
            emergency_contact_phone: body.emergency_contact_phone?.trim() || null,
            employment_info: {
                occupation,
                employer,
                monthly_income: monthlyIncome,
            },
            employment_status: occupation,
            monthly_income: monthlyIncome,
            documents: submittedDocuments.map((doc) => doc.url),
            requirements_checklist: inviteChecklist,
            message: body.message?.trim() || null,
            status: "pending",
            application_source: "invite_link",
            invite_id: invite.id,
        };

        const { data: application, error: insertError } = await adminClient
            .from("applications")
            .insert(insertPayload)
            .select("id, status, created_at")
            .single();

        if (insertError || !application) {
            return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
        }

        const nextUseCount = invite.use_count + 1;
        const nextStatus = nextUseCount >= invite.max_uses ? "consumed" : invite.status;

        await adminClient
            .from("tenant_intake_invites")
            .update({
                use_count: nextUseCount,
                status: nextStatus,
                last_used_at: new Date().toISOString(),
            })
            .eq("id", invite.id);

        await adminClient.from("tenant_intake_invite_events").insert({
            invite_id: invite.id,
            event_type: nextStatus === "consumed" ? "consumed" : "submitted",
            metadata: {
                applicationId: application.id,
                unitId: resolvedUnitId,
            },
        });

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
