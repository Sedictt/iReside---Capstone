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
}: {
    to: string;
    tenantName: string;
    tempPassword: string;
    inviteUrl?: string | null;
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

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6d9838;">Email</p>
        <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#fff;font-family:monospace;">${to}</p>
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6d9838;">Temporary Password</p>
        <p style="margin:0;font-size:18px;font-weight:900;color:#fff;font-family:monospace;letter-spacing:2px;">${tempPassword}</p>
      </div>

      ${inviteUrl ? `
      <div style="margin-bottom:24px;">
        <a href="${inviteUrl}" style="display:inline-block;background:#6d9838;color:#000;font-weight:900;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;letter-spacing:-0.3px;">
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

    const text = `Hi ${tenantName},\n\nYour iReside tenant account is ready.\n\nEmail: ${to}\nTemporary Password: ${tempPassword}\n${inviteUrl ? `\nSet your password: ${inviteUrl}\n` : ""}\nPlease change your password after first login.\n\n— iReside`;

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
