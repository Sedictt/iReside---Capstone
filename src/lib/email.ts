import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM = process.env.SMTP_FROM ?? "iReside <noreply@ireside.app>";

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

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
    <div style="background:#6d9838;padding:24px 32px;">
      <h1 style="margin:0;color:#000;font-size:22px;font-weight:900;letter-spacing:-0.5px;">iReside</h1>
      <p style="margin:4px 0 0;color:#000;font-size:12px;font-weight:700;opacity:0.7;text-transform:uppercase;letter-spacing:2px;">Tenant Portal Access</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:16px;">Hi <strong>${tenantName}</strong>,</p>
      <p style="margin:0 0 24px;color:#a3a3a3;font-size:14px;line-height:1.6;">
        Your application has been approved. Your iReside tenant account is ready — use the credentials below to sign in.
      </p>

      ${leaseDetails ? `
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 16px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#6d9838;">Your Lease Details</p>
        <div style="margin-bottom:12px;">
          <p style="margin:0 0 4px;font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:1px;">Property</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${leaseDetails.property_name}</p>
        </div>
        <div style="margin-bottom:12px;">
          <p style="margin:0 0 4px;font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:1px;">Unit</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${leaseDetails.unit_name}</p>
        </div>
        <div style="margin-bottom:12px;">
          <p style="margin:0 0 4px;font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:1px;">Move-in Date</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${new Date(leaseDetails.move_in_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div>
          <p style="margin:0 0 4px;font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:1px;">Monthly Rent</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">₱${leaseDetails.monthly_rent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>
      ` : ""}

      ${signingLink ? `
      <div style="background:#1a1a1a;border:1px solid #6d9838;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#fff;">📝 Sign Your Lease Agreement</p>
        <p style="margin:0 0 20px;font-size:13px;color:#a3a3a3;line-height:1.5;">
          Your lease is ready for your signature. Please review and sign the agreement to complete your onboarding.
        </p>
        <a href="${signingLink}" style="display:inline-block;background:#6d9838;color:#000;font-weight:900;font-size:15px;padding:16px 32px;border-radius:10px;text-decoration:none;letter-spacing:-0.3px;">
          Sign Lease Agreement →
        </a>
      </div>
      ` : ""}

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6d9838;">Email</p>
        <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#fff;font-family:monospace;">${to}</p>
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6d9838;">Temporary Password</p>
        <p style="margin:0;font-size:18px;font-weight:900;color:#fff;font-family:monospace;letter-spacing:2px;">${tempPassword}</p>
      </div>

      ${inviteUrl ? `
      <div style="margin-bottom:24px;">
        <a href="${inviteUrl}" style="display:inline-block;background:#2a2a2a;color:#fff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;letter-spacing:-0.3px;border:1px solid #3a3a3a;">
          Set Your Password →
        </a>
      </div>
      <p style="margin:0 0 24px;color:#737373;font-size:12px;">Or copy this link: <a href="${inviteUrl}" style="color:#6d9838;word-break:break-all;">${inviteUrl}</a></p>
      ` : ""}

      <p style="margin:0;color:#525252;font-size:12px;line-height:1.6;">
        Please change your password after your first login. If you did not expect this email, you can safely ignore it.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #1a1a1a;text-align:center;">
      <p style="margin:0;color:#404040;font-size:11px;">© iReside Property Management</p>
    </div>
  </div>
