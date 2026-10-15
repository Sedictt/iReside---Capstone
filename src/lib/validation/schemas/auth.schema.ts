/**
 * Auth Validation Schemas
 *
 * @module lib/validation/schemas/auth
 */

import { z } from "zod";
import { emailSchema, nonEmptyStringSchema } from "./common.schema";
import { zNewPassword } from "../zod-fields";
import { zCurrentPassword, zOtp } from "./account.schema";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

// Login only checks the password; strength rules apply when a password is set.
export const loginSchema = z.object({
  email: emailSchema,
  password: zCurrentPassword("Password"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Sign-Up
// ---------------------------------------------------------------------------

export const signupSchema = z.object({
  email: emailSchema,
  password: zNewPassword("Password"),
  fullName: nonEmptyStringSchema.min(2, "Full name is required"),
  role: z.enum(["tenant", "landlord"]).default("tenant"),
});

export type SignupInput = z.infer<typeof signupSchema>;

// ---------------------------------------------------------------------------
// OTP
// ---------------------------------------------------------------------------

export const otpRequestSchema = z.object({
  email: emailSchema,
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  email: emailSchema,
  otp: zOtp(),
});

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

export const changePasswordSchema = z.object({
  currentPassword: zCurrentPassword("Current password"),
  newPassword: zNewPassword("New password"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

export type ResetPasswordRequestInput = z.infer<
  typeof resetPasswordRequestSchema
>;

// ---------------------------------------------------------------------------
// Profile Update
// ---------------------------------------------------------------------------

export const updateProfileSchema = z.object({
  fullName: nonEmptyStringSchema.min(2).optional(),
  phone: z.string().trim().min(10).optional(),
  bio: z.string().trim().max(500).optional(),
  website: z.string().trim().url().optional().or(z.literal("")),
  address: z.string().trim().max(300).optional(),
  avatarUrl: z.string().trim().url().optional(),
  coverUrl: z.string().trim().url().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;