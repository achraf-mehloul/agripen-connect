import { supabase } from "@/integrations/supabase/client";
import type { AttachmentKind, FileFolder, Profile, WorkspaceFile } from "@/types/domain";

import { fetchProfileMap } from "./hydrate";
import { removeFromStorage } from "./storage-service";

export type FileWithUploader = WorkspaceFile & { uploader: Profile | null };

export async function fetchFolders(): Promise<FileFolder[]> {
  const { data, error } = await supabase
    .from("file_folders")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchFiles(options: {
  folderId?: string | null;
  kind?: AttachmentKind | null;
  search?: string;
}): Promise<FileWithUploader[]> {
  let query = supabase.from("files").select("*").order("created_at", { ascending: false });
  if (options.folderId === null) query = query.is("folder_id", null);
  else if (options.folderId) query = query.eq("folder_id", options.folderId);
  if (options.kind) query = query.eq("kind", options.kind);
  if (options.search?.trim()) query = query.ilike("name", `%${options.search.trim()}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const profiles = await fetchProfileMap(rows.map((row) => row.uploaded_by));
  return rows.map((row) => ({ ...row, uploader: profiles.get(row.uploaded_by) ?? null }));
}

export async function createFolder(name: string, createdBy: string, parentId: string | null = null) {
  const { data, error } = await supabase
    .from("file_folders")
    .insert({ name, created_by: createdBy, parent_id: parentId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function renameFolder(folderId: string, name: string) {
  const { error } = await supabase.from("file_folders").update({ name }).eq("id", folderId);
  if (error) throw new Error(error.message);
}

export async function deleteFolder(folderId: string) {
  const { error } = await supabase.from("file_folders").delete().eq("id", folderId);
  if (error) throw new Error(error.message);
}

export async function registerFile(input: {
  clientId: string;
  uploadedBy: string;
  name: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  kind: AttachmentKind;
  folderId?: string | null;
  groupId?: string | null;
  description?: string | null;
}): Promise<WorkspaceFile> {
  const { data: existing } = await supabase
    .from("files")
    .select("*")
    .eq("client_id", input.clientId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("files")
    .insert({
      client_id: input.clientId,
      uploaded_by: input.uploadedBy,
      name: input.name,
      storage_path: input.storagePath,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      kind: input.kind,
      folder_id: input.folderId ?? null,
      group_id: input.groupId ?? null,
      description: input.description ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function renameFile(fileId: string, name: string) {
  const { error } = await supabase.from("files").update({ name }).eq("id", fileId);
  if (error) throw new Error(error.message);
}

export async function moveFile(fileId: string, folderId: string | null) {
  const { error } = await supabase.from("files").update({ folder_id: folderId }).eq("id", fileId);
  if (error) throw new Error(error.message);
}

export async function deleteFile(file: WorkspaceFile) {
  const { error } = await supabase.from("files").delete().eq("id", file.id);
  if (error) throw new Error(error.message);
  await removeFromStorage([file.storage_path]);
}

export async function fetchStorageSummary() {
  const { data, error } = await supabase.from("files").select("kind, size_bytes");
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const byKind = new Map<AttachmentKind, { count: number; bytes: number }>();
  for (const row of rows) {
    const entry = byKind.get(row.kind) ?? { count: 0, bytes: 0 };
    byKind.set(row.kind, { count: entry.count + 1, bytes: entry.bytes + row.size_bytes });
  }
  return {
    totalFiles: rows.length,
    totalBytes: rows.reduce((sum, row) => sum + row.size_bytes, 0),
    byKind: Array.from(byKind.entries()).map(([kind, value]) => ({ kind, ...value })),
  };
}
