/**
 * Email Service — Typed Facade
 *
 * Re-exports all email functions from the implementation layer
 * with descriptive names, typed parameter interfaces, and JSDoc.
 *
 * All functions delegate to the shared transport layer (SMTP + retry).
 *
 * Marked 'use server' — only callable from server-side code.
 *
 * @module lib/email/email-service
 */

"use server";

import {
  sendTenantCredentials,
  sendLandlordCredentialsCopy,
  sendSigningLinkEmail,
  sendTenantSignedNotification,
  sendLeaseActivatedNotification,
  sendTenantOnboardingReminder,
  sendProspectPaymentRequestEmail as sendProspectPaymentRequestEmailImpl,
  sendRegistrationOTP,
  sendLandlordRegistrationApproved,
  sendLandlordOnboardingMagicLink,
} from "@/lib/email";

// ---------------------------------------------------------------------------
// Parameter Types
// ---------------------------------------------------------------------------

export interface TenantWelcomeEmailParameters {
  readonly recipientEmail: string;
  readonly tenantName: string;
  readonly temporaryPassword: string;
  readonly inviteUrl?: string | null;
  readonly leaseDetails?: {
    readonly propertyName: string;
    readonly unitName: string;
    readonly moveInDate: string;
    readonly monthlyRent: number;
  };
  readonly signingLink?: string;
}

export interface LandlordCredentialsCopyEmailParameters {
  readonly recipientEmail: string;
  readonly landlordName: string;
  readonly tenantName: string;
  readonly tenantEmail: string;
  readonly temporaryPassword: string;
  readonly inviteUrl?: string | null;
}

export interface LeaseSigningRequestEmailParameters {
  readonly recipientEmail: string;
  readonly tenantName: string;
  readonly signingUrl: string;
  readonly propertyName: string;
  readonly unitName: string;
  readonly rentAmount: number;
  readonly depositAmount: number;
  readonly landlordName: string;
  readonly landlordEmail: string;
  readonly expiresAt: Date;
}

export interface TenantSignedNotificationEmailParameters {
  readonly recipientEmail: string;
  readonly landlordName: string;
  readonly tenantName: string;
  readonly leaseId: string;
  readonly signingUrl?: string;
}

export interface LeaseActivatedNotificationEmailParameters {
  readonly recipientEmail: string;
  readonly tenantName: string;
  readonly propertyName: string;
  readonly unitName: string;
  readonly moveInDate: string;
}

export interface TenantOnboardingReminderEmailParameters {
  readonly recipientEmail: string;
  readonly tenantName: string;
  readonly onboardingUrl: string;
  readonly temporaryPassword?: string | null;
  readonly inviteUrl?: string | null;
}

export interface ProspectPaymentRequestEmailParameters {
  readonly recipientEmail: string;
  readonly applicantName: string;
  readonly propertyName: string;
  readonly unitName: string;
  readonly paymentPortalUrl: string;
  readonly expiresAt: Date;
  readonly advanceAmount: number;
  readonly securityAmount: number;
}

export interface RegistrationOtpEmailParameters {
  readonly recipientEmail: string;
  readonly otpCode: string;
}

export interface LandlordRegistrationApprovedEmailParameters {
  readonly recipientEmail: string;
  readonly landlordName: string;
  readonly loginUrl: string;
}

export interface LandlordOnboardingMagicLinkEmailParameters {
  readonly recipientEmail: string;
  readonly landlordName: string;
  readonly onboardingUrl: string;
  readonly expiresAt: string;
}

// ---------------------------------------------------------------------------
// Tenant Welcome
// ---------------------------------------------------------------------------

/**
 * Sends a welcome email to a newly approved tenant with their credentials,
 * lease details, and optional signing link.
 */
export async function sendTenantWelcomeEmail(
  parameters: TenantWelcomeEmailParameters,
): Promise<void> {
  await sendTenantCredentials({
    to: parameters.recipientEmail,
    tenantName: parameters.tenantName,
    tempPassword: parameters.temporaryPassword,
    inviteUrl: parameters.inviteUrl,
    leaseDetails: parameters.leaseDetails
      ? {
          property_name: parameters.leaseDetails.propertyName,
          unit_name: parameters.leaseDetails.unitName,
          move_in_date: parameters.leaseDetails.moveInDate,
          monthly_rent: parameters.leaseDetails.monthlyRent,
        }
      : undefined,
    signingLink: parameters.signingLink,
  });
}

// ---------------------------------------------------------------------------
// Landlord Credentials Copy
// ---------------------------------------------------------------------------

/** Sends the landlord a backup copy of a tenant's credentials. */
export async function sendLandlordCredentialsCopyEmail(
  parameters: LandlordCredentialsCopyEmailParameters,
): Promise<void> {
  await sendLandlordCredentialsCopy({
    to: parameters.recipientEmail,
    landlordName: parameters.landlordName,
    tenantName: parameters.tenantName,
    tenantEmail: parameters.tenantEmail,
    tempPassword: parameters.temporaryPassword,
    inviteUrl: parameters.inviteUrl,
  });
}

