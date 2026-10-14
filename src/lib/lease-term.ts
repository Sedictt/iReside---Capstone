/**
 * Lease term helpers.
 *
 * A lease is either open-ended (month-to-month: the tenant stays while rent is
 * paid and leaves through the move-out flow) or fixed-term (dated end, renewal
 * workflow applies). Open-ended is the default. An open-ended lease gets an
 * end date only once a move-out date has been agreed.
 *
 * All UI that used to assume `end_date` is present should go through these
 * helpers so open-ended leases render tenure instead of a countdown.
 *
 * @module lib/lease-term
 */

import type { LeaseTermType } from "@/types/database";

export type { LeaseTermType };

export const LEASE_TERM_TYPES = ["open_ended", "fixed"] as const;
export const DEFAULT_LEASE_TERM_TYPE: LeaseTermType = "open_ended";
/** Days before a fixed-term end date at which a lease counts as "expiring soon". */
export const EXPIRING_SOON_DAYS = 90;
/** Days before a fixed-term end date at which it becomes urgent. */
export const EXPIRING_URGENT_DAYS = 30;

export interface LeaseTermLike {
  term_type?: string | null;
  end_date?: string | null;
  start_date?: string | null;
  status?: string | null;
}

const MS_PER_DAY = 86_400_000;

/**
 * Display language for the label helpers below. Every helper takes it as an
 * optional trailing argument and defaults to English, so existing callers are
 * unchanged. Pass `language` from `useLanguageContext()` for Filipino output.
 */
export type LeaseTermLanguage = "en" | "fil";

const DATE_LOCALES: Record<LeaseTermLanguage, string> = { en: "en-US", fil: "fil-PH" };

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Coerce any stored/legacy value to a known term type. Unknown values are open-ended. */
export function normalizeTermType(value: unknown): LeaseTermType {
  return value === "fixed" ? "fixed" : "open_ended";
}

/** True when the lease has no fixed term (the default). */
export function isOpenEnded(lease: LeaseTermLike | null | undefined): boolean {
  return normalizeTermType(lease?.term_type) === "open_ended";
}

/** True when the lease has a dated term. */
export function isFixedTerm(lease: LeaseTermLike | null | undefined): boolean {
  return normalizeTermType(lease?.term_type) === "fixed";
}

/** Normalised ISO end date (YYYY-MM-DD) or null when none is set. */
export function leaseEndDate(lease: LeaseTermLike | null | undefined): string | null {
  const raw = lease?.end_date;
  if (typeof raw !== "string") return null;
  const iso = raw.trim().slice(0, 10);
  return isIsoDate(iso) ? iso : null;
}

/** True when a lease has a concrete end date (fixed term, or open-ended with an agreed move-out). */
export function hasScheduledEnd(lease: LeaseTermLike | null | undefined): boolean {
  return leaseEndDate(lease) !== null;
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Parse a date-only string (or any date string) to local midnight. Returns null when invalid. */
export function parseLeaseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const iso = value.trim().slice(0, 10);
  if (isIsoDate(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). DST-safe. */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / MS_PER_DAY);
}

export function addMonthsIso(iso: string, months: number): string {
  const date = parseLeaseDate(iso);
  if (!date) return iso;
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toIsoDate(date);
}

/** Days until the lease end date, or null when the lease has no end date. 0 on the end date, negative after. */
export function daysUntilLeaseEnd(lease: LeaseTermLike | null | undefined, now: Date = new Date()): number | null {
  const end = parseLeaseDate(leaseEndDate(lease));
  if (!end) return null;
  return daysBetween(now, end);
}

/** Whole months (and leftover days) elapsed since the start date. */
export function tenureParts(start: string | Date | null | undefined, now: Date = new Date()): { months: number; days: number } {
  const startDate = parseLeaseDate(start);
  if (!startDate) return { months: 0, days: 0 };
  const today = parseLeaseDate(now) ?? now;
  if (today < startDate) return { months: 0, days: 0 };

  let months = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
  if (today.getDate() < startDate.getDate()) months -= 1;
  months = Math.max(0, months);
  const anchor = parseLeaseDate(addMonthsIso(toIsoDate(startDate), months)) ?? startDate;
  const days = Math.max(0, daysBetween(anchor, today));
  return { months, days };
}

