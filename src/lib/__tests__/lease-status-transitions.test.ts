import { describe, it, expect } from "vitest";
import {
  isValidLeaseStatusTransition,
  getAllowedTransitions,
  getTransitionErrorMessage,
} from "../lease-status-transitions";

describe("Lease Status Transition Validation", () => {
  describe("isValidLeaseStatusTransition", () => {
    it("should allow same status (no change)", () => {
      expect(isValidLeaseStatusTransition("draft", "draft")).toBe(true);
      expect(isValidLeaseStatusTransition("active", "active")).toBe(true);
      expect(isValidLeaseStatusTransition("expired", "expired")).toBe(true);
    });

    it("should allow draft -> pending_signature", () => {
      expect(isValidLeaseStatusTransition("draft", "pending_signature")).toBe(true);
    });

    it("should allow draft -> pending_tenant_signature", () => {
      expect(isValidLeaseStatusTransition("draft", "pending_tenant_signature")).toBe(true);
    });

    it("should allow pending_signature -> pending_tenant_signature", () => {
      expect(isValidLeaseStatusTransition("pending_signature", "pending_tenant_signature")).toBe(true);
    });

    it("should allow pending_signature -> pending_landlord_signature", () => {
      expect(isValidLeaseStatusTransition("pending_signature", "pending_landlord_signature")).toBe(true);
    });

    it("should allow pending_tenant_signature -> pending_landlord_signature", () => {
      expect(isValidLeaseStatusTransition("pending_tenant_signature", "pending_landlord_signature")).toBe(true);
    });

    it("should allow pending_landlord_signature -> active", () => {
      expect(isValidLeaseStatusTransition("pending_landlord_signature", "active")).toBe(true);
    });

    it("should allow active -> expired", () => {
      expect(isValidLeaseStatusTransition("active", "expired")).toBe(true);
    });

    it("should allow active -> terminated", () => {
      expect(isValidLeaseStatusTransition("active", "terminated")).toBe(true);
    });

    it("should reject draft -> active (missing intermediate steps)", () => {
      expect(isValidLeaseStatusTransition("draft", "active")).toBe(false);
    });

    it("should reject pending_tenant_signature -> active (missing landlord signature)", () => {
      expect(isValidLeaseStatusTransition("pending_tenant_signature", "active")).toBe(false);
    });

    it("should reject expired -> active (terminal state)", () => {
      expect(isValidLeaseStatusTransition("expired", "active")).toBe(false);
    });

    it("should reject terminated -> active (terminal state)", () => {
      expect(isValidLeaseStatusTransition("terminated", "active")).toBe(false);
    });

    it("should reject expired -> terminated (terminal state)", () => {
      expect(isValidLeaseStatusTransition("expired", "terminated")).toBe(false);
    });

    it("should reject terminated -> expired (terminal state)", () => {
      expect(isValidLeaseStatusTransition("terminated", "expired")).toBe(false);
    });

    it("should reject pending_landlord_signature -> draft (reverse transition)", () => {
      expect(isValidLeaseStatusTransition("pending_landlord_signature", "draft")).toBe(false);
    });

    it("should reject active -> draft (reverse transition)", () => {
      expect(isValidLeaseStatusTransition("active", "draft")).toBe(false);
    });

    it("should reject active -> pending_signature (reverse transition)", () => {
      expect(isValidLeaseStatusTransition("active", "pending_signature")).toBe(false);
    });
  });

  describe("getAllowedTransitions", () => {
    it("should return correct transitions for draft", () => {
      const transitions = getAllowedTransitions("draft");
      expect(transitions).toContain("pending_signature");
      expect(transitions).toContain("pending_tenant_signature");
      expect(transitions.length).toBe(2);
    });

    it("should return correct transitions for pending_signature", () => {
      const transitions = getAllowedTransitions("pending_signature");
      expect(transitions).toContain("pending_tenant_signature");
      expect(transitions).toContain("pending_landlord_signature");
      expect(transitions.length).toBe(2);
    });

    it("should return correct transitions for pending_tenant_signature", () => {
      const transitions = getAllowedTransitions("pending_tenant_signature");
      expect(transitions).toContain("pending_landlord_signature");
      expect(transitions.length).toBe(1);
    });

    it("should return correct transitions for pending_landlord_signature", () => {
      const transitions = getAllowedTransitions("pending_landlord_signature");
      expect(transitions).toContain("active");
      expect(transitions.length).toBe(1);
    });

    it("should return correct transitions for active", () => {
      const transitions = getAllowedTransitions("active");
      expect(transitions).toContain("expired");
      expect(transitions).toContain("terminated");
      expect(transitions.length).toBe(2);
    });

    it("should return empty array for terminal states", () => {
      const expiredTransitions = getAllowedTransitions("expired");
      const terminatedTransitions = getAllowedTransitions("terminated");
      
      expect(expiredTransitions).toEqual([]);
      expect(terminatedTransitions).toEqual([]);
    });
  });

  describe("getTransitionErrorMessage", () => {
    it("should provide helpful error for draft -> active", () => {
      const message = getTransitionErrorMessage("draft", "active");
      expect(message).toContain("draft");
      expect(message).toContain("active");
      expect(message).toContain("Allowed transitions");
    });

    it("should provide helpful error for terminal state transition", () => {
      const message = getTransitionErrorMessage("expired", "active");
      expect(message).toContain("expired");
      expect(message).toContain("active");
      expect(message).toContain("terminal state");
    });

    it("should mention allowed transitions in error message", () => {
      const message = getTransitionErrorMessage("draft", "active");
      expect(message).toContain("pending_signature");
      expect(message).toContain("pending_tenant_signature");
    });

    it("should format error message clearly", () => {
      const message = getTransitionErrorMessage("pending_tenant_signature", "active");
      expect(message).toMatch(/Cannot transition lease from ".*" to ".*"/);
    });
  });

  describe("Complete workflow transitions", () => {
    it("should allow complete signing workflow", () => {
      // Draft -> Pending Tenant Signature
      expect(isValidLeaseStatusTransition("draft", "pending_tenant_signature")).toBe(true);
      
      // Pending Tenant Signature -> Pending Landlord Signature
      expect(isValidLeaseStatusTransition("pending_tenant_signature", "pending_landlord_signature")).toBe(true);
      
      // Pending Landlord Signature -> Active
      expect(isValidLeaseStatusTransition("pending_landlord_signature", "active")).toBe(true);
    });

    it("should allow alternative signing workflow", () => {
      // Draft -> Pending Signature
      expect(isValidLeaseStatusTransition("draft", "pending_signature")).toBe(true);
      
      // Pending Signature -> Pending Landlord Signature (in-person signing)
      expect(isValidLeaseStatusTransition("pending_signature", "pending_landlord_signature")).toBe(true);
      
      // Pending Landlord Signature -> Active
      expect(isValidLeaseStatusTransition("pending_landlord_signature", "active")).toBe(true);
    });

    it("should allow lease expiration workflow", () => {
      // Active -> Expired
      expect(isValidLeaseStatusTransition("active", "expired")).toBe(true);
    });

    it("should allow lease termination workflow", () => {
      // Active -> Terminated
      expect(isValidLeaseStatusTransition("active", "terminated")).toBe(true);
    });
  });
});
