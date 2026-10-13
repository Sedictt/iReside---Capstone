/**
 * Shared email layout and building blocks.
 *
 * All transactional emails render through `renderEmail` so they share one
 * table-based, mobile-responsive shell that survives Gmail, Apple Mail,
 * Outlook (desktop + web) and the common mobile clients:
 *
 *  - Tables (not flex/div max-width) for structure, so Outlook honours widths.
 *  - Inline styles for every element, plus a small `<style>` block with
 *    `@media (max-width: 600px)` rules for clients that support it (Gmail,
 *    Apple Mail, Outlook iOS/Android, Samsung Mail).
 *  - A `preheader` so inbox previews show a useful summary instead of "iReside".
 *  - Everything user-supplied must already be escaped by the caller.
 *
 * @module lib/email/layout
 */

import { escapeHtml as esc } from "@/lib/security/html";

export { esc };

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

export const EMAIL_FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
export const MONO_FONT = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";

const COLORS = {
  pageBg: "#f4f4f5",
  cardBg: "#ffffff",
  border: "#e4e4e7",
  text: "#18181b",
  textMuted: "#52525b",
  textSubtle: "#71717a",
  textFaint: "#a1a1aa",
  brand: "#7c3aed",
  brandSoft: "#c4b0ff",
  brandInk: "#1e1b4b",
  dark: "#09090b",
  danger: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#3b82f6",
} as const;

export type HeaderTone = "brand" | "neutral" | "danger" | "success" | "warning" | "info";
export type ButtonTone = "primary" | "dark" | "danger" | "outline";
export type CardTone = "neutral" | "brand" | "danger" | "warning" | "success";

const HEADER_STYLES: Record<HeaderTone, { bg: string; title: string; eyebrow: string }> = {
  brand: { bg: COLORS.brandSoft, title: "#000000", eyebrow: COLORS.brandInk },
  neutral: { bg: "#f8fafc", title: COLORS.dark, eyebrow: "#64748b" },
  danger: { bg: COLORS.danger, title: "#ffffff", eyebrow: "#ffffff" },
  success: { bg: COLORS.success, title: "#ffffff", eyebrow: "#ffffff" },
  warning: { bg: COLORS.warning, title: "#ffffff", eyebrow: "#ffffff" },
  info: { bg: COLORS.info, title: "#ffffff", eyebrow: "#ffffff" },
};

const BUTTON_STYLES: Record<ButtonTone, { bg: string; color: string; border: string }> = {
  primary: { bg: COLORS.brand, color: "#ffffff", border: COLORS.brand },
  dark: { bg: COLORS.dark, color: "#ffffff", border: COLORS.dark },
  danger: { bg: COLORS.danger, color: "#ffffff", border: COLORS.danger },
  outline: { bg: "#ffffff", color: "#0f172a", border: "#cbd5e1" },
};

const CARD_STYLES: Record<CardTone, { bg: string; border: string }> = {
  neutral: { bg: "#f8fafc", border: "#e2e8f0" },
  brand: { bg: "#f5f3ff", border: "#ddd6fe" },
  danger: { bg: "#fef2f2", border: "#fee2e2" },
  warning: { bg: "#fffbeb", border: "#fde68a" },
  success: { bg: "#ecfdf5", border: "#a7f3d0" },
};

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export interface RenderEmailOptions {
  /** `<title>` of the document. Escaped here. */
  title: string;
  /** Hidden inbox preview text. Escaped here. */
  preheader?: string;
  header?: {
    /** Small uppercase label under the wordmark. Escaped here. */
    eyebrow?: string;
    tone?: HeaderTone;
    align?: "left" | "center";
  };
  /** Pre-built, already-escaped HTML for the body. */
  body: string;
  /** Max content width in px. Defaults to 560. */
  width?: number;
  /** Footer line. Defaults to the copyright line. Escaped here. */
  footer?: string;
}

/**
 * Wraps body HTML in the shared responsive document shell.
 */
