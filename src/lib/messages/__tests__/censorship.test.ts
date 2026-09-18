import { describe, expect, it } from "vitest";
import { parseModelCensorshipResponse, redactSensitiveContent } from "@/lib/messages/censorship";
import { combinedProfanityLexicon, englishProfanityLexicon, filipinoProfanityLexicon } from "@/lib/messages/profanity-lexicon";
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

    it("redacts expanded Filipino profanities and gender variations", () => {
        const result1 = redactSensitiveContent("ang gaga mo naman talaga");
        expect(result1.isSensitive).toBe(true);
        expect(result1.containsProfanity).toBe(true);
        expect(result1.redactedMessage.toLowerCase()).not.toContain("gaga");
        expect(result1.redactionCategory).toBe("profanity");

        const result2 = redactSensitiveContent("tarantada ka at yawa ka");
        expect(result2.isSensitive).toBe(true);
        expect(result2.containsProfanity).toBe(true);
        expect(result2.redactedMessage.toLowerCase()).not.toContain("tarantada");
        expect(result2.redactedMessage.toLowerCase()).not.toContain("yawa");

        const result3 = redactSensitiveContent("pesteng yawa anak ka ng puta");
        expect(result3.isSensitive).toBe(true);
        expect(result3.containsProfanity).toBe(true);
        expect(result3.redactionCategory).toBe("profanity");
    });

    it("redacts curated English profanities and insults", () => {
        const result1 = redactSensitiveContent("fuck you and get out");
        expect(result1.isSensitive).toBe(true);
        expect(result1.containsProfanity).toBe(true);
        expect(result1.redactedMessage.toLowerCase()).not.toContain("fuck");
        expect(result1.redactionCategory).toBe("profanity");

        const result2 = redactSensitiveContent("You are such an asshole and a bitch");
        expect(result2.isSensitive).toBe(true);
        expect(result2.containsProfanity).toBe(true);
        expect(result2.redactedMessage.toLowerCase()).not.toContain("asshole");
        expect(result2.redactedMessage.toLowerCase()).not.toContain("bitch");
        expect(result2.redactionCategory).toBe("profanity");

        const result3 = redactSensitiveContent("Holy shit what a motherfucker");
        expect(result3.isSensitive).toBe(true);
        expect(result3.containsProfanity).toBe(true);
        expect(result3.redactedMessage.toLowerCase()).not.toContain("motherfucker");
        expect(result3.redactionCategory).toBe("profanity");
    });

    it("redacts obfuscated, leetspeak, and stretched profanities", () => {
        const testCases = [
            "f*ck you",
            "f**k off",
            "you b!tch",
            "g@go ka",
            "b0b0 mo",
            "sh!t happens",
            "t@ngina mo",
            "what an a$$hole",
            "fuuuuck that",
            "biiiitch please",
            "s h i t",
            "f u c k you",
            "f.u.c.k",
        ];

        for (const input of testCases) {
            const result = redactSensitiveContent(input);
            expect(result.containsProfanity).toBe(true);
            expect(result.isSensitive).toBe(true);
            expect(result.redactedMessage).toContain("*****");
            expect(result.redactionCategory).toBe("profanity");
        }
    });

    it("preserves benign words without false positives", () => {
        const benignMessages = [
            "Please assess the property assets and classic furniture.",
            "Magandang tanghali po, masarap kumain ng puto bumbong at leche flan.",
            "Small animals and pets are allowed in this apartment.",
            "Please review the lease title and document attachments.",
            "The project assignment is due tomorrow.",
            "Let us discuss the tenant association and assignment terms.",
        ];

        for (const msg of benignMessages) {
            const result = redactSensitiveContent(msg);
            expect(result.containsProfanity).toBe(false);
            expect(result.redactionCategory).not.toBe("profanity");
            expect(result.redactedMessage).toBe(msg);
        }
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

    it("validates curated lexicons at load time and removes blank entries", () => {
        expect(filipinoProfanityLexicon.tokens.length).toBeGreaterThan(0);
        expect(filipinoProfanityLexicon.phrases.length).toBeGreaterThan(0);
        expect(filipinoProfanityLexicon.tokens.some((token) => token.trim().length === 0)).toBe(false);
        expect(filipinoProfanityLexicon.phrases.some((phrase) => phrase.trim().length === 0)).toBe(false);

        expect(englishProfanityLexicon.tokens.length).toBeGreaterThan(0);
        expect(englishProfanityLexicon.phrases.length).toBeGreaterThan(0);
        expect(englishProfanityLexicon.tokens.some((token) => token.trim().length === 0)).toBe(false);
        expect(englishProfanityLexicon.phrases.some((phrase) => phrase.trim().length === 0)).toBe(false);

        expect(combinedProfanityLexicon.tokens.length).toBeGreaterThan(filipinoProfanityLexicon.tokens.length);
        expect(combinedProfanityLexicon.phrases.length).toBeGreaterThan(filipinoProfanityLexicon.phrases.length);

        expect(spamLexicon.tokens.length).toBeGreaterThan(0);
        expect(spamLexicon.phrases.length).toBeGreaterThan(0);
        expect(spamLexicon.tokens.some((token) => token.trim().length === 0)).toBe(false);
        expect(spamLexicon.phrases.some((phrase) => phrase.trim().length === 0)).toBe(false);
    });
});
