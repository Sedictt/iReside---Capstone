/**
 * Plain-language wording for activity-history entries ("Activity history" in Settings).
 *
 * Entries are described from their `action` code and metadata, not from the stored title,
 * so older rows written with technical wording read the same as new ones and every entry
 * can be translated. Writers use this too, so the text stored in the database matches.
 *
 * Pass the app's `t()` to get translated text; without it the English phrases are returned.
 * Unknown actions fall back to the stored title and description.
 */

export type AuditTranslate = (key: string, vars?: Record<string, string | number>) => string;

export interface AuditDisplaySource {
    action: string;
    title?: string | null;
    description?: string | null;
    metadata?: Record<string, unknown> | null;
}

export interface AuditDisplayText {
    title: string;
    description: string;
}

const english: AuditTranslate = (key, vars) =>
    vars ? key.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match)) : key;

function text(value: unknown): string | null {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return null;
}

function peso(value: unknown): string | null {
    const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    if (!Number.isFinite(amount)) return null;
    return amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Lowercase on purpose: these sit in the middle of a sentence ("… by cash.").
const METHOD_LABELS: Record<string, string> = {
    cash: "cash",
    gcash: "GCash",
    bank_transfer: "bank transfer",
};

export function describeAuditEvent(item: AuditDisplaySource, t: AuditTranslate = english): AuditDisplayText {
    const meta = item.metadata ?? {};
    const bill = text(meta.invoiceNumber);
    const action = item.action ?? "";

    switch (action) {
        case "security_key_generated":
            return {
                title: t("Recovery key made"),
                description: t("A recovery key was made for your account. It lets you back in if you ever cannot sign in."),
            };
        case "security_key_rotated":
            return {
                title: t("Recovery key replaced"),
                description: t("You made a new recovery key. The old one no longer works."),
            };
        case "security_key_failed": {
            const tries = text(meta.failedAttempts);
            return {
                title: t("Wrong recovery key typed"),
                description: tries
                    ? t("Someone typed a wrong recovery key while trying to get into your account. Wrong tries so far: {count}.", { count: tries })
                    : t("Someone typed a wrong recovery key while trying to get into your account."),
            };
        }
        case "security_key_recovered":
            return {
                title: t("Account opened with your recovery key"),
                description: t("Your password was changed using your recovery key. A new recovery key was made, and the old one no longer works."),
            };
        case "email_updated":
            return {
                title: t("Email address changed"),
                description: t("A new email address was checked with a code and added to your account."),
            };
        case "account_claimed":
            return {
                title: t("Account set up"),
                description: t("You confirmed your email address and set your password."),
            };
        case "INVOICE_REMINDER_SENT":
        case "reminder_sent":
            return {
                title: t("Payment reminder sent"),
                description: bill
                    ? t("A reminder to pay bill {bill} was sent to the tenant.", { bill })
                    : t("A payment reminder was sent to the tenant."),
            };
        case "PAYMENT_COLLECTED": {
            const amount = peso(meta.amount);
            const methodKey = text(meta.method)?.toLowerCase() ?? "";
            const method = METHOD_LABELS[methodKey] ? t(METHOD_LABELS[methodKey]) : text(meta.method);
            const receipt = text(meta.receiptNumber);
            const paid = amount && method
                ? t("You recorded a payment of ₱{amount} by {method}.", { amount, method })
                : t("You recorded a payment.");
            return {
                title: amount ? t("Payment received: ₱{amount}", { amount }) : t("Payment received"),
                description: receipt ? `${paid} ${t("Receipt number: {receipt}.", { receipt })}` : paid,
            };
        }
        case "confirm_received":
            return {
                title: t("Payment received"),
                description: bill ? t("You marked bill {bill} as paid.", { bill }) : t("You marked a bill as paid."),
            };
        case "receipt_issued":
            return {
                title: t("Receipt made"),
                description: bill ? t("A receipt was made for bill {bill}.", { bill }) : t("A receipt was made for a paid bill."),
            };
        case "tenant_payment_submitted_gcash":
            return {
                title: t("Tenant paid by GCash"),
                description: bill
                    ? t("A tenant says they paid bill {bill} by GCash. Please check your GCash and confirm it.", { bill })
                    : t("A tenant says they paid by GCash. Please check your GCash and confirm it."),
            };
        case "tenant_payment_submitted_bank_transfer":
            return {
                title: t("Tenant paid by bank transfer"),
                description: bill
                    ? t("A tenant says they paid bill {bill} by bank transfer. Please check your bank account and confirm it.", { bill })
                    : t("A tenant says they paid by bank transfer. Please check your bank account and confirm it."),
            };
        case "tenant_in_person_intent_submitted":
            return {
                title: t("Tenant will pay in person"),
                description: bill
                    ? t("A tenant said they will pay bill {bill} to you in person.", { bill })
                    : t("A tenant said they will pay to you in person."),
            };
        case "in_person_intent_expired":
            return {
                title: t("In-person payment did not happen"),
                description: bill
                    ? t("A tenant said they would pay bill {bill} in person, but did not pay in time.", { bill })
                    : t("A tenant said they would pay in person, but did not pay in time."),
            };
    }

    if (action.startsWith("landlord_review_")) {
        const status = action.slice("landlord_review_".length);
        if (status === "confirmed" || status === "receipted") {
            return {
                title: t("You confirmed a payment"),
                description: bill
                    ? t("You checked and accepted the payment for bill {bill}.", { bill })
                    : t("You checked and accepted a payment."),
            };
        }
        if (status === "rejected") {
            return {
                title: t("You did not accept a payment"),
                description: bill
                    ? t("You checked the payment for bill {bill} and did not accept it.", { bill })
                    : t("You checked a payment and did not accept it."),
            };
        }
        return {
            title: t("Payment checked"),
            description: bill ? t("You updated the payment for bill {bill}.", { bill }) : t("You updated a payment."),
        };
    }

    // Unknown action: keep what was stored (translated when the phrase is known).
    const title = text(item.title);
    const description = text(item.description);
    return {
        title: title ? t(title) : t("Account activity"),
        description: description ? t(description) : "",
    };
}
