import { combinedProfanityLexicon, filipinoProfanityLexicon } from "@/lib/messages/profanity-lexicon";
import { spamLexicon } from "@/lib/messages/spam-lexicon";

export type MessageCensorshipResult = {
    isSensitive: boolean;
    redactedMessage: string;
    isPhishing: boolean;
    containsCredentials: boolean;
    containsProfanity: boolean;
    containsSpam: boolean;
    redactionCategory: "none" | "credentials" | "profanity" | "phishing" | "spam";
    disclosureAllowed: boolean;
};

export const REDACTION_TOKEN = "*****";

const WORD_BOUNDARY_CLASS = "[\\p{L}\\p{N}_]";
const CREDENTIAL_KEYWORDS =
    "\\b(?:password|passcode|pin|otp|cvv|cvc|gcash|bank\\s?account|account\\s?number|routing\\s?number)\\b";

const sensitivePatterns: RegExp[] = [
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    /\b\d{3}-\d{2}-\d{4}\b/g,
    /\b09\d{9}\b/g,
    /\b(?:\+63\s?\d{10}|\+1\s?\d{10})\b/g,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    new RegExp(`${CREDENTIAL_KEYWORDS}\\s*(?:is|:|=)?\\s*([A-Za-z0-9!@#$%^&*()_+\\-=]{3,})`, "gi"),
];

const phishingPatterns: RegExp[] = [
    /\b(?:send|share|provide)\s+(?:me\s+)?(?:your\s+)?(?:password|passcode|pin|otp|code)\b/i,
    /\b(?:verify|confirm|unlock|reactivate)\s+(?:your\s+)?(?:account|wallet|profile)\b/i,
    /\b(?:click|open|tap)\s+(?:the\s+)?(?:link|url)\b/i,
];

const suspiciousUrlPattern = /\b(?:https?:\/\/|www\.)\S+/i;
const aggressiveSpamCuePattern = /\b(?:free|winner|won|claim|prize|reward|limited|urgent)\b/i;
const spamCallToActionPattern = /\b(?:click|tap|open|reply|text|call|visit|subscribe|claim)\b/i;
const spamMoneyPattern = /\b(?:cash|jackpot|bonus|gift|payout|prize)\b/i;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeTerm = (value: string) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

const LEET_CHAR_MAP: Record<string, string> = {
    a: "[aA@4^\\*#_]",
    b: "[bB8]",
    c: "[cC\\(]",
    d: "[dD]",
    e: "[eE3\\*#_]",
    f: "[fF]",
    g: "[gG69]",
    h: "[hH]",
    i: "[iI!1\\|l\\*#_]",
    j: "[jJ]",
    k: "[kK]",
    l: "[lL1\\|]",
    m: "[mM]",
    n: "[nN]",
    o: "[oO0\\*#_]",
    p: "[pP]",
    q: "[qQ]",
    r: "[rR]",
    s: "[sS$5]",
    t: "[tT7\\+]",
    u: "[uUvV\\*@#_]",
    v: "[vVuU]",
    w: "[wW]",
    x: "[xX]",
    y: "[yY]",
    z: "[zZ2]",
};

export const buildWholeTermRegex = (term: string) => {
    const normalizedTerm = normalizeTerm(term);
    if (!normalizedTerm.includes(" ")) {
        return new RegExp(`(?<!${WORD_BOUNDARY_CLASS})${escapeRegExp(normalizedTerm)}(?!${WORD_BOUNDARY_CLASS})`, "giu");
    }

    const parts = normalizedTerm.split(" ").filter((part) => part.length > 0).map(escapeRegExp);
    const flexiblePhrase = parts.join("[\\s\\W_]*");
    return new RegExp(`(?<!${WORD_BOUNDARY_CLASS})${flexiblePhrase}(?!${WORD_BOUNDARY_CLASS})`, "giu");
};

const buildFlexibleTokenPattern = (token: string): string => {
    const chars = Array.from(token);
    const charPatterns = chars.map((char) => {
        const leet = LEET_CHAR_MAP[char.toLowerCase()];
        return leet ? `${leet}+` : `${escapeRegExp(char)}+`;
    });
    return charPatterns.join("[\\s\\W_]*");
};

