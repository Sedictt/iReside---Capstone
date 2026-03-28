import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  saveWizardState,
  loadWizardState,
  clearWizardState,
  isLocalStorageAvailable,
  getWizardStateAge,
  isWizardStateExpired,
} from "../wizard-storage";

describe("Wizard Storage Utilities", () => {
  const TEST_KEY = "iReside_wizard_state";

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe("isLocalStorageAvailable", () => {
    it("should return true when localStorage is available", () => {
      const result = isLocalStorageAvailable();
      expect(result).toBe(true);
    });

    it("should return false when localStorage is unavailable", () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error("localStorage unavailable");
      };

      const result = isLocalStorageAvailable();
      expect(result).toBe(false);

      // Restore original function
      localStorage.setItem = originalSetItem;
    });
  });

  describe("saveWizardState", () => {
    it("should save state to localStorage", () => {
      const data = { step: 1, applicationId: "app-123" };
      saveWizardState(data);

      const serialized = localStorage.getItem(TEST_KEY);
      expect(serialized).toBeTruthy();

      const parsed = JSON.parse(serialized!);
      expect(parsed.data).toEqual(data);
      expect(parsed.version).toBeDefined();
      expect(parsed.timestamp).toBeDefined();
    });

    it("should include version in saved state", () => {
      const data = { step: 1 };
      saveWizardState(data);

      const serialized = localStorage.getItem(TEST_KEY);
      const parsed = JSON.parse(serialized!);

      expect(parsed.version).toBe(1);
    });

    it("should include timestamp in saved state", () => {
      const data = { step: 1 };
      const beforeSave = Date.now();
      saveWizardState(data);
      const afterSave = Date.now();

      const serialized = localStorage.getItem(TEST_KEY);
      const parsed = JSON.parse(serialized!);

      expect(parsed.timestamp).toBeGreaterThanOrEqual(beforeSave);
      expect(parsed.timestamp).toBeLessThanOrEqual(afterSave);
    });

    it("should throw error when localStorage quota exceeded", () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      };

      expect(() => saveWizardState({ step: 1 })).toThrow("Local storage quota exceeded");

      // Restore original function
      localStorage.setItem = originalSetItem;
    });

    it("should throw error when localStorage is unavailable", () => {
      // Mock localStorage to throw generic error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error("localStorage unavailable");
      };

      expect(() => saveWizardState({ step: 1 })).toThrow("Failed to save wizard state");

      // Restore original function
      localStorage.setItem = originalSetItem;
    });

    it("should overwrite existing state", () => {
      const data1 = { step: 1, applicationId: "app-123" };
      saveWizardState(data1);

      const data2 = { step: 2, applicationId: "app-456" };
      saveWizardState(data2);

      const serialized = localStorage.getItem(TEST_KEY);
      const parsed = JSON.parse(serialized!);

      expect(parsed.data).toEqual(data2);
    });
  });

  describe("loadWizardState", () => {
    it("should load state from localStorage", () => {
      const data = { step: 1, applicationId: "app-123" };
      saveWizardState(data);

      const loaded = loadWizardState();
      expect(loaded).toEqual(data);
    });

    it("should return null when no state exists", () => {
      const loaded = loadWizardState();
      expect(loaded).toBeNull();
    });

    it("should return null for expired state", () => {
      const data = { step: 1 };
      saveWizardState(data);

      // Manually set timestamp to 25 hours ago (expired)
      const serialized = localStorage.getItem(TEST_KEY);
      const parsed = JSON.parse(serialized!);
      parsed.timestamp = Date.now() - (25 * 60 * 60 * 1000);
      localStorage.setItem(TEST_KEY, JSON.stringify(parsed));

      const loaded = loadWizardState();
      expect(loaded).toBeNull();

      // Should clear expired state
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it("should return null for stale state (version mismatch)", () => {
      const data = { step: 1 };
      saveWizardState(data);

      // Manually set version to 0 (stale)
      const serialized = localStorage.getItem(TEST_KEY);
      const parsed = JSON.parse(serialized!);
      parsed.version = 0;
      localStorage.setItem(TEST_KEY, JSON.stringify(parsed));

      const loaded = loadWizardState();
      expect(loaded).toBeNull();

      // Should clear stale state
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it("should return null for invalid JSON", () => {
      localStorage.setItem(TEST_KEY, "invalid-json");

      const loaded = loadWizardState();
      expect(loaded).toBeNull();

      // Should clear invalid state
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it("should return null for malformed state", () => {
      localStorage.setItem(TEST_KEY, JSON.stringify({ invalid: "state" }));

      const loaded = loadWizardState();
      expect(loaded).toBeNull();
    });
  });

  describe("clearWizardState", () => {
    it("should clear state from localStorage", () => {
      const data = { step: 1 };
      saveWizardState(data);

      expect(localStorage.getItem(TEST_KEY)).toBeTruthy();

      clearWizardState();

      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it("should not throw error when no state exists", () => {
      expect(() => clearWizardState()).not.toThrow();
    });

    it("should not throw error when localStorage is unavailable", () => {
      // Mock localStorage.removeItem to throw error
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = () => {
        throw new Error("localStorage unavailable");
      };

      expect(() => clearWizardState()).not.toThrow();

      // Restore original function
      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe("getWizardStateAge", () => {
    it("should return age of stored state in milliseconds", () => {
      const beforeSave = Date.now();
      saveWizardState({ step: 1 });
      const afterSave = Date.now();

      const age = getWizardStateAge();
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThanOrEqual(afterSave - beforeSave);
    });

    it("should return null when no state exists", () => {
      const age = getWizardStateAge();
      expect(age).toBeNull();
    });

    it("should return null for invalid state", () => {
      localStorage.setItem(TEST_KEY, "invalid-json");

      const age = getWizardStateAge();
      expect(age).toBeNull();
    });
  });

  describe("isWizardStateExpired", () => {
    it("should return true when no state exists", () => {
      const isExpired = isWizardStateExpired();
      expect(isExpired).toBe(true);
    });

    it("should return false for fresh state", () => {
      saveWizardState({ step: 1 });

      const isExpired = isWizardStateExpired();
      expect(isExpired).toBe(false);
    });

    it("should return true for expired state (> 24 hours)", () => {
      saveWizardState({ step: 1 });

      // Manually set timestamp to 25 hours ago
      const serialized = localStorage.getItem(TEST_KEY);
      const parsed = JSON.parse(serialized!);
      parsed.timestamp = Date.now() - (25 * 60 * 60 * 1000);
      localStorage.setItem(TEST_KEY, JSON.stringify(parsed));

      const isExpired = isWizardStateExpired();
      expect(isExpired).toBe(true);
    });

    it("should return false for state just under 24 hours", () => {
      saveWizardState({ step: 1 });

      // Manually set timestamp to 23 hours ago
      const serialized = localStorage.getItem(TEST_KEY);
      const parsed = JSON.parse(serialized!);
      parsed.timestamp = Date.now() - (23 * 60 * 60 * 1000);
      localStorage.setItem(TEST_KEY, JSON.stringify(parsed));

      const isExpired = isWizardStateExpired();
      expect(isExpired).toBe(false);
    });

    it("should return true for invalid state", () => {
      localStorage.setItem(TEST_KEY, "invalid-json");

      const isExpired = isWizardStateExpired();
      expect(isExpired).toBe(true);
    });
  });

  describe("Complete workflow", () => {
    it("should save, load, and clear state correctly", () => {
      const data = { step: 1, applicationId: "app-123", tenantId: "tenant-456" };

      // Save
      saveWizardState(data);
      expect(localStorage.getItem(TEST_KEY)).toBeTruthy();

      // Load
      const loaded = loadWizardState();
      expect(loaded).toEqual(data);

      // Clear
      clearWizardState();
      expect(localStorage.getItem(TEST_KEY)).toBeNull();

      // Load after clear
      const loadedAfterClear = loadWizardState();
      expect(loadedAfterClear).toBeNull();
    });

    it("should handle multiple saves correctly", () => {
      const data1 = { step: 1, applicationId: "app-123" };
      const data2 = { step: 2, applicationId: "app-456" };
      const data3 = { step: 3, applicationId: "app-789" };

      saveWizardState(data1);
      expect(loadWizardState()).toEqual(data1);

      saveWizardState(data2);
      expect(loadWizardState()).toEqual(data2);

      saveWizardState(data3);
      expect(loadWizardState()).toEqual(data3);
    });
  });
});
