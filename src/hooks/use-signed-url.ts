import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { clearSignedUrl, getSignedUrl, WORKSPACE_BUCKET } from "@/services/storage-service";

/**
 * Resolves a private storage object to a short-lived signed URL.
 *
 * Signed URLs expire, so this query is never persisted offline (see __root.tsx)
 * and callers can force a refresh when a media element fails to load.
 */
export function useSignedUrl(path?: string | null, bucket: string = WORKSPACE_BUCKET) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["signed-url", bucket, path],
    queryFn: () => getSignedUrl(path!, bucket),
    enabled: Boolean(path),
    staleTime: 45 * 60_000,
    gcTime: 50 * 60_000,
  });

  const refresh = useCallback(() => {
    if (!path) return;
    clearSignedUrl(path, bucket);
    void queryClient.invalidateQueries({ queryKey: ["signed-url", bucket, path] });
  }, [bucket, path, queryClient]);

  return { ...query, refresh };
}
