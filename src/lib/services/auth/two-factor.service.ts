/**
 * Two-Factor Authentication (2FA) Service
 *
 * Provides a unified, resilient implementation for 2FA across
 * landlords and tenants.
 *
 * Responsibilities:
 * - Status resolution and synchronization between profiles and user_security_settings.
 * - OTP code generation, dispatching branded emails, and cryptographic expiry tracking.
 * - Strict attempt limits (max 5 attempts before invalidation).
 * - Password verification for disabling 2FA.
 *
 * @module lib/services/auth/two-factor.service
 */

import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTwoFactorOTP } from "@/lib/email";
import { generateNumericOtp } from "@/lib/security/passwords";
import { otpMatches } from "@/lib/security/otp-verification";

export interface TwoFactorState {
    enabled: boolean;
    email: string | null;
    userEmail: string;
    hasGmailConnected?: boolean;
    hasChangedPassword?: boolean;
    passwordLastUpdated?: string | null;
}

export interface SendOTPResult {
    success: boolean;
    message: string;
    email: string;
}

export interface VerifyOTPResult {
    success: boolean;
    message?: string;
    error?: string;
    code?: "INVALID_CODE" | "EXPIRED" | "TOO_MANY_ATTEMPTS" | "NOT_FOUND";
    remainingAttempts?: number;
    email?: string;
}

export interface Disable2FAResult {
    success: boolean;
    message?: string;
    error?: string;
}

const MAX_VERIFICATION_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 5;

// In-memory attempt tracker with 10-minute TTL
const attemptTracker = new Map<string, { attempts: number; timestamp: number }>();

function getFailedAttempts(userId: string): number {
    const record = attemptTracker.get(userId);
    if (!record) return 0;
    if (Date.now() - record.timestamp > 10 * 60 * 1000) {
        attemptTracker.delete(userId);
        return 0;
    }
    return record.attempts;
}

function recordFailedAttempt(userId: string): number {
    const current = getFailedAttempts(userId);
    const next = current + 1;
    attemptTracker.set(userId, { attempts: next, timestamp: Date.now() });
    return next;
}

function clearAttempts(userId: string): void {
    attemptTracker.delete(userId);
}

