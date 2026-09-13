/**
 * Email Transport Layer
 *
 * Manages the SMTP connection, retry logic, and low-level sending.
 * Marked 'use server' — only callable from server-side code.
 *
 * @module lib/email/transport
 */

"use server";

import * as nodemailer from "nodemailer";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_SMTP_HOST = "smtp.gmail.com";
const DEFAULT_SMTP_USER = "ireside.official.mail@gmail.com";
const DEFAULT_SMTP_PASS = "qzbh dxhc vazj krpt";
const DEFAULT_SENDER_ADDRESS = '"iReside" <ireside.official.mail@gmail.com>';
const MAXIMUM_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 1000;

function createNodemailerTransporter(user: string, pass: string, host = DEFAULT_SMTP_HOST) {
  const isGmail = host.toLowerCase().includes("gmail");
  const port = isGmail ? 465 : 587;
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: user.trim(),
      pass: pass.replace(/['"\s]/g, ""),
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function getTransporter() {
  const host = process.env.SMTP_HOST || DEFAULT_SMTP_HOST;
  const envUser = process.env.SMTP_USER?.trim();
  // If Vercel env contains the stale personal sedict account or is empty, use the verified official iReside mailbox
  const isStale = !envUser || envUser.toLowerCase().includes("sedict");
  const user = isStale ? DEFAULT_SMTP_USER : envUser;
  const pass = isStale ? DEFAULT_SMTP_PASS : (process.env.SMTP_PASS || DEFAULT_SMTP_PASS);

  const transporter = createNodemailerTransporter(user, pass, host);

  const rawSender = process.env.SMTP_FROM || DEFAULT_SENDER_ADDRESS;
  let senderAddress = rawSender;
  if (!senderAddress.includes("<") && senderAddress.includes("@")) {
    senderAddress = `"iReside" <${senderAddress.replace(/['"]/g, "").trim()}>`;
  }

  return { transporter, senderAddress };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailOptions {
  readonly recipientEmail: string;
  readonly subject: string;
  readonly htmlBody: string;
  readonly textBody?: string;
}

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

/**
 * Sends an email with automatic retry on transient failures.
 *
 * Retries up to MAXIMUM_RETRY_COUNT times with exponential backoff.
 * If authentication fails with 535 BadCredentials, automatically falls back to
 * the verified official iReside credentials.
 *
 * @param emailOptions - The email envelope and content.
 */
export async function sendEmail(
  emailOptions: EmailOptions,
): Promise<boolean> {
  let { transporter, senderAddress } = getTransporter();
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAXIMUM_RETRY_COUNT; attempt += 1) {
    try {
      const info = await transporter.sendMail({
        from: senderAddress,
        to: emailOptions.recipientEmail,
        subject: emailOptions.subject,
        html: emailOptions.htmlBody,
        text: emailOptions.textBody,
      });

      console.log(
        `[email] Sent "${emailOptions.subject}" to ${emailOptions.recipientEmail} (messageId: ${info.messageId})`,
      );
      return true;
    } catch (error: any) {
      lastError = error;
      const errorMessage = String(error?.message || "");

      // If bad credentials (e.g. stale Vercel env var), fall back to official project credentials immediately
      if (errorMessage.includes("535") || errorMessage.includes("BadCredentials")) {
        console.warn("[email] Detected 535 Bad Credentials on configured SMTP. Falling back to verified official credentials...");
        transporter = createNodemailerTransporter(DEFAULT_SMTP_USER, DEFAULT_SMTP_PASS);
        senderAddress = DEFAULT_SENDER_ADDRESS;
      }

      if (attempt < MAXIMUM_RETRY_COUNT) {
        console.warn(
          `[email] Attempt ${attempt}/${MAXIMUM_RETRY_COUNT} failed for "${emailOptions.subject}" — retrying in ${RETRY_DELAY_MS * attempt}ms`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * attempt),
        );
      }
    }
  }

  console.error(
    `[email] All ${MAXIMUM_RETRY_COUNT} attempts failed for "${emailOptions.subject}" to ${emailOptions.recipientEmail}:`,
    lastError,
  );
  return false;
}