/** Total whole months since start (e.g. 14). */
export function tenureMonths(start: string | Date | null | undefined, now: Date = new Date()): number {
  return tenureParts(start, now).months;
}

/**
 * Human tenure such as "2 years 3 months", "7 months", "3 weeks" or
 * "Starts in 12 days" when the lease has not begun yet.
 */
export function formatTenure(
  start: string | Date | null | undefined,
  now: Date = new Date(),
  lang: LeaseTermLanguage = "en",
): string {
  const startDate = parseLeaseDate(start);
  if (!startDate) return "";
  const today = parseLeaseDate(now) ?? now;
  const fil = lang === "fil";
  const ahead = daysBetween(today, startDate);
  if (ahead > 0) {
    if (fil) return ahead === 1 ? "Magsisimula bukas" : `Magsisimula sa loob ng ${ahead} araw`;
    return ahead === 1 ? "Starts tomorrow" : `Starts in ${ahead} days`;
  }

  const { months } = tenureParts(startDate, today);
  if (months === 0) {
    const days = daysBetween(startDate, today);
    if (days < 1) return fil ? "Nagsimula ngayong araw" : "Started today";
    if (days < 7) return fil ? `${days} araw` : `${days} ${plural(days, "day", "days")}`;
    const weeks = Math.floor(days / 7);
    return fil ? `${weeks} linggo` : `${weeks} ${plural(weeks, "week", "weeks")}`;
  }
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(fil ? `${years} taon` : `${years} ${plural(years, "year", "years")}`);
  if (rem > 0) parts.push(fil ? `${rem} buwan` : `${rem} ${plural(rem, "month", "months")}`);
  return parts.join(fil && parts.length > 1 ? " at " : " ");
}

/**
 * Short tenure for tight spaces: "1y 3m", "7m", "2w", "new".
 * Filipino: "1t 3b", "7b", "2l", "bago" (t = taon, b = buwan, l = linggo).
 */
