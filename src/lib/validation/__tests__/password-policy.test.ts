import { describe, it, expect } from "vitest";
import { evaluatePasswordStrength, getPasswordPolicyError } from "../password-policy";

describe("getPasswordPolicyError", () => {
  it("keeps the baseline rules (required, 8-72 chars, letters plus number/symbol)", () => {
    expect(getPasswordPolicyError("")).toMatch(/required/);
    expect(getPasswordPolicyError("short1")).toMatch(/at least 8/);
    expect(getPasswordPolicyError("a1".repeat(40))).toMatch(/cannot exceed 72/);
    expect(getPasswordPolicyError("lettersonly")).toMatch(/number or symbol/);
    expect(getPasswordPolicyError("12345678!")).toMatch(/number or symbol/);
    expect(getPasswordPolicyError("SecurePass2026!")).toBeUndefined();
    expect(getPasswordPolicyError("goodpass1")).toBeUndefined();
  });

  it("rejects a single repeated character regardless of length or case", () => {
    expect(getPasswordPolicyError("BBBBBBBBBBBBBBBB")).toMatch(/number or symbol/);
    expect(getPasswordPolicyError("BBBBBBBBBBBBBBB1")).toMatch(/predictable/);
    expect(getPasswordPolicyError("aaaaaaa1!")).toMatch(/predictable/);
  });

  it("rejects alphabet, digit and keyboard sequences", () => {
    expect(getPasswordPolicyError("abcdefgh1")).toMatch(/predictable/);
    expect(getPasswordPolicyError("a12345678")).toMatch(/predictable/);
    expect(getPasswordPolicyError("qwertyuiop1")).toMatch(/common|predictable/);
    expect(getPasswordPolicyError("abababab1")).toMatch(/predictable/);
  });

  it("rejects common passwords, including leetspeak and digit/symbol suffixes", () => {
    expect(getPasswordPolicyError("Password123")).toMatch(/too common/);
    expect(getPasswordPolicyError("P@ssw0rd!")).toMatch(/too common/);
    expect(getPasswordPolicyError("Welcome2026!")).toMatch(/too common/);
    expect(getPasswordPolicyError("iloveyou1")).toMatch(/too common/);
    expect(getPasswordPolicyError("landlord2026")).toMatch(/too common/);
    expect(getPasswordPolicyError("ireside123!")).toMatch(/too common/);
  });

  it("rejects passwords containing the user's name or email", () => {
    const context = { name: "Bryan Benedict Canon", email: "bryan.canon@gmail.com" };
    expect(getPasswordPolicyError("Bryan2026!!", { context })).toMatch(/name or email/);
    expect(getPasswordPolicyError("xxCANONxx99", { context })).toMatch(/name or email/);
    expect(getPasswordPolicyError("bryan.canon@gmail.com1", { context })).toMatch(/name or email/);
    expect(getPasswordPolicyError("Br4nd0nRocks99", { context })).toBeUndefined();
    // Without context the same password is fine.
    expect(getPasswordPolicyError("Bryan2026!!")).toBeUndefined();
  });

  it("uses the supplied label in messages", () => {
    expect(getPasswordPolicyError("short", { label: "New password" })).toMatch(/^New password/);
  });
});

describe("evaluatePasswordStrength", () => {
  it("never rates a repeated or sequential password above Weak", () => {
    const repeated = evaluatePasswordStrength("BBBBBBBBBBBBBBBB");
    expect(repeated.label).toBe("Weak");
    expect(repeated.score).toBeLessThanOrEqual(1);
    expect(repeated.error).toBeDefined();

    expect(evaluatePasswordStrength("aaaaaaaaaaaaaaaaaaaa1!").score).toBeLessThanOrEqual(1);
    expect(evaluatePasswordStrength("abcdefghijklmnop1").score).toBeLessThanOrEqual(1);
    expect(evaluatePasswordStrength("1234567890123456").score).toBeLessThanOrEqual(1);
  });

  it("rates common passwords Weak even when long", () => {
    expect(evaluatePasswordStrength("Password123456!").score).toBeLessThanOrEqual(1);
    expect(evaluatePasswordStrength("P@ssw0rd2026!!").label).toBe("Weak");
  });

  it("caps anything that fails the hard policy at Weak", () => {
    const personal = evaluatePasswordStrength("BryanCanonSecure99!", { name: "Bryan Canon" });
    expect(personal.score).toBeLessThanOrEqual(1);
    expect(personal.label).toBe("Weak");
    expect(personal.checks.isNotPersonal).toBe(false);
  });

  it("rewards length and variety for genuinely random-looking passwords", () => {
    expect(evaluatePasswordStrength("abc").score).toBe(0);
    expect(evaluatePasswordStrength("goodpass1").label).toBe("Fair");
    expect(evaluatePasswordStrength("Str0ngP@ssw0rd2026").score).toBeGreaterThanOrEqual(3);
    expect(evaluatePasswordStrength("Tr0ub4dor&3Horse").score).toBeGreaterThanOrEqual(3);
    expect(evaluatePasswordStrength("correct-horse-battery-staple-91").score).toBe(4);
    expect(evaluatePasswordStrength("vK9#mQ2$pL7@xR4w").score).toBe(4);
  });

  it("exposes granular checks for the live checklist", () => {
    const result = evaluatePasswordStrength("Str0ng!Pass");
    expect(result.checks).toMatchObject({
      hasMinLength: true,
      hasLetter: true,
      hasNumberOrSymbol: true,
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: true,
      isNotCommon: true,
      isNotRepetitive: true,
      isNotPersonal: true,
    });
    expect(result.error).toBeUndefined();
  });

  it("returns score 0 with no error for an empty value", () => {
    const empty = evaluatePasswordStrength("");
    expect(empty.score).toBe(0);
    expect(empty.error).toBeUndefined();
  });
});
