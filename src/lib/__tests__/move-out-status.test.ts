import { describe, it, expect } from "vitest";
import {
  isValidMoveOutStatusTransition,
  getTransitionErrorMessage,
  MOVE_OUT_STATUS_LABELS,
  MOVE_OUT_STATUS_COLORS,
  type MoveOutStatus,
} from "@/lib/move-out-status";

describe("move-out-status", () => {
  // ─── isValidMoveOutStatusTransition ──────────────────────────────────

  describe("isValidMoveOutStatusTransition", () => {
    it("allows same-status transitions (no-op)", () => {
      expect(isValidMoveOutStatusTransition("pending", "pending")).toBe(true);
      expect(isValidMoveOutStatusTransition("approved", "approved")).toBe(true);
      expect(isValidMoveOutStatusTransition("denied", "denied")).toBe(true);
      expect(isValidMoveOutStatusTransition("completed", "completed")).toBe(true);
    });

    it("allows pending → approved", () => {
      expect(isValidMoveOutStatusTransition("pending", "approved")).toBe(true);
    });

    it("allows pending → denied", () => {
      expect(isValidMoveOutStatusTransition("pending", "denied")).toBe(true);
    });

    it("allows approved → completed", () => {
      expect(isValidMoveOutStatusTransition("approved", "completed")).toBe(true);
    });

    it("denies pending → completed (skip approval)", () => {
      expect(isValidMoveOutStatusTransition("pending", "completed")).toBe(false);
    });

    it("denies approved → pending (reverse)", () => {
      expect(isValidMoveOutStatusTransition("approved", "pending")).toBe(false);
    });

    it("denies approved → denied (wrong direction)", () => {
      expect(isValidMoveOutStatusTransition("approved", "denied")).toBe(false);
    });

    it("denies all transitions from denied (terminal state)", () => {
      expect(isValidMoveOutStatusTransition("denied", "pending")).toBe(false);
      expect(isValidMoveOutStatusTransition("denied", "approved")).toBe(false);
      expect(isValidMoveOutStatusTransition("denied", "completed")).toBe(false);
    });

    it("denies all transitions from completed (terminal state)", () => {
      expect(isValidMoveOutStatusTransition("completed", "pending")).toBe(false);
      expect(isValidMoveOutStatusTransition("completed", "approved")).toBe(false);
      expect(isValidMoveOutStatusTransition("completed", "denied")).toBe(false);
    });
  });

  // ─── getTransitionErrorMessage ──────────────────────────────────────

  describe("getTransitionErrorMessage", () => {
    it("returns terminal state message for denied", () => {
      const msg = getTransitionErrorMessage("denied", "pending");
      expect(msg).toContain("terminal state");
      expect(msg).toContain("denied");
    });

    it("returns terminal state message for completed", () => {
      const msg = getTransitionErrorMessage("completed", "approved");
      expect(msg).toContain("terminal state");
      expect(msg).toContain("completed");
    });

    it("returns allowed transitions in message for non-terminal invalid transition", () => {
      const msg = getTransitionErrorMessage("pending", "completed");
      expect(msg).toContain("pending");
      expect(msg).toContain("completed");
      expect(msg).toContain("approved");
      expect(msg).toContain("denied");
    });

    it("returns allowed transitions for approved → denied", () => {
      const msg = getTransitionErrorMessage("approved", "denied");
      expect(msg).toContain("approved");
      expect(msg).toContain("denied");
      expect(msg).toContain("completed");
    });
  });

  // ─── MOVE_OUT_STATUS_LABELS ─────────────────────────────────────────

  describe("MOVE_OUT_STATUS_LABELS", () => {
    it("has a label for every status", () => {
      const statuses: MoveOutStatus[] = ["pending", "approved", "denied", "completed"];
      for (const s of statuses) {
        expect(MOVE_OUT_STATUS_LABELS[s]).toBeDefined();
        expect(typeof MOVE_OUT_STATUS_LABELS[s]).toBe("string");
      }
    });

    it("has correct labels", () => {
      expect(MOVE_OUT_STATUS_LABELS.pending).toBe("Pending Review");
      expect(MOVE_OUT_STATUS_LABELS.approved).toBe("Approved");
      expect(MOVE_OUT_STATUS_LABELS.denied).toBe("Denied");
      expect(MOVE_OUT_STATUS_LABELS.completed).toBe("Completed");
    });
  });

  // ─── MOVE_OUT_STATUS_COLORS ─────────────────────────────────────────

  describe("MOVE_OUT_STATUS_COLORS", () => {
    it("has a color for every status", () => {
      const statuses: MoveOutStatus[] = ["pending", "approved", "denied", "completed"];
      for (const s of statuses) {
        expect(MOVE_OUT_STATUS_COLORS[s]).toBeDefined();
        expect(typeof MOVE_OUT_STATUS_COLORS[s]).toBe("string");
      }
    });

    it("has correct colors", () => {
      expect(MOVE_OUT_STATUS_COLORS.pending).toBe("yellow");
      expect(MOVE_OUT_STATUS_COLORS.approved).toBe("blue");
      expect(MOVE_OUT_STATUS_COLORS.denied).toBe("red");
      expect(MOVE_OUT_STATUS_COLORS.completed).toBe("green");
    });
  });
});
