import { describe, it, expect, beforeEach, vi } from "vitest";
import { offlineTaskManager, type OfflineTask } from "../../lib/offline/offlineTaskManager";

describe("offlineTaskManager (Reminders System)", () => {
  beforeEach(() => {
    offlineTaskManager.clearAll();
  });

  it("should add and retrieve offline reminders with correct navigation action URLs", () => {
    const task1 = offlineTaskManager.addTask(
      "payment",
      "₱5,000 Cash Payment",
      "Unit 101 • Monthly Rent",
      { unit: "Unit 101", amount: 5000 }
    );

    const task2 = offlineTaskManager.addTask(
      "utility",
      "Sub-meter Reading",
      "Unit 102 • 150 kWh",
      { unit: "Unit 102", currReading: 150 }
    );

    const all = offlineTaskManager.getTasks();
    expect(all).toHaveLength(2);
    expect(all[0].id).toBe(task2.id); // newest first
    expect(all[0].actionUrl).toBe("/landlord/utilities");
    expect(all[1].actionUrl).toBe("/landlord/dashboard");
  });

  it("should remove individual reminders when dismissed or marked done", () => {
    const task = offlineTaskManager.addTask(
      "maintenance",
      "Leaking Pipe",
      "Unit 201 • Plumbing",
      { unit: "Unit 201" }
    );

    expect(offlineTaskManager.getTasks()).toHaveLength(1);
    offlineTaskManager.removeTask(task.id);
    expect(offlineTaskManager.getTasks()).toHaveLength(0);
  });

  it("should notify subscribers when new reminders are added", () => {
    const listener = vi.fn();
    const unsub = offlineTaskManager.subscribe(listener);

    offlineTaskManager.addTask(
      "registration",
      "Register Juan",
      "Unit 103",
      { fullName: "Juan" }
    );

    expect(listener).toHaveBeenCalled();
    unsub();
  });

  it("should clear all reminders at once", () => {
    offlineTaskManager.addTask("payment", "Task 1", "Sub 1", {});
    offlineTaskManager.addTask("utility", "Task 2", "Sub 2", {});
    expect(offlineTaskManager.getTasks()).toHaveLength(2);

    offlineTaskManager.clearAll();
    expect(offlineTaskManager.getTasks()).toHaveLength(0);
  });
});