export function maskEmail(email: string): string {
    if (!email || !email.includes("@")) return email || "";
    const [local, domain] = email.split("@");
    if (local.length <= 2) {
        return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export class TwoFactorService {
    private readonly adminClient: ReturnType<typeof createAdminClient>;

    constructor(adminClient?: ReturnType<typeof createAdminClient>) {
        this.adminClient = adminClient || createAdminClient();
    }

    /**
     * Resolves the current 2FA status for a user, ensuring synchronization
     * across profiles and user_security_settings.
     */
    async getStatus(userId: string): Promise<TwoFactorState> {
        const [{ data: profile }, { data: settings }, { data: gmailToken }] = await Promise.all([
            this.adminClient
                .from("profiles")
                .select("id, email, two_factor_enabled, two_factor_email")
                .eq("id", userId)
                .maybeSingle(),
            (this.adminClient as any)
                .from("user_security_settings")
                .select("two_factor_enabled, two_factor_email, otp_code, otp_expiry, has_changed_password, updated_at")
                .eq("profile_id", userId)
                .maybeSingle(),
            (this.adminClient as any)
                .from("external_account_tokens")
                .select("access_token")
                .eq("profile_id", userId)
                .eq("provider", "gmail")
                .maybeSingle(),
        ]);

        const isEnabled = Boolean(settings?.two_factor_enabled || profile?.two_factor_enabled);
        const twoFactorEmail = settings?.two_factor_email || profile?.two_factor_email || profile?.email || null;
        const userEmail = profile?.email || "";

        // Proactively synchronize if one table had enabled and the other didn't
        if (settings && profile && settings.two_factor_enabled !== profile.two_factor_enabled) {
            try {
                await Promise.all([
                    (this.adminClient as any)
                        .from("user_security_settings")
                        .upsert({
                            profile_id: userId,
                            two_factor_enabled: isEnabled,
                            two_factor_email: twoFactorEmail,
                            updated_at: new Date().toISOString(),
                        }, { onConflict: "profile_id" }),
                    this.adminClient
                        .from("profiles")
                        .update({
                            two_factor_enabled: isEnabled,
                            two_factor_email: twoFactorEmail,
                            updated_at: new Date().toISOString(),
                        } as any)
                        .eq("id", userId),
                ]);
            } catch (syncErr) {
                console.warn("[TwoFactorService] Synchronization notice:", syncErr);
            }
        }

        // Keep Supabase user_metadata synchronized with resolved status
        try {
            if (typeof this.adminClient?.auth?.admin?.updateUserById === "function") {
                await this.adminClient.auth.admin.updateUserById(userId, {
                    user_metadata: { two_factor_enabled: isEnabled },
                });
            }
        } catch {
            // Synchronization is best effort
        }

        const passwordLastUpdated = (settings as any)?.has_changed_password ? (settings as any)?.updated_at : null;

        return {
            enabled: isEnabled,
            email: isEnabled ? twoFactorEmail : null,
            userEmail,
            hasGmailConnected: Boolean(gmailToken?.access_token),
            hasChangedPassword: Boolean((settings as any)?.has_changed_password),
            passwordLastUpdated,
        };
    }

    /**
     * Generates a 6-digit OTP code, persists it in both tables, and sends a branded 2FA email.
     */
    async sendOTP(
        userId: string,
        options: { action?: "enable" | "login" | "verification" } = {}
    ): Promise<SendOTPResult> {
        const { action = "enable" } = options;

        const [{ data: profile }, { data: settings }] = await Promise.all([
            this.adminClient
                .from("profiles")
                .select("id, email, two_factor_email")
                .eq("id", userId)
                .maybeSingle(),
            (this.adminClient as any)
                .from("user_security_settings")
                .select("two_factor_email")
                .eq("profile_id", userId)
                .maybeSingle(),
        ]);

        if (!profile?.email) {
            throw new Error("User profile not found");
        }

        const recipientEmail = settings?.two_factor_email || profile.two_factor_email || profile.email;
        // CSPRNG: Math.random() output is predictable and unsuitable for codes.
        const otp = generateNumericOtp();
        const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

        // Persist OTP in both user_security_settings and profiles
        const [{ error: secErr }, { error: profErr }] = await Promise.all([
            (this.adminClient as any)
                .from("user_security_settings")
                .upsert({
                    profile_id: userId,
                    otp_code: otp,
                    otp_expiry: otpExpiry,
                    two_factor_email: recipientEmail,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "profile_id" }),
            this.adminClient
                .from("profiles")
                .update({
                    otp_code: otp,
                    otp_expiry: otpExpiry,
                    two_factor_email: recipientEmail,
                    updated_at: new Date().toISOString(),
                } as any)
                .eq("id", userId),
        ]);

        if (secErr || profErr) {
            console.error("[TwoFactorService] Error storing OTP:", secErr || profErr);
            throw new Error("Failed to generate verification code");
        }

        // Reset failed attempt counter when a fresh code is dispatched
        clearAttempts(userId);

        // Send branded two-factor email
        await sendTwoFactorOTP({
            to: recipientEmail,
            otp,
            action,
        });

        return {
            success: true,
            message: "Verification code sent to your email",
            email: maskEmail(recipientEmail),
        };
    }

    /**
     * Verifies the 6-digit OTP code with attempt limiting.
     * If enableOnSuccess is true, sets two_factor_enabled = true.
     */
    async verifyOTP(
        userId: string,
        otp: string,
        options: { enableOnSuccess?: boolean } = {}
    ): Promise<VerifyOTPResult> {
        const { enableOnSuccess = false } = options;
        const cleanOtp = (otp || "").replace(/\D/g, "");

        if (!cleanOtp || cleanOtp.length !== 6) {
            return {
                success: false,
                error: "Please enter a valid 6-digit verification code.",
                code: "INVALID_CODE",
            };
        }

        // Retrieve stored OTP from database
        const [{ data: profile }, { data: settings }] = await Promise.all([
            this.adminClient
                .from("profiles")
                .select("id, email, two_factor_email, otp_code, otp_expiry")
                .eq("id", userId)
                .maybeSingle(),
            (this.adminClient as any)
                .from("user_security_settings")
                .select("two_factor_email, otp_code, otp_expiry")
                .eq("profile_id", userId)
                .maybeSingle(),
        ]);

        const rawCode = settings?.otp_code || profile?.otp_code;
        const storedExpiry = settings?.otp_expiry || profile?.otp_expiry;
        const recipientEmail = settings?.two_factor_email || profile?.two_factor_email || profile?.email || "";

        // Parse code and DB-persisted attempts count (format: "123456" or "123456#2")
        const [storedCode, storedAttemptsStr] = (rawCode || "").split("#");
        const dbFailedAttempts = parseInt(storedAttemptsStr || "0", 10) || 0;
        const memoryFailedAttempts = getFailedAttempts(userId);
        const currentFailed = Math.max(dbFailedAttempts, memoryFailedAttempts);

        if (currentFailed >= MAX_VERIFICATION_ATTEMPTS) {
            await this.invalidateOTP(userId);
            return {
                success: false,
                error: "Too many failed attempts. This code has been invalidated. Please request a new code.",
                code: "TOO_MANY_ATTEMPTS",
                remainingAttempts: 0,
            };
        }

        const now = Date.now();
        const expiryTime = storedExpiry ? new Date(storedExpiry).getTime() : 0;

        if (!storedCode || !storedExpiry || now > expiryTime) {
            return {
                success: false,
                error: "Verification code has expired. Please request a new one.",
                code: "EXPIRED",
            };
        }

        if (!otpMatches(storedCode, cleanOtp)) {
            const nextFailed = currentFailed + 1;
            recordFailedAttempt(userId);
            const remaining = Math.max(0, MAX_VERIFICATION_ATTEMPTS - nextFailed);

            if (remaining === 0) {
                await this.invalidateOTP(userId);
                return {
                    success: false,
                    error: "Too many failed attempts. This code has been invalidated. Please request a new code.",
                    code: "TOO_MANY_ATTEMPTS",
                    remainingAttempts: 0,
                };
            }

            // Persist incremented attempt in DB so restarts/multi-nodes track it
            await Promise.all([
                (this.adminClient as any)
                    .from("user_security_settings")
                    .update({
                        otp_code: `${storedCode}#${nextFailed}`,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("profile_id", userId),
                this.adminClient
                    .from("profiles")
                    .update({
                        otp_code: `${storedCode}#${nextFailed}`,
                        updated_at: new Date().toISOString(),
                    } as any)
                    .eq("id", userId),
            ]).catch(() => {});

            return {
                success: false,
                error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
                code: "INVALID_CODE",
                remainingAttempts: remaining,
            };
        }

        // Code is valid! Clear attempt tracker
        clearAttempts(userId);

        if (enableOnSuccess) {
            // Enable 2FA in both tables and clear active OTP
            await Promise.all([
                (this.adminClient as any)
                    .from("user_security_settings")
                    .upsert({
                        profile_id: userId,
                        two_factor_enabled: true,
                        two_factor_email: recipientEmail,
                        otp_code: null,
                        otp_expiry: null,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: "profile_id" }),
                this.adminClient
                    .from("profiles")
                    .update({
                        two_factor_enabled: true,
                        two_factor_email: recipientEmail,
                        otp_code: null,
                        otp_expiry: null,
                        updated_at: new Date().toISOString(),
                    } as any)
                    .eq("id", userId),
            ]);

            // Sync user_metadata in auth.users
            try {
                if (typeof this.adminClient?.auth?.admin?.updateUserById === "function") {
                    await this.adminClient.auth.admin.updateUserById(userId, {
                        user_metadata: { two_factor_enabled: true },
                    });
                }
            } catch (authErr) {
                console.warn("[TwoFactorService] user_metadata sync notice:", authErr);
            }

            return {
                success: true,
                message: "Two-Factor Authentication enabled successfully",
                email: recipientEmail,
            };
        } else {
            // Used for login verification: clear OTP code and expiry in both tables
            await Promise.all([
                (this.adminClient as any)
                    .from("user_security_settings")
                    .update({
                        otp_code: null,
                        otp_expiry: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("profile_id", userId),
                this.adminClient
                    .from("profiles")
                    .update({
                        otp_code: null,
                        otp_expiry: null,
                        updated_at: new Date().toISOString(),
                    } as any)
                    .eq("id", userId),
            ]);

            return {
                success: true,
                message: "Verification successful",
            };
        }
    }

    /**
     * Disables 2FA by verifying the user's account password.
     */
    async disable(userId: string, password: string): Promise<Disable2FAResult> {
        if (!password) {
            return { success: false, error: "Password is required to disable Two-Factor Authentication." };
        }

        const { data: profile } = await this.adminClient
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .maybeSingle();

        if (!profile?.email) {
            return { success: false, error: "Profile not found." };
        }

        // Verify password using standalone Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const verifyClient = createClient(supabaseUrl, supabaseAnonKey);

        const { error: verifyError } = await verifyClient.auth.signInWithPassword({
            email: profile.email,
            password,
        });

        if (verifyError) {
            return { success: false, error: "Incorrect account password. Please try again." };
        }

        // Turn off 2FA in both tables and clear external account tokens
        await Promise.all([
            (this.adminClient as any)
                .from("user_security_settings")
                .upsert({
                    profile_id: userId,
                    two_factor_enabled: false,
                    two_factor_email: null,
                    otp_code: null,
                    otp_expiry: null,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "profile_id" }),
            this.adminClient
                .from("profiles")
                .update({
                    two_factor_enabled: false,
                    two_factor_email: null,
                    otp_code: null,
                    otp_expiry: null,
                    updated_at: new Date().toISOString(),
                } as any)
                .eq("id", userId),
            (this.adminClient as any)
                .from("external_account_tokens")
                .delete()
                .eq("profile_id", userId)
                .eq("provider", "gmail"),
        ]);

        // Sync user_metadata in auth.users
        try {
            if (typeof this.adminClient?.auth?.admin?.updateUserById === "function") {
                await this.adminClient.auth.admin.updateUserById(userId, {
                    user_metadata: { two_factor_enabled: false },
                });
            }
        } catch (authErr) {
            console.warn("[TwoFactorService] user_metadata sync notice:", authErr);
        }

        clearAttempts(userId);

        return {
            success: true,
            message: "Two-Factor Authentication disabled successfully.",
        };
    }

    /**
     * Invalidates any active OTP code in the database for the user.
     */
    async invalidateOTP(userId: string): Promise<void> {
        await Promise.all([
            (this.adminClient as any)
                .from("user_security_settings")
                .update({
                    otp_code: null,
                    otp_expiry: null,
                    updated_at: new Date().toISOString(),
                })
                .eq("profile_id", userId),
            this.adminClient
                .from("profiles")
                .update({
                    otp_code: null,
                    otp_expiry: null,
                    updated_at: new Date().toISOString(),
                } as any)
                .eq("id", userId),
        ]);
    }
}
