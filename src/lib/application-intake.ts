import { emailRule } from "@/lib/validation/rules";
import {
    applicantNameRule,
    applicationMessageRule,
    employerRule,
    monthlyIncomeRule,
    moveInDateRule,
    occupationRule,
    phMobileRule,
} from "@/lib/validation/schemas/tenant-lifecycle.schema";

export interface UnitHoldInfo {
    held_for_name: string;
    held_by_application_id?: string | null;
    hold_expires_at?: string | null;
    hold_note?: string | null;
    created_at?: string;
}

export interface WalkInUnit {
    id: string;
    name: string;
    rent_amount: number;
    property_id: string;
    property_name: string;
    property_contract_template?: Record<string, unknown> | null;
    status?: string;
    has_ongoing_application?: boolean;
    ongoing_application_count?: number;
    ongoing_application_status?: string | null;
    application_status?: string | null;
    is_on_hold?: boolean;
    hold_info?: UnitHoldInfo | null;
    max_occupants?: number | null;
}

export function isUnitOccupied(unit: Pick<WalkInUnit, "status">): boolean {
    return (unit.status ?? "").toLowerCase() === "occupied";
}

export function isUnitOnHold(unit: Pick<WalkInUnit, "status" | "is_on_hold" | "hold_info">): boolean {
    if (unit.is_on_hold) return true;
    if (unit.hold_info) {
        if (!unit.hold_info.hold_expires_at) return true;
        const expires = new Date(unit.hold_info.hold_expires_at).getTime();
        if (!Number.isNaN(expires) && expires > Date.now()) return true;
    }
    const status = (unit.status ?? "").toLowerCase();
    return ["reserved", "on_hold", "on hold", "held"].includes(status);
}

export function isUnitOngoing(unit: Pick<WalkInUnit, "status" | "has_ongoing_application" | "application_status" | "is_on_hold" | "hold_info">): boolean {
    if (isUnitOnHold(unit)) return true;
    if (Boolean(unit.has_ongoing_application)) return true;
    const status = (unit.status ?? "").toLowerCase();
    const isOngoingStatus = [
        "under_negotiation",
        "under negotiation",
        "negotiating",
        "processing",
        "ongoing",
        "on-going",
        "reserved",
    ].includes(status);
    if (isOngoingStatus) return true;

    if (unit.application_status) {
        const appStatus = unit.application_status.toLowerCase();
        if (["pending", "reviewing", "payment_pending", "approved"].includes(appStatus)) {
            return true;
        }
    }
    return false;
}

/**
 * Checks whether a unit is strictly locked from accepting new applications
 * (occupied, manual hold active, or already committed in payment_pending / approved).
 * Units with only `pending` or `reviewing` applications remain open for competing applicants.
 */
export function isUnitLockedForIntake(
    unit: Pick<WalkInUnit, "status" | "ongoing_application_status" | "application_status" | "is_on_hold" | "hold_info">
): boolean {
    if (isUnitOccupied(unit)) return true;
    if (isUnitOnHold(unit)) return true;
    const status = (unit.status ?? "").toLowerCase();
    if (["under_negotiation", "under negotiation", "negotiating", "processing", "ongoing", "on-going", "reserved"].includes(status)) {
        return true;
    }
    const appStatus = (unit.ongoing_application_status ?? unit.application_status ?? "").toLowerCase();
    if (["payment_pending", "approved"].includes(appStatus)) {
        return true;
    }
    return false;
}

export function isUnitAvailable(unit: Pick<WalkInUnit, "status" | "has_ongoing_application" | "application_status" | "is_on_hold" | "hold_info">): boolean {
    return !isUnitOccupied(unit) && !isUnitOngoing(unit);
}

export function getUnitOptionLabel(unit: WalkInUnit, includePropertyName = false): string {
    const isOccupied = isUnitOccupied(unit);
    const onHold = isUnitOnHold(unit);
    const isOngoing = isUnitOngoing(unit);
    const prefix = includePropertyName ? `${unit.name} — ${unit.property_name}` : unit.name;

    if (isOccupied) {
        return `${prefix} • (Occupied — Unavailable)`;
    }
    if (onHold && unit.hold_info?.held_for_name) {
        return `${prefix} • (On Hold for ${unit.hold_info.held_for_name})`;
    }
    if (isOngoing) {
        return `${prefix} • (On-going — Unavailable)`;
    }
    if (unit.ongoing_application_count && unit.ongoing_application_count > 0) {
        const plural = unit.ongoing_application_count === 1 ? "1 Applicant" : `${unit.ongoing_application_count} Applicants`;
        return `${prefix} — ₱${unit.rent_amount.toLocaleString()}/mo • (${plural})`;
    }
    return `${prefix} — ₱${unit.rent_amount.toLocaleString()}/mo`;
}

