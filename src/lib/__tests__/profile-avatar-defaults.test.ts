import { describe, it, expect } from "vitest";
import {
    DEFAULT_AVATAR_URL,
    DEFAULT_AVATAR_BG_COLOR,
    getSafeAvatarBgColor,
    isProfileIncomplete,
} from "@/lib/constants";

describe("Profile Avatar Defaults & Incompleteness Invariants", () => {
    it("exports valid default avatar URL and default brand background color", () => {
        expect(DEFAULT_AVATAR_URL).toContain("profile-avatars/default_avatars");
        expect(DEFAULT_AVATAR_BG_COLOR).toBe("#8B5CF6");
    });

    describe("getSafeAvatarBgColor", () => {
        it("normalizes legacy pitch black and dark default colors to brand default", () => {
            expect(getSafeAvatarBgColor(null)).toBe(DEFAULT_AVATAR_BG_COLOR);
            expect(getSafeAvatarBgColor(undefined)).toBe(DEFAULT_AVATAR_BG_COLOR);
            expect(getSafeAvatarBgColor("")).toBe(DEFAULT_AVATAR_BG_COLOR);
            expect(getSafeAvatarBgColor("#171717")).toBe(DEFAULT_AVATAR_BG_COLOR);
            expect(getSafeAvatarBgColor("#000000")).toBe(DEFAULT_AVATAR_BG_COLOR);
            expect(getSafeAvatarBgColor("#0a0a0a")).toBe(DEFAULT_AVATAR_BG_COLOR);
            expect(getSafeAvatarBgColor("#121212")).toBe(DEFAULT_AVATAR_BG_COLOR);
            expect(getSafeAvatarBgColor("#18181b")).toBe(DEFAULT_AVATAR_BG_COLOR);
            expect(getSafeAvatarBgColor("  #171717  ")).toBe(DEFAULT_AVATAR_BG_COLOR);
        });

        it("preserves custom user selected hex colors", () => {
            expect(getSafeAvatarBgColor("#22C55E")).toBe("#22C55E");
            expect(getSafeAvatarBgColor("#3B82F6")).toBe("#3B82F6");
            expect(getSafeAvatarBgColor("#EC4899")).toBe("#EC4899");
            expect(getSafeAvatarBgColor("#F59E0B")).toBe("#F59E0B");
        });
    });

    describe("isProfileIncomplete", () => {
        it("returns false if profile object is null or undefined", () => {
            expect(isProfileIncomplete(null)).toBe(false);
            expect(isProfileIncomplete(undefined)).toBe(false);
        });

        it("flags profile as incomplete when avatar_url is missing or empty", () => {
            expect(isProfileIncomplete({
                avatar_url: null,
                phone: "09171234567",
                bio: "Experienced property manager."
            })).toBe(true);

            expect(isProfileIncomplete({
                avatar_url: "",
                phone: "09171234567",
                bio: "Experienced property manager."
            })).toBe(true);
        });

        it("flags profile as incomplete when phone is missing or empty", () => {
            expect(isProfileIncomplete({
                avatar_url: "https://example.com/avatar.png",
                phone: null,
                bio: "Experienced property manager."
            })).toBe(true);

            expect(isProfileIncomplete({
                avatar_url: "https://example.com/avatar.png",
                phone: "   ",
                bio: "Experienced property manager."
            })).toBe(true);
        });

        it("flags profile as incomplete when bio is missing or empty", () => {
            expect(isProfileIncomplete({
                avatar_url: "https://example.com/avatar.png",
                phone: "09171234567",
                bio: null
            })).toBe(true);

            expect(isProfileIncomplete({
                avatar_url: "https://example.com/avatar.png",
                phone: "09171234567",
                bio: "  "
            })).toBe(true);
        });

        it("returns false when avatar, phone, and bio are all configured", () => {
            expect(isProfileIncomplete({
                avatar_url: "https://example.com/avatar.png",
                phone: "09171234567",
                bio: "Experienced property manager."
            })).toBe(false);
        });
    });
});
