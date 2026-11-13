import { getAppBaseUrl } from "@/lib/app-url";
import { captureEmailPreview } from "@/lib/email/preview-store";
import {
    sendApplicationReceivedEmail,
    sendApplicationRejectedEmail,
    sendEmailVerificationOTP,
    sendLandlordCredentialsCopy,
    sendLandlordOnboardingMagicLink,
    sendLandlordRegistrationApproved,
    sendLeaseActivatedNotification,
    sendNewApplicationReceivedEmail,
    sendPasswordResetConfirmationEmail,
    sendPasswordResetEmail,
    sendPasswordResetOtpEmail,
    sendPaymentProofSubmittedEmail,
    sendPaymentReviewResolutionEmail,
    sendProspectPaymentRequestEmail,
    sendRegistrationOTP,
    sendSigningLinkEmail,
    sendTenantCredentials,
    sendTenantOnboardingReminder,
    sendTenantSignedNotification,
    sendTwoFactorOTP,
    sendUnitOnHoldStatusEmail,
    sendUnitReassignedRecommendationEmail,
} from "@/lib/email";

export type SampleEmailCategory =
    | "Onboarding & Accounts"
    | "Leases & E-Sign"
    | "Applications & Units"
    | "Payments & Billing"
    | "Security & Auth";

export interface SampleEmailDef {
    id: string;
    category: SampleEmailCategory;
    title: string;
    recipientRole: "Tenant" | "Landlord" | "Applicant" | "User";
    trigger: string;
    render: (recipientEmail: string, baseUrl: string) => Promise<unknown>;
}

