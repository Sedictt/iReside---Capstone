import crypto from "crypto";

// Base32 Crockford-like charset excluding ambiguous characters: 0, O, 1, I, L
const CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CHUNK_SIZE = 4;
const CHUNK_COUNT = 4; // Total 16 characters = 80 bits of entropy

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Derives a 32-byte key from environment secrets.
 */
function getMasterKey(): Buffer {
    const rawSecret =
        process.env.SECURITY_KEY_SECRET ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXTAUTH_SECRET ||
        "ireside-default-secret-seed-should-be-configured-in-env";

    return crypto.createHash("sha256").update(rawSecret).digest();
}

/**
 * Normalizes a security key for comparison (removes hyphens, spaces, uppercase).
 */
export function normalizeSecurityKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * Formats a normalized key string into hyphenated chunks: XXXX-XXXX-XXXX-XXXX.
 */
export function formatSecurityKey(raw: string): string {
    const clean = normalizeSecurityKey(raw);
    const chunks: string[] = [];
    for (let i = 0; i < clean.length; i += CHUNK_SIZE) {
        chunks.push(clean.slice(i, i + CHUNK_SIZE));
    }
    return chunks.join("-");
}

/**
 * Generates a high-entropy, human-friendly Base32 security key.
 * E.g., "7K9P-4M2X-8W3Q-5H6J"
 */
export function generateSecurityKey(): string {
    const totalChars = CHUNK_SIZE * CHUNK_COUNT;
    const randomBytes = crypto.randomBytes(totalChars);
    let result = "";

    for (let i = 0; i < totalChars; i++) {
        const index = randomBytes[i] % CHARSET.length;
        result += CHARSET[index];
    }

    return formatSecurityKey(result);
}

export interface EncryptedSecurityKey {
    encrypted: string;
    iv: string;
    authTag: string;
}

/**
 * Encrypts a plaintext security key using AES-256-GCM.
 */
export function encryptSecurityKey(plaintextKey: string): EncryptedSecurityKey {
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const normalized = normalizeSecurityKey(plaintextKey);

    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
    let encrypted = cipher.update(normalized, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return {
        encrypted,
        iv: iv.toString("hex"),
        authTag,
    };
}

/**
 * Decrypts an AES-256-GCM encrypted security key.
 */
export function decryptSecurityKey(
    encrypted: string,
    ivHex: string,
    authTagHex: string
): string | null {
    try {
        const masterKey = getMasterKey();
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");

        const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return formatSecurityKey(decrypted);
    } catch {
        return null;
    }
}

/**
 * Constant-time verification of an entered security key against encrypted storage.
 */
export function verifySecurityKey(
    inputKey: string,
    encrypted: string,
    ivHex: string,
    authTagHex: string
): boolean {
    const decrypted = decryptSecurityKey(encrypted, ivHex, authTagHex);
    if (!decrypted) return false;

    const normalizedInput = normalizeSecurityKey(inputKey);
    const normalizedStored = normalizeSecurityKey(decrypted);

    if (normalizedInput.length !== normalizedStored.length) {
        return false;
    }

    const inputBuf = Buffer.from(normalizedInput);
    const storedBuf = Buffer.from(normalizedStored);

    return crypto.timingSafeEqual(inputBuf, storedBuf);
}

export interface RateLimitCheckResult {
    isLocked: boolean;
    lockedUntil?: Date;
    remainingAttempts: number;
}

/**
 * Checks whether an account is currently locked out from recovery attempts.
 */
export function checkRecoveryRateLimit(
    failedAttempts: number,
    lockedUntilIso: string | null | undefined
): RateLimitCheckResult {
    if (lockedUntilIso) {
        const lockedUntil = new Date(lockedUntilIso);
        if (lockedUntil.getTime() > Date.now()) {
            return {
                isLocked: true,
                lockedUntil,
                remainingAttempts: 0,
            };
        }
    }

    const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - (failedAttempts || 0));
    return {
        isLocked: false,
        remainingAttempts: remaining,
    };
}

/**
 * Calculates updated failure count and lockout time on a failed attempt.
 */
export function registerFailedAttempt(currentFailures: number): {
    failedAttempts: number;
    lockedUntil: string | null;
} {
    const nextFailures = (currentFailures || 0) + 1;
    if (nextFailures >= MAX_FAILED_ATTEMPTS) {
        const lockExpiration = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
        return {
            failedAttempts: nextFailures,
            lockedUntil: lockExpiration,
        };
    }

    return {
        failedAttempts: nextFailures,
        lockedUntil: null,
    };
}