export const buildFlexibleProfanityRegex = (term: string): RegExp => {
    const normalizedTerm = normalizeTerm(term);
    if (!normalizedTerm.includes(" ")) {
        const flexibleToken = buildFlexibleTokenPattern(normalizedTerm);
        return new RegExp(`(?<!${WORD_BOUNDARY_CLASS})${flexibleToken}(?!${WORD_BOUNDARY_CLASS})`, "giu");
    }

    const parts = normalizedTerm.split(" ").filter((part) => part.length > 0).map(buildFlexibleTokenPattern);
    const flexiblePhrase = parts.join("[\\s\\W_]+");
    return new RegExp(`(?<!${WORD_BOUNDARY_CLASS})${flexiblePhrase}(?!${WORD_BOUNDARY_CLASS})`, "giu");
};

const applyPatternRedaction = (text: string, patterns: RegExp[]) => {
    let redacted = text;
    for (const pattern of patterns) {
        redacted = redacted.replace(pattern, REDACTION_TOKEN);
    }
    return redacted;
};

type LexiconSource = {
    phrases: string[];
    tokens: string[];
};

const applyLexiconRedaction = (
    text: string,
    lexicon: LexiconSource,
    regexBuilder: (term: string) => RegExp = buildWholeTermRegex
) => {
    let redacted = text;
    const phrases = [...lexicon.phrases].sort((a, b) => b.length - a.length);
    const tokens = [...lexicon.tokens].sort((a, b) => b.length - a.length);

    for (const phrase of phrases) {
        redacted = redacted.replace(regexBuilder(phrase), REDACTION_TOKEN);
    }

    for (const token of tokens) {
        redacted = redacted.replace(regexBuilder(token), REDACTION_TOKEN);
    }

    return redacted;
};

const condenseRedactionMarkers = (text: string) => text.replace(/(\*{5}\s*){2,}/g, `${REDACTION_TOKEN} `);

const protectAllowlistTerms = (message: string, allowlistTerms: string[]) => {
    let protectedMessage = message;
    const placeholders = new Map<string, string>();
    const allowlist = [...allowlistTerms].sort((a, b) => b.length - a.length);

    for (const entry of allowlist) {
        const pattern = buildWholeTermRegex(normalizeTerm(entry));
        protectedMessage = protectedMessage.replace(pattern, (match) => {
            const placeholder = `__ALLOWLIST_${placeholders.size}__`;
            placeholders.set(placeholder, match);
            return placeholder;
        });
    }

    return { protectedMessage, placeholders };
};

const restoreAllowlistTerms = (message: string, placeholders: Map<string, string>) => {
    let restored = message;
    for (const [placeholder, originalValue] of placeholders.entries()) {
        restored = restored.replace(new RegExp(escapeRegExp(placeholder), "g"), originalValue);
    }
    return restored;
};

const detectPhishing = (message: string) =>
    (suspiciousUrlPattern.test(message) && phishingPatterns.some((pattern) => pattern.test(message))) ||
    (/\b(?:urgent|immediately|right now)\b/i.test(message) && /\b(?:otp|password|pin)\b/i.test(message));

const hasLexiconMatch = (
    message: string,
    lexicon: { allowlist: string[]; phrases: string[]; tokens: string[] },
    regexBuilder: (term: string) => RegExp = buildWholeTermRegex
) => {
    const { protectedMessage } = protectAllowlistTerms(message, lexicon.allowlist);
    return applyLexiconRedaction(protectedMessage, lexicon, regexBuilder) !== protectedMessage;
};

const detectSpam = (message: string, containsSpamLexiconMatch: boolean) => {
    if (containsSpamLexiconMatch) {
        return true;
    }

    const containsUrl = suspiciousUrlPattern.test(message);
    const hasCtaAndSpamCue = spamCallToActionPattern.test(message) && aggressiveSpamCuePattern.test(message);
    const hasMoneyAndSpamCue = spamMoneyPattern.test(message) && aggressiveSpamCuePattern.test(message);

    return containsUrl ? hasCtaAndSpamCue || hasMoneyAndSpamCue : hasMoneyAndSpamCue;
};

