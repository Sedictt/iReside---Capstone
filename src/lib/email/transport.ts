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

function getTransporter() {
  const host = process.env.SMTP_HOST || DEFAULT_SMTP_HOST;
  const user = (process.env.SMTP_USER || DEFAULT_SMTP_USER).trim();
  const rawPass = process.env.SMTP_PASS || DEFAULT_SMTP_PASS;
  // Google App Passwords are 16 chars; remove spaces/quotes that can cause 535 Bad Credentials
  const pass = rawPass.replace(/['"\s]/g, "");

  const explicitPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const isGmail = host.toLowerCase().includes("gmail");
  const port = explicitPort ?? (isGmail ? 465 : 587);
  const secure = explicitPort ? explicitPort === 465 : (port === 465);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

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
 * Returns boolean indicating whether the message was successfully dispatched.
 *
 * @param emailOptions - The email envelope and content.
 */
export async function sendEmail(
  emailOptions: EmailOptions,
): Promise<boolean> {
  const { transporter, senderAddress } = getTransporter();
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
    } catch (error) {
      lastError = error;

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