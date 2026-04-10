import { describe, expect, it } from "vitest";
import { getInviteAvailability, hashInviteToken } from "./tenant-intake-invites";

describe("tenant intake invite helpers", () => {
    it("produces stable token hashes", () => {
        expect(hashInviteToken("abc123")).toBe(hashInviteToken("abc123"));
    });

    it("marks expired or consumed invites unavailable", () => {
        const expired = getInviteAvailability({
            status: "active",
            expiresAt: "2020-01-01T00:00:00.000Z",
            useCount: 0,
            maxUses: 1,
            now: new Date("2026-04-09T00:00:00.000Z"),
        });
        const consumed = getInviteAvailability({
            status: "active",
            expiresAt: null,
            useCount: 1,
            maxUses: 1,
            now: new Date("2026-04-09T00:00:00.000Z"),
        });

        expect(expired.active).toBe(false);
        expect(expired.expired).toBe(true);
        expect(consumed.active).toBe(false);
        expect(consumed.consumed).toBe(true);
    });
});
