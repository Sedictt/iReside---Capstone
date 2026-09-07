import crypto from "crypto";

const RESET_TOKEN_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "ireside-reset-token-fallback-key";

export function createPasswordResetToken(email: string, userId: string): string {
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const payload = `${email.toLowerCase()}:${userId}:${expiresAt}`;
    const signature = crypto
        .createHmac("sha256", RESET_TOKEN_SECRET)
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
            .createHmac("sha256", RESET_TOKEN_SECRET)
            .update(payload)
            .digest("hex");

        if (crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) {
            return { valid: true, email, userId };
        }
        return { valid: false };
    } catch {
        return { valid: false };
    }
}
