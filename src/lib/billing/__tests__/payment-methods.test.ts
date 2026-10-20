import { describe, expect, it } from "vitest";

import {
    GCASH_TRANSFER_LIMIT,
    PH_BANKS,
    bankInitials,
    exceedsGcashLimit,
    formatAccountNumber,
    isProofMethod,
    maskAccountNumber,
    normalizeAccountNumber,
    paymentMethodLabel,
} from "@/lib/billing/payment-methods";

describe("payment methods", () => {
    it("labels stored method values", () => {
        expect(paymentMethodLabel("bank_transfer")).toBe("Bank Transfer");
        expect(paymentMethodLabel("gcash")).toBe("GCash");
        expect(paymentMethodLabel("in_person")).toBe("Cash");
        expect(paymentMethodLabel("some_new_method")).toBe("Some New Method");
        expect(paymentMethodLabel(null)).toBe("Not specified");
        expect(paymentMethodLabel(undefined, "N/A")).toBe("N/A");
    });

    it("knows which methods need a reference and proof", () => {
        expect(isProofMethod("gcash")).toBe(true);
        expect(isProofMethod("bank_transfer")).toBe(true);
        expect(isProofMethod("cash")).toBe(false);
        expect(isProofMethod(null)).toBe(false);
    });

    it("warns only above the GCash limit", () => {
        expect(GCASH_TRANSFER_LIMIT).toBe(50_000);
        expect(exceedsGcashLimit(50_000)).toBe(false);
        expect(exceedsGcashLimit(50_000.01)).toBe(true);
        expect(exceedsGcashLimit(Number.NaN)).toBe(false);
        expect(exceedsGcashLimit(null)).toBe(false);
    });

    it("formats, normalises and masks account numbers", () => {
        expect(normalizeAccountNumber(" 0059-3012 3456 ")).toBe("005930123456");
        expect(formatAccountNumber("005930123456")).toBe("0059 3012 3456");
        expect(formatAccountNumber("1234567890")).toBe("1234 5678 90");
        expect(maskAccountNumber("005930123456")).toBe("•••• 3456");
        expect(maskAccountNumber("")).toBe("");
    });

    it("gives every listed bank a short badge code", () => {
        for (const bank of PH_BANKS) expect(bankInitials(bank).length).toBeGreaterThanOrEqual(2);
        expect(bankInitials("BDO Unibank")).toBe("BDO");
        expect(bankInitials("Bank of Commerce")).toBe("COMM");
        expect(bankInitials("Philippine Business Bank")).toBe("PB");
        expect(bankInitials("")).toBe("BANK");
    });
});
