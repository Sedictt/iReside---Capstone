import { redactSensitiveContent, type MessageCensorshipResult } from "@/lib/messages/censorship";

const DEFAULT_REDACTION_TIMEOUT_MS = 1800;

type RedactionApiPayload = {
    isSensitive?: unknown;
    redactedMessage?: unknown;
    isPhishing?: unknown;
    containsCredentials?: unknown;
    containsProfanity?: unknown;
    containsSpam?: unknown;
    redactionCategory?: unknown;
    disclosureAllowed?: unknown;
};

export const redactMessageForSend = async (
    message: string,
    timeoutMs = DEFAULT_REDACTION_TIMEOUT_MS
): Promise<MessageCensorshipResult> => {
    const localResult = redactSensitiveContent(message);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch("/api/iris/redact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
            signal: controller.signal,
        });

        if (!response.ok) {
            return localResult;
        }

        const payload = (await response.json()) as RedactionApiPayload;
        const redactionCategory =
            payload.redactionCategory === "credentials" ||
            payload.redactionCategory === "profanity" ||
            payload.redactionCategory === "phishing" ||
            payload.redactionCategory === "spam" ||
            payload.redactionCategory === "none"
                ? payload.redactionCategory
                : localResult.redactionCategory;
        return {
            isSensitive: Boolean(payload.isSensitive),
            redactedMessage: typeof payload.redactedMessage === "string" ? payload.redactedMessage : message,
            isPhishing: Boolean(payload.isPhishing),
            containsCredentials:
                typeof payload.containsCredentials === "boolean"
                    ? payload.containsCredentials
                    : localResult.containsCredentials,
            containsProfanity:
                typeof payload.containsProfanity === "boolean"
                    ? payload.containsProfanity
                    : localResult.containsProfanity,
            containsSpam:
                typeof payload.containsSpam === "boolean"
                    ? payload.containsSpam
                    : localResult.containsSpam,
            redactionCategory,
            disclosureAllowed:
                typeof payload.disclosureAllowed === "boolean"
                    ? payload.disclosureAllowed
                    : redactionCategory === "credentials",
        };
    } catch {
        return localResult;
    } finally {
        clearTimeout(timeoutId);
    }
};
