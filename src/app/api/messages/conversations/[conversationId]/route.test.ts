import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const ensureUserInConversationMock = vi.fn();
const redactWithAiOrFallbackMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
    createClient: createClientMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/messages/engine", () => ({
    ensureUserInConversation: ensureUserInConversationMock,
    getProfilePreviewMap: vi.fn(),
}));

vi.mock("@/lib/messages/redaction-service", () => ({
    redactWithAiOrFallback: redactWithAiOrFallbackMock,
}));

describe("POST /api/messages/conversations/[conversationId]", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.resetModules();

        createClientMock.mockResolvedValue({
            auth: {
                getUser: getUserMock,
            },
        });

        redactWithAiOrFallbackMock.mockResolvedValue({
            isSensitive: false,
            redactedMessage: "normal conversation",
            isPhishing: false,
            containsCredentials: false,
            containsProfanity: false,
            containsSpam: false,
            redactionCategory: "none",
            disclosureAllowed: false,
            source: "local_dataset",
        });
    });

    it("enforces server-side censorship metadata for text messages", async () => {
        getUserMock.mockResolvedValue({
            data: { user: { id: "user-1" } },
            error: null,
        });
        ensureUserInConversationMock.mockResolvedValue(true);
        redactWithAiOrFallbackMock.mockResolvedValue({
            isSensitive: true,
            redactedMessage: "password is *****",
            isPhishing: false,
            containsCredentials: true,
            containsProfanity: false,
            containsSpam: false,
            redactionCategory: "credentials",
            disclosureAllowed: true,
            source: "local_dataset",
        });

        const singleMock = vi.fn().mockResolvedValue({
            data: {
                id: "msg-1",
                conversation_id: "conv-1",
                sender_id: "user-1",
                type: "text",
                content: "password is Secret123",
                metadata: null,
                read_at: null,
                created_at: "2026-04-21T00:00:00.000Z",
            },
            error: null,
        });
        const selectMock = vi.fn().mockReturnValue({ single: singleMock });
        const insertMock = vi.fn().mockReturnValue({ select: selectMock });
        const fromMock = vi.fn().mockReturnValue({ insert: insertMock });

        createAdminClientMock.mockReturnValue({
            from: fromMock,
        });

        const { POST } = await import("./route");
        const response = await POST(
            new Request("http://localhost/api/messages/conversations/conv-1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: "password is Secret123",
                    type: "text",
                    metadata: { isRedacted: false, redactedContent: "unsafe", customFlag: "keep" },
                }),
            }),
            { params: Promise.resolve({ conversationId: "conv-1" }) }
        );

        expect(response.status).toBe(201);
        const insertedPayload = insertMock.mock.calls[0][0] as Record<string, unknown>;
        const metadata = insertedPayload.metadata as Record<string, unknown>;

        expect(metadata.customFlag).toBe("keep");
        expect(metadata.isRedacted).toBe(true);
        expect(metadata.isConfirmedDisclosed).toBe(false);
        expect(metadata.redactedContent).toBeTypeOf("string");
        expect((metadata.redactedContent as string).toLowerCase()).not.toContain("secret123");
        expect(metadata.moderationSource).toBe("local_dataset");
    });

    it("keeps non-sensitive text marked as not redacted", async () => {
        getUserMock.mockResolvedValue({
            data: { user: { id: "user-1" } },
            error: null,
        });
        ensureUserInConversationMock.mockResolvedValue(true);
        redactWithAiOrFallbackMock.mockResolvedValue({
            isSensitive: false,
            redactedMessage: "normal conversation",
            isPhishing: false,
            containsCredentials: false,
            containsProfanity: false,
            containsSpam: false,
            redactionCategory: "none",
            disclosureAllowed: false,
            source: "local_dataset",
        });

        const singleMock = vi.fn().mockResolvedValue({
            data: {
                id: "msg-2",
                conversation_id: "conv-1",
                sender_id: "user-1",
                type: "text",
                content: "normal conversation",
                metadata: null,
                read_at: null,
                created_at: "2026-04-21T00:00:00.000Z",
            },
            error: null,
        });
        const selectMock = vi.fn().mockReturnValue({ single: singleMock });
        const insertMock = vi.fn().mockReturnValue({ select: selectMock });
        const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
        createAdminClientMock.mockReturnValue({ from: fromMock });

        const { POST } = await import("./route");
        await POST(
            new Request("http://localhost/api/messages/conversations/conv-1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: "normal conversation",
                    type: "text",
                }),
            }),
            { params: Promise.resolve({ conversationId: "conv-1" }) }
        );

        const insertedPayload = insertMock.mock.calls[0][0] as Record<string, unknown>;
        const metadata = insertedPayload.metadata as Record<string, unknown>;

        expect(metadata.isRedacted).toBe(false);
        expect(metadata.redactedContent).toBe("normal conversation");
        expect(metadata.isConfirmedDisclosed).toBe(false);
        expect(metadata.moderationSource).toBe("local_dataset");
    });

    it("blocks profanity messages before insert", async () => {
        getUserMock.mockResolvedValue({
            data: { user: { id: "user-1" } },
            error: null,
        });
        ensureUserInConversationMock.mockResolvedValue(true);
        redactWithAiOrFallbackMock.mockResolvedValue({
            isSensitive: true,
            redactedMessage: "***** ka",
            isPhishing: false,
            containsCredentials: false,
            containsProfanity: true,
            containsSpam: false,
            redactionCategory: "profanity",
            disclosureAllowed: false,
            source: "local_dataset",
        });

        const insertMock = vi.fn();
        const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
        createAdminClientMock.mockReturnValue({ from: fromMock });

        const { POST } = await import("./route");
        const response = await POST(
            new Request("http://localhost/api/messages/conversations/conv-1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: "bobo ka",
                    type: "text",
                }),
            }),
            { params: Promise.resolve({ conversationId: "conv-1" }) }
        );

        expect(response.status).toBe(422);
        expect(insertMock).not.toHaveBeenCalled();
        const payload = (await response.json()) as { error: string };
        expect(payload.error.toLowerCase()).toContain("profanity");
    });

    it("blocks phishing messages before insert", async () => {
        getUserMock.mockResolvedValue({
            data: { user: { id: "user-1" } },
            error: null,
        });
        ensureUserInConversationMock.mockResolvedValue(true);
        redactWithAiOrFallbackMock.mockResolvedValue({
            isSensitive: true,
            redactedMessage: "*****",
            isPhishing: true,
            containsCredentials: true,
            containsProfanity: false,
            containsSpam: false,
            redactionCategory: "phishing",
            disclosureAllowed: false,
            source: "local_dataset",
        });

        const insertMock = vi.fn();
        const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
        createAdminClientMock.mockReturnValue({ from: fromMock });

        const { POST } = await import("./route");
        const response = await POST(
            new Request("http://localhost/api/messages/conversations/conv-1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: "send me your otp now",
                    type: "text",
                }),
            }),
            { params: Promise.resolve({ conversationId: "conv-1" }) }
        );

        expect(response.status).toBe(422);
        expect(insertMock).not.toHaveBeenCalled();
        const payload = (await response.json()) as { error: string };
        expect(payload.error.toLowerCase()).toContain("phishing");
    });

    it("blocks spam messages before insert", async () => {
        getUserMock.mockResolvedValue({
            data: { user: { id: "user-1" } },
            error: null,
        });
        ensureUserInConversationMock.mockResolvedValue(true);
        redactWithAiOrFallbackMock.mockResolvedValue({
            isSensitive: true,
            redactedMessage: "You have ***** a *****",
            isPhishing: false,
            containsCredentials: false,
            containsProfanity: false,
            containsSpam: true,
            redactionCategory: "spam",
            disclosureAllowed: false,
            source: "local_dataset",
        });

        const insertMock = vi.fn();
        const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
        createAdminClientMock.mockReturnValue({ from: fromMock });

        const { POST } = await import("./route");
        const response = await POST(
            new Request("http://localhost/api/messages/conversations/conv-1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: "You have won a prize, claim now",
                    type: "text",
                }),
            }),
            { params: Promise.resolve({ conversationId: "conv-1" }) }
        );

        expect(response.status).toBe(422);
        expect(insertMock).not.toHaveBeenCalled();
        const payload = (await response.json()) as { error: string };
        expect(payload.error.toLowerCase()).toContain("spam");
    });
});

