import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type OutboxStatus = "pending" | "syncing" | "synced" | "failed";

/** A single offline-safe mutation. `clientId` is the idempotency key. */
export interface OutboxEntry {
  clientId: string;
  kind: OutboxKind;
  payload: unknown;
  status: OutboxStatus;
  attempts: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

export type OutboxKind =
  | "create_message"
  | "create_post"
  | "create_comment"
  | "toggle_reaction"
  | "create_resource"
  | "create_email"
  | "create_experiment";

interface AgripenDB extends DBSchema {
  outbox: {
    key: string;
    value: OutboxEntry;
    indexes: { by_status: OutboxStatus; by_created: number };
  };
  drafts: {
    key: string;
    value: { key: string; value: string; updatedAt: number };
  };
  cache: {
    key: string;
    value: { key: string; value: unknown; updatedAt: number };
  };
}

const DB_NAME = "agripen-team-app";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AgripenDB>> | null = null;

export function getOfflineDb(): Promise<IDBPDatabase<AgripenDB>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable in this environment"));
  }
  if (!dbPromise) {
    dbPromise = openDB<AgripenDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("outbox")) {
          const outbox = db.createObjectStore("outbox", { keyPath: "clientId" });
          outbox.createIndex("by_status", "status");
          outbox.createIndex("by_created", "createdAt");
        }
        if (!db.objectStoreNames.contains("drafts")) {
          db.createObjectStore("drafts", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("cache")) {
          db.createObjectStore("cache", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

export const offlineStore = {
  async saveDraft(key: string, value: string): Promise<void> {
    const db = await getOfflineDb();
    await db.put("drafts", { key, value, updatedAt: Date.now() });
  },
  async readDraft(key: string): Promise<string | null> {
    const db = await getOfflineDb();
    const row = await db.get("drafts", key);
    return row?.value ?? null;
  },
  async clearDraft(key: string): Promise<void> {
    const db = await getOfflineDb();
    await db.delete("drafts", key);
  },
  async setCache(key: string, value: unknown): Promise<void> {
    const db = await getOfflineDb();
    await db.put("cache", { key, value, updatedAt: Date.now() });
  },
  async getCache<T>(key: string): Promise<T | null> {
    const db = await getOfflineDb();
    const row = await db.get("cache", key);
    return (row?.value as T) ?? null;
  },
  async removeCache(key: string): Promise<void> {
    const db = await getOfflineDb();
    await db.delete("cache", key);
  },
};
