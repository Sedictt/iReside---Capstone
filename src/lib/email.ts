"use server";

import { sendEmail } from "./email/transport";
import { getAppBaseUrl } from "./app-url";
import {
    esc,
    renderEmail,
    greeting,
    paragraph,
    muted,
    heading,
    eyebrow,
    card,
    detailList,
    keyValueRows,
    button,
    linkFallback,
    otpBox,
    credential,
    bulletList,
    divider,
    peso,
    longDate,
} from "./email/layout";
import { formatPhMobile } from "@/lib/phone";
import { paymentMethodLabel } from "@/lib/billing/payment-methods";

export async function sendTenantCredentials({
    to,
    tenantName,
    tempPassword,
    inviteUrl,
    leaseDetails,
    signingLink,
}: {
    to: string;
    tenantName: string;
    tempPassword: string;
    inviteUrl?: string | null;
    leaseDetails?: {
        property_name: string;
        unit_name: string;
        move_in_date: string;
        monthly_rent: number;
    };
    signingLink?: string;
}) {
    const subject = "Welcome to iReside — Your Account is Ready";

    const leaseBlock = leaseDetails
        ? card(
              detailList(
                  [
                      { label: "Property", value: leaseDetails.property_name },
                      { label: "Unit", value: leaseDetails.unit_name },
                      { label: "Move-in Date", value: longDate(leaseDetails.move_in_date) },
                      { label: "Monthly Rent", value: peso(leaseDetails.monthly_rent) },
                  ],
                  { title: "Your Lease Details" },
              ),
          )
        : "";

    const signingBlock = signingLink
        ? card(
              `<p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1e1b4b;">Sign Your Lease Agreement</p>
               ${paragraph("Your lease is ready for your signature. Please review and sign the agreement to complete your onboarding.", { marginBottom: 20 })}
               ${button(signingLink, "Sign Lease Agreement →", { center: true, marginBottom: 0 })}`,
              { tone: "brand", center: true, padding: 24 },
          )
        : "";

    const inviteBlock = inviteUrl
        ? `${button(inviteUrl, "Set Your Password →", { tone: "dark" })}${linkFallback(inviteUrl, "Or copy this link:")}`
        : "";

    const html = renderEmail({
        title: subject,
        preheader: "Your application was approved. Here are your tenant portal credentials.",
        header: { eyebrow: "Tenant Portal Access" },
        body: `
            ${greeting(tenantName)}
            ${paragraph("Your application has been approved. Your iReside tenant account is ready — use the credentials below to sign in.")}
            ${leaseBlock}
            ${signingBlock}
            ${card(`${credential("Email", to)}${credential("Temporary Password", tempPassword, { large: true, last: true })}`)}
            ${inviteBlock}
            ${muted("Please change your password after your first login. If you did not expect this email, you can safely ignore it.")}
        `,
    });

    const text = `Hi ${tenantName},\n\nYour iReside tenant account is ready.\n\n${leaseDetails ? `LEASE DETAILS:\nProperty: ${leaseDetails.property_name}\nUnit: ${leaseDetails.unit_name}\nMove-in Date: ${new Date(leaseDetails.move_in_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\nMonthly Rent: ₱${leaseDetails.monthly_rent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n` : ""}${signingLink ? `SIGN YOUR LEASE:\n${signingLink}\n\n` : ""}LOGIN CREDENTIALS:\nEmail: ${to}\nTemporary Password: ${tempPassword}\n${inviteUrl ? `\nSet your password: ${inviteUrl}\n` : ""}\nPlease change your password after first login.\n\n— iReside`;

    await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendLandlordCredentialsCopy({
    to,
    landlordName,
    tenantName,
    tenantEmail,
    tempPassword,
    inviteUrl,
}: {
    to: string;
    landlordName: string;
    tenantName: string;
    tenantEmail: string;
    tempPassword: string;
    inviteUrl?: string | null;
}) {
    const subject = `Tenant Account Created — ${tenantName}`;

    const html = renderEmail({
        title: subject,
        preheader: `Backup credentials for ${tenantName}'s tenant account.`,
        header: { eyebrow: "Landlord Copy", tone: "neutral" },
        body: `
            ${greeting(landlordName)}
            ${paragraph(`A tenant account has been created for <strong style="color:#0f172a;">${esc(tenantName)}</strong>. Keep these credentials as a backup in case the tenant did not receive their email.`)}
            ${card(`${credential("Tenant Email", tenantEmail)}${credential("Temporary Password", tempPassword, { large: true, last: true })}`)}
            ${inviteUrl ? linkFallback(inviteUrl, "Password reset link:") : ""}
            ${muted("Share these credentials with the tenant only if they did not receive their welcome email.")}
        `,
    });

    const text = `Hi ${landlordName},\n\nTenant account created for ${tenantName}.\n\nEmail: ${tenantEmail}\nTemp Password: ${tempPassword}\n${inviteUrl ? `Reset link: ${inviteUrl}\n` : ""}\n— iReside`;

    await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendSigningLinkEmail({
    to,
    tenantName,
    signingUrl,
    propertyName,
    unitName,
    rentAmount,
    depositAmount,
    landlordName,
    landlordEmail,
    expiresAt,
}: {
    to: string;
    tenantName: string;
    signingUrl: string;
    propertyName: string;
    unitName: string;
    rentAmount: number;
    depositAmount: number;
    landlordName: string;
    landlordEmail: string;
    expiresAt: Date;
}) {
    const subject = "Your Lease Agreement is Ready for Signature";

    const html = renderEmail({
        title: subject,
        preheader: `Review and sign your lease for ${propertyName} (${unitName}).`,
        header: { eyebrow: "Lease Agreement" },
        body: `
            ${greeting(tenantName)}
            ${paragraph("Congratulations! Your lease application has been approved. Your lease agreement is ready for your signature. Please review and sign to complete your rental agreement.")}
            ${card(
                detailList(
                    [
                        { label: "Property", value: propertyName },
                        { label: "Unit", value: unitName },
                        { label: "Monthly Rent", value: peso(rentAmount) },
                        { label: "Security Deposit", value: peso(depositAmount) },
                    ],
                    { title: "Property Details" },
                ),
            )}
            ${card(
                `<p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1e1b4b;">Review and Sign Your Lease</p>
                 ${paragraph("Please review the full lease agreement and provide your electronic signature to complete the rental process.", { marginBottom: 20 })}
                 ${button(signingUrl, "Sign Lease Agreement →", { center: true, marginBottom: 0 })}`,
                { tone: "brand", center: true, padding: 24 },
            )}
            ${linkFallback(signingUrl, "Or copy this link:")}
            ${card(
                `${eyebrow("Link Expires")}
                 <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">${esc(longDate(expiresAt))}</p>
                 ${muted("Please sign before this date to avoid expiration.")}`,
            )}
            ${card(
                `${eyebrow("Landlord Contact")}
                 <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#0f172a;">${esc(landlordName)}</p>
                 <p style="margin:0;font-size:13px;color:#52525b;word-break:break-all;">${esc(landlordEmail)}</p>`,
            )}
            ${muted("If you have any questions about the lease terms, please contact your landlord directly. This signing link is unique to you and should not be shared.")}
        `,
    });

    const text = `Hi ${tenantName},\n\nYour lease application has been approved! Your lease agreement is ready for signature.\n\nPROPERTY DETAILS:\nProperty: ${propertyName}\nUnit: ${unitName}\nMonthly Rent: ₱${rentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nSecurity Deposit: ₱${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nSIGN LEASE AGREEMENT:\n${signingUrl}\n\nLink expires: ${expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\nLANDLORD CONTACT:\n${landlordName}\n${landlordEmail}\n\n— iReside`;

    await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendTenantSignedNotification({
    to,
    landlordName,
    tenantName,
    leaseId,
    signingUrl,
}: {
    to: string;
    landlordName: string;
    tenantName: string;
    leaseId: string;
    signingUrl?: string;
}) {
    const subject = `Tenant Signed Lease — ${tenantName}`;

    const actionBlock = signingUrl
        ? card(
              `<p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1e1b4b;">Countersign the Lease</p>
               ${paragraph("The tenant has completed their portion. Use the button below to review and provide your signature.", { marginBottom: 20 })}
               ${button(signingUrl, "Countersign Lease →", { center: true, marginBottom: 0 })}`,
              { tone: "brand", center: true, padding: 24 },
          ) + linkFallback(signingUrl, "Or copy this link:")
        : muted("Log in to your landlord dashboard to countersign the lease.");

    const html = renderEmail({
        title: subject,
        preheader: `${tenantName} has signed. Countersign to activate the lease.`,
        header: { eyebrow: "Lease Update", tone: "neutral" },
        body: `
            ${greeting(landlordName)}
            ${paragraph(`<strong style="color:#0f172a;">${esc(tenantName)}</strong> has signed their lease agreement. Please review and countersign to activate the lease.`)}
            ${card(credential("Lease ID", leaseId, { last: true }))}
            ${actionBlock}
        `,
    });

    const text = `Hi ${landlordName},\n\n${tenantName} has signed their lease agreement.\n\nLease ID: ${leaseId}\n\n${signingUrl ? `Countersign here: ${signingUrl}` : 'Log in to your landlord dashboard to countersign the lease.'}\n\n— iReside`;

    await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendLeaseActivatedNotification({
    to,
    tenantName,
    propertyName,
    unitName,
    moveInDate,
}: {
    to: string;
    tenantName: string;
    propertyName: string;
    unitName: string;
    moveInDate: string;
}) {
    const subject = "Your Lease is Now Active";

    const html = renderEmail({
        title: subject,
        preheader: `Welcome home! Your lease for ${propertyName} (${unitName}) is active.`,
        header: { eyebrow: "Lease Activated" },
        body: `
            ${greeting(tenantName)}
            ${paragraph("Great news! Your lease agreement has been fully signed and is now active. Welcome to your new home!")}
            ${card(
                detailList(
                    [
                        { label: "Property", value: propertyName },
                        { label: "Unit", value: unitName },
                        { label: "Move-in Date", value: longDate(moveInDate) },
                    ],
                    { title: "Your Lease Details" },
                ),
            )}
            ${muted("You can now access your tenant portal to view payments, submit maintenance requests, and communicate with your landlord.")}
        `,
    });

    const text = `Hi ${tenantName},\n\nYour lease agreement has been fully signed and is now active!\n\nPROPERTY DETAILS:\nProperty: ${propertyName}\nUnit: ${unitName}\nMove-in Date: ${new Date(moveInDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\nWelcome to your new home! You can now access your tenant portal to manage your lease.\n\n— iReside`;

    await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendTenantOnboardingReminder({
    to,
    tenantName,
    onboardingUrl,
    tempPassword,
    inviteUrl,
}: {
    to: string;
    tenantName: string;
    onboardingUrl: string;
    tempPassword?: string | null;
    inviteUrl?: string | null;
}) {
    const subject = "Continue your iReside onboarding";

    const html = renderEmail({
        title: subject,
        preheader: "Your tenant account is ready, but onboarding is still incomplete.",
        header: { eyebrow: "Onboarding Reminder" },
        body: `
            ${greeting(tenantName)}
            ${paragraph("Your tenant account is ready, but onboarding is still incomplete. Please continue onboarding to unlock your full tenant portal access.", { marginBottom: 20 })}
            ${tempPassword ? card(credential("Temporary Password", tempPassword, { large: true, last: true }), { marginBottom: 20 }) : ""}
            ${card(
                `${button(onboardingUrl, "Continue Onboarding", { center: true, marginBottom: inviteUrl ? 16 : 0 })}
                 ${inviteUrl ? muted(`Set or reset your password:<br><a href="${esc(inviteUrl)}" target="_blank" rel="noopener noreferrer" style="color:#7c3aed;word-break:break-all;">${esc(inviteUrl)}</a>`, { center: true }) : ""}`,
                { center: true, padding: 24 },
            )}
            ${linkFallback(onboardingUrl, "Or copy this link:")}
        `,
    });

    const text = `Hi ${tenantName},

Your tenant account is ready, but onboarding is still incomplete.
Continue here: ${onboardingUrl}
${tempPassword ? `Temporary password: ${tempPassword}\n` : ""}${inviteUrl ? `Password setup link: ${inviteUrl}\n` : ""}
— iReside`;

    await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendProspectPaymentRequestEmail({
    to,
    applicantName,
    propertyName,
    unitName,
    paymentPortalUrl,
    expiresAt,
    advanceAmount,
    securityAmount,
}: {
    to: string;
    applicantName: string;
    propertyName: string;
    unitName: string;
    paymentPortalUrl: string;
    expiresAt: Date;
    advanceAmount: number;
    securityAmount: number;
}) {
    const subject = `Action Required: Submit Move-in Payment (${propertyName} - ${unitName})`;
    const expiresLabel = expiresAt.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });

    const html = renderEmail({
        title: "Action Required: Submit Move-in Payment",
        preheader: `Your application for ${propertyName} - ${unitName} passed review. Submit your move-in payment to continue.`,
        header: { eyebrow: "Payment Confirmation Step" },
        body: `
            ${greeting(applicantName)}
            ${paragraph(`Your application for <strong style="color:#0f172a;">${esc(propertyName)} - ${esc(unitName)}</strong> has passed review. To continue, please submit move-in payment details for verification.`, { marginBottom: 18 })}
            ${card(
                `${eyebrow("Required Amounts", "#7c3aed")}
                 <div style="height:4px;line-height:4px;font-size:4px;">&nbsp;</div>
                 ${keyValueRows([
                     { label: "Advance Rent", value: `PHP ${advanceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                     { label: "Security Deposit", value: `PHP ${securityAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                 ])}`,
                { marginBottom: 20, padding: 18 },
            )}
            ${button(paymentPortalUrl, "Open Payment Portal →", { center: true, marginBottom: 16 })}
            ${linkFallback(paymentPortalUrl, "Or click or copy this direct link:")}
            ${muted(`This secure link expires on <strong style="color:#0f172a;">${esc(expiresLabel)}</strong>.`, { marginBottom: 10 })}
            ${muted("We will only finalize approval after both required payments are landlord-confirmed.")}
        `,
    });

    const text = `Hi ${applicantName},

Your application for ${propertyName} - ${unitName} passed review.

Submit your payment details here:
${paymentPortalUrl}

Required amounts:
- Advance Rent: PHP ${advanceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Security Deposit: PHP ${securityAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Link expires on: ${expiresLabel}

We will only finalize approval after both payments are landlord-confirmed.
`;

    return await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendRegistrationOTP({
    to,
    otp,
}: {
    to: string;
    otp: string;
}) {
    const subject = `${otp} is your iReside verification code`;

    const html = renderEmail({
        title: "Verify your email",
        preheader: `${otp} is your iReside verification code. It expires in 10 minutes.`,
        header: { align: "center" },
        width: 480,
        body: `
            ${heading("Verify your email", { center: true })}
            <p style="margin:0 0 28px;color:#52525b;font-size:14px;line-height:1.6;text-align:center;">Use the verification code below to continue your landlord registration.</p>
            ${otpBox(otp)}
            ${muted("This code will expire in 10 minutes. If you did not request this code, please ignore this email.", { center: true })}
        `,
    });

    const text = `Your iReside verification code is: ${otp}\n\nThis code expires in 10 minutes.`;

    await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendTwoFactorOTP({
    to,
    otp,
    action = "login",
}: {
    to: string;
    otp: string;
    action?: "login" | "enable" | "verification";
}) {
    const subject = `${otp} is your iReside two-factor verification code`;

    const title = action === "enable"
        ? "Enable Two-Factor Authentication"
        : action === "login"
        ? "Two-Factor Authentication Sign-In"
        : "Two-Factor Security Verification";

    const description = action === "enable"
        ? "Use the verification code below to enable Two-Factor Authentication on your iReside account."
        : action === "login"
        ? "Use the verification code below to complete your sign-in to your iReside account."
        : "Use the verification code below to verify your identity for Two-Factor Authentication.";

    const html = renderEmail({
        title,
        preheader: `${otp} is your two-factor code. It expires in 5 minutes.`,
        header: { eyebrow: "Two-Factor Authentication", align: "center" },
        width: 480,
        body: `
            ${heading(title, { center: true })}
            <p style="margin:0 0 28px;color:#52525b;font-size:14px;line-height:1.6;text-align:center;">${esc(description)}</p>
            ${otpBox(otp)}
            ${muted("This code will expire in 5 minutes. If you did not request this code, please secure your account credentials immediately.", { center: true })}
        `,
    });

    const text = `${title}\n\n${description}\n\nVerification Code: ${otp}\n\nThis code will expire in 5 minutes. If you did not request this code, please secure your account credentials immediately.\n\n© ${new Date().getFullYear()} iReside Property Management`;

    return await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendEmailVerificationOTP({
    to,
    otp,
}: {
    to: string;
    otp: string;
}) {
    const subject = `${otp} is your iReside email verification code`;

    const html = renderEmail({
        title: "Verify your new email address",
        preheader: `${otp} is your email verification code. It expires in 10 minutes.`,
        header: { align: "center" },
        width: 480,
        body: `
            ${heading("Verify Your New Email", { center: true })}
            <p style="margin:0 0 28px;color:#52525b;font-size:14px;line-height:1.6;text-align:center;">Use the single-use verification code below to verify and link your new email address to your iReside landlord account.</p>
            ${otpBox(otp)}
            ${muted("This code expires in 10 minutes. If you did not request to link this email address, you can safely ignore this message.", { center: true })}
        `,
    });

    const text = `Your iReside email verification code is: ${otp}\n\nThis code expires in 10 minutes.`;

    await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendLandlordRegistrationApproved({
    to,
    landlordName,
    loginUrl,
}: {
    to: string;
    landlordName: string;
    loginUrl: string;
}) {
    const subject = "Your Landlord Registration is Approved — You can now access iReside";

    const html = renderEmail({
        title: "Landlord Access Approved",
        preheader: "Your landlord registration has been approved. Sign in to start managing your properties.",
        header: { eyebrow: "Landlord Access Approved" },
        body: `
            ${greeting(landlordName)}
            ${paragraph("Great news! Your landlord registration has been approved. You now have full access to the iReside landlord portal.")}
            ${card(
                `<p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#1e1b4b;">Start Managing Your Properties</p>
                 ${button(loginUrl, "Go to Landlord Dashboard →", { center: true, marginBottom: 0 })}`,
                { tone: "brand", center: true, padding: 24 },
            )}
            ${card(
                `${eyebrow("What you can do now", "#7c3aed")}
                 <div style="height:6px;line-height:6px;font-size:6px;">&nbsp;</div>
                 ${bulletList([
                     "Add and manage your properties",
                     "Create units and list them for rent",
                     "Invite tenants and process applications",
                     "Track payments and generate invoices",
                     "Handle maintenance requests",
                 ])}`,
            )}
            ${muted("Log in with the credentials you created during registration. If you need help getting started, check out our landlord guide in the dashboard.")}
        `,
    });

    const text = `Hi ${landlordName},

Your landlord registration has been approved! You now have full access to the iReside landlord portal.

LOG IN:
${loginUrl}

What you can do now:
- Add and manage your properties
- Create units and list them for rent
- Invite tenants and process applications
- Track payments and generate invoices
- Handle maintenance requests

Log in with the credentials you created during registration.

— iReside`;

    await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendLandlordOnboardingMagicLink({
    to,
    landlordName,
    onboardingUrl,
    expiresAt,
}: {
    to: string;
    landlordName: string;
    onboardingUrl: string;
    expiresAt: string;
}) {
    const subject = "Complete Your Landlord Setup — Action Required";

    const html = renderEmail({
        title: "Complete Your Landlord Setup",
        preheader: `Your registration is approved. Complete setup before ${expiresAt}.`,
        header: { eyebrow: "Complete Your Setup" },
        body: `
            ${greeting(landlordName)}
            ${paragraph("Great news! Your landlord registration has been approved. To access your landlord dashboard, you need to complete a quick setup process.")}
            ${card(
                `<p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#1e1b4b;">Set Up Your Account</p>
                 ${button(onboardingUrl, "Complete Setup →", { center: true, marginBottom: 0 })}`,
                { tone: "brand", center: true, padding: 24 },
            )}
            ${linkFallback(onboardingUrl, "Or copy this link:")}
            ${card(
                `${eyebrow("Link Expires")}
                 <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">${esc(expiresAt)}</p>
                 ${muted("Please complete your setup before the link expires.")}`,
            )}
            ${card(
                `${eyebrow("What you'll do", "#7c3aed")}
                 <div style="height:6px;line-height:6px;font-size:6px;">&nbsp;</div>
                 ${bulletList([
                     "Create your account password",
                     "Verify your property details",
                     "Configure billing settings",
                     "Set up your profile",
                 ])}`,
            )}
            ${muted("If you didn't expect this email or have questions, please contact support.")}
        `,
    });

    const text = `Hi ${landlordName},

Your landlord registration has been approved! Complete your setup to access your landlord dashboard.

SETUP LINK:
${onboardingUrl}

The link expires: ${expiresAt}

What you'll do:
- Create your account password
- Verify your property details
- Configure billing settings
- Set up your profile

Complete your setup before the link expires.

— iReside`;

    await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendPasswordResetEmail({
    to,
    resetLink,
    userName,
}: {
    to: string;
    resetLink: string;
    userName?: string;
}) {
    const subject = "Reset your iReside password";
    const greetingText = userName?.trim() ? `Hi ${userName.trim()},` : "Hello,";

    const html = renderEmail({
        title: subject,
        preheader: "We received a request to reset your password. This link expires in 1 hour.",
        header: { eyebrow: "Password Reset", tone: "neutral" },
        width: 520,
        footer: `© ${new Date().getFullYear()} iReside. All rights reserved.`,
        body: `
            ${greeting(userName)}
            ${paragraph("We received a request to reset the password for your account. Click the button below to choose a new password:")}
            ${button(resetLink, "Reset password", { tone: "dark", marginBottom: 28 })}
            <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#71717a;">This link will expire in 1 hour. If you didn't ask to reset your password, you can safely ignore this email.</p>
            ${divider()}
            ${linkFallback(resetLink)}
        `,
    });

    const text = `${greetingText}

We received a request to reset the password for your iReside account.

Reset link (expires in 1 hour):
${resetLink}

If you didn't request a password reset, you can safely ignore this email.

— iReside`;

    await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendPasswordResetOtpEmail({
    to,
    otp,
    userName,
}: {
    to: string;
    otp: string;
    userName?: string;
}) {
    const subject = `${otp} is your iReside reset code`;
    const greetingText = userName?.trim() ? `Hi ${userName.trim()},` : "Hello,";
    const formattedOtp = otp.length === 6 ? `${otp.slice(0, 3)} ${otp.slice(3)}` : otp;

    const html = renderEmail({
        title: "Your iReside verification code",
        preheader: `${formattedOtp} is your password reset code. It expires in 10 minutes.`,
        header: { eyebrow: "Password Reset", tone: "neutral" },
        width: 480,
        footer: `© ${new Date().getFullYear()} iReside. All rights reserved.`,
        body: `
            ${greeting(userName)}
            ${paragraph("Enter the verification code below to reset your password:")}
            ${otpBox(formattedOtp)}
            <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#71717a;">This code expires in <strong>10 minutes</strong> and can only be used once.</p>
            ${divider()}
            ${muted("If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.")}
        `,
    });

    const text = `${greetingText}

Your password reset verification code is:

${formattedOtp}

This code expires in 10 minutes.

If you didn't request this code, you can safely ignore this message.

— iReside`;

    await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendPasswordResetConfirmationEmail({
    to,
    userName,
}: {
    to: string;
    userName?: string;
}) {
    const subject = "Your iReside password was successfully changed";
    const greetingText = userName?.trim() ? `Hi ${userName.trim()},` : "Hello,";
    const formattedDate = new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    });

    const resetUrl = `${getAppBaseUrl()}/forgot-password?email=${encodeURIComponent(to)}`;

    const html = renderEmail({
        title: "Your password was changed",
        preheader: `Your iReside password was updated on ${formattedDate}.`,
        header: { eyebrow: "Security Notice", tone: "neutral" },
        width: 480,
        footer: `© ${new Date().getFullYear()} iReside. All rights reserved.`,
        body: `
            ${greeting(userName)}
            ${paragraph(`The password for your iReside account was successfully updated on <strong>${esc(formattedDate)}</strong>.`, { marginBottom: 20 })}
            ${card(
                `<p style="margin:0;font-size:13px;line-height:1.5;color:#18181b;"><strong>Did you make this change?</strong><br>
                 <span style="color:#71717a;">If so, no further action is needed and you can safely sign in with your new password.</span></p>`,
                { marginBottom: 20, padding: 16 },
            )}
            ${card(
                `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#991b1b;font-weight:700;">Is this not you?</p>
                 <p style="margin:0 0 14px;font-size:12px;line-height:1.5;color:#7f1d1d;">If you did not perform this update, someone else may have gained unauthorized access to your credentials. Reset your password immediately to secure your account.</p>
                 ${button(resetUrl, "Reset Password Now →", { tone: "danger", small: true, marginBottom: 0 })}`,
                { tone: "danger", marginBottom: 0, padding: 16 },
            )}
        `,
    });

    const text = `${greetingText}

The password for your iReside account was successfully updated on ${formattedDate}.

If you made this change, no further action is needed.

IS THIS NOT YOU?
If you did not make this change, please reset your password immediately:
${resetUrl}

— iReside Security`;

    await sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendApplicationRejectedEmail({
    to,
    applicantName,
    propertyName,
    unitName,
    rejectionReason,
    resubmitUrl,
}: {
    to: string;
    applicantName: string;
    propertyName: string;
    unitName?: string | null;
    rejectionReason: string;
    resubmitUrl?: string | null;
}) {
    const subject = `Application Status Update — ${propertyName}${unitName ? ` (${unitName})` : ""}`;
    const cleanUnit = unitName ? ` (${unitName})` : "";

    const html = renderEmail({
        title: "Application Status Update",
        preheader: `An update on your application for ${propertyName}${cleanUnit}.`,
        header: { eyebrow: "Rental Application Status", tone: "danger" },
        width: 520,
        body: `
            ${greeting(applicantName)}
            ${paragraph(`Thank you for your interest in leasing at <strong>${esc(propertyName)}${esc(cleanUnit)}</strong>. The property manager has reviewed your application and regrettably was unable to approve it at this time.`, { marginBottom: 20 })}
            ${card(
                `${eyebrow("Reason from Landlord", "#b91c1c")}
                 <p style="margin:0;font-size:14px;line-height:1.5;color:#7f1d1d;font-weight:600;">${esc(rejectionReason)}</p>`,
                { tone: "danger", padding: 16 },
            )}
            ${resubmitUrl ? card(
                `<p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0f172a;">Would you like to re-submit or apply again?</p>
                 <p style="margin:0 0 16px;font-size:12px;color:#475569;line-height:1.5;">You may update your details or apply for another available unit using the link below.</p>
                 ${button(resubmitUrl, "Submit New Application →", { center: true, marginBottom: 0 })}`,
                { center: true },
            ) : ""}
            ${muted("If you have questions regarding this decision, please reach out directly to the landlord or property management office.")}
        `,
    });

    const text = `Hi ${applicantName},

Thank you for your application for ${propertyName}${cleanUnit}. The property manager has reviewed your application and was unable to approve it at this time.

Reason: ${rejectionReason}
${resubmitUrl ? `\nIf you would like to submit a new application, you may do so here: ${resubmitUrl}` : ""}

— iReside Property Management`;

    return sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendPaymentReviewResolutionEmail({
    to,
    applicantName,
    propertyName,
    unitName,
    resolutionType,
    transactionReference,
    amount,
    note,
    proofUrl,
    paymentPortalUrl,
}: {
    to: string;
    applicantName: string;
    propertyName: string;
    unitName?: string | null;
    resolutionType: "returned" | "overpayment_refunded" | "shortfall_requested";
    transactionReference: string;
    amount?: number | null;
    note?: string | null;
    proofUrl?: string | null;
    paymentPortalUrl?: string | null;
}) {
    const cleanUnit = unitName ? ` (${unitName})` : "";
    const pesoFormat = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
    const formattedAmount = typeof amount === "number" ? pesoFormat.format(amount) : null;

    let subject = `Payment Update — ${propertyName}${cleanUnit}`;
    let title = "Payment Status Update";
    let message = `An update has been issued regarding your payment for ${propertyName}${cleanUnit}.`;
    let tone: "info" | "danger" | "success" | "warning" = "info";

    if (resolutionType === "returned") {
        subject = `Payment Returned — ${propertyName}${cleanUnit}`;
        title = "Payment Proof Returned";
        message = `Your payment of ${formattedAmount ?? "the submitted amount"} has been returned by your landlord.`;
        tone = "danger";
    } else if (resolutionType === "overpayment_refunded") {
        subject = `Overpayment Refund Issued — ${propertyName}${cleanUnit}`;
        title = "Overpayment Refund Issued";
        message = `Your payment was verified, and an excess refund of ${formattedAmount ?? "the overpaid amount"} has been returned.`;
        tone = "success";
    } else if (resolutionType === "shortfall_requested") {
        subject = `Remaining Balance Required — ${propertyName}${cleanUnit}`;
        title = "Additional Payment Required";
        message = `Your landlord verified your partial payment, but an outstanding balance of ${formattedAmount ?? "the remaining amount"} is still required.`;
        tone = "warning";
    }

    const rows: Array<{ label: string; value: string; mono?: boolean; accent?: boolean }> = [
        { label: "System Reference", value: transactionReference, mono: true, accent: true },
    ];
    if (formattedAmount) rows.push({ label: "Amount", value: formattedAmount });

    const html = renderEmail({
        title,
        preheader: message,
        header: { eyebrow: "Payment Reconciliation", tone },
        width: 520,
        body: `
            ${greeting(applicantName)}
            ${heading(title)}
            ${paragraph(esc(message), { marginBottom: 20 })}
            ${card(
                `${keyValueRows(rows)}
                 ${note ? `<div style="border-top:1px solid #e2e8f0;padding-top:10px;margin-top:10px;">
                   <span style="font-size:11px;color:#64748b;text-transform:uppercase;display:block;margin-bottom:4px;font-weight:600;letter-spacing:0.5px;">Landlord Note</span>
                   <span style="font-size:13px;color:#334155;line-height:1.5;">${esc(note)}</span>
                 </div>` : ""}`,
                { marginBottom: 20, padding: 18 },
            )}
            ${proofUrl ? card(
                `<p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0f172a;">Attached Refund / Return Receipt</p>
                 ${button(proofUrl, "View Receipt Proof →", { tone: "outline", small: true, center: true, marginBottom: 0 })}`,
                { center: true, padding: 16 },
            ) : ""}
            ${paymentPortalUrl ? button(paymentPortalUrl, "Open Payment Portal →", { center: true }) + linkFallback(paymentPortalUrl, "Or copy this link:") : ""}
            ${muted("If you have any questions, please contact your landlord or property administrator.")}
        `,
    });

    const text = `Hi ${applicantName},

${message}
System Reference: ${transactionReference}
${formattedAmount ? `Amount: ${formattedAmount}\n` : ""}${note ? `Note: ${note}\n` : ""}${proofUrl ? `Proof Receipt: ${proofUrl}\n` : ""}${paymentPortalUrl ? `Payment Portal: ${paymentPortalUrl}\n` : ""}
— iReside Property Management`;

    return sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendNewApplicationReceivedEmail({
    to,
    landlordName,
    applicantName,
    applicantEmail,
    applicantPhone,
    propertyName,
    unitName,
    moveInDate,
    dossierUrl,
}: {
    to: string;
    landlordName: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone?: string | null;
    propertyName: string;
    unitName?: string | null;
    moveInDate?: string | null;
    dossierUrl: string;
}) {
    const cleanUnit = unitName ? ` (${unitName})` : "";
    const subject = `New Application Received — ${propertyName}${cleanUnit}`;

    const rows: Array<{ label: string; value: string; accent?: boolean; strong?: boolean }> = [
        { label: "Applicant Name", value: applicantName },
        { label: "Email", value: applicantEmail, accent: true, strong: false },
    ];
    if (applicantPhone) rows.push({ label: "Phone", value: formatPhMobile(applicantPhone), strong: false });
    if (moveInDate) rows.push({ label: "Target Move-In", value: moveInDate, strong: false });
    rows.push({ label: "Property / Unit", value: `${propertyName}${cleanUnit}` });

    const html = renderEmail({
        title: "New Tenant Application",
        preheader: `${applicantName} applied for ${propertyName}${cleanUnit}.`,
        header: { eyebrow: "New Tenant Application" },
        width: 520,
        body: `
            ${greeting(landlordName)}
            ${paragraph(`You have received a new rental application for <strong>${esc(propertyName)}${esc(cleanUnit)}</strong>.`, { marginBottom: 20 })}
            ${card(keyValueRows(rows))}
            ${button(dossierUrl, "Review Application Dossier →", { center: true })}
            ${muted("You can approve, request payment, or decline this application with feedback directly from your landlord command center.")}
        `,
    });

    const text = `Hi ${landlordName},

You have received a new rental application for ${propertyName}${cleanUnit}.

Applicant: ${applicantName}
Email: ${applicantEmail}
${applicantPhone ? `Phone: ${formatPhMobile(applicantPhone)}\n` : ""}${moveInDate ? `Move-in Date: ${moveInDate}\n` : ""}
Review the application dossier here: ${dossierUrl}

— iReside Property Management`;

    return sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}

export async function sendPaymentProofSubmittedEmail({
    to,
    applicantName,
    propertyName,
    unitName,
    formattedTotal,
    method,
    systemTransactionReference,
    externalReference,
    reviewUrl,
}: {
    to: string;
    applicantName: string;
    propertyName: string;
    unitName: string;
    formattedTotal: string;
    method?: string | null;
    systemTransactionReference: string;
    externalReference?: string | null;
    reviewUrl?: string | null;
}) {
    const subject = `Payment Proof Submitted — ${propertyName} (${unitName})`;

    const methodLabel = method ? paymentMethodLabel(method) : null;
    // "GCash Ref" / "Bank Transfer Ref": the number from the tenant's app or deposit slip.
    const externalLabel = `${methodLabel && method !== "cash" ? methodLabel : "GCash"} Ref`;
    const rows: Array<{ label: string; value: string; mono?: boolean; accent?: boolean; strong?: boolean }> = [
        { label: "Txn Ref", value: systemTransactionReference, mono: true, accent: true },
    ];
    if (externalReference) rows.push({ label: externalLabel, value: externalReference, mono: true });
    if (methodLabel) rows.push({ label: "Method", value: methodLabel, strong: false });

    const html = renderEmail({
        title: "New Proof of Payment Received",
        preheader: `${applicantName} submitted ${formattedTotal} for ${propertyName} (${unitName}).`,
        header: { eyebrow: "Move-In Payment Verification" },
        width: 520,
        body: `
            ${heading("New Proof of Payment Received")}
            ${paragraph(`<strong>${esc(applicantName)}</strong> has submitted payment verification for <strong>${esc(propertyName)} (${esc(unitName)})</strong>.`, { marginBottom: 20 })}
            ${card(
                `${eyebrow("Total Amount")}
                 <p style="margin:0 0 14px;font-size:24px;line-height:1.2;font-weight:900;color:#7c3aed;">${esc(formattedTotal)}</p>
                 <div style="border-top:1px solid #e2e8f0;padding-top:12px;">${keyValueRows(rows)}</div>`,
                { marginBottom: 20, padding: 16 },
            )}
            ${reviewUrl ? button(reviewUrl, "Review Payment →", { center: true }) : ""}
            ${muted("Please review the submitted receipt in your Landlord Operations dashboard to confirm or decline the payment.")}
        `,
    });

    const text = `Payment proof submitted by ${applicantName} for ${propertyName} (${unitName}).\nTotal Amount: ${formattedTotal}\n${methodLabel ? `Method: ${methodLabel}\n` : ""}Txn Ref: ${systemTransactionReference}${externalReference ? `\n${externalLabel}: ${externalReference}` : ""}${reviewUrl ? `\n\nReview: ${reviewUrl}` : ""}\n\n— iReside Property Management`;

    return sendEmail({ recipientEmail: to, subject, htmlBody: html, textBody: text });
}
