import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

import { offlineStore } from "./database";

const CACHE_KEY = "react-query-cache";

/**
 * Persists the TanStack Query cache into IndexedDB so previously loaded feeds,
 * conversations and file listings stay readable with no network.
 */
export function createIndexedDbPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await offlineStore.setCache(CACHE_KEY, client);
      } catch {
        /* storage full or unavailable — offline cache is best-effort */
      }
    },
    restoreClient: async () => {
      try {
        return (await offlineStore.getCache<PersistedClient>(CACHE_KEY)) ?? undefined;
      } catch {
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        await offlineStore.removeCache(CACHE_KEY);
      } catch {
        /* ignore */
      }
    },
  };
}
