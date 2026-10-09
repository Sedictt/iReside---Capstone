/**
 * Signed two-factor "verified device" cookie.
 *
 * The cookie proves that the browser completed an email OTP challenge for a
 * given user. It is read by the Edge middleware and by the API auth guard, so
 * it is implemented with WebCrypto only (no Node-specific imports).
 *
 * Format: `<userId>.<expiresAtUnixSeconds>.<base64url(HMAC-SHA256(userId.expiresAt))>`
 *
 * A plain, unsigned value (the previous format) is rejected: anyone could set
 * `ireside_2fa_verified=<their user id>` in dev tools and skip 2FA entirely.
 *
 * @module lib/security/two-factor-cookie
 */

export const TWO_FACTOR_VERIFIED_COOKIE = "ireside_2fa_verified";
export const TWO_FACTOR_PENDING_COOKIE = "ireside_2fa_pending";
/** How long a verified device stays trusted before the OTP challenge runs again. */
export const TWO_FACTOR_VERIFIED_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const DEV_FALLBACK_SECRET = "ireside-dev-two-factor-cookie-secret";

function resolveSecret(): string | null {
  const configured =
    process.env.TWO_FACTOR_COOKIE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.JWT_SECRET;
  if (configured) return configured;
  // Never fall back to a public constant in production: that would make the cookie forgeable.
  if (process.env.NODE_ENV === "production") return null;
  return DEV_FALLBACK_SECRET;
}

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("WebCrypto is not available in this runtime.");
  }
  return subtle;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await getSubtle().importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await getSubtle().sign("HMAC", key, encoder.encode(message));
  return toBase64Url(new Uint8Array(signature));
}

/** Constant-time string comparison (both inputs are base64url signatures of equal length when valid). */
function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

/**
 * Builds the signed cookie value for a user who just passed the OTP challenge.
 * Throws in production when no signing secret is configured.
 */
export async function createTwoFactorVerifiedCookieValue(userId: string, now: number = Date.now()): Promise<string> {
  const secret = resolveSecret();
  if (!secret) {
    throw new Error("TWO_FACTOR_COOKIE_SECRET (or SUPABASE_SERVICE_ROLE_KEY) must be configured to issue 2FA cookies.");
  }
  const expiresAt = Math.floor(now / 1000) + TWO_FACTOR_VERIFIED_MAX_AGE_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${await sign(payload, secret)}`;
}

/**
 * Verifies a cookie value against the signed-in user. Returns false for a
 * missing, malformed, expired, foreign, or tampered cookie.
 */
export async function verifyTwoFactorVerifiedCookieValue(
  value: string | undefined | null,
  userId: string,
  now: number = Date.now(),
): Promise<boolean> {
  if (!value || !userId) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [cookieUserId, expiresAtRaw, providedSignature] = parts;
  if (cookieUserId !== userId) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 < now) return false;

  const secret = resolveSecret();
  if (!secret) return false;

  try {
    const expectedSignature = await sign(`${cookieUserId}.${expiresAtRaw}`, secret);
    return constantTimeEqual(expectedSignature, providedSignature);
  } catch {
    return false;
  }
}

/** Cookie attributes shared by every place that issues the verified cookie. */
export function twoFactorVerifiedCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: TWO_FACTOR_VERIFIED_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  };
}
