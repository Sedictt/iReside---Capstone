import { redactSensitiveContent, type MessageCensorshipResult } from "@/lib/messages/censorship";
import { createAdminClient } from "@/lib/supabase/admin";

export type RedactionSource = "local_dataset";

export type RedactionServiceResult = MessageCensorshipResult & {
    source: RedactionSource;
};

const WORD_BOUNDARY_CLASS = "[\\p{L}\\p{N}_]";
const REDACTION_TOKEN = "*****";
const BANNED_TERM_CACHE_TTL_MS = 60_000;

let bannedTermCache: { terms: string[]; expiresAt: number } | null = null;

const normalizeTerm = (value: string) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildWholeTermRegex = (term: string) => {
    const normalized = normalizeTerm(term);
    if (!normalized.includes(" ")) {
        return new RegExp(`(?<!${WORD_BOUNDARY_CLASS})${escapeRegExp(normalized)}(?!${WORD_BOUNDARY_CLASS})`, "giu");
    }

    const parts = normalized.split(" ").filter(Boolean).map(escapeRegExp);
    const flexiblePhrase = parts.join("[\\s\\W_]*");
    return new RegExp(`(?<!${WORD_BOUNDARY_CLASS})${flexiblePhrase}(?!${WORD_BOUNDARY_CLASS})`, "giu");
};

const mergeCategory = (
    existing: MessageCensorshipResult["redactionCategory"],
    hasHistoricalProfanity: boolean
): MessageCensorshipResult["redactionCategory"] => {
    if (!hasHistoricalProfanity) {
        return existing;
    }
    if (existing === "phishing" || existing === "spam") {
        return existing;
    }
    return "profanity";
};

const applyHistoricalProfanityTerms = (message: string, terms: string[]) => {
    if (!message || terms.length === 0) {
        return { redactedMessage: message, containsHistoricalProfanity: false };
    }

    let redactedMessage = message;
    for (const term of terms) {
        const regex = buildWholeTermRegex(term);
        redactedMessage = redactedMessage.replace(regex, REDACTION_TOKEN);
    }

    return {
        redactedMessage,
        containsHistoricalProfanity: redactedMessage !== message,
    };
};

const loadDynamicBannedTerms = async (): Promise<string[]> => {
    if (bannedTermCache && bannedTermCache.expiresAt > Date.now()) {
        return bannedTermCache.terms;
    }

    try {
        const adminClient = createAdminClient() as any;
        const { data, error } = await adminClient
            .from("message_moderation_banned_terms")
            .select("normalized_term")
            .eq("is_active", true);

        if (error) {
            return [];
        }

        const terms: string[] = Array.from(
            new Set<string>(
                (data ?? [])
                    .map((row: { normalized_term?: unknown }) =>
                        typeof row.normalized_term === "string" ? normalizeTerm(row.normalized_term) : ""
                    )
                    .filter((term: string) => term.length > 0)
            )
        );

        bannedTermCache = {
            terms,
            expiresAt: Date.now() + BANNED_TERM_CACHE_TTL_MS,
        };

        return terms;
    } catch {
        return [];
    }
};

export const redactWithAiOrFallback = async (message: string): Promise<RedactionServiceResult> => {
    const deterministic = redactSensitiveContent(message);
    const historicalTerms = await loadDynamicBannedTerms();
    const historicalModeration = applyHistoricalProfanityTerms(deterministic.redactedMessage, historicalTerms);
    const hasHistoricalProfanity = historicalModeration.containsHistoricalProfanity;
    const mergedCategory = mergeCategory(deterministic.redactionCategory, hasHistoricalProfanity);

    return {
        ...deterministic,
        isSensitive: deterministic.isSensitive || hasHistoricalProfanity,
        redactedMessage: historicalModeration.redactedMessage,
        containsProfanity: deterministic.containsProfanity || hasHistoricalProfanity,
        redactionCategory: mergedCategory,
        disclosureAllowed: mergedCategory === "credentials",
        source: "local_dataset",
    };
};
