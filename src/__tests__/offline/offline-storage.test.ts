import { describe, it, expect, beforeEach, vi } from "vitest";
import { OfflineStorage } from "@/lib/offline/offlineStorage";
import { mutationQueue } from "@/lib/offline/mutationQueue";

describe("OfflineStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("sets and gets cached snapshot data correctly", () => {
    const mockData = { id: "prop_123", name: "Valenzuela Residences" };
    OfflineStorage.set("properties_list", mockData, 60000, "properties");

    const cached = OfflineStorage.get<typeof mockData>("properties_list");
    expect(cached).not.toBeNull();
    expect(cached?.data).toEqual(mockData);
    expect(cached?.isStale).toBe(false);
  });

  it("handles expired cache entries properly", () => {
    const mockData = { title: "Old Announcement" };
    // Expired 1000ms ago
    OfflineStorage.set("notice_1", mockData, -1000, "notices");

    const cachedAllowExpired = OfflineStorage.get("notice_1", true);
    expect(cachedAllowExpired?.isStale).toBe(true);

    const cachedDisallowExpired = OfflineStorage.get("notice_1", false);
    expect(cachedDisallowExpired).toBeNull();
  });

  it("removes and lists keys accurately", () => {
    OfflineStorage.set("key_a", "val_a");
    OfflineStorage.set("key_b", "val_b");

    expect(OfflineStorage.listKeys()).toContain("key_a");
    expect(OfflineStorage.listKeys()).toContain("key_b");

    OfflineStorage.remove("key_a");
    expect(OfflineStorage.listKeys()).not.toContain("key_a");

    OfflineStorage.clearAll();
    expect(OfflineStorage.listKeys().length).toBe(0);
  });
});

describe("MutationQueue", () => {
  beforeEach(() => {
    localStorage.clear();
    mutationQueue.clear();
  });

  it("enqueues offline mutations and notifies listeners", () => {
    let queueLength = 0;
    const unsubscribe = mutationQueue.subscribe((length) => {
      queueLength = length;
    });

    const mutation = mutationQueue.enqueue(
      "SAVE_FLYER_TEMPLATE",
      "/api/landlord/flyer-template",
      "POST",
      { title: "Test Flyer" },
      "Saved flyer template offline"
    );

    expect(mutation.id).toBeDefined();
    expect(queueLength).toBe(1);
    expect(mutationQueue.getQueue().length).toBe(1);

    unsubscribe();
  });

  it("removes mutations by ID", () => {
    const mut = mutationQueue.enqueue(
      "SAVE_SUBMETER_READINGS",
      "/api/landlord/utility-readings",
      "POST",
      { reading: 123 },
      "Submeter offline batch"
    );

    expect(mutationQueue.getQueue().length).toBe(1);
    mutationQueue.remove(mut.id);
    expect(mutationQueue.getQueue().length).toBe(0);
  });
});