export const SAMPLE_EMAILS: SampleEmailDef[] = [
    // --- Onboarding & Accounts ---
    {
        id: "tenant-credentials",
        category: "Onboarding & Accounts",
        title: "Tenant Account & Credentials",
        recipientRole: "Tenant",
        trigger: "Sent when a landlord creates or activates a tenant account with temporary credentials and lease details.",
        render: (to, baseUrl) =>
            sendTenantCredentials({
                to,
                tenantName: "Maria Angelica Santos",
                tempPassword: "Defense2026!",
                inviteUrl: `${baseUrl}/login`,
                leaseDetails: {
                    property_name: "Fernando Gonzales Dormitory",
                    unit_name: "Room 101",
                    move_in_date: "2026-11-01",
                    monthly_rent: 4500,
                },
                signingLink: `${baseUrl}/signing/tenant/demo-lease-101`,
            }),
    },
    {
        id: "landlord-credentials-copy",
        category: "Onboarding & Accounts",
        title: "Landlord Copy of Tenant Credentials",
        recipientRole: "Landlord",
        trigger: "Sent to the landlord as a backup copy when a new tenant account is provisioned.",
        render: (to, baseUrl) =>
            sendLandlordCredentialsCopy({
                to,
                landlordName: "John Peter Gonzales",
                tenantName: "Katrina Mae Villanueva",
                tenantEmail: "katrina.villanueva@ireside.ph",
                tempPassword: "Defense2026!",
                inviteUrl: `${baseUrl}/login`,
            }),
    },
    {
        id: "tenant-onboarding-reminder",
        category: "Onboarding & Accounts",
        title: "Tenant Onboarding Reminder",
        recipientRole: "Tenant",
        trigger: "Sent when a landlord nudges an invited tenant who has not yet claimed their account.",
        render: (to, baseUrl) =>
            sendTenantOnboardingReminder({
                to,
                tenantName: "Mark Anthony Lim",
                onboardingUrl: `${baseUrl}/tenant/onboarding`,
                tempPassword: "Defense2026!",
                inviteUrl: `${baseUrl}/login`,
            }),
    },
    {
        id: "landlord-registration-approved",
        category: "Onboarding & Accounts",
        title: "Landlord Registration Approved",
        recipientRole: "Landlord",
        trigger: "Sent once a landlord registration is approved for full portal access.",
        render: (to, baseUrl) =>
            sendLandlordRegistrationApproved({
                to,
                landlordName: "Melanie Tolentino",
                loginUrl: `${baseUrl}/login`,
            }),
    },
    {
        id: "landlord-onboarding-magic-link",
        category: "Onboarding & Accounts",
        title: "Landlord Setup Magic Link",
        recipientRole: "Landlord",
        trigger: "Sent when an approved landlord receives a one-time link to complete initial workspace setup.",
        render: (to, baseUrl) =>
            sendLandlordOnboardingMagicLink({
                to,
                landlordName: "Arnold F. Ferrer",
                onboardingUrl: `${baseUrl}/setup`,
                expiresAt: "November 20, 2026 at 5:00 PM",
            }),
    },

    // --- Leases & E-Sign ---
    {
        id: "signing-link",
        category: "Leases & E-Sign",
        title: "Lease E-Signature Request",
        recipientRole: "Tenant",
        trigger: "Sent when the landlord generates a remote digital lease signing link for a tenant.",
        render: (to, baseUrl) =>
            sendSigningLinkEmail({
                to,
                tenantName: "Katrina Mae Villanueva",
                signingUrl: `${baseUrl}/signing/tenant/demo-lease-201`,
                propertyName: "Fernando Gonzales Dormitory",
                unitName: "Room 201",
                rentAmount: 4800,
                depositAmount: 4800,
                landlordName: "John Peter Gonzales",
                landlordEmail: "john.gonzales@ireside.ph",
                expiresAt: new Date("2026-11-30T23:59:59+08:00"),
            }),
    },
    {
        id: "tenant-signed-notification",
        category: "Leases & E-Sign",
        title: "Tenant Signed Lease (Landlord Alert)",
        recipientRole: "Landlord",
        trigger: "Sent to the landlord as soon as the tenant submits their electronic signature.",
        render: (to, baseUrl) =>
            sendTenantSignedNotification({
                to,
                landlordName: "John Peter Gonzales",
                tenantName: "Katrina Mae Villanueva",
                leaseId: "demo-lease-201",
                signingUrl: `${baseUrl}/landlord/leases`,
            }),
    },
    {
        id: "lease-activated",
        category: "Leases & E-Sign",
        title: "Lease Activated Confirmation",
        recipientRole: "Tenant",
        trigger: "Sent to the tenant after both parties have signed and the lease becomes active.",
        render: (to) =>
            sendLeaseActivatedNotification({
                to,
                tenantName: "Mark Anthony Lim",
                propertyName: "Fernando Gonzales Dormitory",
                unitName: "Room 301",
                moveInDate: "2026-10-10",
            }),
    },

    // --- Applications & Units ---
    {
        id: "application-received-applicant",
        category: "Applications & Units",
        title: "Application Received (Applicant Receipt)",
        recipientRole: "Applicant",
        trigger: "Sent to a prospective tenant right after submitting a rental application.",
        render: (to, baseUrl) =>
            sendApplicationReceivedEmail({
                to,
                applicantName: "Katrina Mae Villanueva",
                propertyName: "Fernando Gonzales Dormitory",
                unitName: "Room 201",
                referenceCode: "APP-FGD-2026-084",
                statusTrackerUrl: `${baseUrl}/apply/status`,
            }),
    },
    {
        id: "new-application-landlord",
        category: "Applications & Units",
        title: "New Rental Application (Landlord Alert)",
        recipientRole: "Landlord",
        trigger: "Sent to the landlord whenever a walk-in or online applicant submits a dossier.",
        render: (to, baseUrl) =>
            sendNewApplicationReceivedEmail({
                to,
                landlordName: "John Peter Gonzales",
                applicantName: "Nixon Sent Jr.",
                applicantEmail: "nixon.sent@ireside.ph",
                applicantPhone: "09182224401",
                propertyName: "Fernando Gonzales Dormitory",
                unitName: "Room 104",
                moveInDate: "2026-11-15",
                dossierUrl: `${baseUrl}/landlord/applications`,
            }),
    },
    {
        id: "application-rejected",
        category: "Applications & Units",
        title: "Application Update / Rejection Notice",
        recipientRole: "Applicant",
        trigger: "Sent when a landlord declines an application with an optional reason or resubmission link.",
        render: (to, baseUrl) =>
            sendApplicationRejectedEmail({
                to,
                applicantName: "Juan Dela Cruz",
                propertyName: "Fernando Gonzales Dormitory",
                unitName: "Room 103",
                rejectionReason: "Submitted valid ID photo was cropped; please upload a clear front-and-back copy.",
                resubmitUrl: `${baseUrl}/apply/fgd`,
                statusTrackerUrl: `${baseUrl}/apply/status`,
            }),
    },
    {
        id: "unit-reassigned-recommendation",
        category: "Applications & Units",
        title: "Unit Reassignment Offer",
        recipientRole: "Applicant",
        trigger: "Sent when a landlord recommends an alternative available unit to an applicant.",
        render: (to, baseUrl) =>
            sendUnitReassignedRecommendationEmail({
                to,
                applicantName: "Gian Carlo Quintano",
                propertyName: "Tolentino Apartments",
                previousUnitName: "Unit 101",
                newUnitName: "Unit 103",
                newMonthlyRent: 6500,
                landlordNote: "Unit 101 was just reserved, but Unit 103 on the same floor is ready for move-in.",
                offerResponseUrl: `${baseUrl}/applications/offer/demo-offer`,
                statusTrackerUrl: `${baseUrl}/apply/status`,
            }),
    },
    {
        id: "unit-on-hold-status",
        category: "Applications & Units",
        title: "Application Placed On Hold",
        recipientRole: "Applicant",
        trigger: "Sent when a unit is temporarily placed on hold while competing applications are reviewed.",
        render: (to, baseUrl) =>
            sendUnitOnHoldStatusEmail({
                to,
                applicantName: "Franchesca Faith De Guzman",
                propertyName: "Joven Boarding House",
                unitName: "Unit 101",
                holdNote: "Pending final move-out inspection of the outgoing resident this Friday.",
                statusTrackerUrl: `${baseUrl}/apply/status`,
            }),
    },

    // --- Payments & Billing ---
    {
        id: "prospect-payment-request",
        category: "Payments & Billing",
        title: "Move-In Settlement Payment Request",
        recipientRole: "Applicant",
        trigger: "Sent to an approved applicant with the breakdown of advance rent and security deposit.",
        render: (to, baseUrl) =>
            sendProspectPaymentRequestEmail({
                to,
                applicantName: "Katrina Mae Villanueva",
                propertyName: "Fernando Gonzales Dormitory",
                unitName: "Room 201",
                paymentPortalUrl: `${baseUrl}/apply/payments/demo-token`,
                expiresAt: new Date("2026-11-18T23:59:59+08:00"),
                advanceAmount: 4800,
                securityAmount: 4800,
                statusTrackerUrl: `${baseUrl}/apply/status`,
            }),
    },
    {
        id: "payment-proof-submitted",
        category: "Payments & Billing",
        title: "Payment Proof Submitted (Applicant Receipt)",
        recipientRole: "Applicant",
        trigger: "Sent to an applicant confirming their GCash/bank payment proof was received for review.",
        render: (to, baseUrl) =>
            sendPaymentProofSubmittedEmail({
                to,
                applicantName: "Joshua Miguel Dela Cruz",
                propertyName: "Fernando Gonzales Dormitory",
                unitName: "Room 102",
                formattedTotal: "₱6,125.00",
                method: "gcash",
                systemTransactionReference: "TXN-FGD-202611-0102",
                externalReference: "1023 4477 8812",
                reviewUrl: `${baseUrl}/landlord/invoices`,
            }),
    },
    {
        id: "payment-resolution-returned",
        category: "Payments & Billing",
        title: "Payment Proof Returned",
        recipientRole: "Applicant",
        trigger: "Sent when a landlord returns a payment proof (e.g., blurry receipt or wrong reference number).",
        render: (to, baseUrl) =>
            sendPaymentReviewResolutionEmail({
                to,
                applicantName: "Joshua Miguel Dela Cruz",
                propertyName: "Fernando Gonzales Dormitory",
                unitName: "Room 102",
                resolutionType: "returned",
                transactionReference: "TXN-FGD-202611-0102",
                amount: 6125,
                note: "The GCash reference number is cut off in the screenshot. Please re-upload the full receipt.",
                paymentPortalUrl: `${baseUrl}/tenant/payments`,
                statusTrackerUrl: `${baseUrl}/tenant/payments`,
            }),
    },
    {
        id: "payment-resolution-overpayment",
        category: "Payments & Billing",
        title: "Overpayment Refund Notice",
        recipientRole: "Applicant",
        trigger: "Sent when a landlord logs a refund for an overpaid move-in or rent settlement.",
        render: (to, baseUrl) =>
            sendPaymentReviewResolutionEmail({
                to,
                applicantName: "Estella Marie P. Dacara",
                propertyName: "Ferrer Apartment",
                unitName: "Unit 101",
                resolutionType: "overpayment_refunded",
                transactionReference: "TXN-FER-202611-0041",
                amount: 500,
                note: "Refunded ₱500.00 excess transfer via GCash.",
                statusTrackerUrl: `${baseUrl}/tenant/payments`,
            }),
    },
    {
        id: "payment-resolution-shortfall",
        category: "Payments & Billing",
        title: "Payment Shortfall Balance Request",
        recipientRole: "Applicant",
        trigger: "Sent when a submitted payment is less than the required amount and the remaining balance is requested.",
        render: (to, baseUrl) =>
            sendPaymentReviewResolutionEmail({
                to,
                applicantName: "Ronald Bautista",
                propertyName: "Fernando Gonzales Dormitory",
                unitName: "Room 202",
                resolutionType: "shortfall_requested",
                transactionReference: "TXN-FGD-202611-0088",
                amount: 1250,
                note: "Remaining utility balance for October sub-meter reading.",
                paymentPortalUrl: `${baseUrl}/tenant/payments`,
                statusTrackerUrl: `${baseUrl}/tenant/payments`,
            }),
    },

    // --- Security & Auth ---
    {
        id: "registration-otp",
        category: "Security & Auth",
        title: "Registration Verification OTP",
        recipientRole: "User",
        trigger: "Sent during new account signup to verify ownership of the email address.",
        render: (to) =>
            sendRegistrationOTP({
                to,
                otp: "482916",
            }),
    },
    {
        id: "two-factor-otp",
        category: "Security & Auth",
        title: "Two-Factor Authentication (2FA) OTP",
        recipientRole: "User",
        trigger: "Sent when 2FA is enabled on login or sensitive account actions.",
        render: (to) =>
            sendTwoFactorOTP({
                to,
                otp: "739204",
                action: "login",
            }),
    },
    {
        id: "email-verification-otp",
        category: "Security & Auth",
        title: "New Email Address Verification OTP",
        recipientRole: "Landlord",
        trigger: "Sent when a landlord links or updates their email address in Settings.",
        render: (to) =>
            sendEmailVerificationOTP({
                to,
                otp: "615830",
            }),
    },
    {
        id: "password-reset-link",
        category: "Security & Auth",
        title: "Password Reset Link",
        recipientRole: "User",
        trigger: "Sent when a user requests a password reset link from the login page.",
        render: (to, baseUrl) =>
            sendPasswordResetEmail({
                to,
                resetLink: `${baseUrl}/reset-password?token=demo-reset-token`,
                userName: "John Peter Gonzales",
            }),
    },
    {
        id: "password-reset-otp",
        category: "Security & Auth",
        title: "Password Reset OTP Code",
        recipientRole: "User",
        trigger: "Sent when a user requests a 6-digit verification code to reset their password.",
        render: (to) =>
            sendPasswordResetOtpEmail({
                to,
                otp: "904127",
                userName: "Melanie Tolentino",
            }),
    },
    {
        id: "password-reset-confirmation",
        category: "Security & Auth",
        title: "Password Changed Confirmation",
        recipientRole: "User",
        trigger: "Sent immediately after a user's password is updated as a security notice.",
        render: (to) =>
            sendPasswordResetConfirmationEmail({
                to,
                userName: "Shannea Joelle F. Joven",
            }),
    },
];

export async function renderSampleEmailById(id: string, recipientEmail = "demo.recipient@gmail.com") {
    const item = SAMPLE_EMAILS.find((e) => e.id === id);
    if (!item) return null;
    const baseUrl = getAppBaseUrl();
    const captured = await captureEmailPreview(() => item.render(recipientEmail, baseUrl));
    return {
        id: item.id,
        category: item.category,
        title: item.title,
        recipientRole: item.recipientRole,
        trigger: item.trigger,
        subject: captured?.subject ?? item.title,
        htmlBody: captured?.htmlBody ?? "",
        textBody: captured?.textBody ?? "",
    };
}
