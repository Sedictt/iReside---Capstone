export interface WalkInUnit {
    id: string;
    name: string;
    rent_amount: number;
    property_id: string;
    property_name: string;
    property_contract_template?: Record<string, unknown> | null;
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

const PHONE_REGEX_11 = /^(\+?63|0)?9\d{9}$/;
const PHONE_REGEX_10 = /^9\d{9}$/;

export function getPhoneDigits(value: string) {
    return value.replace(/\D/g, "");
}

export function validatePhone(value: string): string | undefined {
    const digits = getPhoneDigits(value);
    if (digits.length === 11 && PHONE_REGEX_11.test(digits)) return undefined;
    if (digits.length === 10 && PHONE_REGEX_10.test(digits)) return undefined;
    return "Enter a valid Philippine mobile number (e.g. 09171234567).";
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFormStep(
    currentStep: number,
    selectedUnit: string,
    formData: WalkInFormData,
    options?: {
        requireUnit?: boolean;
    }
): Partial<Record<FormErrorKey, string>> {
    const errors: Partial<Record<FormErrorKey, string>> = {};
    const requireUnit = options?.requireUnit ?? true;

    if (currentStep === 0) {
        const name = formData.applicant_name.trim();
        const email = formData.applicant_email.trim();
        const phone = formData.applicant_phone.trim();

        if (requireUnit && !selectedUnit) {
            errors.unit = "Please select a unit.";
        }

        if (!name) {
            errors.applicant_name = "Applicant name is required.";
        } else if (/\d/.test(name)) {
            errors.applicant_name = "Name must not contain numbers.";
        } else if (name.length < 2 || name.length > 100) {
            errors.applicant_name = "Name must be between 2 and 100 characters.";
        }

        if (!email) {
            errors.applicant_email = "Email is required.";
        } else if (!EMAIL_REGEX.test(email)) {
            errors.applicant_email = "Enter a valid email address.";
        }

        if (phone) {
            const phoneError = validatePhone(phone);
            if (phoneError) errors.applicant_phone = phoneError;
        }

        if (!formData.move_in_date) {
            errors.move_in_date = "Move-in date is required.";
        }

        const ecName = formData.emergency_contact_name.trim();
        if (!ecName) {
            errors.emergency_contact_name = "Emergency contact name is required.";
        } else if (/\d/.test(ecName)) {
            errors.emergency_contact_name = "Name must not contain numbers.";
        } else if (ecName.length < 2 || ecName.length > 100) {
            errors.emergency_contact_name = "Name must be between 2 and 100 characters.";
        }

        const ecPhone = formData.emergency_contact_phone.trim();
        if (!ecPhone) {
            errors.emergency_contact_phone = "Emergency contact number is required.";
        } else {
            const phoneError = validatePhone(ecPhone);
            if (phoneError) errors.emergency_contact_phone = phoneError;
        }
    }

    if (currentStep === 1) {
        const occupation = formData.employment_info.occupation.trim();
        const employer = formData.employment_info.employer.trim();
        const incomeRaw = String(formData.employment_info.monthly_income).trim();
        const incomeNumber = Number(incomeRaw.replace(/,/g, ""));
        const messageLength = formData.message.trim().length;

        if (!occupation) {
            errors.occupation = "Occupation is required.";
        } else if (occupation.length < 2 || occupation.length > 100) {
            errors.occupation = "Occupation must be 2 to 100 characters.";
        }

        if (!employer) {
            errors.employer = "Employer is required.";
        } else if (employer.length < 2 || employer.length > 100) {
            errors.employer = "Employer must be 2 to 100 characters.";
        }

        if (!incomeRaw) {
            errors.monthly_income = "Monthly income is required.";
        } else if (!Number.isFinite(incomeNumber) || incomeNumber <= 0) {
            errors.monthly_income = "Monthly income must be a positive number.";
        } else if (incomeNumber > 10_000_000) {
            errors.monthly_income = "Monthly income looks too high.";
        }

        if (messageLength > 1000) {
            errors.message = "Notes must not exceed 1000 characters.";
        }
    }

    return errors;
}
