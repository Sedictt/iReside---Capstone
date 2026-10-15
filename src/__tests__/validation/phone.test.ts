import { describe, it, expect } from "vitest";
import {
    formatPhMobile,
    groupPhMobileDigits,
    isPhMobile,
    phMobileDigits,
    phMobileError,
    phMobileFieldValue,
    readPhMobileInput,
    toPhMobileE164,
    toPhMobileLocal,
} from "@/lib/phone";

describe("PH mobile numbers", () => {
    it("reads every common way of writing the same number", () => {
        for (const value of ["09171234567", "+639171234567", "639171234567", "+63 917 123 4567", "+63 0917-123-4567", "9171234567"]) {
            expect(phMobileDigits(value)).toBe("9171234567");
            expect(isPhMobile(value)).toBe(true);
            expect(toPhMobileE164(value)).toBe("+639171234567");
        }
    });

    it("rejects landlines, foreign, short and long numbers", () => {
        for (const value of ["(02) 8123 4567", "+14155552671", "0917123456", "091712345678", "+63 817 123 4567", ""]) {
            expect(isPhMobile(value)).toBe(false);
            expect(toPhMobileE164(value)).toBeNull();
        }
    });

    it("formats for display and for local-only services", () => {
        expect(formatPhMobile("09171234567")).toBe("+63 917 123 4567");
        expect(toPhMobileLocal("+639171234567")).toBe("09171234567");
        expect(groupPhMobileDigits("91712")).toBe("917 12");
        expect(formatPhMobile("12345")).toBe("12345");
    });

    it("keeps an unfinished number so it still fails validation", () => {
        expect(phMobileFieldValue("")).toBe("");
        expect(phMobileFieldValue("917")).toBe("+63917");
        expect(phMobileError("+63917")).toMatch(/all 10 numbers/);
    });

    it("gives plain messages", () => {
        expect(phMobileError("")).toBeUndefined();
        expect(phMobileError("+63")).toBeUndefined();
        expect(phMobileError("", { required: true })).toBe("Please type a mobile number.");
        expect(phMobileError("+63 817 123 4567")).toMatch(/must start with 9/);
        expect(phMobileError("0917-ABC-4567")).toBe("A mobile number can only have numbers.");
        expect(phMobileError("+63 917 123 45678")).toMatch(/too long/);
        expect(phMobileError("+63 917 123 4567")).toBeUndefined();
    });

    it("cleans pasted text and reports what was dropped for the cursor", () => {
        expect(readPhMobileInput("+63 917 123 4567")).toEqual({ digits: "9171234567", droppedPrefix: 2 });
        expect(readPhMobileInput("0917")).toEqual({ digits: "917", droppedPrefix: 1 });
        expect(readPhMobileInput("917 1")).toEqual({ digits: "9171", droppedPrefix: 0 });
    });
});

describe("PH mobile numbers: partly typed values", () => {
    it("treats +63 as the country code even before the number is finished", () => {
        expect(phMobileDigits("+63917")).toBe("917");
        expect(readPhMobileInput("+63 917")).toEqual({ digits: "917", droppedPrefix: 2 });
        expect(phMobileError("+63917")).toMatch(/all 10 numbers/);
    });
});

describe("PH mobile numbers: what counts as empty", () => {
    it("treats a blank box or the +63 alone as empty, but not junk", async () => {
        const { isPhMobileEmpty } = await import("@/lib/phone");
        expect(isPhMobileEmpty("")).toBe(true);
        expect(isPhMobileEmpty("+63")).toBe(true);
        expect(isPhMobileEmpty(null)).toBe(true);
        expect(isPhMobileEmpty("abc")).toBe(false);
        expect(phMobileError("abc")).toBe("A mobile number can only have numbers.");
        expect(phMobileError("Not provided")).toBe("A mobile number can only have numbers.");
    });
});