export interface RequirementsChecklist {
    valid_id: boolean;
    proof_of_income: boolean;
    [key: string]: boolean;
}

export interface EmploymentInfo {
    occupation: string;
    employer: string;
    monthly_income: number | string;
}

export interface WalkInFormData {
    applicant_name: string;
    applicant_phone: string;
    applicant_email: string;
    move_in_date: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    employment_info: EmploymentInfo;
    requirements_checklist: RequirementsChecklist;
    message: string;
}

export type FormErrorKey =
    | "unit"
    | "applicant_name"
    | "applicant_phone"
    | "applicant_email"
    | "move_in_date"
    | "emergency_contact_name"
    | "emergency_contact_phone"
    | "occupation"
    | "employer"
    | "monthly_income"
    | "message";

export const DEFAULT_CHECKLIST: RequirementsChecklist = {
    valid_id: false,
    proof_of_income: false,
};

export const DEFAULT_EMPLOYMENT: EmploymentInfo = {
    occupation: "",
    employer: "",
    monthly_income: "",
};

export function getPhoneDigits(value: string) {
    return value.replace(/\D/g, "");
}

/** Philippine mobile number check shared with the invite/walk-in API schemas. */
export function validatePhone(value: string): string | undefined {
    return phMobileRule(value, { required: true });
}

export interface ValidateFormStepOptions {
    requireUnit?: boolean;
    /** Allow a move-in date before today (editing an existing application). Defaults to false. */
    allowPastMoveIn?: boolean;
}

/**
 * Step-level validation for the walk-in / invite / add-tenant wizards. Uses the
 * same rule functions as the API schemas so inline and server errors agree.
 */
export function validateFormStep(
    currentStep: number,
    selectedUnit: string,
    formData: WalkInFormData,
    options?: ValidateFormStepOptions
): Partial<Record<FormErrorKey, string>> {
    const errors: Partial<Record<FormErrorKey, string>> = {};
    const requireUnit = options?.requireUnit ?? true;
    const set = (key: FormErrorKey, message: string | undefined) => {
        if (message) errors[key] = message;
    };

    if (currentStep === 0) {
        if (requireUnit && !selectedUnit) {
            errors.unit = "Please select a unit.";
        }

        set("applicant_name", applicantNameRule(formData.applicant_name));
        set("applicant_email", emailRule(formData.applicant_email, { label: "Email" }));
        set("applicant_phone", phMobileRule(formData.applicant_phone));
        set("move_in_date", moveInDateRule(formData.move_in_date, { allowPast: options?.allowPastMoveIn ?? false }));
        set("emergency_contact_name", applicantNameRule(formData.emergency_contact_name, { label: "Emergency contact name" }));
        set(
            "emergency_contact_phone",
            phMobileRule(formData.emergency_contact_phone, { required: true, label: "Emergency contact number" })
        );
    }

    if (currentStep === 1) {
        set("occupation", occupationRule(formData.employment_info.occupation));
        set("employer", employerRule(formData.employment_info.employer));
        set("monthly_income", monthlyIncomeRule(formData.employment_info.monthly_income));
        set("message", applicationMessageRule(formData.message));
    }

    return errors;
}

const SERVER_FIELD_TO_FORM_KEY: Record<string, FormErrorKey> = {
    unit_id: "unit",
    applicant_name: "applicant_name",
    applicant_email: "applicant_email",
    applicant_phone: "applicant_phone",
    move_in_date: "move_in_date",
    emergency_contact_name: "emergency_contact_name",
    emergency_contact_phone: "emergency_contact_phone",
    "employment_info.occupation": "occupation",
    "employment_info.employer": "employer",
    "employment_info.monthly_income": "monthly_income",
    message: "message",
};

const STEP_ONE_KEYS: FormErrorKey[] = ["occupation", "employer", "monthly_income", "message"];

/**
 * Maps API `fieldErrors` (dot paths) onto the wizard's error keys and reports
 * which step holds the first one, so the wizard can jump back and show it inline.
 */
export function mapApplicationFieldErrors(fieldErrors: unknown): {
    errors: Partial<Record<FormErrorKey, string>>;
    firstStep: number | null;
} {
    const errors: Partial<Record<FormErrorKey, string>> = {};
    if (!fieldErrors || typeof fieldErrors !== "object") return { errors, firstStep: null };
    for (const [path, message] of Object.entries(fieldErrors as Record<string, unknown>)) {
        const key = SERVER_FIELD_TO_FORM_KEY[path];
        if (key && typeof message === "string" && !errors[key]) errors[key] = message;
    }
    const keys = Object.keys(errors) as FormErrorKey[];
    if (keys.length === 0) return { errors, firstStep: null };
    const firstStep = keys.some((key) => !STEP_ONE_KEYS.includes(key)) ? 0 : 1;
    return { errors, firstStep };
}
