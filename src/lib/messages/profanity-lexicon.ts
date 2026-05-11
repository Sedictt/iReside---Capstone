import { z } from "zod";
import rawLexicon from "@/lib/messages/moderation/filipino-profanity.json";

const lexiconSchema = z.object({
    version: z.number().int().positive(),
    updatedAt: z.string().min(1),
    tokens: z.array(z.string()).default([]),
    phrases: z.array(z.string()).default([]),
    allowlist: z.array(z.string()).default([]),
});

const normalizeEntry = (value: string) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

const uniqueNormalized = (values: string[]) =>
    Array.from(
        new Set(
            values
                .map(normalizeEntry)
                .filter((entry) => entry.length > 0)
        )
    );

const parsedLexicon = lexiconSchema.parse(rawLexicon);

export const filipinoProfanityLexicon = {
    version: parsedLexicon.version,
    updatedAt: parsedLexicon.updatedAt,
    tokens: uniqueNormalized(parsedLexicon.tokens),
    phrases: uniqueNormalized(parsedLexicon.phrases),
    allowlist: uniqueNormalized(parsedLexicon.allowlist),
};

type FilipinoProfanityLexicon = typeof filipinoProfanityLexicon;

export const buildProfanityPromptHints = (tokenLimit = 30, phraseLimit = 20) => {
    const tokenHints = filipinoProfanityLexicon.tokens.slice(0, tokenLimit).join(", ");
    const phraseHints = filipinoProfanityLexicon.phrases.slice(0, phraseLimit).join(", ");
    return {
        tokenHints,
        phraseHints,
    };
};
