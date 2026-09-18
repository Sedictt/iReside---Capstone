import { z } from "zod";
import rawFilipinoLexicon from "@/lib/messages/moderation/filipino-profanity.json";
import rawEnglishLexicon from "@/lib/messages/moderation/english-profanity.json";

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

const parsedFilipino = lexiconSchema.parse(rawFilipinoLexicon);
const parsedEnglish = lexiconSchema.parse(rawEnglishLexicon);

export const filipinoProfanityLexicon = {
    version: parsedFilipino.version,
    updatedAt: parsedFilipino.updatedAt,
    tokens: uniqueNormalized(parsedFilipino.tokens),
    phrases: uniqueNormalized(parsedFilipino.phrases),
    allowlist: uniqueNormalized(parsedFilipino.allowlist),
};

export const englishProfanityLexicon = {
    version: parsedEnglish.version,
    updatedAt: parsedEnglish.updatedAt,
    tokens: uniqueNormalized(parsedEnglish.tokens),
    phrases: uniqueNormalized(parsedEnglish.phrases),
    allowlist: uniqueNormalized(parsedEnglish.allowlist),
};

export const combinedProfanityLexicon = {
    version: Math.max(parsedFilipino.version, parsedEnglish.version),
    updatedAt: parsedEnglish.updatedAt > parsedFilipino.updatedAt ? parsedEnglish.updatedAt : parsedFilipino.updatedAt,
    tokens: uniqueNormalized([...parsedFilipino.tokens, ...parsedEnglish.tokens]),
    phrases: uniqueNormalized([...parsedFilipino.phrases, ...parsedEnglish.phrases]),
    allowlist: uniqueNormalized([...parsedFilipino.allowlist, ...parsedEnglish.allowlist]),
};

export type FilipinoProfanityLexicon = typeof filipinoProfanityLexicon;
export type EnglishProfanityLexicon = typeof englishProfanityLexicon;
export type CombinedProfanityLexicon = typeof combinedProfanityLexicon;

export const buildProfanityPromptHints = (tokenLimit = 30, phraseLimit = 20) => {
    const tokenHints = combinedProfanityLexicon.tokens.slice(0, tokenLimit).join(", ");
    const phraseHints = combinedProfanityLexicon.phrases.slice(0, phraseLimit).join(", ");
    return {
        tokenHints,
        phraseHints,
    };
};
