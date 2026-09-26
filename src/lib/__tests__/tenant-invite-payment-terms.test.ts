import { describe, expect, it } from "vitest";
import {
    calculatePaymentPreview,
    sanitizePaymentTerms,
    pickTemplateAmount,
    DEFAULT_INVITE_PAYMENT_TERMS,
    ADVANCE_TEMPLATE_KEYS,
    DEPOSIT_TEMPLATE_KEYS,
} from "../tenant-invite-payment-terms";

describe("tenant invite payment terms helpers", () => {
    it("calculates default 1-month advance and 1-month deposit", () => {
        const preview = calculatePaymentPreview({
            monthlyRent: 20000,
            terms: {
                advanceMonths: 1,
                securityDepositMonths: 1,
            },
        });

        expect(preview.advanceAmount).toBe(20000);
        expect(preview.securityDepositAmount).toBe(20000);
        expect(preview.totalMoveInAmount).toBe(40000);
        expect(preview.advanceMonths).toBe(1);
        expect(preview.securityDepositMonths).toBe(1);
        expect(preview.isCustomAdvance).toBe(false);
        expect(preview.isCustomDeposit).toBe(false);
    });

    it("calculates 1-month advance and 2-month deposit", () => {
        const preview = calculatePaymentPreview({
            monthlyRent: 15000,
            terms: {
                advanceMonths: 1,
                securityDepositMonths: 2,
            },
        });

        expect(preview.advanceAmount).toBe(15000);
        expect(preview.securityDepositAmount).toBe(30000);
        expect(preview.totalMoveInAmount).toBe(45000);
    });

    it("handles zero months (no advance or no deposit)", () => {
        const preview = calculatePaymentPreview({
            monthlyRent: 25000,
            terms: {
                advanceMonths: 0,
                securityDepositMonths: 1,
            },
        });

        expect(preview.advanceAmount).toBe(0);
        expect(preview.securityDepositAmount).toBe(25000);
        expect(preview.totalMoveInAmount).toBe(25000);
    });

    it("handles custom amounts", () => {
        const preview = calculatePaymentPreview({
            monthlyRent: 20000,
            terms: {
                advanceMonths: -1,
                securityDepositMonths: -1,
                customAdvanceAmount: 12500,
                customSecurityDepositAmount: 35000,
            },
        });

        expect(preview.advanceAmount).toBe(12500);
        expect(preview.securityDepositAmount).toBe(35000);
        expect(preview.totalMoveInAmount).toBe(47500);
        expect(preview.isCustomAdvance).toBe(true);
        expect(preview.isCustomDeposit).toBe(true);
    });

    it("falls back gracefully for legacy invites with null terms", () => {
        const preview = calculatePaymentPreview({
            monthlyRent: 18000,
            terms: null,
            contractTemplate: null,
        });

        expect(preview.advanceAmount).toBe(18000);
        expect(preview.securityDepositAmount).toBe(18000);
        expect(preview.totalMoveInAmount).toBe(36000);
    });

    it("picks template amounts when terms are null", () => {
        const template = {
            answers: {
                advance_rent: "2 months",
                security_deposit: "2 months",
            },
        };
        const advance = pickTemplateAmount(template, ADVANCE_TEMPLATE_KEYS, 10000);
        const deposit = pickTemplateAmount(template, DEPOSIT_TEMPLATE_KEYS, 10000);

        expect(advance).toBe(20000);
        expect(deposit).toBe(20000);
    });

    it("sanitizes malformed payment terms properly", () => {
        const sanitized = sanitizePaymentTerms({
            advanceMonths: "invalid",
            securityDepositMonths: -5,
            customAdvanceAmount: -100,
        });

        expect(sanitized.advanceMonths).toBe(1);
        expect(sanitized.securityDepositMonths).toBe(-1);
        expect(sanitized.customAdvanceAmount).toBeNull();
    });
});