export function formatTenureShort(
  start: string | Date | null | undefined,
  now: Date = new Date(),
  lang: LeaseTermLanguage = "en",
): string {
  const startDate = parseLeaseDate(start);
  if (!startDate) return "";
  const today = parseLeaseDate(now) ?? now;
  const u = lang === "fil"
    ? { upcoming: "parating", fresh: "bago", w: "l", m: "b", y: "t" }
    : { upcoming: "upcoming", fresh: "new", w: "w", m: "m", y: "y" };
  if (daysBetween(today, startDate) > 0) return u.upcoming;
  const { months } = tenureParts(startDate, today);
  if (months === 0) {
    const days = daysBetween(startDate, today);
    if (days < 7) return u.fresh;
    return `${Math.floor(days / 7)}${u.w}`;
  }
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem}${u.m}`;
  return rem > 0 ? `${years}${u.y} ${rem}${u.m}` : `${years}${u.y}`;
}

/** "Since Mar 2024" (Filipino: "Mula Mar 2024") */
export function tenureSinceLabel(start: string | Date | null | undefined, lang: LeaseTermLanguage = "en"): string {
  const startDate = parseLeaseDate(start);
  if (!startDate) return "";
  const month = startDate.toLocaleDateString(DATE_LOCALES[lang], { month: "short", year: "numeric" });
  return lang === "fil" ? `Mula ${month}` : `Since ${month}`;
}

export function formatLeaseDate(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
  lang: LeaseTermLanguage = "en",
): string {
  const date = parseLeaseDate(value);
  return date ? date.toLocaleDateString(DATE_LOCALES[lang], options) : "";
}

/** Whole months between two dates (rounded), or null when either is missing. */
export function termLengthMonths(start: string | null | undefined, end: string | null | undefined): number | null {
  const s = parseLeaseDate(start);
  const e = parseLeaseDate(end);
  if (!s || !e) return null;
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  const dayAdjust = e.getDate() - s.getDate() >= 15 ? 1 : e.getDate() - s.getDate() <= -15 ? -1 : 0;
  return Math.max(0, months + dayAdjust);
}

/**
 * Percent of a dated term elapsed (0-100), or null when the lease has no end
 * date. Use the null case to render tenure instead of a progress bar.
 */
export function leaseProgressPercent(lease: LeaseTermLike | null | undefined, now: Date = new Date()): number | null {
  const start = parseLeaseDate(lease?.start_date);
  const end = parseLeaseDate(leaseEndDate(lease));
  if (!start || !end) return null;
  const total = daysBetween(start, end);
  if (total <= 0) return 100;
  const elapsed = daysBetween(start, now);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export type LeaseEndState =
  /** Open-ended, no move-out agreed: show tenure. */
  | { kind: "open_ended"; daysLeft: null }
  /** Open-ended with an approved move-out date. */
  | { kind: "moving_out"; daysLeft: number; endDate: string }
  /** Fixed term still running. */
  | { kind: "fixed"; daysLeft: number; endDate: string; expiringSoon: boolean; urgent: boolean }
  /** Fixed term or move-out date has passed. */
  | { kind: "ended"; daysLeft: number; endDate: string };

/** Single source of truth for countdown / badge decisions. */
export function leaseEndState(lease: LeaseTermLike | null | undefined, now: Date = new Date()): LeaseEndState {
  const endDate = leaseEndDate(lease);
  const daysLeft = daysUntilLeaseEnd(lease, now);
  if (!endDate || daysLeft === null) return { kind: "open_ended", daysLeft: null };
  if (daysLeft < 0) return { kind: "ended", daysLeft, endDate };
  if (isOpenEnded(lease)) return { kind: "moving_out", daysLeft, endDate };
  return {
    kind: "fixed",
    daysLeft,
    endDate,
    expiringSoon: daysLeft <= EXPIRING_SOON_DAYS,
    urgent: daysLeft <= EXPIRING_URGENT_DAYS,
  };
}

/** True only for fixed-term leases ending within `days`. Open-ended leases never "expire". */
export function isLeaseExpiringSoon(
  lease: LeaseTermLike | null | undefined,
  days: number = EXPIRING_SOON_DAYS,
  now: Date = new Date(),
): boolean {
  if (!isFixedTerm(lease)) return false;
  const left = daysUntilLeaseEnd(lease, now);
  return left !== null && left >= 0 && left <= days;
}

/** Whether a lease covers `referenceDate`. A missing end date means it is still running. */
export function isLeaseActiveOnDate(lease: LeaseTermLike | null | undefined, referenceDate: Date = new Date()): boolean {
  if (!lease || lease.status !== "active") return false;
  const start = parseLeaseDate(lease.start_date);
  if (!start) return false;
  const ref = parseLeaseDate(referenceDate) ?? referenceDate;
  if (start > ref) return false;
  const end = parseLeaseDate(leaseEndDate(lease));
  return !end || end >= ref;
}

const OPEN_ENDED_LABEL: Record<LeaseTermLanguage, string> = { en: "Open-ended", fil: "Walang takdang tapos" };

export function leaseTermTypeLabel(termType: unknown, lang: LeaseTermLanguage = "en"): string {
  if (normalizeTermType(termType) === "fixed") return lang === "fil" ? "May takdang termino" : "Fixed term";
  return OPEN_ENDED_LABEL[lang];
}

/**
 * Short label for cards and summaries:
 *  - "Open-ended"
 *  - "Moving out Mar 15, 2027"
 *  - "Ends Mar 15, 2027"
 *  - "Ended Mar 15, 2027"
 */
export function leaseTermLabel(
  lease: LeaseTermLike | null | undefined,
  now: Date = new Date(),
  lang: LeaseTermLanguage = "en",
): string {
  const state = leaseEndState(lease, now);
  if (state.kind === "open_ended") return OPEN_ENDED_LABEL[lang];
  const date = formatLeaseDate(state.endDate, undefined, lang);
  const fil = lang === "fil";
  switch (state.kind) {
    case "moving_out":
      return fil ? `Aalis sa ${date}` : `Moving out ${date}`;
    case "fixed":
      return fil ? `Matatapos sa ${date}` : `Ends ${date}`;
    case "ended":
      return fil ? `Natapos noong ${date}` : `Ended ${date}`;
  }
}

/** "Jan 5, 2025 – Open-ended" or "Jan 5, 2025 – Jan 4, 2026" */
export function leaseDateRangeLabel(lease: LeaseTermLike | null | undefined, lang: LeaseTermLanguage = "en"): string {
  const start = formatLeaseDate(lease?.start_date, undefined, lang);
  const end = leaseEndDate(lease);
  const openEnded = OPEN_ENDED_LABEL[lang];
  if (!start) {
    if (!end) return openEnded;
    const until = formatLeaseDate(end, undefined, lang);
    return lang === "fil" ? `Hanggang ${until}` : `Until ${until}`;
  }
  return `${start} – ${end ? formatLeaseDate(end, undefined, lang) : openEnded}`;
}

/** Longer explanation for detail views and tooltips. */
export function leaseTermDescription(
  lease: LeaseTermLike | null | undefined,
  now: Date = new Date(),
  lang: LeaseTermLanguage = "en",
): string {
  const state = leaseEndState(lease, now);
  if (lang === "fil") {
    const date = state.kind === "open_ended" ? "" : formatLeaseDate(state.endDate, undefined, lang);
    switch (state.kind) {
      case "open_ended":
        return "Buwan-buwan. Tuloy ang upa hangga't nababayaran ito; puwedeng tapusin ito ng alinmang panig basta may napagkasunduang abiso.";
      case "moving_out":
        return state.daysLeft === 0 ? "Ngayong araw ang pag-alis." : `Napagkasunduang pag-alis sa ${date} (${state.daysLeft} araw na lang).`;
      case "fixed":
        return `May takdang termino hanggang ${date} (${state.daysLeft} araw na lang).`;
      case "ended":
        return `Natapos ang termino noong ${date}.`;
    }
  }
  switch (state.kind) {
    case "open_ended":
      return "Month-to-month. The tenancy continues for as long as rent is paid; either side can end it with the agreed notice.";
    case "moving_out":
      return state.daysLeft === 0
        ? "Move-out is today."
        : `Move-out agreed for ${formatLeaseDate(state.endDate)} (${state.daysLeft} day${state.daysLeft === 1 ? "" : "s"} away).`;
    case "fixed":
      return `Fixed term ending ${formatLeaseDate(state.endDate)} (${state.daysLeft} day${state.daysLeft === 1 ? "" : "s"} left).`;
    case "ended":
      return `Term ended ${formatLeaseDate(state.endDate)}.`;
  }
}

/** Sort key so leases without an end date (open-ended) sort after dated ones ascending. */
export function leaseEndSortValue(lease: LeaseTermLike | null | undefined): number {
  const end = parseLeaseDate(leaseEndDate(lease));
  return end ? end.getTime() : Number.MAX_SAFE_INTEGER;
}

/** Days of notice either party gives to end an open-ended tenancy (mirrors MOVE_OUT_NOTICE_DAYS). */
export const OPEN_ENDED_NOTICE_DAYS = 30;

/** Contract wording for the "TERM OF LEASE" clause. */
export function leaseTermClause(lease: LeaseTermLike | null | undefined): string {
  const start = lease?.start_date ?? "";
  const end = leaseEndDate(lease);
  if (isFixedTerm(lease) && end) {
    return `Term begins on ${start} and ends on ${end}.`;
  }
  return (
    `This lease begins on ${start} and continues on a month-to-month basis with no fixed end date, ` +
    `for as long as rent is paid and the terms herein are observed. Either party may end the tenancy ` +
    `by giving at least ${OPEN_ENDED_NOTICE_DAYS} days' written notice.`
  );
}