// ---------------------------------------------------------------------------
// Lease Signing Request
// ---------------------------------------------------------------------------

/** Sends a lease signing request email to a tenant with property details and a signing link. */
export async function sendLeaseSigningRequestEmail(
  parameters: LeaseSigningRequestEmailParameters,
): Promise<void> {
  await sendSigningLinkEmail({
    to: parameters.recipientEmail,
    tenantName: parameters.tenantName,
    signingUrl: parameters.signingUrl,
    propertyName: parameters.propertyName,
    unitName: parameters.unitName,
    rentAmount: parameters.rentAmount,
    depositAmount: parameters.depositAmount,
    landlordName: parameters.landlordName,
    landlordEmail: parameters.landlordEmail,
    expiresAt: parameters.expiresAt,
  });
}

// ---------------------------------------------------------------------------
// Tenant Signed Notification (Landlord)
// ---------------------------------------------------------------------------

/** Notifies the landlord that a tenant has signed their lease. */
export async function sendTenantSignedNotificationEmail(
  parameters: TenantSignedNotificationEmailParameters,
): Promise<void> {
  await sendTenantSignedNotification({
    to: parameters.recipientEmail,
    landlordName: parameters.landlordName,
    tenantName: parameters.tenantName,
    leaseId: parameters.leaseId,
    signingUrl: parameters.signingUrl,
  });
}

// ---------------------------------------------------------------------------
// Lease Activated
// ---------------------------------------------------------------------------

/** Notifies the tenant that their lease is fully active. */
export async function sendLeaseActivatedNotificationEmail(
  parameters: LeaseActivatedNotificationEmailParameters,
): Promise<void> {
  await sendLeaseActivatedNotification({
    to: parameters.recipientEmail,
    tenantName: parameters.tenantName,
    propertyName: parameters.propertyName,
    unitName: parameters.unitName,
    moveInDate: parameters.moveInDate,
  });
}

// ---------------------------------------------------------------------------
// Onboarding Reminder
// ---------------------------------------------------------------------------

/** Sends a reminder to a tenant to complete their onboarding. */
export async function sendTenantOnboardingReminderEmail(
  parameters: TenantOnboardingReminderEmailParameters,
): Promise<void> {
  await sendTenantOnboardingReminder({
    to: parameters.recipientEmail,
    tenantName: parameters.tenantName,
    onboardingUrl: parameters.onboardingUrl,
    tempPassword: parameters.temporaryPassword,
    inviteUrl: parameters.inviteUrl,
  });
}

// ---------------------------------------------------------------------------
// Prospect Payment Request
// ---------------------------------------------------------------------------

/** Sends a payment portal link to a prospect for move-in payment verification. */
export async function sendProspectPaymentRequestEmail(
  parameters: ProspectPaymentRequestEmailParameters,
): Promise<void> {
  await sendProspectPaymentRequestEmailImpl({
    to: parameters.recipientEmail,
    applicantName: parameters.applicantName,
    propertyName: parameters.propertyName,
    unitName: parameters.unitName,
    paymentPortalUrl: parameters.paymentPortalUrl,
    expiresAt: parameters.expiresAt,
    advanceAmount: parameters.advanceAmount,
    securityAmount: parameters.securityAmount,
  });
}

// ---------------------------------------------------------------------------
// Registration OTP
// ---------------------------------------------------------------------------

/** Sends a registration OTP verification code to a landlord applicant. */
export async function sendRegistrationOtpEmail(
  parameters: RegistrationOtpEmailParameters,
): Promise<void> {
  await sendRegistrationOTP({
    to: parameters.recipientEmail,
    otp: parameters.otpCode,
  });
}

// ---------------------------------------------------------------------------
// Landlord Registration Approved
// ---------------------------------------------------------------------------

/** Notifies a landlord that their registration has been approved. */
export async function sendLandlordRegistrationApprovedEmail(
  parameters: LandlordRegistrationApprovedEmailParameters,
): Promise<void> {
  await sendLandlordRegistrationApproved({
    to: parameters.recipientEmail,
    landlordName: parameters.landlordName,
    loginUrl: parameters.loginUrl,
  });
}

// ---------------------------------------------------------------------------
// Onboarding Magic Link
// ---------------------------------------------------------------------------

/** Sends a magic link for landlord onboarding setup. */
export async function sendLandlordOnboardingMagicLinkEmail(
  parameters: LandlordOnboardingMagicLinkEmailParameters,
): Promise<void> {
  await sendLandlordOnboardingMagicLink({
    to: parameters.recipientEmail,
    landlordName: parameters.landlordName,
    onboardingUrl: parameters.onboardingUrl,
    expiresAt: parameters.expiresAt,
  });
}