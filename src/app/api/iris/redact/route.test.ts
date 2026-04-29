import { beforeEach, describe, expect, it, vi } from "vitest";

describe("POST /api/iris/redact", () => {
    beforeEach(() => {
        vi.resetAllMocks();
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
    });

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
