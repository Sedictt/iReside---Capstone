/**
 * Payment methods tenants and prospects can use, and the helpers every payment
 * screen shares: labels, which methods need proof, the GCash/InstaPay transfer
 * limit, the Philippine bank list, and account-number masking.
 *
 * Client-safe: no server-only imports.
 *
 * @module lib/billing/payment-methods
 */

/** Destination providers a landlord can set up (landlord_payment_destinations.provider). */
export const DESTINATION_PROVIDERS = ["gcash", "bank_transfer"] as const;
export type DestinationProvider = (typeof DESTINATION_PROVIDERS)[number];

/** Methods paid outside the app and confirmed with a reference number and proof. */
export const PROOF_METHODS = ["gcash", "bank_transfer"] as const;
export type ProofMethod = (typeof PROOF_METHODS)[number];

/** Every method a tenant or prospect can choose at checkout. */
export type CheckoutMethod = ProofMethod | "cash";

export function isProofMethod(method: unknown): method is ProofMethod {
    return typeof method === "string" && (PROOF_METHODS as readonly string[]).includes(method);
}

/**
 * GCash (and InstaPay between banks) cap a single transfer at PHP 50,000.
 * Larger amounts are still allowed: the checkout only warns and points the
 * tenant to PESONet, an over-the-counter deposit, or paying in parts.
 */
export const GCASH_TRANSFER_LIMIT = 50_000;
export const INSTAPAY_TRANSFER_LIMIT = 50_000;

export function exceedsGcashLimit(amount: number | null | undefined): boolean {
    return Number.isFinite(amount) && Number(amount) > GCASH_TRANSFER_LIMIT;
}

/** English labels (they double as i18n keys: pass the result through t()). */
const METHOD_LABELS: Record<string, string> = {
    gcash: "GCash",
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    in_person: "Cash",
    maya: "Maya",
    credit_card: "Credit Card",
    debit_card: "Debit Card",
};

/** Human label for a stored method value, e.g. "bank_transfer" → "Bank Transfer". */
export function paymentMethodLabel(method: string | null | undefined, fallback = "Not specified"): string {
    if (!method) return fallback;
    const known = METHOD_LABELS[method.toLowerCase()];
    if (known) return known;
    return method
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Banks and digital banks tenants commonly send to, with the short code shown
 * on the bank badge. Names stay untranslated. "Other" lets the landlord type a
 * bank that is not listed.
 */
const PH_BANK_CODES = {
    "BDO Unibank": "BDO",
    BPI: "BPI",
    Metrobank: "MBTC",
    Landbank: "LBP",
    PNB: "PNB",
    "Security Bank": "SECB",
    UnionBank: "UBP",
    RCBC: "RCBC",
    "China Bank": "CBC",
    "EastWest Bank": "EW",
    DBP: "DBP",
    PSBank: "PSB",
    AUB: "AUB",
    Maybank: "MAY",
    "CIMB Bank": "CIMB",
    "GoTyme Bank": "GO",
    "Maya Bank": "MAYA",
    SeaBank: "SEA",
    Tonik: "TNK",
} as const;

export const PH_BANKS = Object.keys(PH_BANK_CODES) as Array<keyof typeof PH_BANK_CODES>;

export const OTHER_BANK = "Other";

/** Short code for the bank badge on payment cards ("BDO Unibank" → "BDO"). */
export function bankInitials(bankName: string | null | undefined): string {
    const name = (bankName ?? "").trim();
    if (!name) return "BANK";
    const known = (PH_BANK_CODES as Record<string, string>)[name];
    if (known) return known;
    const words = name.split(/\s+/).filter((word) => !/^(bank|unibank|of|the|and|&)$/i.test(word));
    const initials = words.map((word) => word[0]).join("").slice(0, 4).toUpperCase();
    if (initials.length >= 2) return initials;
    return (words[0] ?? name).slice(0, 4).toUpperCase();
}

/** Digits only: bank apps reject spaces and dashes when pasting. */
export function normalizeAccountNumber(value: string | null | undefined): string {
    return String(value ?? "").replace(/\D/g, "");
}

/** Groups an account number in fours so it is easy to read aloud and check. */
export function formatAccountNumber(value: string | null | undefined): string {
    const digits = normalizeAccountNumber(value);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** "•••• 1234" for places where the full account number should not show. */
export function maskAccountNumber(value: string | null | undefined): string {
    const digits = normalizeAccountNumber(value);
    if (!digits) return "";
    return `•••• ${digits.slice(-4)}`;
}
