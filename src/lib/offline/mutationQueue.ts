/**
 * iReside Offline Mutation Queue
 * 
 * Manages optimistic local changes made while disconnected and
 * automatically replays them in FIFO order once connectivity is restored.
 */

import { OfflineBlobStorage } from "./offlineStorage";

export interface OfflineMutation {
  id: string;
  type: 
    | "SAVE_FLYER_TEMPLATE"
    | "SAVE_SUBMETER_READINGS"
    | "SUBMIT_MAINTENANCE_TICKET"
    | "STAGE_PAYMENT_PROOF"
    | "CREATE_COMMUNITY_POST"
    | "RECORD_COMMUNITY_VOTE"
    | "STAGE_OFFLINE_LEASE_SIGNATURE"
    | "SAVE_LANDLORD_SETTINGS";
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  status: "queued" | "syncing" | "failed";
  error?: string;
  description: string;
}

const QUEUE_STORAGE_KEY = "ireside_offline_mutation_queue_v1";

type SyncListener = (queueLength: number, currentMutation?: OfflineMutation) => void;

class MutationQueueManager {
  private listeners: Set<SyncListener> = new Set();
  private isProcessing: boolean = false;

  public getQueue(): OfflineMutation[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: OfflineMutation[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      this.notifyListeners(queue.length);
    } catch (err) {
      console.error("[MutationQueue] Failed to save queue:", err);
    }
  }

  public enqueue(
    type: OfflineMutation["type"],
    endpoint: string,
    method: OfflineMutation["method"],
    payload: Record<string, unknown>,
    description: string
  ): OfflineMutation {
    const mutation: OfflineMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      endpoint,
      method,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
      status: "queued",
      description,
    };

    const queue = this.getQueue();
    queue.push(mutation);
    this.saveQueue(queue);
    return mutation;
  }

  public remove(id: string): void {
    const queue = this.getQueue().filter((item) => item.id !== id);
    this.saveQueue(queue);
  }

  public clear(): void {
    this.saveQueue([]);
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Initial call
    listener(this.getQueue().length);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(queueLength: number, currentMutation?: OfflineMutation): void {
    this.listeners.forEach((l) => l(queueLength, currentMutation));
  }

  /**
   * Helper: Converts base64 DataURL or binary string to a Blob/File.
   */
  private async dataUrlToFile(dataUrl: string, fileName: string, mimeType: string): Promise<File> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: mimeType });
  }

  /**
   * Processes all queued mutations sequentially.
   */
  public async processQueue(): Promise<{ successful: number; failed: number }> {
    if (this.isProcessing || typeof window === "undefined" || !navigator.onLine) {
      return { successful: 0, failed: 0 };
    }

    this.isProcessing = true;
    let successful = 0;
    let failed = 0;

    try {
      const queue = this.getQueue();
      if (queue.length === 0) {
        this.isProcessing = false;
        return { successful: 0, failed: 0 };
      }

      const remainingQueue: OfflineMutation[] = [];

      for (const mutation of queue) {
        mutation.status = "syncing";
        this.notifyListeners(remainingQueue.length + 1, mutation);

        try {
          let response: Response;

          // Special Handling: STAGE_PAYMENT_PROOF with Blob receipt
          if (mutation.type === "STAGE_PAYMENT_PROOF" && mutation.payload.receiptBlobKey) {
            const blobKey = mutation.payload.receiptBlobKey as string;
            const blobEntry = await OfflineBlobStorage.getBlob(blobKey);

            const formData = new FormData();
            formData.append("method", String(mutation.payload.method || "gcash"));
            formData.append("referenceNumber", String(mutation.payload.referenceNumber || ""));
            formData.append("note", String(mutation.payload.note || ""));
            formData.append("selectedItemIds", String(mutation.payload.selectedItemIds || "[]"));
            formData.append("selectedReadingIds", String(mutation.payload.selectedReadingIds || "[]"));
            if (mutation.payload.partialAmount) {
              formData.append("partialAmount", String(mutation.payload.partialAmount));
            }

            if (blobEntry && typeof blobEntry.blobData === "string") {
              const file = await this.dataUrlToFile(
                blobEntry.blobData,
                String(blobEntry.metadata?.name || "receipt.png"),
                String(blobEntry.metadata?.contentType || "image/png")
              );
              formData.append("receipt", file);
            }

            response = await fetch(mutation.endpoint, {
              method: mutation.method,
              headers: {
                "X-Offline-Replay": "true",
                "X-Mutation-Id": mutation.id,
              },
              body: formData,
            });

            // Clean up staged blob on success
            if (response.ok && blobKey) {
              await OfflineBlobStorage.removeBlob(blobKey);
            }
          } else {
            // Standard JSON Request
            response = await fetch(mutation.endpoint, {
              method: mutation.method,
              headers: {
                "Content-Type": "application/json",
                "X-Offline-Replay": "true",
                "X-Mutation-Id": mutation.id,
              },
              body: JSON.stringify(mutation.payload),
            });
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          successful++;
        } catch (err) {
          console.warn(`[MutationQueue] Error syncing mutation ${mutation.id}:`, err);
          mutation.retryCount += 1;
          mutation.status = "failed";
          mutation.error = err instanceof Error ? err.message : "Sync error";
          
          // Re-queue if under max retries (5)
          if (mutation.retryCount < 5) {
            remainingQueue.push(mutation);
          }
          failed++;
        }
      }

      this.saveQueue(remainingQueue);
    } finally {
      this.isProcessing = false;
      this.notifyListeners(this.getQueue().length);
    }

    return { successful, failed };
  }
}

export const mutationQueue = new MutationQueueManager();
