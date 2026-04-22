import { describe, expect, it } from "vitest";
import { parseModelCensorshipResponse, redactSensitiveContent } from "@/lib/messages/censorship";
import { filipinoProfanityLexicon } from "@/lib/messages/profanity-lexicon";
import { spamLexicon } from "@/lib/messages/spam-lexicon";

describe("messages censorship", () => {
    it("redacts sensitive credentials and contact details", () => {
        const source = "password is Secret123 and email me at user@example.com";
        const result = redactSensitiveContent(source);

        expect(result.isSensitive).toBe(true);
        expect(result.redactedMessage).toContain("*****");
        expect(result.redactedMessage).not.toContain("Secret123");
        expect(result.redactedMessage).not.toContain("user@example.com");
        expect(result.redactionCategory).toBe("credentials");
        expect(result.disclosureAllowed).toBe(true);
    });

    it("redacts curated Filipino profanity terms", () => {
        const result = redactSensitiveContent("pakyu ka bobo ka");

        expect(result.isSensitive).toBe(true);
        expect(result.redactedMessage).toContain("*****");
        expect(result.redactedMessage.toLowerCase()).not.toContain("pakyu");
        expect(result.redactedMessage.toLowerCase()).not.toContain("bobo");
        expect(result.redactionCategory).toBe("profanity");
        expect(result.disclosureAllowed).toBe(false);
    });

    it("redacts spaced/hyphenated profanity phrase variants", () => {
        const result = redactSensitiveContent("putang-ina mo bakit ganyan");

        expect(result.isSensitive).toBe(true);
        expect(result.redactedMessage).toContain("*****");
        expect(result.redactedMessage.toLowerCase()).not.toContain("putang-ina");
    });

    it("redacts spaced tang ina variants", () => {
        const result = redactSensitiveContent("Tang ina bakit ganyan?");

        expect(result.isSensitive).toBe(true);
        expect(result.redactedMessage).toContain("*****");
        expect(result.redactedMessage.toLowerCase()).not.toContain("tang ina");
    });

    it("redacts curated spam phrases and marks spam category", () => {
        const result = redactSensitiveContent("You have won a prize, click the link to claim code now.");

        expect(result.isSensitive).toBe(true);
        expect(result.redactedMessage).toContain("*****");
        expect(result.redactedMessage.toLowerCase()).not.toContain("claim code");
        expect(result.redactionCategory).toBe("spam");
        expect(result.disclosureAllowed).toBe(false);
    });

    it("keeps neutral content untouched under balanced mode", () => {
        const result = redactSensitiveContent("Ang ganda ng apartment at maayos kausap ang landlord.");

        expect(result.isSensitive).toBe(false);
        expect(result.redactedMessage).toBe("Ang ganda ng apartment at maayos kausap ang landlord.");
    });

    it("parses model JSON payload safely", () => {
        const parsed = parseModelCensorshipResponse(
            '{"isSensitive":true,"redactedMessage":"*****","isPhishing":false}',
            "raw text"
        );

        expect(parsed).toMatchObject({
            isSensitive: true,
            redactedMessage: "*****",
            isPhishing: false,
            redactionCategory: "none",
            disclosureAllowed: false,
        });
    });

    it("validates curated lexicon at load time and removes blank entries", () => {
        expect(filipinoProfanityLexicon.tokens.length).toBeGreaterThan(0);
        expect(filipinoProfanityLexicon.phrases.length).toBeGreaterThan(0);
        expect(filipinoProfanityLexicon.tokens.some((token) => token.trim().length === 0)).toBe(false);
        expect(filipinoProfanityLexicon.phrases.some((phrase) => phrase.trim().length === 0)).toBe(false);
        expect(spamLexicon.tokens.length).toBeGreaterThan(0);
        expect(spamLexicon.phrases.length).toBeGreaterThan(0);
        expect(spamLexicon.tokens.some((token) => token.trim().length === 0)).toBe(false);
        expect(spamLexicon.phrases.some((phrase) => phrase.trim().length === 0)).toBe(false);
    });
});
