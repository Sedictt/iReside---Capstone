// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
    createTwoFactorVerifiedCookieValue,
    verifyTwoFactorVerifiedCookieValue,
    TWO_FACTOR_VERIFIED_MAX_AGE_SECONDS,
} from "@/lib/security/two-factor-cookie";

describe("signed two-factor verified cookie", () => {
    it("round-trips for the user it was issued to", async () => {
        const value = await createTwoFactorVerifiedCookieValue("user-1");
        expect(value.split(".")).toHaveLength(3);
        expect(await verifyTwoFactorVerifiedCookieValue(value, "user-1")).toBe(true);
    });

    it("rejects a bare user id (the old unsigned format)", async () => {
        expect(await verifyTwoFactorVerifiedCookieValue("user-1", "user-1")).toBe(false);
    });

    it("rejects a cookie issued to a different user", async () => {
        const value = await createTwoFactorVerifiedCookieValue("user-1");
        expect(await verifyTwoFactorVerifiedCookieValue(value, "user-2")).toBe(false);
    });

    it("rejects a tampered payload or signature", async () => {
        const value = await createTwoFactorVerifiedCookieValue("user-1");
        const [userId, expiresAt, signature] = value.split(".");
        expect(await verifyTwoFactorVerifiedCookieValue(`${userId}.${Number(expiresAt) + 1000}.${signature}`, "user-1")).toBe(false);
        expect(await verifyTwoFactorVerifiedCookieValue(`${userId}.${expiresAt}.${signature.slice(0, -2)}xx`, "user-1")).toBe(false);
        expect(await verifyTwoFactorVerifiedCookieValue(`user-2.${expiresAt}.${signature}`, "user-2")).toBe(false);
    });

    it("rejects an expired cookie", async () => {
        const issuedAt = Date.now() - (TWO_FACTOR_VERIFIED_MAX_AGE_SECONDS + 60) * 1000;
        const value = await createTwoFactorVerifiedCookieValue("user-1", issuedAt);
        expect(await verifyTwoFactorVerifiedCookieValue(value, "user-1")).toBe(false);
    });

    it("rejects missing or malformed values", async () => {
        expect(await verifyTwoFactorVerifiedCookieValue(undefined, "user-1")).toBe(false);
        expect(await verifyTwoFactorVerifiedCookieValue("", "user-1")).toBe(false);
        expect(await verifyTwoFactorVerifiedCookieValue("a.b", "user-1")).toBe(false);
        expect(await verifyTwoFactorVerifiedCookieValue("a.b.c.d", "user-1")).toBe(false);
    });
});
