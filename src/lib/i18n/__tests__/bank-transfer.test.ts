import { describe, expect, it } from "vitest";

import { translate } from "@/lib/i18n";

describe("bank transfer messages in Filipino", () => {
    it("translates the landlord notification built by the submit route", () => {
        expect(translate("Tenant submitted bank transfer proof for invoice INV-2026-0042.", "fil")).toBe(
            "Nagpasa ang nangungupahan ng patunay ng bank transfer para sa invoice INV-2026-0042.",
        );
        // The GCash sentence is unchanged.
        expect(translate("Tenant submitted GCash proof for invoice INV-1.", "fil")).toBe(
            "Nagpasa ang nangungupahan ng GCash proof para sa invoice INV-1.",
        );
    });

    it("translates server validation messages and the bank account name label", () => {
        expect(translate("Reference number is required for bank transfer submissions.", "fil")).not.toBe(
            "Reference number is required for bank transfer submissions.",
        );
        expect(translate("Bank account name is required.", "fil")).toBe("Kailangan ang pangalan ng bank account.");
    });

    it("translates the GCash limit warning with its amount", () => {
        expect(translate("GCash transfers are limited to {limit}.", "fil", { limit: "₱50,000.00" })).toBe(
            "Hanggang ₱50,000.00 lang ang puwedeng ipadala sa GCash kada transfer.",
        );
    });
});
