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

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const IS_SMTP_SECURE = SMTP_PORT === 465;
const SMTP_USERNAME = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASS;
const SENDER_ADDRESS = process.env.SMTP_FROM ?? "iReside <noreply@ireside.app>";
const MAXIMUM_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 1000;

// ---------------------------------------------------------------------------
// Transporter
// ---------------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: IS_SMTP_SECURE,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
});

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
 * All failures are logged but never thrown — email failures should
 * not block the caller's request flow.
 *
 * @param emailOptions - The email envelope and content.
 */
export async function sendEmail(
  emailOptions: EmailOptions,
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAXIMUM_RETRY_COUNT; attempt += 1) {
    try {
      const info = await transporter.sendMail({
        from: SENDER_ADDRESS,
        to: emailOptions.recipientEmail,
        subject: emailOptions.subject,
        html: emailOptions.htmlBody,
        text: emailOptions.textBody,
      });

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[email] Sent "${emailOptions.subject}" to ${emailOptions.recipientEmail} (messageId: ${info.messageId})`,
        );
      }
      return;
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
}