const hasSensitivePattern = (message: string) =>
    sensitivePatterns.some((pattern) => {
        pattern.lastIndex = 0;
        return pattern.test(message);
    });

const parseJsonObject = (content: string) => {
    try {
        return JSON.parse(content);
    } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (!match) {
            return null;
        }
        try {
            return JSON.parse(match[0]);
        } catch {
            return null;
        }
    }
};

export const redactSensitiveContent = (message: string): MessageCensorshipResult => {
    if (!message) {
        return {
            isSensitive: false,
            redactedMessage: message,
            isPhishing: false,
            containsCredentials: false,
            containsProfanity: false,
            containsSpam: false,
            redactionCategory: "none",
            disclosureAllowed: false,
        };
    }

    const containsCredentials = hasSensitivePattern(message);
    const containsProfanity = hasLexiconMatch(message, combinedProfanityLexicon, buildFlexibleProfanityRegex);
    const containsSpamLexiconMatch = hasLexiconMatch(message, spamLexicon, buildWholeTermRegex);
    const containsSpam = detectSpam(message, containsSpamLexiconMatch);
    const isPhishing = detectPhishing(message);

    let redacted = applyPatternRedaction(message, sensitivePatterns);
    const profanityProtected = protectAllowlistTerms(redacted, combinedProfanityLexicon.allowlist);
    redacted = applyLexiconRedaction(profanityProtected.protectedMessage, combinedProfanityLexicon, buildFlexibleProfanityRegex);
    redacted = restoreAllowlistTerms(redacted, profanityProtected.placeholders);
    const spamProtected = protectAllowlistTerms(redacted, spamLexicon.allowlist);
    redacted = applyLexiconRedaction(spamProtected.protectedMessage, spamLexicon, buildWholeTermRegex);
    redacted = restoreAllowlistTerms(redacted, spamProtected.placeholders);
    redacted = condenseRedactionMarkers(redacted);

    const redactionCategory: MessageCensorshipResult["redactionCategory"] = isPhishing
        ? "phishing"
        : containsSpam
            ? "spam"
        : containsProfanity
            ? "profanity"
            : containsCredentials
                ? "credentials"
                : "none";

    return {
        isSensitive: redacted !== message,
        redactedMessage: redacted,
        isPhishing,
        containsCredentials,
        containsProfanity,
        containsSpam,
        redactionCategory,
        disclosureAllowed: redactionCategory === "credentials",
    };
};

export const parseModelCensorshipResponse = (
    content: string,
    originalMessage: string
): MessageCensorshipResult | null => {
    const parsed = parseJsonObject(content);
    if (!parsed || typeof parsed !== "object") {
        return null;
    }

    const response = parsed as {
        isSensitive?: unknown;
        redactedMessage?: unknown;
        isPhishing?: unknown;
        containsSpam?: unknown;
        redactionCategory?: unknown;
    };
    const redactedMessage =
        typeof response.redactedMessage === "string" ? response.redactedMessage : originalMessage;
    const isSensitive =
        typeof response.isSensitive === "boolean" ? response.isSensitive : redactedMessage !== originalMessage;
    const isPhishing = typeof response.isPhishing === "boolean" ? response.isPhishing : false;
    const containsSpam = typeof response.containsSpam === "boolean" ? response.containsSpam : false;
    const redactionCategory =
        response.redactionCategory === "credentials" ||
        response.redactionCategory === "profanity" ||
        response.redactionCategory === "phishing" ||
        response.redactionCategory === "spam" ||
        response.redactionCategory === "none"
            ? response.redactionCategory
            : isPhishing
                ? "phishing"
                : containsSpam
                    ? "spam"
                    : "none";

    return {
        isSensitive,
        redactedMessage,
        isPhishing,
        containsCredentials: false,
        containsProfanity: false,
        containsSpam,
        redactionCategory,
        disclosureAllowed: false,
    };
};