</body>
</html>`;

    const text = `Hi ${tenantName},\n\nYour iReside tenant account is ready.\n\n${leaseDetails ? `LEASE DETAILS:\nProperty: ${leaseDetails.property_name}\nUnit: ${leaseDetails.unit_name}\nMove-in Date: ${new Date(leaseDetails.move_in_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\nMonthly Rent: ₱${leaseDetails.monthly_rent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n` : ""}${signingLink ? `SIGN YOUR LEASE:\n${signingLink}\n\n` : ""}LOGIN CREDENTIALS:\nEmail: ${to}\nTemporary Password: ${tempPassword}\n${inviteUrl ? `\nSet your password: ${inviteUrl}\n` : ""}\nPlease change your password after first login.\n\n— iReside`;

    await transporter.sendMail({ from: FROM, to, subject, html, text });
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

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
    <div style="background:#1a1a1a;padding:24px 32px;border-bottom:1px solid #2a2a2a;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:900;">iReside — Landlord Copy</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:15px;">Hi <strong>${landlordName}</strong>,</p>
      <p style="margin:0 0 24px;color:#a3a3a3;font-size:14px;line-height:1.6;">
        A tenant account has been created for <strong style="color:#fff;">${tenantName}</strong>. Keep these credentials as a backup in case the tenant did not receive their email.
      </p>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6d9838;">Tenant Email</p>
        <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#fff;font-family:monospace;">${tenantEmail}</p>
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6d9838;">Temporary Password</p>
        <p style="margin:0;font-size:18px;font-weight:900;color:#fff;font-family:monospace;letter-spacing:2px;">${tempPassword}</p>
      </div>

      ${inviteUrl ? `<p style="margin:0 0 24px;color:#737373;font-size:12px;">Password reset link: <a href="${inviteUrl}" style="color:#6d9838;word-break:break-all;">${inviteUrl}</a></p>` : ""}

      <p style="margin:0;color:#525252;font-size:12px;">Share these credentials with the tenant only if they did not receive their welcome email.</p>
    </div>
  </div>
</body>
</html>`;

    const text = `Hi ${landlordName},\n\nTenant account created for ${tenantName}.\n\nEmail: ${tenantEmail}\nTemp Password: ${tempPassword}\n${inviteUrl ? `Reset link: ${inviteUrl}\n` : ""}\n— iReside`;

    await transporter.sendMail({ from: FROM, to, subject, html, text });
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

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
    <div style="background:#6d9838;padding:24px 32px;">
      <h1 style="margin:0;color:#000;font-size:22px;font-weight:900;letter-spacing:-0.5px;">iReside</h1>
      <p style="margin:4px 0 0;color:#000;font-size:12px;font-weight:700;opacity:0.7;text-transform:uppercase;letter-spacing:2px;">Lease Agreement</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:16px;">Hi <strong>${tenantName}</strong>,</p>
      <p style="margin:0 0 24px;color:#a3a3a3;font-size:14px;line-height:1.6;">
        Congratulations! Your lease application has been approved. Your lease agreement is ready for your signature. Please review and sign to complete your rental agreement.
      </p>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 16px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#6d9838;">Property Details</p>
        <div style="margin-bottom:12px;">
          <p style="margin:0 0 4px;font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:1px;">Property</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${propertyName}</p>
        </div>
        <div style="margin-bottom:12px;">
          <p style="margin:0 0 4px;font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:1px;">Unit</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${unitName}</p>
        </div>
        <div style="margin-bottom:12px;">
          <p style="margin:0 0 4px;font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:1px;">Monthly Rent</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">₱${rentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p style="margin:0 0 4px;font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:1px;">Security Deposit</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">₱${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div style="background:#1a1a1a;border:1px solid #6d9838;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#fff;">📝 Review and Sign Your Lease</p>
        <p style="margin:0 0 20px;font-size:13px;color:#a3a3a3;line-height:1.5;">
          Please review the full lease agreement and provide your electronic signature to complete the rental process.
        </p>
        <a href="${signingUrl}" style="display:inline-block;background:#6d9838;color:#000;font-weight:900;font-size:15px;padding:16px 32px;border-radius:10px;text-decoration:none;letter-spacing:-0.3px;">
          Review and Sign Lease →
        </a>
      </div>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6d9838;">⏰ Link Expires</p>
        <p style="margin:0;font-size:14px;color:#fff;">${expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#737373;">Please sign before this date to avoid expiration.</p>
      </div>

      <div style="padding:20px;background:#1a1a1a;border-radius:12px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6d9838;">Landlord Contact</p>
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#fff;">${landlordName}</p>
        <p style="margin:0;font-size:13px;color:#a3a3a3;">${landlordEmail}</p>
      </div>

      <p style="margin:0;color:#525252;font-size:12px;line-height:1.6;">
        If you have any questions about the lease terms, please contact your landlord directly. This signing link is unique to you and should not be shared.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #1a1a1a;text-align:center;">
      <p style="margin:0;color:#404040;font-size:11px;">© iReside Property Management</p>
    </div>
  </div>
</body>
</html>`;

    const text = `Hi ${tenantName},\n\nYour lease application has been approved! Your lease agreement is ready for signature.\n\nPROPERTY DETAILS:\nProperty: ${propertyName}\nUnit: ${unitName}\nMonthly Rent: ₱${rentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nSecurity Deposit: ₱${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nREVIEW AND SIGN:\n${signingUrl}\n\nLink expires: ${expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\nLANDLORD CONTACT:\n${landlordName}\n${landlordEmail}\n\n— iReside`;

    await transporter.sendMail({ from: FROM, to, subject, html, text });
}

export async function sendTenantSignedNotification({
    to,
    landlordName,
    tenantName,
    leaseId,
}: {
    to: string;
    landlordName: string;
    tenantName: string;
    leaseId: string;
}) {
    const subject = `Tenant Signed Lease — ${tenantName}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
    <div style="background:#1a1a1a;padding:24px 32px;border-bottom:1px solid #2a2a2a;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:900;">iReside — Lease Update</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:15px;">Hi <strong>${landlordName}</strong>,</p>
      <p style="margin:0 0 24px;color:#a3a3a3;font-size:14px;line-height:1.6;">
        <strong style="color:#fff;">${tenantName}</strong> has signed their lease agreement. Please review and countersign to activate the lease.
      </p>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6d9838;">Lease ID</p>
        <p style="margin:0;font-size:15px;font-weight:700;color:#fff;font-family:monospace;">${leaseId}</p>
      </div>

      <p style="margin:0;color:#525252;font-size:12px;">Log in to your landlord dashboard to countersign the lease.</p>
    </div>
  </div>
</body>
</html>`;

    const text = `Hi ${landlordName},\n\n${tenantName} has signed their lease agreement.\n\nLease ID: ${leaseId}\n\nLog in to your landlord dashboard to countersign the lease.\n\n— iReside`;

    await transporter.sendMail({ from: FROM, to, subject, html, text });
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

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
    <div style="background:#6d9838;padding:24px 32px;">
      <h1 style="margin:0;color:#000;font-size:22px;font-weight:900;letter-spacing:-0.5px;">iReside</h1>
      <p style="margin:4px 0 0;color:#000;font-size:12px;font-weight:700;opacity:0.7;text-transform:uppercase;letter-spacing:2px;">Lease Activated</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:16px;">Hi <strong>${tenantName}</strong>,</p>
      <p style="margin:0 0 24px;color:#a3a3a3;font-size:14px;line-height:1.6;">
        Great news! Your lease agreement has been fully signed and is now active. Welcome to your new home!
      </p>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 16px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#6d9838;">Your Lease Details</p>
        <div style="margin-bottom:12px;">
          <p style="margin:0 0 4px;font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:1px;">Property</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${propertyName}</p>
        </div>
        <div style="margin-bottom:12px;">
          <p style="margin:0 0 4px;font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:1px;">Unit</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${unitName}</p>
        </div>
        <div>
          <p style="margin:0 0 4px;font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:1px;">Move-in Date</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${new Date(moveInDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <p style="margin:0;color:#525252;font-size:12px;line-height:1.6;">
        You can now access your tenant portal to view payments, submit maintenance requests, and communicate with your landlord.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #1a1a1a;text-align:center;">
      <p style="margin:0;color:#404040;font-size:11px;">© iReside Property Management</p>
    </div>
  </div>
</body>
</html>`;

    const text = `Hi ${tenantName},\n\nYour lease agreement has been fully signed and is now active!\n\nPROPERTY DETAILS:\nProperty: ${propertyName}\nUnit: ${unitName}\nMove-in Date: ${new Date(moveInDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\nWelcome to your new home! You can now access your tenant portal to manage your lease.\n\n— iReside`;

    await transporter.sendMail({ from: FROM, to, subject, html, text });
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

    const credentialBlock = tempPassword
        ? `
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6d9838;">Temporary Password</p>
        <p style="margin:0;font-size:17px;font-weight:900;color:#fff;font-family:monospace;letter-spacing:2px;">${tempPassword}</p>
      </div>
      `
        : "";

    const inviteBlock = inviteUrl
        ? `
      <p style="margin:12px 0 0;color:#9ca3af;font-size:12px;">
        Set or reset your password:
        <a href="${inviteUrl}" style="color:#6d9838;word-break:break-all;">${inviteUrl}</a>
      </p>
      `
        : "";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
    <div style="background:#6d9838;padding:24px 32px;">
      <h1 style="margin:0;color:#000;font-size:22px;font-weight:900;letter-spacing:-0.5px;">iReside</h1>
      <p style="margin:4px 0 0;color:#000;font-size:12px;font-weight:700;opacity:0.75;text-transform:uppercase;letter-spacing:2px;">Onboarding Reminder</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:16px;">Hi <strong>${tenantName}</strong>,</p>
      <p style="margin:0 0 20px;color:#a3a3a3;font-size:14px;line-height:1.6;">
        Your tenant account is ready, but onboarding is still incomplete. Please continue onboarding to unlock your full tenant portal access.
      </p>

      ${credentialBlock}

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:24px;text-align:center;">
        <a href="${onboardingUrl}" style="display:inline-block;background:#6d9838;color:#000;font-weight:900;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;letter-spacing:-0.3px;">
          Continue Onboarding
        </a>
        ${inviteBlock}
      </div>
    </div>
  </div>
</body>
</html>`;

    const text = `Hi ${tenantName},

Your tenant account is ready, but onboarding is still incomplete.
Continue here: ${onboardingUrl}
${tempPassword ? `Temporary password: ${tempPassword}\n` : ""}${inviteUrl ? `Password setup link: ${inviteUrl}\n` : ""}
— iReside`;

    await transporter.sendMail({ from: FROM, to, subject, html, text });
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
    const subject = "Action Required: Submit move-in payment details";
    const expiresLabel = expiresAt.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
    <div style="background:#6d9838;padding:24px 32px;">
      <h1 style="margin:0;color:#000;font-size:22px;font-weight:900;">iReside</h1>
      <p style="margin:4px 0 0;color:#000;font-size:12px;font-weight:700;opacity:0.75;text-transform:uppercase;letter-spacing:2px;">Payment Confirmation Step</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:16px;">Hi <strong>${applicantName}</strong>,</p>
      <p style="margin:0 0 18px;color:#a3a3a3;font-size:14px;line-height:1.6;">
        Your application for <strong style="color:#fff;">${propertyName} - ${unitName}</strong> has passed review.
        To continue, please submit move-in payment details for verification.
      </p>
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:18px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#6d9838;">Required Amounts</p>
        <p style="margin:0 0 6px;color:#fff;font-size:14px;">Advance Rent: <strong>PHP ${advanceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
        <p style="margin:0;color:#fff;font-size:14px;">Security Deposit: <strong>PHP ${securityAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
      </div>
      <div style="text-align:center;margin-bottom:20px;">
        <a href="${paymentPortalUrl}" style="display:inline-block;background:#6d9838;color:#000;font-weight:900;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
          Open Payment Portal
        </a>
      </div>
      <p style="margin:0 0 10px;color:#737373;font-size:12px;">This secure link expires on <strong style="color:#fff;">${expiresLabel}</strong>.</p>
      <p style="margin:0;color:#525252;font-size:12px;line-height:1.6;">
        We will only finalize approval after both required payments are landlord-confirmed.
      </p>
    </div>
  </div>
</body>
</html>`;

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

    await transporter.sendMail({ from: FROM, to, subject, html, text });
}

export async function sendRegistrationOTP({
    to,
    otp,
}: {
    to: string;
    otp: string;
}) {
    const subject = `${otp} is your iReside verification code`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <div style="max-width:480px;margin:40px auto;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
    <div style="background:#6d9838;padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#000;font-size:22px;font-weight:900;letter-spacing:-0.5px;">iReside</h1>
    </div>
    <div style="padding:32px;text-align:center;">
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#fff;">Verify your email</h2>
      <p style="margin:0 0 32px;color:#a3a3a3;font-size:14px;line-height:1.6;">
        Use the verification code below to continue your landlord registration.
      </p>

      <div style="background:#1a1a1a;border:2px dashed #2a2a2a;border-radius:12px;padding:24px;margin-bottom:32px;">
        <span style="font-size:32px;font-weight:900;color:#fff;font-family:monospace;letter-spacing:8px;margin-left:8px;">${otp}</span>
      </div>

      <p style="margin:0;color:#525252;font-size:12px;line-height:1.6;">
        This code will expire in 10 minutes. If you did not request this code, please ignore this email.
      </p>
    </div>
    <div style="padding:16px;background:#0d0d0d;text-align:center;border-top:1px solid #2a2a2a;">
      <p style="margin:0;color:#404040;font-size:11px;">© iReside Property Management</p>
    </div>
  </div>
</body>
</html>`;

const text = `Your iReside verification code is: ${otp}\n\nThis code expires in 10 minutes.`;

    await transporter.sendMail({ from: FROM, to, subject, html, text });
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

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
    <div style="background:#6d9838;padding:24px 32px;">
      <h1 style="margin:0;color:#000;font-size:22px;font-weight:900;letter-spacing:-0.5px;">iReside</h1>
      <p style="margin:4px 0 0;color:#000;font-size:12px;font-weight:700;opacity:0.7;text-transform:uppercase;letter-spacing:2px;">Landlord Access Approved</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:16px;">Hi <strong>${landlordName}</strong>,</p>
      <p style="margin:0 0 24px;color:#a3a3a3;font-size:14px;line-height:1.6;">
        Great news! Your landlord registration has been approved. You now have full access to the iReside landlord portal.
      </p>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#fff;">Start Managing Your Properties</p>
        <a href="${loginUrl}" style="display:inline-block;background:#6d9838;color:#000;font-weight:900;font-size:15px;padding:16px 32px;border-radius:10px;text-decoration:none;letter-spacing:-0.3px;">
          Go to Landlord Dashboard →
        </a>
      </div>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6d9838;">What you can do now</p>
        <ul style="margin:0;padding-left:20px;color:#a3a3a3;font-size:13px;line-height:1.8;">
          <li>Add and manage your properties</li>
          <li>Create units and list them for rent</li>
          <li>Invite tenants and process applications</li>
          <li>Track payments and generate invoices</li>
          <li>Handle maintenance requests</li>
        </ul>
      </div>

      <p style="margin:0;color:#525252;font-size:12px;line-height:1.6;">
        Log in with the credentials you created during registration. If you need help getting started, check out our landlord guide in the dashboard.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #1a1a1a;text-align:center;">
      <p style="margin:0;color:#404040;font-size:11px;">© iReside Property Management</p>
    </div>
  </div>
</body>
</html>`;

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

    await transporter.sendMail({ from: FROM, to, subject, html, text });
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

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
    <div style="background:#6d9838;padding:24px 32px;">
      <h1 style="margin:0;color:#000;font-size:22px;font-weight:900;letter-spacing:-0.5px;">iReside</h1>
      <p style="margin:4px 0 0;color:#000;font-size:12px;font-weight:700;opacity:0.7;text-transform:uppercase;letter-spacing:2px;">Complete Your Setup</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:16px;">Hi <strong>${landlordName}</strong>,</p>
      <p style="margin:0 0 24px;color:#a3a3a3;font-size:14px;line-height:1.6;">
        Great news! Your landlord registration has been approved. To access your landlord dashboard, you need to complete a quick setup process.
      </p>

      <div style="background:#1a1a1a;border:1px solid #6d9838;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#fff;">Set Up Your Account</p>
        <a href="${onboardingUrl}" style="display:inline-block;background:#6d9838;color:#000;font-weight:900;font-size:15px;padding:16px 32px;border-radius:10px;text-decoration:none;letter-spacing:-0.3px;">
          Complete Setup →
        </a>
      </div>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6d9838;">⏰ Link Expires</p>
        <p style="margin:0;font-size:14px;color:#fff;">${expiresAt}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#737373;">Please complete your setup before the link expires.</p>
      </div>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6d9838;">What you'll do</p>
        <ul style="margin:0;padding-left:20px;color:#a3a3a3;font-size:13px;line-height:1.8;">
          <li>Create your account password</li>
          <li>Verify your property details</li>
          <li>Configure billing settings</li>
          <li>Set up your profile</li>
        </ul>
      </div>

      <p style="margin:0;color:#525252;font-size:12px;line-height:1.6;">
        If you didn't expect this email or have questions, please contact support.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #1a1a1a;text-align:center;">
      <p style="margin:0;color:#404040;font-size:11px;">© iReside Property Management</p>
    </div>
  </div>
</body>
</html>`;

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

    await transporter.sendMail({ from: FROM, to, subject, html, text });
}
