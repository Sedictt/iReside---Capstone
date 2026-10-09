import { beforeEach, describe, expect, it, vi } from "vitest";

// The endpoint calls a paid AI provider, so it requires a signed-in user.
vi.mock("@/lib/api/auth-guard", () => ({
    requireAuthenticatedUser: vi.fn(async () => ({
        userId: "user-1",
        userEmail: "user@example.com",
        userRole: "tenant",
        supabase: {},
    })),
}));

describe("POST /api/iris/redact", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("uses deterministic local redaction for sensitive credentials", async () => {
        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/iris/redact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "password is Secret123" }),
            })
        );

        const payload = (await response.json()) as {
            isSensitive: boolean;
            redactedMessage: string;
            isPhishing: boolean;
            source: string;
        };

        expect(response.status).toBe(200);
        expect(payload.isSensitive).toBe(true);
        expect(payload.redactedMessage).toContain("*****");
        expect(payload.redactedMessage).not.toContain("Secret123");
        expect(payload.source).toBe("local_dataset");
    }, 30000);


    it("flags local profanity from the embedded dataset", async () => {
        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/iris/redact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "pakyu ka" }),
            })
        );
        const payload = (await response.json()) as { isSensitive: boolean; redactedMessage: string };

        expect(response.status).toBe(200);
        expect(payload.isSensitive).toBe(true);
        expect(payload.redactedMessage).toContain("*****");
    });
});
