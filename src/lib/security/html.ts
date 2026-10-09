/**
 * HTML escaping for server-rendered markup (email templates, notifications).
 *
 * Any value that originated from a user (names, addresses, notes, file names)
 * must pass through `escapeHtml` before it is interpolated into an HTML
 * template literal, otherwise a crafted value becomes markup in the recipient's
 * mail client.
 *
 * @module lib/security/html
 */

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes the five HTML-significant characters. Non-string values are stringified first. */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character);
}
