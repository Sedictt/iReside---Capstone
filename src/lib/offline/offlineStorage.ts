/**
 * iReside Turnkey Offline Storage Engine
 * 
 * Provides resilient, type-safe client-side caching utilizing LocalStorage
 * and IndexedDB for zero-maintenance turnkey property operations.
 */

export interface CachedSnapshot<T> {
  data: T;
  timestamp: number;
  expiresAt: number | null; // null = persistent until updated
  version: number;
  tag: string;
}

const STORAGE_PREFIX = "ireside_offline_snapshot_";
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days default persistence

export const OfflineStorage = {
  /**
   * Saves a typed snapshot to local cache.
   */
  set<T>(key: string, data: T, ttlMs: number | null = DEFAULT_TTL_MS, tag: string = "general"): void {
    if (typeof window === "undefined") return;
    try {
      const now = Date.now();
      const snapshot: CachedSnapshot<T> = {
        data,
        timestamp: now,
        expiresAt: ttlMs ? now + ttlMs : null,
        version: 1,
        tag,
      };
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(snapshot));
    } catch (err) {
      console.warn(`[OfflineStorage] Failed to cache snapshot for key "${key}":`, err);
    }
  },

  /**
   * Retrieves a typed snapshot from local cache, returning null if missing or expired.
   */
  get<T>(key: string, allowExpired: boolean = true): { data: T; timestamp: number; isStale: boolean } | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!raw) return null;

      const snapshot: CachedSnapshot<T> = JSON.parse(raw);
      const isExpired = snapshot.expiresAt !== null && Date.now() > snapshot.expiresAt;

      if (isExpired && !allowExpired) {
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
        return null;
      }

      return {
        data: snapshot.data,
        timestamp: snapshot.timestamp,
        isStale: isExpired,
      };
    } catch (err) {
      console.warn(`[OfflineStorage] Failed to read snapshot for key "${key}":`, err);
      return null;
    }
  },

  /**
   * Removes a specific snapshot from local cache.
   */
  remove(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  },

  /**
   * Lists all cached snapshot keys currently stored on device.
   */
  listKeys(): string[] {
    if (typeof window === "undefined") return [];
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        keys.push(k.replace(STORAGE_PREFIX, ""));
      }
    }
    return keys;
  },

  /**
   * Clears all iReside offline snapshots from device.
   */
  clearAll(): void {
    if (typeof window === "undefined") return;
    const keys = this.listKeys();
    for (const key of keys) {
      this.remove(key);
    }
  },
};

/**
 * IndexedDB Blob & File Storage for offline images (Receipts, Photos, Leases)
 */
const IDB_NAME = "ireside_offline_blobs";
const IDB_STORE = "media_blobs";

function openBlobDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not supported on this platform"));
      return;
    }
    const request = window.indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const memoryFallbackMap = new Map<string, { id: string; blobData: string | Blob; metadata: Record<string, unknown>; savedAt: number }>();

export const OfflineBlobStorage = {
  /**
   * Stores a large data blob or base64 file offline in IndexedDB, with LocalStorage/memory fallback.
   */
  async saveBlob(id: string, blobData: string | Blob, metadata?: Record<string, unknown>): Promise<void> {
    try {
      const db = await openBlobDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);
        const entry = {
          id,
          blobData,
          metadata: metadata || {},
          savedAt: Date.now(),
        };
        const req = store.put(entry);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to in-memory / local storage
      const entry = {
        id,
        blobData: typeof blobData === "string" ? blobData : "[Binary Blob]",
        metadata: metadata || {},
        savedAt: Date.now(),
      };
      memoryFallbackMap.set(id, entry);
      if (typeof window !== "undefined" && typeof blobData === "string") {
        try {
          localStorage.setItem(`ireside_blob_${id}`, JSON.stringify(entry));
        } catch {
          // Ignore quota error in fallback
        }
      }
    }
  },

  /**
   * Retrieves a stored offline blob from IndexedDB, with LocalStorage/memory fallback.
   */
  async getBlob(id: string): Promise<{ id: string; blobData: string | Blob; metadata: Record<string, unknown>; savedAt: number } | null> {
    try {
      const db = await openBlobDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      if (memoryFallbackMap.has(id)) {
        return memoryFallbackMap.get(id) || null;
      }
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(`ireside_blob_${id}`);
        return raw ? JSON.parse(raw) : null;
      }
      return null;
    }
  },

  /**
   * Deletes a stored offline blob from IndexedDB.
   */
  async removeBlob(id: string): Promise<void> {
    try {
      const db = await openBlobDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      memoryFallbackMap.delete(id);
      if (typeof window !== "undefined") {
        localStorage.removeItem(`ireside_blob_${id}`);
      }
    }
  },
};