export function renderEmail(options: RenderEmailOptions): string {
  const width = options.width ?? 560;
  const header = options.header ?? {};
  const tone = HEADER_STYLES[header.tone ?? "brand"];
  const align = header.align ?? "left";
  const year = new Date().getFullYear();
  const footer = options.footer ?? `© ${year} iReside Property Management`;
  const preheader = options.preheader ? esc(options.preheader) : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${esc(options.title)}</title>
  <!--[if mso]>
  <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  <style>table,td,div,h1,h2,p,a,span{font-family:Arial,Helvetica,sans-serif !important;}</style>
  <![endif]-->
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    html, body { margin:0 !important; padding:0 !important; height:100% !important; width:100% !important; }
    * { -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt !important; mso-table-rspace:0pt !important; border-collapse:collapse !important; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
    u + #ir-body a { color:inherit; text-decoration:none; }
    .ir-btn:hover { opacity:0.92; }
    @media only screen and (max-width: 600px) {
      .ir-wrap { padding:16px 8px !important; }
      .ir-card { border-radius:12px !important; }
      .ir-header { padding:20px 20px !important; }
      .ir-content { padding:24px 20px !important; }
      .ir-footer { padding:14px 20px !important; }
      .ir-box { padding:16px !important; }
      .ir-btn-wrap { width:100% !important; }
      .ir-btn { display:block !important; width:100% !important; box-sizing:border-box !important; text-align:center !important; }
      .ir-otp { font-size:28px !important; letter-spacing:6px !important; }
      .ir-stack { display:block !important; width:100% !important; text-align:left !important; padding-bottom:4px !important; }
      .ir-stack-last { padding-bottom:12px !important; }
      .ir-h1 { font-size:20px !important; }
    }
  </style>
</head>
<body id="ir-body" style="margin:0;padding:0;background-color:${COLORS.pageBg};font-family:${EMAIL_FONT};color:${COLORS.text};-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:${COLORS.pageBg};">${preheader}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>` : ""}
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${COLORS.pageBg};">
    <tr>
      <td align="center" class="ir-wrap" style="padding:40px 16px;">
        <!--[if mso]><table role="presentation" border="0" cellspacing="0" cellpadding="0" width="${width}"><tr><td><![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="ir-card" style="max-width:${width}px;margin:0 auto;background-color:${COLORS.cardBg};border:1px solid ${COLORS.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td class="ir-header" style="background-color:${tone.bg};padding:24px 32px;text-align:${align};">
              <h1 class="ir-h1" style="margin:0;color:${tone.title};font-size:22px;line-height:1.2;font-weight:900;letter-spacing:-0.5px;font-family:${EMAIL_FONT};">iReside</h1>
              ${header.eyebrow ? `<p style="margin:6px 0 0;color:${tone.eyebrow};font-size:11px;line-height:1.4;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;opacity:0.9;font-family:${EMAIL_FONT};">${esc(header.eyebrow)}</p>` : ""}
            </td>
          </tr>
          <tr>
            <td class="ir-content" style="padding:32px;font-family:${EMAIL_FONT};">
              ${options.body}
            </td>
          </tr>
          <tr>
            <td class="ir-footer" style="padding:16px 32px;background-color:#fafafa;border-top:1px solid ${COLORS.pageBg};text-align:center;">
              <p style="margin:0;color:${COLORS.textFaint};font-size:11px;line-height:1.5;font-family:${EMAIL_FONT};">${esc(footer)}</p>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Blocks (all return HTML strings; text args must be pre-escaped unless noted)
// ---------------------------------------------------------------------------

/** Greeting line. `name` is escaped here. */
export function greeting(name?: string | null): string {
  const label = name?.trim() ? `Hi <strong>${esc(name.trim())}</strong>,` : "Hello,";
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${COLORS.text};">${label}</p>`;
}

/** Body paragraph. Accepts HTML (caller escapes dynamic values). */
export function paragraph(html: string, opts: { marginBottom?: number } = {}): string {
  return `<p style="margin:0 0 ${opts.marginBottom ?? 24}px;color:${COLORS.textMuted};font-size:14px;line-height:1.6;">${html}</p>`;
}

/** Small grey helper text. Accepts HTML. */
export function muted(html: string, opts: { marginBottom?: number; center?: boolean } = {}): string {
  return `<p style="margin:0 0 ${opts.marginBottom ?? 0}px;color:${COLORS.textSubtle};font-size:12px;line-height:1.6;${opts.center ? "text-align:center;" : ""}">${html}</p>`;
}

/** Section heading inside the body. Escaped here. */
export function heading(text: string, opts: { center?: boolean } = {}): string {
  return `<h2 style="margin:0 0 8px;font-size:18px;line-height:1.3;font-weight:700;color:${COLORS.dark};${opts.center ? "text-align:center;" : ""}">${esc(text)}</h2>`;
}

/** Uppercase label used above a value or card. Escaped here. */
export function eyebrow(text: string, color: string = "#64748b"): string {
  return `<p style="margin:0 0 4px;font-size:11px;line-height:1.4;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${color};">${esc(text)}</p>`;
}

/** Boxed card. `innerHtml` is pre-built. */
export function card(
  innerHtml: string,
  opts: { tone?: CardTone; center?: boolean; marginBottom?: number; padding?: number } = {},
): string {
  const tone = CARD_STYLES[opts.tone ?? "neutral"];
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 ${opts.marginBottom ?? 24}px;">
  <tr>
    <td class="ir-box" style="background-color:${tone.bg};border:1px solid ${tone.border};border-radius:12px;padding:${opts.padding ?? 20}px;${opts.center ? "text-align:center;" : ""}">
      ${innerHtml}
    </td>
  </tr>
</table>`;
}

/** Stacked label/value pairs (reads well on narrow screens). Both escaped here. */
export function detailList(
  rows: Array<{ label: string; value: string; mono?: boolean; accent?: boolean }>,
  opts: { title?: string } = {},
): string {
  const items = rows
    .map((row, index) => {
      const last = index === rows.length - 1;
      const font = row.mono ? `font-family:${MONO_FONT};` : "";
      const color = row.accent ? COLORS.brand : "#0f172a";
      return `<tr>
  <td style="padding:0 0 ${last ? 0 : 12}px;">
    ${eyebrow(row.label)}
    <p style="margin:0;font-size:15px;line-height:1.4;font-weight:700;color:${color};${font}word-break:break-word;">${esc(row.value)}</p>
  </td>
</tr>`;
    })
    .join("");
  const title = opts.title
    ? `<tr><td style="padding:0 0 16px;">${eyebrow(opts.title, COLORS.brand)}</td></tr>`
    : "";
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">${title}${items}</table>`;
}

/**
 * Two-column label | value rows. Collapses to stacked rows on mobile via the
 * `.ir-stack` class. Both escaped here.
 */
export function keyValueRows(
  rows: Array<{ label: string; value: string; mono?: boolean; accent?: boolean; strong?: boolean }>,
): string {
  const body = rows
    .map((row, index) => {
      const last = index === rows.length - 1;
      const font = row.mono ? `font-family:${MONO_FONT};` : "";
      const color = row.accent ? COLORS.brand : "#0f172a";
      const weight = row.strong === false ? 500 : 700;
      return `<tr>
  <td class="ir-stack" style="padding:0 8px ${last ? 0 : 10}px 0;font-size:11px;line-height:1.5;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;vertical-align:top;white-space:nowrap;">${esc(row.label)}</td>
  <td class="ir-stack ir-stack-last" align="right" style="padding:0 0 ${last ? 0 : 10}px;font-size:13px;line-height:1.5;font-weight:${weight};color:${color};${font}text-align:right;vertical-align:top;word-break:break-word;">${esc(row.value)}</td>
</tr>`;
    })
    .join("");
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">${body}</table>`;
}

/** Bulletproof button. `label` escaped here; `href` escaped here. */
export function button(
  href: string,
  label: string,
  opts: { tone?: ButtonTone; center?: boolean; marginBottom?: number; small?: boolean } = {},
): string {
  const tone = BUTTON_STYLES[opts.tone ?? "primary"];
  const safeHref = esc(href);
  const padding = opts.small ? "10px 18px" : "14px 28px";
  const fontSize = opts.small ? 13 : 15;
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="ir-btn-wrap" align="${opts.center ? "center" : "left"}" style="margin:0 ${opts.center ? "auto" : "0"} ${opts.marginBottom ?? 24}px;">
  <tr>
    <td align="center" bgcolor="${tone.bg}" style="border-radius:10px;background-color:${tone.bg};border:1px solid ${tone.border};">
      <a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="ir-btn" style="display:inline-block;padding:${padding};font-size:${fontSize}px;line-height:1.2;font-weight:700;color:${tone.color};text-decoration:none;border-radius:10px;font-family:${EMAIL_FONT};mso-padding-alt:0;">${esc(label)}</a>
    </td>
  </tr>
</table>`;
}

/** "Or copy this link" fallback. URL escaped here. */
export function linkFallback(url: string, label = "Button not working? Paste this link into your browser:"): string {
  const safe = esc(url);
  return `<p style="margin:0 0 24px;color:${COLORS.textSubtle};font-size:12px;line-height:1.6;">${esc(label)}<br>
<a href="${safe}" target="_blank" rel="noopener noreferrer" style="color:${COLORS.brand};word-break:break-all;text-decoration:underline;">${safe}</a></p>`;
}

/** Large one-time code box. Code escaped here. */
export function otpBox(code: string): string {
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
  <tr>
    <td align="center" class="ir-box" style="background-color:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:24px 16px;">
      <span class="ir-otp" style="display:inline-block;font-family:${MONO_FONT};font-size:32px;line-height:1.2;font-weight:900;letter-spacing:8px;color:${COLORS.dark};padding-left:8px;">${esc(code)}</span>
    </td>
  </tr>
</table>`;
}

/** Monospace credential value (email, temp password). Escaped here. */
export function credential(label: string, value: string, opts: { large?: boolean; last?: boolean } = {}): string {
  const size = opts.large ? 18 : 15;
  const spacing = opts.large ? "letter-spacing:2px;" : "";
  return `${eyebrow(label)}<p style="margin:0 0 ${opts.last ? 0 : 16}px;font-size:${size}px;line-height:1.4;font-weight:${opts.large ? 900 : 700};color:#0f172a;font-family:${MONO_FONT};${spacing}word-break:break-all;">${esc(value)}</p>`;
}

/** Simple bullet list. Items escaped here. */
export function bulletList(items: string[]): string {
  const li = items.map((item) => `<li style="margin:0 0 4px;">${esc(item)}</li>`).join("");
  return `<ul style="margin:0;padding-left:20px;color:#475569;font-size:13px;line-height:1.7;">${li}</ul>`;
}

/** Horizontal rule. */
export function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${COLORS.pageBg};margin:24px 0 20px;">`;
}

/** Formats a PHP amount with two decimals. */
export function peso(amount: number): string {
  return `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Formats a date for display, e.g. "April 1, 2024". */
export function longDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
