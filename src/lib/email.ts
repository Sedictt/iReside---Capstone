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
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:900;">α1 — Landlord Copy</h1>
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

    const text = `Hi ${landlordName},\n\nTenant account created for ${tenantName}.\n\nEmail: ${tenantEmail}\nTemp Password: ${tempPassword}\n${inviteUrl ? `Reset link: ${inviteUrl}\n` : ""}\n— α1`;

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
      <h1 style="margin:0;color:#000;font-size:22px;font-weight:900;letter-spacing:-0.5px;">α1</h1>
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
      <p style="margin:0;color:#404040;font-size:11px;">© α1 Property Management</p>
    </div>
  </div>
</body>
</html>`;

    const text = `Hi ${tenantName},\n\nYour lease application has been approved! Your lease agreement is ready for signature.\n\nPROPERTY DETAILS:\nProperty: ${propertyName}\nUnit: ${unitName}\nMonthly Rent: ₱${rentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nSecurity Deposit: ₱${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nREVIEW AND SIGN:\n${signingUrl}\n\nLink expires: ${expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\nLANDLORD CONTACT:\n${landlordName}\n${landlordEmail}\n\n— α1`;

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
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:900;">α1 — Lease Update</h1>
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

    const text = `Hi ${landlordName},\n\n${tenantName} has signed their lease agreement.\n\nLease ID: ${leaseId}\n\nLog in to your landlord dashboard to countersign the lease.\n\n— α1`;

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
      <h1 style="margin:0;color:#000;font-size:22px;font-weight:900;letter-spacing:-0.5px;">α1</h1>
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
      <p style="margin:0;color:#404040;font-size:11px;">© α1 Property Management</p>
    </div>
  </div>
</body>
</html>`;

    const text = `Hi ${tenantName},\n\nYour lease agreement has been fully signed and is now active!\n\nPROPERTY DETAILS:\nProperty: ${propertyName}\nUnit: ${unitName}\nMove-in Date: ${new Date(moveInDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\nWelcome to your new home! You can now access your tenant portal to manage your lease.\n\n— α1`;

    await transporter.sendMail({ from: FROM, to, subject, html, text });
}
