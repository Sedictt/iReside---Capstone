import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseUserAgent } from "@/lib/utils/device-parser";
import { broadcastAuthEvent, AUTH_SYNC_CHANNEL_NAME } from "@/lib/supabase/client-auth";

describe("Device Parser Utility", () => {
    it("parses desktop Chrome on Windows user agent correctly", () => {
        const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
        const result = parseUserAgent(ua);
        expect(result.browser).toContain("Chrome");
        expect(result.os).toContain("Windows");
        expect(result.deviceType).toBe("desktop");
        expect(result.label).toContain("Chrome");
    });

    it("parses mobile Safari on iPhone user agent correctly", () => {
        const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
        const result = parseUserAgent(ua);
        expect(result.browser).toContain("Safari");
        expect(result.os).toContain("iOS");
        expect(result.deviceType).toBe("mobile");
        expect(result.label).toContain("Safari");
    });

    it("parses Android Chrome user agent correctly", () => {
        const ua = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36";
        const result = parseUserAgent(ua);
        expect(result.browser).toContain("Chrome");
        expect(result.os).toContain("Android");
        expect(result.deviceType).toBe("mobile");
    });

    it("handles null or undefined user agents gracefully", () => {
        const resultNull = parseUserAgent(null);
        expect(resultNull.browser).toBe("Unknown Browser");
        expect(resultNull.os).toBe("Unknown OS");
        expect(resultNull.deviceType).toBe("desktop");
        expect(resultNull.label).toBe("Unknown Device");

        const resultEmpty = parseUserAgent("");
        expect(resultEmpty.browser).toBe("Unknown Browser");
    });
});

describe("Auth BroadcastChannel Synchronization", () => {
    let mockConstructor: any;
    let mockPostMessage: any;
    let mockClose: any;
    let originalBroadcastChannel: any;

    beforeEach(() => {
        mockConstructor = vi.fn();
        mockPostMessage = vi.fn();
        mockClose = vi.fn();
        originalBroadcastChannel = (globalThis as any).BroadcastChannel;

        class MockBroadcastChannel {
            name: string;
            constructor(name: string) {
                this.name = name;
                mockConstructor(name);
            }
            postMessage(msg: any) {
                mockPostMessage(msg);
            }
            close() {
                mockClose();
            }
        }

        (globalThis as any).BroadcastChannel = MockBroadcastChannel;
    });

    afterEach(() => {
        (globalThis as any).BroadcastChannel = originalBroadcastChannel;
    });

    it("broadcasts SIGNED_IN event on the correct channel", () => {
        broadcastAuthEvent({ type: "SIGNED_IN", userId: "user-123" });
        expect(mockConstructor).toHaveBeenCalledWith(AUTH_SYNC_CHANNEL_NAME);
        expect(mockPostMessage).toHaveBeenCalledWith({ type: "SIGNED_IN", userId: "user-123" });
        expect(mockClose).toHaveBeenCalled();
    });

    it("broadcasts SIGNED_OUT event with local scope", () => {
        broadcastAuthEvent({ type: "SIGNED_OUT", scope: "local" });
        expect(mockPostMessage).toHaveBeenCalledWith({ type: "SIGNED_OUT", scope: "local" });
        expect(mockClose).toHaveBeenCalled();
    });

    it("broadcasts SESSION_REVOKED event", () => {
        broadcastAuthEvent({ type: "SESSION_REVOKED", sessionId: "sess-abc" });
        expect(mockPostMessage).toHaveBeenCalledWith({ type: "SESSION_REVOKED", sessionId: "sess-abc" });
    });
});
