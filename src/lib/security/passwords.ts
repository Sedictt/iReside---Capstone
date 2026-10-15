/**
 * Cryptographically secure temporary password generation.
 *
 * Temporary tenant passwords are emailed and used for first sign-in, so they
 * must come from a CSPRNG. `Math.random()` is predictable and must never be
 * used for credentials.
 *
 * @module lib/security/passwords
 */

import { randomInt } from "node:crypto";

/** Unambiguous alphabet (no 0/O, 1/l/I) plus a few symbols the password policy accepts. */
const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
const LETTER_PATTERN = /[A-Za-z]/;
const NUMBER_OR_SYMBOL_PATTERN = /[0-9!@#$]/;

/**
 * Generates a random temporary password that satisfies the shared password
 * policy (letters plus a number or symbol).
 */
export function generateTemporaryPassword(length = 12): string {
  const size = Math.max(8, Math.floor(length));

  // Retry until the policy is met; with a 60-char alphabet this virtually never loops twice.
  for (;;) {
    let password = "";
    for (let index = 0; index < size; index += 1) {
      password += TEMP_PASSWORD_ALPHABET[randomInt(0, TEMP_PASSWORD_ALPHABET.length)];
    }
    if (LETTER_PATTERN.test(password) && NUMBER_OR_SYMBOL_PATTERN.test(password)) {
      return password;
    }
  }
}

/** Generates a 6-digit numeric one-time code from a CSPRNG. */
export function generateNumericOtp(): string {
  return randomInt(100000, 1000000).toString();
}
