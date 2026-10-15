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
import { getAppBaseUrl } from "@/lib/app-url";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_SMTP_HOST = "smtp.gmail.com";
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
      // Verify the server certificate by default. Set SMTP_TLS_REJECT_UNAUTHORIZED=false
      // only for a private SMTP relay that uses a self-signed certificate.
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    },
  });
}

function getTransporter() {
  const host = process.env.SMTP_HOST || DEFAULT_SMTP_HOST;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!user || !pass) {
    throw new Error("SMTP credentials are not configured. Please set SMTP_USER and SMTP_PASS environment variables.");
  }

  const transporter = createNodemailerTransporter(user, pass, host);

  const rawSender = process.env.SMTP_FROM || user;
  let senderAddress = rawSender;
  if (!senderAddress.includes("<") && senderAddress.includes("@")) {
    senderAddress = `"iReside" <${senderAddress.replace(/['"]/g, "").trim()}>`;
  }

  return { transporter, senderAddress };
}

// ---------------------------------------------------------------------------
// Safety net: never ship a localhost link to a real user
// ---------------------------------------------------------------------------

const LOCAL_LINK_PATTERN = /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(?::\d+)?/gi;

/**
 * Last line of defence. Every link should already come from `getAppBaseUrl`,
 * but if a localhost URL still reaches the transport in production we rewrite
 * it to the canonical app origin and log loudly so the source gets fixed.
 */
function guardAgainstLocalLinks(body: string, subject: string): string {
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (!isProduction || !LOCAL_LINK_PATTERN.test(body)) {
    LOCAL_LINK_PATTERN.lastIndex = 0;
    return body;
  }
  LOCAL_LINK_PATTERN.lastIndex = 0;
  const base = getAppBaseUrl();
  console.error(
    `[email] "${subject}" contained a localhost link in production; rewrote it to ${base}. Check NEXT_PUBLIC_APP_URL.`,
  );
  return body.replace(LOCAL_LINK_PATTERN, base);
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
 *
 * @param emailOptions - The email envelope and content.
 */
export async function sendEmail(
  emailOptions: EmailOptions,
): Promise<boolean> {
  let transporterData: ReturnType<typeof getTransporter>;
  try {
    transporterData = getTransporter();
  } catch (configError) {
    console.error("[email] Configuration error:", configError);
    return false;
  }

  const { transporter, senderAddress } = transporterData;
  const htmlBody = guardAgainstLocalLinks(emailOptions.htmlBody, emailOptions.subject);
  const textBody = emailOptions.textBody
    ? guardAgainstLocalLinks(emailOptions.textBody, emailOptions.subject)
    : emailOptions.textBody;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAXIMUM_RETRY_COUNT; attempt += 1) {
    try {
      const info = await transporter.sendMail({
        from: senderAddress,
        to: emailOptions.recipientEmail,
        subject: emailOptions.subject,
        html: htmlBody,
        text: textBody,
      });

      console.log(
        `[email] Sent "${emailOptions.subject}" to ${emailOptions.recipientEmail} (messageId: ${info.messageId})`,
      );
      return true;
    } catch (error: any) {
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