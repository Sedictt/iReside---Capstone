import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED_REGEX = /^[+()\-\s\d]+$/;

type PostgrestLikeError = {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    hint?: string | null;
};

function normalizeString(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function toPositiveOrZeroNumber(value: unknown) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : Number.NaN;
    }
    return Number.NaN;
}

function hasValidPhoneFormat(value: string) {
    const digits = value.replace(/\D/g, "");
    return PHONE_ALLOWED_REGEX.test(value) && digits.length >= 10 && digits.length <= 15;
}

function validateRequirementsChecklist(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    return Object.values(value as Record<string, unknown>).every((item) => typeof item === "boolean");
}

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
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
        unit_id,
        applicant_name,
        applicant_phone,
        applicant_email,
        move_in_date,
        emergency_contact_name,
        emergency_contact_phone,
        employment_info,
        requirements_checklist,
        message,
        status: requestedStatus,
    } = body;

    const normalizedApplicantName = normalizeString(applicant_name);
    const normalizedApplicantEmail = normalizeString(applicant_email);
    const normalizedApplicantPhone = normalizeString(applicant_phone);
    const normalizedMessage = normalizeString(message);
    const normalizedEmploymentInfo =
        employment_info && typeof employment_info === "object" && !Array.isArray(employment_info)
            ? employment_info
            : {};

    const occupation = normalizeString((normalizedEmploymentInfo as Record<string, unknown>).occupation);
    const employer = normalizeString((normalizedEmploymentInfo as Record<string, unknown>).employer);
    const monthlyIncomeRaw = (normalizedEmploymentInfo as Record<string, unknown>).monthly_income;
    const monthlyIncome = toPositiveOrZeroNumber(monthlyIncomeRaw);

    if (!unit_id || !normalizedApplicantName || !normalizedApplicantEmail) {
        return NextResponse.json(
            { error: "unit_id, applicant_name, and applicant_email are required." },
            { status: 400 }
        );
    }

    if (normalizedApplicantName.length < 2 || normalizedApplicantName.length > 100) {
        return NextResponse.json({ error: "applicant_name must be between 2 and 100 characters." }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(normalizedApplicantEmail)) {
        return NextResponse.json({ error: "applicant_email is invalid." }, { status: 400 });
    }

    if (normalizedApplicantPhone && !hasValidPhoneFormat(normalizedApplicantPhone)) {
        return NextResponse.json({ error: "applicant_phone format is invalid." }, { status: 400 });
    }

    if (occupation.length === 0 || occupation.length > 100) {
        return NextResponse.json({ error: "employment_info.occupation is required and must be 1-100 characters." }, { status: 400 });
    }

    if (employer.length === 0 || employer.length > 100) {
        return NextResponse.json({ error: "employment_info.employer is required and must be 1-100 characters." }, { status: 400 });
    }

    if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0 || monthlyIncome > 10_000_000) {
        return NextResponse.json({ error: "employment_info.monthly_income must be a positive number within range." }, { status: 400 });
    }

    if (normalizedMessage.length > 1000) {
        return NextResponse.json({ error: "message must not exceed 1000 characters." }, { status: 400 });
    }

    if (requirements_checklist && !validateRequirementsChecklist(requirements_checklist)) {
        return NextResponse.json({ error: "requirements_checklist must only contain boolean values." }, { status: 400 });
    }

    // Verify landlord owns this unit.
    const { data: unit, error: unitError } = await adminClient
        .from("units")
        .select("id, property_id")
        .eq("id", unit_id)
        .maybeSingle();

    if (unitError) {
        console.error("Walk-in unit lookup error:", unitError);
        return NextResponse.json({ error: "Failed to validate unit." }, { status: 500 });
    }

    if (!unit) {
        return NextResponse.json({ error: "Unit not found." }, { status: 404 });
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

    if (property.landlord_id !== user.id) {
        return NextResponse.json({ error: "You do not own this unit." }, { status: 403 });
    }

    // Determine status: landlord may override even if checklist incomplete
    const checklist = requirements_checklist || {};
    const allComplete =
        Object.values(checklist).length > 0 && Object.values(checklist).every((v) => v === true);
    const status =
        requestedStatus === "approved" || requestedStatus === "pending"
            ? requestedStatus
            : allComplete
              ? "approved"
              : "pending";

    const insertPayload: Record<string, unknown> = {
        unit_id,
        landlord_id: user.id,
        created_by: user.id,
        applicant_name: normalizedApplicantName,
        applicant_phone: normalizedApplicantPhone || null,
        applicant_email: normalizedApplicantEmail,
        move_in_date: move_in_date ? normalizeString(move_in_date) : null,
        emergency_contact_name: emergency_contact_name ? normalizeString(emergency_contact_name) : null,
        emergency_contact_phone: emergency_contact_phone ? normalizeString(emergency_contact_phone) : null,
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
            insertPayload.applicant_id = user.id;
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
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
        application_id,
        requirements_checklist,
        employment_info,
        status,
        applicant_name,
        applicant_email,
        applicant_phone,
        emergency_contact_name,
        emergency_contact_phone,
        move_in_date,
        message,
    } = body;

    const allowedStatuses = new Set(["pending", "reviewing", "approved", "rejected", "withdrawn"]);

    if (!application_id) {
        return NextResponse.json({ error: "application_id is required." }, { status: 400 });
    }

    if (status && !allowedStatuses.has(status)) {
        return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    if (requirements_checklist && !validateRequirementsChecklist(requirements_checklist)) {
        return NextResponse.json({ error: "requirements_checklist must only contain boolean values." }, { status: 400 });
    }

    // Validate applicant fields if provided
    if (applicant_name !== undefined) {
        const n = normalizeString(applicant_name);
        if (n.length < 2 || n.length > 100) {
            return NextResponse.json({ error: "applicant_name must be 2–100 characters." }, { status: 400 });
        }
    }
    if (applicant_email !== undefined) {
        const e = normalizeString(applicant_email);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
            return NextResponse.json({ error: "applicant_email is invalid." }, { status: 400 });
        }
    }
    if (applicant_phone !== undefined && applicant_phone !== null && applicant_phone !== "") {
        if (!hasValidPhoneFormat(normalizeString(applicant_phone))) {
            return NextResponse.json({ error: "applicant_phone format is invalid." }, { status: 400 });
        }
    }
    if (message !== undefined && normalizeString(message).length > 1000) {
        return NextResponse.json({ error: "message must not exceed 1000 characters." }, { status: 400 });
    }

    // Verify the landlord owns this application
    let ownershipSelect = "id, created_by, landlord_id";
    let existing: { id: string; created_by?: string | null; landlord_id?: string | null } | null = null;
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
            ownershipSelect = "id, landlord_id";
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
    const isOwner = landlordId === user.id;
    const isCreator = createdBy === user.id;

    if (!isOwner && !isCreator) {
        return NextResponse.json({ error: "Unauthorized to update this application." }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};

    // Applicant identity fields
    if (applicant_name !== undefined) updates.applicant_name = normalizeString(applicant_name);
    if (applicant_email !== undefined) updates.applicant_email = normalizeString(applicant_email);
    if (applicant_phone !== undefined) updates.applicant_phone = applicant_phone ? normalizeString(applicant_phone) : null;
    if (emergency_contact_name !== undefined) updates.emergency_contact_name = emergency_contact_name ? normalizeString(emergency_contact_name) : null;
    if (emergency_contact_phone !== undefined) updates.emergency_contact_phone = emergency_contact_phone ? normalizeString(emergency_contact_phone) : null;
    if (move_in_date !== undefined) updates.move_in_date = move_in_date || null;
    if (message !== undefined) updates.message = message ? normalizeString(message) : null;

    if (requirements_checklist) updates.requirements_checklist = requirements_checklist;
    if (employment_info) {
        const normalizedOccupation = normalizeString(employment_info.occupation);
        const normalizedEmployer = normalizeString(employment_info.employer);
        const normalizedMonthlyIncome = toPositiveOrZeroNumber(employment_info.monthly_income);

        if (normalizedOccupation.length === 0 || normalizedOccupation.length > 100) {
            return NextResponse.json({ error: "employment_info.occupation is required and must be 1-100 characters." }, { status: 400 });
        }

        if (normalizedEmployer.length === 0 || normalizedEmployer.length > 100) {
            return NextResponse.json({ error: "employment_info.employer is required and must be 1-100 characters." }, { status: 400 });
        }

        if (!Number.isFinite(normalizedMonthlyIncome) || normalizedMonthlyIncome <= 0 || normalizedMonthlyIncome > 10_000_000) {
            return NextResponse.json({ error: "employment_info.monthly_income must be a positive number within range." }, { status: 400 });
        }

        updates.employment_info = {
            occupation: normalizedOccupation,
            employer: normalizedEmployer,
            monthly_income: normalizedMonthlyIncome,
        };
        updates.employment_status = normalizedOccupation;
        updates.monthly_income = normalizedMonthlyIncome;
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
