import { describe, expect, it } from "vitest";
import {
  addMonthsIso,
  daysUntilLeaseEnd,
  formatTenure,
  formatTenureShort,
  isLeaseActiveOnDate,
  isLeaseExpiringSoon,
  isOpenEnded,
  leaseDateRangeLabel,
  leaseEndSortValue,
  leaseEndState,
  leaseProgressPercent,
  leaseTermLabel,
  normalizeTermType,
  tenureMonths,
  termLengthMonths,
} from "@/lib/lease-term";

const NOW = new Date(2026, 9, 13); // 2026-10-13 local

describe("lease-term", () => {
  it("defaults unknown/blank term types to open-ended", () => {
    expect(normalizeTermType(undefined)).toBe("open_ended");
    expect(normalizeTermType("")).toBe("open_ended");
    expect(normalizeTermType("month_to_month")).toBe("open_ended");
    expect(normalizeTermType("fixed")).toBe("fixed");
    expect(isOpenEnded({ term_type: null })).toBe(true);
    expect(isOpenEnded({ term_type: "fixed" })).toBe(false);
  });

  it("returns null days remaining and null progress for open-ended leases", () => {
    const lease = { term_type: "open_ended", start_date: "2025-03-01", end_date: null };
    expect(daysUntilLeaseEnd(lease, NOW)).toBeNull();
    expect(leaseProgressPercent(lease, NOW)).toBeNull();
    expect(leaseEndState(lease, NOW)).toEqual({ kind: "open_ended", daysLeft: null });
    expect(leaseTermLabel(lease, NOW)).toBe("Open-ended");
    expect(leaseDateRangeLabel(lease)).toBe("Mar 1, 2025 – Open-ended");
  });

  it("treats an open-ended lease with an end date as a scheduled move-out", () => {
    const lease = { term_type: "open_ended", start_date: "2025-03-01", end_date: "2026-11-30" };
    const state = leaseEndState(lease, NOW);
    expect(state.kind).toBe("moving_out");
    expect(state.daysLeft).toBe(48);
    expect(leaseTermLabel(lease, NOW)).toBe("Moving out Nov 30, 2026");
    expect(isLeaseExpiringSoon(lease, 90, NOW)).toBe(false);
  });

  it("computes countdown, expiring-soon and urgency for fixed terms", () => {
    const soon = { term_type: "fixed", start_date: "2025-12-01", end_date: "2026-11-30" };
    expect(daysUntilLeaseEnd(soon, NOW)).toBe(48);
    expect(isLeaseExpiringSoon(soon, 90, NOW)).toBe(true);
    const state = leaseEndState(soon, NOW);
    expect(state.kind).toBe("fixed");
    if (state.kind === "fixed") {
      expect(state.expiringSoon).toBe(true);
      expect(state.urgent).toBe(false);
    }
    expect(leaseTermLabel(soon, NOW)).toBe("Ends Nov 30, 2026");

    const far = { term_type: "fixed", start_date: "2026-01-01", end_date: "2027-12-31" };
    expect(isLeaseExpiringSoon(far, 90, NOW)).toBe(false);

    const past = { term_type: "fixed", start_date: "2025-01-01", end_date: "2025-12-31" };
    expect(leaseEndState(past, NOW).kind).toBe("ended");
    expect(leaseTermLabel(past, NOW)).toBe("Ended Dec 31, 2025");
  });

  it("computes progress for dated terms", () => {
    const lease = { term_type: "fixed", start_date: "2026-01-01", end_date: "2026-12-31" };
    const pct = leaseProgressPercent(lease, NOW)!;
    expect(pct).toBeGreaterThan(75);
    expect(pct).toBeLessThan(80);
    expect(leaseProgressPercent(lease, new Date(2027, 0, 1))).toBe(100);
    expect(leaseProgressPercent(lease, new Date(2025, 0, 1))).toBe(0);
  });

  it("formats tenure in plain language", () => {
    expect(tenureMonths("2025-03-01", NOW)).toBe(19);
    expect(formatTenure("2025-03-01", NOW)).toBe("1 year 7 months");
    expect(formatTenure("2024-10-13", NOW)).toBe("2 years");
    expect(formatTenure("2026-08-01", NOW)).toBe("2 months");
    expect(formatTenure("2026-10-01", NOW)).toBe("1 week");
    expect(formatTenure("2026-10-10", NOW)).toBe("3 days");
    expect(formatTenure("2026-10-13", NOW)).toBe("Started today");
    expect(formatTenure("2026-10-20", NOW)).toBe("Starts in 7 days");
    expect(formatTenureShort("2025-03-01", NOW)).toBe("1y 7m");
    expect(formatTenureShort("2026-08-01", NOW)).toBe("2m");
    expect(formatTenureShort("2026-10-12", NOW)).toBe("new");
  });

  it("treats a missing end date as still active for occupancy maths", () => {
    const open = { status: "active", term_type: "open_ended", start_date: "2025-01-01", end_date: null };
    expect(isLeaseActiveOnDate(open, NOW)).toBe(true);
    expect(isLeaseActiveOnDate(open, new Date(2024, 11, 31))).toBe(false);
    const fixed = { status: "active", term_type: "fixed", start_date: "2025-01-01", end_date: "2025-12-31" };
    expect(isLeaseActiveOnDate(fixed, NOW)).toBe(false);
    expect(isLeaseActiveOnDate(fixed, new Date(2025, 5, 1))).toBe(true);
    expect(isLeaseActiveOnDate({ ...open, status: "draft" }, NOW)).toBe(false);
  });

  it("sorts open-ended leases after dated ones", () => {
    const open = { term_type: "open_ended", end_date: null };
    const dated = { term_type: "fixed", end_date: "2026-12-31" };
    expect(leaseEndSortValue(open)).toBeGreaterThan(leaseEndSortValue(dated));
  });

  it("adds months with end-of-month clamping and measures term length", () => {
    expect(addMonthsIso("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsIso("2026-03-15", 12)).toBe("2027-03-15");
    expect(termLengthMonths("2026-01-01", "2026-12-31")).toBe(12);
    expect(termLengthMonths("2026-01-01", "2026-07-01")).toBe(6);
    expect(termLengthMonths("2026-01-01", null)).toBeNull();
  });
});
