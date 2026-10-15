/**
 * Shared one-time-code verification with attempt limiting.
 *
 * Six-digit codes are brute-forceable (1,000,000 combinations) unless the
 * number of guesses per issued code is bounded. Every OTP flow that stores a
 * code in `user_security_settings.otp_code` (password reset, setup email
 * verification, account claiming) must go through `evaluateOtpAttempt` and
 * persist the returned `nextStoredCode`.
 *
 * Failed attempts are tracked inline in the stored value as `<code>#<attempts>`
 * (the same encoding `TwoFactorService` already uses) so no schema change is
 * required and the counter survives restarts and multiple instances.
 *
 * @module lib/security/otp-verification
 */

import { timingSafeEqual } from "node:crypto";

export const OTP_MAX_FAILED_ATTEMPTS = 5;

export interface StoredOtp {
  code: string | null;
  failedAttempts: number;
}

/** Splits a stored `code#attempts` value into its parts. */
export function parseStoredOtp(raw: unknown): StoredOtp {
  if (typeof raw !== "string" || raw.length === 0) {
    return { code: null, failedAttempts: 0 };
  }
  const [code, attempts] = raw.split("#");
  const failedAttempts = Number.parseInt(attempts ?? "0", 10);
  return {
    code: code || null,
    failedAttempts: Number.isFinite(failedAttempts) && failedAttempts > 0 ? failedAttempts : 0,
  };
}

/** Constant-time comparison of a stored code against user input. */
export function otpMatches(expected: string | null, provided: string): boolean {
  if (!expected || !provided) return false;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  if (expectedBytes.length !== providedBytes.length) return false;
  return timingSafeEqual(expectedBytes, providedBytes);
}

export type OtpAttemptResult =
  | { ok: true; nextStoredCode: null }
  | {
      ok: false;
      reason: "not_found" | "expired" | "locked" | "mismatch";
      remainingAttempts: number;
      message: string;
      /** Value to persist back into `otp_code` (null clears the code). */
      nextStoredCode: string | null;
    };

export interface EvaluateOtpAttemptInput {
  storedCode: unknown;
  storedExpiry: string | Date | null | undefined;
  providedOtp: string;
  now?: number;
  maxFailedAttempts?: number;
}

/**
 * Pure decision function: compares the provided code to the stored one,
 * enforces expiry and the failed-attempt ceiling, and reports what should be
 * written back. The caller persists `nextStoredCode` (null = invalidate).
 */
export function evaluateOtpAttempt(input: EvaluateOtpAttemptInput): OtpAttemptResult {
  const now = input.now ?? Date.now();
  const maxFailedAttempts = input.maxFailedAttempts ?? OTP_MAX_FAILED_ATTEMPTS;
  const { code, failedAttempts } = parseStoredOtp(input.storedCode);
  const providedOtp = (input.providedOtp ?? "").trim();

  if (!code) {
    return {
      ok: false,
      reason: "not_found",
      remainingAttempts: 0,
      message: "No pending verification code found. Please request a new code.",
      nextStoredCode: null,
    };
  }

  if (failedAttempts >= maxFailedAttempts) {
    return {
      ok: false,
      reason: "locked",
      remainingAttempts: 0,
      message: "Too many failed attempts. This code has been invalidated. Please request a new code.",
      nextStoredCode: null,
    };
  }

  const expiryTime = input.storedExpiry ? new Date(input.storedExpiry).getTime() : Number.NaN;
  if (!Number.isFinite(expiryTime) || now > expiryTime) {
    return {
      ok: false,
      reason: "expired",
      remainingAttempts: 0,
      message: "Verification code has expired. Please request a new one.",
      nextStoredCode: null,
    };
  }

  if (!otpMatches(code, providedOtp)) {
    const nextFailed = failedAttempts + 1;
    const remaining = Math.max(0, maxFailedAttempts - nextFailed);
    if (remaining === 0) {
      return {
        ok: false,
        reason: "locked",
        remainingAttempts: 0,
        message: "Too many failed attempts. This code has been invalidated. Please request a new code.",
        nextStoredCode: null,
      };
    }
    return {
      ok: false,
      reason: "mismatch",
      remainingAttempts: remaining,
      message: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      nextStoredCode: `${code}#${nextFailed}`,
    };
  }

  return { ok: true, nextStoredCode: null };
}

/**
 * Persists the outcome of an attempt to both OTP stores (the normalized
 * `user_security_settings` row and the legacy `profiles` columns). Best effort:
 * a write failure must not turn a rejected guess into an accepted one, so the
 * caller only uses the evaluation result, never the write result.
 */
export async function persistOtpAttempt(
  adminClient: { from: (table: string) => any },
  profileId: string,
  nextStoredCode: string | null,
): Promise<void> {
  const updatedAt = new Date().toISOString();
  const securityUpdate = nextStoredCode === null
    ? { otp_code: null, otp_expiry: null, updated_at: updatedAt }
    : { otp_code: nextStoredCode, updated_at: updatedAt };

  const safely = async (write: () => Promise<unknown> | unknown) => {
    try {
      await write();
    } catch (error) {
      console.warn("[otp-verification] Failed to persist OTP attempt state:", error);
    }
  };

  await Promise.all([
    safely(() => adminClient.from("user_security_settings").update(securityUpdate).eq("profile_id", profileId)),
    safely(() => adminClient.from("profiles").update(securityUpdate).eq("id", profileId)),
  ]);
}
