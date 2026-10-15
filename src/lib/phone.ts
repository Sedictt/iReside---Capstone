/**
 * Philippine mobile numbers: the one rule every contact-number field follows.
 *
 * - People type only the 10 numbers after a fixed "+63" (they start with 9: 9XX XXX XXXX).
 * - Anything pasted or saved in an older form ("09171234567", "639171234567",
 *   "+63 917-123-4567") is understood and cleaned up.
 * - Numbers are saved as "+639171234567" (E.164) and shown as "+63 917 123 4567".
 *
 * Messages are plain English phrases; UI code translates them with t().
 */

export const PH_COUNTRY_CODE = "+63";
/** Digits after +63 in a PH mobile number. */
export const PH_MOBILE_DIGITS = 10;
export const PH_MOBILE_EXAMPLE = "+63 917 123 4567";

/** "+63…" always carries the country code; bare "63…" only when it is too long to be national. */
function hasCountryCode(raw: string, digits: string) {
    return raw.startsWith("+63") || (digits.startsWith("63") && digits.length > PH_MOBILE_DIGITS);
}

/** All national digits (country code and leading 0 removed), without trimming the length. */
function nationalDigits(value: unknown): string {
    if (typeof value !== "string" && typeof value !== "number") return "";
    const raw = String(value).trim();
    let digits = raw.replace(/\D/g, "");
    if (hasCountryCode(raw, digits)) digits = digits.slice(2);
    // "09…" and "+63 09…" are both common ways of writing the same number.
    return digits.replace(/^0+/, "");
}

/**
 * The national part of a PH number as plain digits (no country code, no leading 0),
 * at most 10 digits. "09171234567" → "9171234567", "+63 917 123 4567" → "9171234567".
 */
export function phMobileDigits(value: unknown): string {
    return nationalDigits(value).slice(0, PH_MOBILE_DIGITS);
}

/** True for a complete PH mobile number in any accepted form. */
export function isPhMobile(value: unknown): boolean {
    return /^9\d{9}$/.test(nationalDigits(value));
}

/** "+639171234567" for a complete number, otherwise null. */
export function toPhMobileE164(value: unknown): string | null {
    return isPhMobile(value) ? `${PH_COUNTRY_CODE}${phMobileDigits(value)}` : null;
}

/** "+63 917 123 4567" for display. Incomplete or foreign numbers are returned as given. */
export function formatPhMobile(value: unknown): string {
    if (!isPhMobile(value)) return typeof value === "string" ? value : "";
    const d = phMobileDigits(value);
    return `${PH_COUNTRY_CODE} ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

/** Groups the national digits as people read them: "917 123 4567". */
export function groupPhMobileDigits(digits: string): string {
    const d = digits.slice(0, PH_MOBILE_DIGITS);
    return [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join(" ");
}

/**
 * What a phone field stores while someone types: "" when empty, otherwise "+63" plus the
 * digits typed so far (so an unfinished number still fails validation instead of vanishing).
 */
export function phMobileFieldValue(digits: string): string {
    const d = phMobileDigits(digits);
    return d ? `${PH_COUNTRY_CODE}${d}` : "";
}

/** "09171234567" — for services that only take the local form (e.g. typing into GCash). */
export function toPhMobileLocal(value: unknown): string | null {
    return isPhMobile(value) ? `0${phMobileDigits(value)}` : null;
}

/** Blank, or only the "+63" a phone field starts with: nothing was typed. */
export function isPhMobileEmpty(value: unknown): boolean {
    if (value == null) return true;
    const raw = String(value).trim();
    return raw === "" || /^\+?\s*63$/.test(raw);
}

/**
 * Validation message for a PH mobile number, or undefined when it is fine.
 * Empty values (see isPhMobileEmpty) pass unless `required`.
 */
export function phMobileError(value: unknown, { required = false }: { required?: boolean } = {}): string | undefined {
    if (isPhMobileEmpty(value)) return required ? "Please type a mobile number." : undefined;
    const raw = typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
    if (isPhMobile(raw)) return undefined;
    if (/[^\d\s+().-]/.test(raw)) return "A mobile number can only have numbers.";
    const national = nationalDigits(raw);
    if (!national.startsWith("9")) return "The number after +63 must start with 9, like +63 917 123 4567.";
    if (national.length > PH_MOBILE_DIGITS) return "That number is too long. Type only the 10 numbers after +63.";
    return "Type all 10 numbers after +63, like +63 917 123 4567.";
}

/**
 * For phone inputs: the national digits from whatever is in the box, plus how many leading
 * digits were dropped as country code or 0 (so the cursor can stay in the right place).
 */
export function readPhMobileInput(raw: string): { digits: string; droppedPrefix: number } {
    let digits = raw.replace(/\D/g, "");
    let droppedPrefix = 0;
    if (hasCountryCode(raw.trim(), digits)) {
        digits = digits.slice(2);
        droppedPrefix += 2;
    }
    const zeros = digits.length - digits.replace(/^0+/, "").length;
    digits = digits.slice(zeros);
    droppedPrefix += zeros;
    return { digits: digits.slice(0, PH_MOBILE_DIGITS), droppedPrefix };
}
