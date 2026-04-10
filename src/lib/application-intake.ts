export interface WalkInUnit {
    id: string;
    name: string;
    rent_amount: number;
    property_id: string;
    property_name: string;
}

export interface RequirementsChecklist {
    valid_id: boolean;
    proof_of_income: boolean;
    background_reference: boolean;
    application_form: boolean;
    move_in_payment: boolean;
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
    background_reference: false,
    application_form: false,
    move_in_payment: false,
};

export const DEFAULT_EMPLOYMENT: EmploymentInfo = {
    occupation: "",
    employer: "",
    monthly_income: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED_REGEX = /^[+()\-\s\d]+$/;

export function getPhoneDigits(value: string) {
    return value.replace(/\D/g, "");
}

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
        } else if (name.length < 2 || name.length > 100) {
            errors.applicant_name = "Name must be between 2 and 100 characters.";
        }

        if (!email) {
            errors.applicant_email = "Email is required.";
        } else if (!EMAIL_REGEX.test(email)) {
            errors.applicant_email = "Enter a valid email address.";
        }

        if (phone) {
            const digits = getPhoneDigits(phone);
            if (!PHONE_ALLOWED_REGEX.test(phone)) {
                errors.applicant_phone = "Phone contains invalid characters.";
            } else if (digits.length < 10 || digits.length > 15) {
                errors.applicant_phone = "Phone number must have 10 to 15 digits.";
            }
        }

        if (!formData.move_in_date) {
            errors.move_in_date = "Move-in date is required.";
        }

        const ecName = formData.emergency_contact_name.trim();
        if (!ecName) {
            errors.emergency_contact_name = "Emergency contact name is required.";
        } else if (ecName.length < 2 || ecName.length > 100) {
            errors.emergency_contact_name = "Name must be between 2 and 100 characters.";
        }

        const ecPhone = formData.emergency_contact_phone.trim();
        if (!ecPhone) {
            errors.emergency_contact_phone = "Emergency contact number is required.";
        } else {
            const ecDigits = getPhoneDigits(ecPhone);
            if (!PHONE_ALLOWED_REGEX.test(ecPhone)) {
                errors.emergency_contact_phone = "Phone contains invalid characters.";
            } else if (ecDigits.length < 10 || ecDigits.length > 15) {
                errors.emergency_contact_phone = "Phone number must have 10 to 15 digits.";
            }
        }
    }

    if (currentStep === 1) {
        const occupation = formData.employment_info.occupation.trim();
        const employer = formData.employment_info.employer.trim();
        const incomeRaw = String(formData.employment_info.monthly_income).trim();
        const incomeNumber = Number(incomeRaw);
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
