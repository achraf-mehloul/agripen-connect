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

/** Streams the upload with real byte progress so the UI can show a live percentage. */
async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File | Blob,
  onProgress: (percent: number) => void,
): Promise<boolean> {
  const baseUrl = import.meta.env["VITE_SUPABASE_URL"];
  const apiKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (typeof XMLHttpRequest === "undefined" || !baseUrl || !apiKey) return false;

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;

  return await new Promise<boolean>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${baseUrl}/storage/v1/object/${bucket}/${path}`);
    request.setRequestHeader("authorization", `Bearer ${token}`);
    request.setRequestHeader("apikey", apiKey);
    request.setRequestHeader("x-upsert", "false");
    request.setRequestHeader("cache-control", "3600");
    request.setRequestHeader("content-type", file.type || "application/octet-stream");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve(true);
      } else {
        let message = `Upload failed (${request.status})`;
        try {
          const parsed = JSON.parse(request.responseText) as { message?: string; error?: string };
          message = parsed.message ?? parsed.error ?? message;
        } catch {
          /* keep the generic message */
        }
        reject(new Error(message));
      }
    };
    request.onerror = () => resolve(false);
    request.send(file);
  });
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

  options.onProgress?.(1);
  if (options.onProgress) {
    const streamed = await uploadWithProgress(bucket, path, file, options.onProgress);
    if (streamed) return path;
  }

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
