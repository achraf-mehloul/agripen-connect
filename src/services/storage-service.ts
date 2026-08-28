import { supabase } from "@/integrations/supabase/client";
import type { AttachmentKind } from "@/types/domain";

export const AVATARS_BUCKET = "avatars";
export const WORKSPACE_BUCKET = "workspace";

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const ALLOWED_PREFIXES = ["image/", "video/", "audio/"];
const ALLOWED_EXACT = [
  "application/pdf",
  "application/zip",
  "application/json",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export function classifyFile(mimeType: string): AttachmentKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) return "document";
  if (ALLOWED_EXACT.includes(mimeType)) return "document";
  return "other";
}

export function validateUpload(file: File, maxBytes = MAX_UPLOAD_BYTES): string | null {
  if (file.size === 0) return "This file is empty.";
  if (file.size > maxBytes)
    return `"${file.name}" is too large. The maximum is ${Math.round(maxBytes / 1024 / 1024)} MB.`;
  const type = file.type || "application/octet-stream";
  const allowed =
    ALLOWED_PREFIXES.some((prefix) => type.startsWith(prefix)) || ALLOWED_EXACT.includes(type);
  if (!allowed) return `"${file.name}" has an unsupported file type (${type}).`;
  return null;
}

function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(-80);
}

export async function uploadToWorkspace(
  userId: string,
  file: File | Blob,
  fileName: string,
  options: { bucket?: string; folder?: string; onProgress?: (percent: number) => void } = {},
): Promise<string> {
  const bucket = options.bucket ?? WORKSPACE_BUCKET;
  const folder = options.folder ? `${options.folder}/` : "";
  const path = `${userId}/${folder}${Date.now()}-${safeName(fileName)}`;

  options.onProgress?.(10);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw new Error(error.message);
  options.onProgress?.(100);
  return path;
}

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/** Buckets are private, so every render path resolves media through short-lived signed URLs. */
export async function getSignedUrl(
  path: string,
  bucket: string = WORKSPACE_BUCKET,
  expiresInSeconds = 60 * 60,
): Promise<string | null> {
  const cacheKey = `${bucket}:${path}`;
  const cached = signedUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.url;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) return null;

  signedUrlCache.set(cacheKey, {
    url: data.signedUrl,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });
  return data.signedUrl;
}

export async function downloadFile(path: string, fileName: string, bucket = WORKSPACE_BUCKET) {
  const url = await getSignedUrl(path, bucket);
  if (!url) throw new Error("This file could not be prepared for download.");
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function removeFromStorage(paths: string[], bucket = WORKSPACE_BUCKET) {
  if (!paths.length) return;
  await supabase.storage.from(bucket).remove(paths);
}
