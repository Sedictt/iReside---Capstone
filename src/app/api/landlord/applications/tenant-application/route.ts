import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { parseJsonBody } from "@/lib/validation/server";
import { landlordApplicationCreateSchema, landlordApplicationUpdateSchema } from "@/lib/validation/schemas/tenant-lifecycle.schema";

type PostgrestLikeError = {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    hint?: string | null;
};

function extractMissingColumn(error: PostgrestLikeError | null | undefined) {
    if (!error || error.code !== "PGRST204" || !error.message) {
        return null;
    }

    const match = error.message.match(/'([^']+)' column/);
    return match?.[1] ?? null;
}

function isApplicantIdNotNullViolation(error: PostgrestLikeError | null | undefined) {
    return error?.code === "23502" && (error.message ?? "").includes("applicant_id");
}

export async function POST(request: Request) {
    const adminClient = createServiceRoleSupabaseClient();


    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase: _supabase } = authContext;

    const parsed = await parseJsonBody(request, landlordApplicationCreateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const unit_id = body.unit_id;
    const normalizedApplicantName = body.applicant_name;
    const normalizedApplicantEmail = body.applicant_email;
    const normalizedApplicantPhone = body.applicant_phone ?? "";
    const normalizedMessage = body.message ?? "";
    const occupation = body.employment_info.occupation;
    const employer = body.employment_info.employer;
    const monthlyIncome = body.employment_info.monthly_income;
    const requirements_checklist = body.requirements_checklist ?? null;
    const requestedStatus = body.status;

    // Verify landlord owns this unit.
    const { data: unit, error: unitError } = await adminClient
        .from("units")
        .select("id, property_id, status")
        .eq("id", unit_id)
        .maybeSingle();

    if (unitError) {
        console.error("Walk-in unit lookup error:", unitError);
        return NextResponse.json({ error: "Failed to validate unit." }, { status: 500 });
    }

    if (!unit) {
        return NextResponse.json({ error: "Unit not found." }, { status: 404 });
    }

    if ((unit.status ?? "").toLowerCase() === "occupied") {
        return NextResponse.json({ error: "Selected unit is currently occupied and unavailable." }, { status: 400 });
    }

    const isOngoingStatus = [
        "under_negotiation",
        "under negotiation",
        "negotiating",
        "processing",
        "ongoing",
        "on-going",
        "reserved"
    ].includes((unit.status ?? "").toLowerCase());

    if (isOngoingStatus) {
        return NextResponse.json({ error: "Selected unit currently has an ongoing application or is under negotiation." }, { status: 400 });
    }

    const { data: ongoingApp } = await adminClient
        .from("applications")
        .select("id")
        .eq("unit_id", unit_id)
        .in("status", ["pending", "reviewing", "payment_pending", "approved"])
        .limit(1)
        .maybeSingle();

    if (ongoingApp) {
        return NextResponse.json({ error: "Selected unit currently has an ongoing application under processing and is unavailable." }, { status: 400 });
    }

    const { data: property, error: propertyError } = await adminClient
        .from("properties")
        .select("id, landlord_id")
        .eq("id", unit.property_id)
        .maybeSingle();

    if (propertyError) {
        console.error("Walk-in property ownership lookup error:", propertyError);
        return NextResponse.json({ error: "Failed to validate unit ownership." }, { status: 500 });
    }

    if (!property) {
        return NextResponse.json({ error: "Property not found for unit." }, { status: 404 });
    }

    if (property.landlord_id !== userId) {
        return NextResponse.json({ error: "You do not own this unit." }, { status: 403 });
    }

    // Tenant-application creation cannot directly approve under payment-gated flow.
    const checklist = requirements_checklist || {};
    const allComplete =
        Object.values(checklist).length > 0 && Object.values(checklist).every((v) => v === true);
    const status =
        requestedStatus === "pending" || requestedStatus === "reviewing"
            ? requestedStatus
            : allComplete
              ? "reviewing"
              : "pending";

    const insertPayload: Record<string, unknown> = {
        unit_id,
        landlord_id: userId,
        created_by: userId,
        applicant_name: normalizedApplicantName,
        applicant_phone: normalizedApplicantPhone || null,
        applicant_email: normalizedApplicantEmail,
        move_in_date: body.move_in_date,
        emergency_contact_name: body.emergency_contact_name,
        emergency_contact_phone: body.emergency_contact_phone,
        employment_info: {
            occupation,
            employer,
            monthly_income: monthlyIncome,
        },
        requirements_checklist: checklist,
        status,
        message: normalizedMessage || null,
        employment_status: occupation || null,
        monthly_income: monthlyIncome,
    };

    let application: { id: string; status: string; created_at: string } | null = null;
    let insertError: PostgrestLikeError | null = null;

    for (let attempt = 0; attempt < 8; attempt += 1) {
        const { data, error } = await (adminClient as any)
            .from("applications")
            .insert(insertPayload as any)
            .select("id, status, created_at")
            .single();

        if (!error) {
            application = data;
            insertError = null;
            break;
        }

        const missingColumn = extractMissingColumn(error);
        if (missingColumn && missingColumn in insertPayload) {
            delete insertPayload[missingColumn];
            continue;
        }

        if (isApplicantIdNotNullViolation(error) && !("applicant_id" in insertPayload)) {
            // Backward-compatibility for environments where applicant_id is still NOT NULL.
            insertPayload.applicant_id = userId;
            continue;
        }

        insertError = error;
        break;
    }

    if (insertError || !application) {
        console.error("Walk-in application insert error:", insertError);
        return NextResponse.json(
            { error: "Failed to create application." },
            { status: 500 }
        );
    }

    return NextResponse.json({ application }, { status: 201 });
}

