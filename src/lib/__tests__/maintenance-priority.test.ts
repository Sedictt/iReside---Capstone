import { describe, expect, it } from "vitest";
import { filModuleDictionary } from "@/lib/i18n/modules";
import {
  MAINTENANCE_PRIORITY_BADGE_CLASSES,
  MAINTENANCE_PRIORITY_BADGE_TEXT,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_PRIORITY_RANK,
  MAINTENANCE_PRIORITY_SOFT_CLASSES,
  MAINTENANCE_PRIORITY_VALUES,
  toDbPriority,
  toPriorityLabel,
} from "@/lib/maintenance-priority";

describe("maintenance-priority", () => {
  it("maps every DB value to one label", () => {
    expect(MAINTENANCE_PRIORITY_VALUES.map(toPriorityLabel)).toEqual(["Low", "Medium", "High", "Critical"]);
    expect(MAINTENANCE_PRIORITY_LABELS).toEqual({ low: "Low", medium: "Medium", high: "High", urgent: "Critical" });
  });

  it("reads urgent as Critical whether given the DB value or the label", () => {
    expect(toPriorityLabel("urgent")).toBe("Critical");
    expect(toPriorityLabel("URGENT")).toBe("Critical");
    expect(toPriorityLabel("Critical")).toBe("Critical");
    expect(toPriorityLabel("High")).toBe("High");
  });

  it("falls back to Low for missing or unknown values", () => {
    expect(toPriorityLabel(null)).toBe("Low");
    expect(toPriorityLabel(undefined)).toBe("Low");
    expect(toPriorityLabel("normal")).toBe("Low");
  });

  it("round-trips labels back to DB values", () => {
    for (const value of MAINTENANCE_PRIORITY_VALUES) {
      expect(toDbPriority(toPriorityLabel(value))).toBe(value);
    }
    expect(toDbPriority("Critical")).toBe("urgent");
  });

  it("ranks priorities from Low to Critical", () => {
    const ranks = MAINTENANCE_PRIORITY_VALUES.map((value) => MAINTENANCE_PRIORITY_RANK[toPriorityLabel(value)]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(new Set(ranks).size).toBe(ranks.length);
  });

  it("gives every label badge text, colours and a Filipino translation", () => {
    for (const value of MAINTENANCE_PRIORITY_VALUES) {
      const label = toPriorityLabel(value);
      expect(MAINTENANCE_PRIORITY_BADGE_CLASSES[label]).toBeTruthy();
      expect(MAINTENANCE_PRIORITY_SOFT_CLASSES[label]).toBeTruthy();
      expect(filModuleDictionary[label]).toBeTruthy();
      expect(filModuleDictionary[MAINTENANCE_PRIORITY_BADGE_TEXT[label]]).toBeTruthy();
    }
    expect(MAINTENANCE_PRIORITY_BADGE_TEXT.Critical).toBe("Critical Priority");
  });
});
