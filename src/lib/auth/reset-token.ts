import crypto from "crypto";

// Local-development convenience only. In production a missing secret fails
// closed: a public fallback would let anyone mint password reset tokens.
const DEV_FALLBACK_SECRET = "ireside-reset-token-fallback-key";

function getResetTokenSecret(): string {
    const configured = process.env.PASSWORD_RESET_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (configured) return configured;
    if (process.env.NODE_ENV === "production") {
        throw new Error("PASSWORD_RESET_TOKEN_SECRET (or SUPABASE_SERVICE_ROLE_KEY) must be configured in production.");
    }
    return DEV_FALLBACK_SECRET;
}

export function createPasswordResetToken(email: string, userId: string): string {
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const payload = `${email.toLowerCase()}:${userId}:${expiresAt}`;
    const signature = crypto
        .createHmac("sha256", getResetTokenSecret())
        .update(payload)
        .digest("hex");
    return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyPasswordResetToken(token: string): { valid: boolean; email?: string; userId?: string } {
    try {
        const decoded = Buffer.from(token, "base64url").toString("utf-8");
        const parts = decoded.split(":");
        if (parts.length !== 4) return { valid: false };

        const [email, userId, expiresAtStr, providedSignature] = parts;
        const expiresAt = parseInt(expiresAtStr, 10);

        if (isNaN(expiresAt) || Date.now() > expiresAt) {
            return { valid: false };
        }

        const payload = `${email}:${userId}:${expiresAtStr}`;
        const expectedSignature = crypto
            .createHmac("sha256", getResetTokenSecret())
            .update(payload)
            .digest("hex");

        const provided = Buffer.from(providedSignature);
        const expected = Buffer.from(expectedSignature);
        if (provided.length !== expected.length) return { valid: false };

        if (crypto.timingSafeEqual(provided, expected)) {
            return { valid: true, email, userId };
        }
        return { valid: false };
    } catch {
        return { valid: false };
    }
}