export async function PATCH(request: Request) {
    const adminClient = createServiceRoleSupabaseClient();


    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase: _supabase } = authContext;

    const parsed = await parseJsonBody(request, landlordApplicationUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const { application_id, requirements_checklist, employment_info, status } = body;

    // Verify the landlord owns this application
    let ownershipSelect = "id, created_by, landlord_id, status";
    let existing: { id: string; created_by?: string | null; landlord_id?: string | null; status?: string | null } | null = null;
    let fetchError: PostgrestLikeError | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
        const { data, error } = await (adminClient as any)
            .from("applications")
            .select(ownershipSelect)
            .eq("id", application_id)
            .single();

        if (!error) {
            existing = data;
            fetchError = null;
            break;
        }

        const missingColumn = extractMissingColumn(error);
        if (missingColumn === "created_by") {
            ownershipSelect = "id, landlord_id, status";
            continue;
        }

        fetchError = error;
        break;
    }

    if (fetchError || !existing) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const createdBy = typeof existing.created_by === "string" ? existing.created_by : null;
    const landlordId = typeof existing.landlord_id === "string" ? existing.landlord_id : null;
    const isOwner = landlordId === userId;
    const isCreator = createdBy === userId;

    if (!isOwner && !isCreator) {
        return NextResponse.json({ error: "Unauthorized to update this application." }, { status: 403 });
    }

    // An approved application already has a tenant account and lease; its status is final here.
    if (status && existing.status === "approved") {
        return NextResponse.json(
            { error: "This application is already approved and its status can no longer be changed." },
            { status: 409 }
        );
    }

    const updates: Record<string, unknown> = {};

    // Applicant identity fields (already trimmed/normalized by the schema)
    if (body.applicant_name !== undefined) updates.applicant_name = body.applicant_name;
    if (body.applicant_email !== undefined) updates.applicant_email = body.applicant_email;
    if (body.applicant_phone !== undefined) updates.applicant_phone = body.applicant_phone;
    if (body.emergency_contact_name !== undefined) updates.emergency_contact_name = body.emergency_contact_name;
    if (body.emergency_contact_phone !== undefined) updates.emergency_contact_phone = body.emergency_contact_phone;
    if (body.move_in_date !== undefined) updates.move_in_date = body.move_in_date;
    if (body.message !== undefined) updates.message = body.message;

    if (requirements_checklist) updates.requirements_checklist = requirements_checklist;
    if (employment_info) {
        updates.employment_info = employment_info;
        updates.employment_status = employment_info.occupation;
        updates.monthly_income = employment_info.monthly_income;
    }
    if (status) updates.status = status;

    let updateSelect = "id, status, requirements_checklist, updated_at";
    let updated: { id: string; status: string; updated_at: string; requirements_checklist?: unknown } | null = null;
    let updateError: PostgrestLikeError | null = null;

    for (let attempt = 0; attempt < 8; attempt += 1) {
        const { data, error } = await (adminClient as any)
            .from("applications")
            .update(updates as any)
            .eq("id", application_id)
            .select(updateSelect)
            .single();

        if (!error) {
            updated = data;
            updateError = null;
            break;
        }

        const missingColumn = extractMissingColumn(error);
        if (missingColumn) {
            if (missingColumn in updates) {
                delete updates[missingColumn];
                continue;
            }

            if (updateSelect.includes(missingColumn)) {
                const fields = updateSelect
                    .split(",")
                    .map((field) => field.trim())
                    .filter((field) => field !== missingColumn);
                updateSelect = fields.join(", ");
                continue;
            }
        }

        updateError = error;
        break;
    }

    if (updateError || !updated) {
        console.error("Walk-in application update error:", updateError);
        return NextResponse.json({ error: "Failed to update application." }, { status: 500 });
    }

    return NextResponse.json({ application: updated });
}
