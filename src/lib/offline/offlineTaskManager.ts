/**
 * iReside Offline Action Reminders & Task Notepad
 * 
 * Stores reminders of actions noted down while in dead zones,
 * allowing landlords to review their notes and manually record/process
 * them through standard system workflows once internet connectivity returns.
 */

export type OfflineTaskType = 
  | "payment" 
  | "utility" 
  | "maintenance" 
  | "registration" 
  | "lease_signature";

export interface OfflineTask {
  id: string;
  type: OfflineTaskType;
  title: string;
  subtitle: string;
  createdAt: number;
  payload: Record<string, any>;
  status: "pending" | "completed";
  actionUrl: string;
  actionLabel: string;
}

const STORAGE_KEY = "ireside_offline_tasks_v1";

type TaskListener = (tasks: OfflineTask[]) => void;

class OfflineTaskManager {
  private listeners: Set<TaskListener> = new Set();

  public getTasks(): OfflineTask[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveTasks(tasks: OfflineTask[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      this.notifyListeners(tasks);
    } catch (err) {
      console.error("[OfflineTaskManager] Failed to save tasks:", err);
    }
  }

  public addTask(
    type: OfflineTaskType,
    title: string,
    subtitle: string,
    payload: Record<string, any>
  ): OfflineTask {
    let actionUrl = "/landlord/dashboard";
    let actionLabel = "Open Payments";

    switch (type) {
      case "payment":
        actionUrl = "/landlord/dashboard";
        actionLabel = "Open Payments";
        break;
      case "utility":
        actionUrl = "/landlord/utilities";
        actionLabel = "Open Utilities";
        break;
      case "maintenance":
        actionUrl = "/landlord/maintenance";
        actionLabel = "Open Maintenance";
        break;
      case "registration":
        actionUrl = "/landlord/tenants";
        actionLabel = "Open Tenant List";
        break;
      case "lease_signature":
        actionUrl = "/landlord/visual-planner";
        actionLabel = "Open Leases";
        break;
    }

    const task: OfflineTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      subtitle,
      createdAt: Date.now(),
      payload,
      status: "pending",
      actionUrl,
      actionLabel,
    };

    const tasks = this.getTasks();
    tasks.unshift(task); // newest first
    this.saveTasks(tasks);
    return task;
  }

  public updateTask(id: string, updates: Partial<OfflineTask>): void {
    const tasks = this.getTasks().map((t) => (t.id === id ? { ...t, ...updates } : t));
    this.saveTasks(tasks);
  }

  public removeTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    this.saveTasks(tasks);
  }

  public clearAll(): void {
    this.saveTasks([]);
  }

  public subscribe(listener: TaskListener): () => void {
    this.listeners.add(listener);
    listener(this.getTasks());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(tasks: OfflineTask[]): void {
    this.listeners.forEach((l) => l(tasks));
  }
}

export const offlineTaskManager = new OfflineTaskManager();
