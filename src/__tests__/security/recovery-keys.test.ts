import { describe, it, expect } from "vitest";
import {
    generateSecurityKey,
    normalizeSecurityKey,
    formatSecurityKey,
    encryptSecurityKey,
    decryptSecurityKey,
    verifySecurityKey,
    checkRecoveryRateLimit,
    registerFailedAttempt,
} from "@/lib/security/recovery-keys";

describe("Security Recovery Keys Cryptography & Utilities", () => {
    it("generates a 16-character Base32 key in 4-character chunks", () => {
        const key = generateSecurityKey();
        expect(key).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
    });

    it("normalizes keys properly regardless of case, hyphens, and whitespace", () => {
        const raw = " 7k9p - 4m2x - 8w3q - 5h6j ";
        expect(normalizeSecurityKey(raw)).toBe("7K9P4M2X8W3Q5H6J");
        expect(formatSecurityKey(raw)).toBe("7K9P-4M2X-8W3Q-5H6J");
    });

    it("encrypts with AES-256-GCM and decrypts back to original key", () => {
        const key = generateSecurityKey();
        const encrypted = encryptSecurityKey(key);

        expect(encrypted.encrypted).toBeDefined();
        expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex chars
        expect(encrypted.authTag).toHaveLength(32); // 16 bytes = 32 hex chars

        const decrypted = decryptSecurityKey(encrypted.encrypted, encrypted.iv, encrypted.authTag);
        expect(decrypted).toBe(key);
    });

    it("verifies matching keys using constant-time check", () => {
        const key = generateSecurityKey();
        const encrypted = encryptSecurityKey(key);

        // Exact match
        expect(verifySecurityKey(key, encrypted.encrypted, encrypted.iv, encrypted.authTag)).toBe(true);

        // Lowercase and unformatted input should still verify
        const lowercaseNoDashes = key.toLowerCase().replace(/-/g, "");
        expect(verifySecurityKey(lowercaseNoDashes, encrypted.encrypted, encrypted.iv, encrypted.authTag)).toBe(true);

        // Incorrect key
        expect(verifySecurityKey("AAAA-BBBB-CCCC-DDDD", encrypted.encrypted, encrypted.iv, encrypted.authTag)).toBe(false);
    });

    it("fails verification if ciphertext or auth tag is tampered with", () => {
        const key = generateSecurityKey();
        const encrypted = encryptSecurityKey(key);

        // Tamper ciphertext
        const tamperedCipher = encrypted.encrypted.slice(0, -2) + "00";
        expect(verifySecurityKey(key, tamperedCipher, encrypted.iv, encrypted.authTag)).toBe(false);

        // Tamper auth tag
        const tamperedTag = encrypted.authTag.slice(0, -2) + "ff";
        expect(verifySecurityKey(key, encrypted.encrypted, encrypted.iv, tamperedTag)).toBe(false);
    });

    it("implements progressive rate limiting after 5 failed attempts", () => {
        // Initial state
        let check = checkRecoveryRateLimit(0, null);
        expect(check.isLocked).toBe(false);
        expect(check.remainingAttempts).toBe(5);

        // 4 failed attempts
        let failures = 0;
        let lockedUntil: string | null = null;
        for (let i = 1; i <= 4; i++) {
            const attempt = registerFailedAttempt(failures);
            failures = attempt.failedAttempts;
            lockedUntil = attempt.lockedUntil;
            expect(lockedUntil).toBeNull();
        }

        check = checkRecoveryRateLimit(failures, lockedUntil);
        expect(check.isLocked).toBe(false);
        expect(check.remainingAttempts).toBe(1);

        // 5th failed attempt -> locks account
        const finalAttempt = registerFailedAttempt(failures);
        failures = finalAttempt.failedAttempts;
        lockedUntil = finalAttempt.lockedUntil;
        expect(lockedUntil).not.toBeNull();

        check = checkRecoveryRateLimit(failures, lockedUntil);
        expect(check.isLocked).toBe(true);
        expect(check.remainingAttempts).toBe(0);
        expect(check.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });
});
