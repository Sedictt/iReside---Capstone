import { describe, expect, it } from "vitest";
import type { ConversationMessage, ConversationSummary } from "@/lib/messages/client";
import type { MiniChatMessage } from "../types";
import {
    formatDayLabel,
    formatRelativeTime,
    isImageMessage,
    mapConversationMessage,
    mapConversationToContact,
    mergeWithPendingMessages,
    shouldGroupWithPrevious,
    startsNewDay,
    summarizeLastMessage,
} from "../utils";

const NOW = new Date("2026-10-08T15:00:00.000Z");
const ME = "user-me";
const THEM = "user-them";

const message = (overrides: Partial<MiniChatMessage>): MiniChatMessage => ({
    id: "m1",
    senderId: THEM,
    content: "hello",
    createdAt: NOW.toISOString(),
    isOwn: false,
    messageType: "text",
    fileUrl: null,
    fileName: null,
    fileMimeType: null,
    isRedacted: false,
    redactedContent: null,
    ...overrides,
});

const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();

describe("formatDayLabel", () => {
    it("labels today and yesterday relative to the reference date", () => {
        expect(formatDayLabel(NOW.toISOString(), NOW)).toBe("Today");
        expect(formatDayLabel(new Date(NOW.getTime() - 24 * 60 * 60_000).toISOString(), NOW)).toBe("Yesterday");
    });

    it("returns an empty label for invalid dates", () => {
        expect(formatDayLabel("not-a-date", NOW)).toBe("");
    });
});

describe("formatRelativeTime", () => {
    it("formats recent activity compactly", () => {
        expect(formatRelativeTime(minutesAgo(0), NOW)).toBe("Now");
        expect(formatRelativeTime(minutesAgo(5), NOW)).toBe("5m");
        expect(formatRelativeTime(minutesAgo(120), NOW)).toBe("2h");
    });

    it("handles missing or invalid timestamps", () => {
        expect(formatRelativeTime(null, NOW)).toBe("");
        expect(formatRelativeTime("garbage", NOW)).toBe("");
    });
});

describe("message grouping", () => {
    it("groups consecutive messages from the same sender within the window", () => {
        const first = message({ id: "a", createdAt: minutesAgo(2) });
        const second = message({ id: "b", createdAt: minutesAgo(1) });
        expect(shouldGroupWithPrevious(first, second)).toBe(true);
    });

    it("does not group across senders, long gaps, or system messages", () => {
        const first = message({ id: "a", createdAt: minutesAgo(10) });
        expect(shouldGroupWithPrevious(first, message({ id: "b", createdAt: minutesAgo(1) }))).toBe(false);
        expect(shouldGroupWithPrevious(message({ id: "a", createdAt: minutesAgo(1) }), message({ id: "b", senderId: ME, isOwn: true }))).toBe(false);
        expect(shouldGroupWithPrevious(message({ id: "a", messageType: "system" }), message({ id: "b" }))).toBe(false);
        expect(shouldGroupWithPrevious(undefined, message({ id: "b" }))).toBe(false);
    });

    it("starts a new day only when the calendar day changes", () => {
        const yesterday = message({ id: "a", createdAt: new Date(NOW.getTime() - 24 * 60 * 60_000).toISOString() });
        expect(startsNewDay(undefined, message({ id: "b" }))).toBe(true);
        expect(startsNewDay(yesterday, message({ id: "b" }))).toBe(true);
        expect(startsNewDay(message({ id: "a", createdAt: minutesAgo(30) }), message({ id: "b" }))).toBe(false);
    });
});

describe("mapConversationMessage", () => {
    const base: ConversationMessage = {
        id: "srv-1",
        conversationId: "c1",
        senderId: ME,
        sender: null,
        type: "text",
        content: "my card is 4111",
        metadata: { isRedacted: true, redactedContent: "my card is ••••" },
        readAt: null,
        createdAt: NOW.toISOString(),
    };

    it("marks own messages and derives delivery status from readAt", () => {
        expect(mapConversationMessage(base, ME)).toMatchObject({ isOwn: true, status: "delivered", isRedacted: true, redactedContent: "my card is ••••" });
        expect(mapConversationMessage({ ...base, readAt: NOW.toISOString() }, ME).status).toBe("seen");
        expect(mapConversationMessage(base, THEM)).toMatchObject({ isOwn: false, status: undefined });
    });

    it("reads file details from metadata and tolerates stringified metadata", () => {
        const mapped = mapConversationMessage({
            ...base,
            type: "file",
            metadata: JSON.stringify({ fileUrl: "https://x/y.pdf", fileName: "lease.pdf", mimeType: "application/pdf" }) as unknown as Record<string, unknown>,
        }, ME);
        expect(mapped).toMatchObject({ fileUrl: "https://x/y.pdf", fileName: "lease.pdf", fileMimeType: "application/pdf" });
    });
});

describe("isImageMessage", () => {
    it("detects images by type, mime, or extension", () => {
        expect(isImageMessage(message({ fileUrl: "https://x/a.bin", messageType: "image" }))).toBe(true);
        expect(isImageMessage(message({ fileUrl: "https://x/a.bin", fileMimeType: "image/png" }))).toBe(true);
        expect(isImageMessage(message({ fileUrl: "https://x/a.webp?token=1", messageType: "file" }))).toBe(true);
        expect(isImageMessage(message({ fileUrl: "https://x/a.pdf", messageType: "file" }))).toBe(false);
        expect(isImageMessage(message({ fileUrl: null }))).toBe(false);
    });
});

describe("mergeWithPendingMessages", () => {
    it("keeps unconfirmed optimistic messages after a refetch", () => {
        const fetched = [message({ id: "srv-1" })];
        const existing = [
            message({ id: "srv-0" }),
            message({ id: "local-1", status: "sending", isOwn: true }),
            message({ id: "local-2", status: "failed", isOwn: true }),
            message({ id: "local-3", status: "delivered", isOwn: true }),
        ];
        expect(mergeWithPendingMessages(fetched, existing).map((entry) => entry.id)).toEqual(["srv-1", "local-1", "local-2"]);
    });
});

describe("conversation summaries", () => {
    const summary: ConversationSummary = {
        id: "c1",
        createdAt: minutesAgo(60),
        updatedAt: minutesAgo(3),
        unreadCount: 2,
        relationshipStatus: "tenant_landlord",
        hasPaymentHistory: false,
        isArchived: false,
        isBlocked: false,
        otherParticipants: [{ id: THEM, fullName: "John Doe", avatarUrl: null, avatarBgColor: "#fff", role: "tenant", unitName: "Unit 4B" }],
        lastMessage: { id: "m", content: "See you", createdAt: minutesAgo(3), senderId: ME, type: "text" },
    };

    it("prefixes own last messages and describes attachments", () => {
        expect(summarizeLastMessage(summary.lastMessage, ME)).toBe("You: See you");
        expect(summarizeLastMessage({ ...summary.lastMessage!, senderId: THEM, type: "image" }, ME)).toBe("Sent a photo");
        expect(summarizeLastMessage(null, ME)).toBe("No messages yet");
    });

    it("maps a summary into a sidebar contact", () => {
        expect(mapConversationToContact(summary, ME, NOW)).toMatchObject({
            id: "c1",
            participantUserId: THEM,
            name: "John Doe",
            unit: "Unit 4B",
            unread: true,
            unreadCount: 2,
            time: "3m",
            lastMessage: "You: See you",
        });
    });
});
