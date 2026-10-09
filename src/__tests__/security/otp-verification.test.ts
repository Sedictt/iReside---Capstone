// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import {
    evaluateOtpAttempt,
    parseStoredOtp,
    otpMatches,
    persistOtpAttempt,
    OTP_MAX_FAILED_ATTEMPTS,
} from "@/lib/security/otp-verification";
import { generateNumericOtp, generateTemporaryPassword } from "@/lib/security/passwords";
import { escapeHtml } from "@/lib/security/html";

const future = new Date(Date.now() + 5 * 60 * 1000).toISOString();
const past = new Date(Date.now() - 60 * 1000).toISOString();

describe("parseStoredOtp", () => {
    it("reads a bare code and a code with an attempt counter", () => {
        expect(parseStoredOtp("123456")).toEqual({ code: "123456", failedAttempts: 0 });
        expect(parseStoredOtp("123456#3")).toEqual({ code: "123456", failedAttempts: 3 });
        expect(parseStoredOtp(null)).toEqual({ code: null, failedAttempts: 0 });
        expect(parseStoredOtp("")).toEqual({ code: null, failedAttempts: 0 });
    });
});

describe("otpMatches", () => {
    it("compares codes without leaking length through early exits", () => {
        expect(otpMatches("123456", "123456")).toBe(true);
        expect(otpMatches("123456", "123457")).toBe(false);
        expect(otpMatches("123456", "12345")).toBe(false);
        expect(otpMatches(null, "123456")).toBe(false);
        expect(otpMatches("123456", "")).toBe(false);
    });
});

describe("evaluateOtpAttempt", () => {
    it("accepts the correct code and asks for the stored code to be cleared", () => {
        const result = evaluateOtpAttempt({ storedCode: "123456", storedExpiry: future, providedOtp: " 123456 " });
        expect(result).toEqual({ ok: true, nextStoredCode: null });
    });

    it("increments the failed-attempt counter on a wrong guess", () => {
        const result = evaluateOtpAttempt({ storedCode: "123456", storedExpiry: future, providedOtp: "000000" });
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.reason).toBe("mismatch");
        expect(result.nextStoredCode).toBe("123456#1");
        expect(result.remainingAttempts).toBe(OTP_MAX_FAILED_ATTEMPTS - 1);
    });

    it("invalidates the code once the attempt ceiling is reached", () => {
        const lastAllowed = evaluateOtpAttempt({
            storedCode: `123456#${OTP_MAX_FAILED_ATTEMPTS - 1}`,
            storedExpiry: future,
            providedOtp: "000000",
        });
        expect(lastAllowed.ok).toBe(false);
        if (lastAllowed.ok) return;
        expect(lastAllowed.reason).toBe("locked");
        expect(lastAllowed.nextStoredCode).toBeNull();

        // Even the correct code is refused once locked.
        const locked = evaluateOtpAttempt({
            storedCode: `123456#${OTP_MAX_FAILED_ATTEMPTS}`,
            storedExpiry: future,
            providedOtp: "123456",
        });
        expect(locked.ok).toBe(false);
        if (!locked.ok) expect(locked.reason).toBe("locked");
    });

    it("rejects expired and missing codes", () => {
        const expired = evaluateOtpAttempt({ storedCode: "123456", storedExpiry: past, providedOtp: "123456" });
        expect(expired.ok).toBe(false);
        if (!expired.ok) expect(expired.reason).toBe("expired");

        const missing = evaluateOtpAttempt({ storedCode: null, storedExpiry: future, providedOtp: "123456" });
        expect(missing.ok).toBe(false);
        if (!missing.ok) expect(missing.reason).toBe("not_found");
    });
});

describe("persistOtpAttempt", () => {
    it("writes the counter to both OTP stores and clears both on null", async () => {
        const eq = vi.fn().mockResolvedValue({ error: null });
        const update = vi.fn().mockReturnValue({ eq });
        const from = vi.fn().mockReturnValue({ update });

        await persistOtpAttempt({ from }, "profile-1", "123456#2");
        expect(from).toHaveBeenCalledWith("user_security_settings");
        expect(from).toHaveBeenCalledWith("profiles");
        expect(update.mock.calls[0][0]).toMatchObject({ otp_code: "123456#2" });
        expect(update.mock.calls[0][0]).not.toHaveProperty("otp_expiry");

        update.mockClear();
        await persistOtpAttempt({ from }, "profile-1", null);
        expect(update.mock.calls[0][0]).toMatchObject({ otp_code: null, otp_expiry: null });
    });
});

describe("credential generators", () => {
    it("produces six-digit numeric codes", () => {
        for (let index = 0; index < 50; index += 1) {
            expect(generateNumericOtp()).toMatch(/^\d{6}$/);
        }
    });

    it("produces temporary passwords that satisfy the shared policy", () => {
        for (let index = 0; index < 50; index += 1) {
            const password = generateTemporaryPassword(12);
            expect(password).toHaveLength(12);
            expect(password).toMatch(/[A-Za-z]/);
            expect(password).toMatch(/[0-9!@#$]/);
        }
        expect(generateTemporaryPassword(4)).toHaveLength(8);
    });
});

describe("escapeHtml", () => {
    it("neutralises markup in user-controlled values", () => {
        expect(escapeHtml(`<a href="x">Bob & 'Co'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;Bob &amp; &#39;Co&#39;&lt;/a&gt;");
        expect(escapeHtml(null)).toBe("");
        expect(escapeHtml(1250.5)).toBe("1250.5");
    });
});
