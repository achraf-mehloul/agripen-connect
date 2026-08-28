import { useQuery } from "@tanstack/react-query";

import { getSignedUrl, WORKSPACE_BUCKET } from "@/services/storage-service";

/** Resolves a private storage object to a short-lived signed URL. */
export function useSignedUrl(path?: string | null, bucket: string = WORKSPACE_BUCKET) {
  return useQuery({
    queryKey: ["signed-url", bucket, path],
    queryFn: () => getSignedUrl(path!, bucket),
    enabled: Boolean(path),
    staleTime: 50 * 60_000,
    gcTime: 55 * 60_000,
  });
}
