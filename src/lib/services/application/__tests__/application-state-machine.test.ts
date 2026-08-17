import { describe, it, expect } from "vitest";
import {
  canTransitionApplication,
  validateApplicationTransition,
  isTerminalApplicationStatus,
} from "../application-state-machine";
import { InvalidApplicationStateError } from "../application.errors";

describe("Application State Machine", () => {
  describe("canTransitionApplication", () => {
    it("allows transitions from pending to reviewing, approved, payment_pending, rejected, withdrawn", () => {
      expect(canTransitionApplication("pending", "reviewing")).toBe(true);
      expect(canTransitionApplication("pending", "approved")).toBe(true);
      expect(canTransitionApplication("pending", "payment_pending")).toBe(true);
      expect(canTransitionApplication("pending", "rejected")).toBe(true);
      expect(canTransitionApplication("pending", "withdrawn")).toBe(true);
    });

    it("allows same-status idempotent transitions", () => {
      expect(canTransitionApplication("pending", "pending")).toBe(true);
      expect(canTransitionApplication("approved", "approved")).toBe(true);
      expect(canTransitionApplication("rejected", "rejected")).toBe(true);
    });

    it("disallows transitions from terminal states", () => {
      expect(canTransitionApplication("rejected", "pending")).toBe(false);
      expect(canTransitionApplication("rejected", "approved")).toBe(false);
      expect(canTransitionApplication("withdrawn", "approved")).toBe(false);
    });
  });

  describe("validateApplicationTransition", () => {
    it("does not throw on valid transition", () => {
      expect(() => validateApplicationTransition("pending", "reviewing")).not.toThrow();
    });

    it("throws InvalidApplicationStateError on invalid transition", () => {
      expect(() => validateApplicationTransition("rejected", "approved")).toThrow(
        InvalidApplicationStateError,
      );
    });
  });

  describe("isTerminalApplicationStatus", () => {
    it("identifies rejected and withdrawn as terminal", () => {
      expect(isTerminalApplicationStatus("rejected")).toBe(true);
      expect(isTerminalApplicationStatus("withdrawn")).toBe(true);
      expect(isTerminalApplicationStatus("pending")).toBe(false);
      expect(isTerminalApplicationStatus("approved")).toBe(false);
    });
  });
});
