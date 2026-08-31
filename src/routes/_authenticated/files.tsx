import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FolderPlus, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { formatBytes, formatRelative, fullName } from "@/lib/format";
import { createClientId } from "@/lib/ids";
import {
  createFolder,
  deleteFile,
  fetchFiles,
  fetchFolders,
  fetchStorageSummary,
  type FileWithUploader,
} from "@/services/file-service";
import { prepareFiles } from "@/services/media-service";
import {
  classifyFile,
  getSignedUrl,
  uploadToWorkspace,
  validateUpload,
} from "@/services/storage-service";
import { registerFile } from "@/services/file-service";

export const Route = createFileRoute("/_authenticated/files")({
  head: () => ({
    meta: [
      { title: "Files — AgriPen Team App" },
      {
        name: "description",
        content: "Shared documents, photos and datasets for the AgriPen field team.",
      },
      { property: "og:title", content: "Files — AgriPen Team App" },
      {
        property: "og:description",
        content: "Shared documents, photos and datasets for the AgriPen field team.",
      },
    ],
  }),
  component: FilesPage,
});

function FilesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [folderId, setFolderId] = useState<string | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const folders = useQuery({ queryKey: ["file-folders"], queryFn: fetchFolders });
  const files = useQuery({
    queryKey: ["files", folderId ?? "all", search],
    queryFn: () => fetchFiles({ folderId: folderId ?? undefined, search }),
  });
  const summary = useQuery({ queryKey: ["storage-summary"], queryFn: fetchStorageSummary });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["files"] });
    void queryClient.invalidateQueries({ queryKey: ["storage-summary"] });
  };

  const remove = useMutation({
    mutationFn: (file: FileWithUploader) => deleteFile(file),
    onSuccess: () => {
      toast.success("File deleted");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const onPick = async (picked: FileList | null) => {
    if (!picked?.length || !user) return;
    const list = Array.from(picked);
    for (const file of list) {
      const problem = validateUpload(file);
      if (problem) {
        toast.error(problem);
        return;
      }
    }
    setUploading(true);
    try {
      const prepared = await prepareFiles(list);
      await Promise.all(
        prepared.map(async (file) => {
          const path = await uploadToWorkspace(user.id, file, file.name, { folder: "files" });
          await registerFile({
            clientId: createClientId("file"),
            uploadedBy: user.id,
            name: file.name,
            storagePath: path,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            kind: classifyFile(file.type || ""),
            folderId: folderId ?? null,
          });
        }),
      );
      toast.success(prepared.length > 1 ? `${prepared.length} files uploaded` : "File uploaded");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onCreateFolder = async () => {
    const name = window.prompt("Folder name");
    if (!name?.trim() || !user) return;
    try {
      await createFolder(name.trim(), user.id);
      void queryClient.invalidateQueries({ queryKey: ["file-folders"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create folder");
    }
  };

  const onDownload = async (file: FileWithUploader) => {
    try {
      const url = await getSignedUrl(file.storage_path);
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error("Could not open that file");
    }
  };

  return (
    <section className="space-y-4">
      <header className="glass rounded-3xl p-5">
        <h1 className="font-display text-2xl font-bold tracking-tight">Files</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {summary.data
            ? `${summary.data.totalFiles} files · ${formatBytes(summary.data.totalBytes)} stored`
            : "Shared workspace storage"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => void onPick(event.target.files)}
          />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload
          </Button>
          <Button variant="outline" onClick={() => void onCreateFolder()}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New folder
          </Button>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search files…"
            className="w-full sm:w-56"
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={folderId === undefined ? "default" : "outline"}
          onClick={() => setFolderId(undefined)}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={folderId === null ? "default" : "outline"}
          onClick={() => setFolderId(null)}
        >
          Unfiled
        </Button>
        {(folders.data ?? []).map((folder) => (
          <Button
            key={folder.id}
            size="sm"
            variant={folderId === folder.id ? "default" : "outline"}
            onClick={() => setFolderId(folder.id)}
          >
            {folder.name}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {files.isLoading ? (
          <>
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </>
        ) : (files.data ?? []).length === 0 ? (
          <p className="glass rounded-3xl p-6 text-sm text-muted-foreground">
            No files here yet. Upload the first one.
          </p>
        ) : (
          (files.data ?? []).map((file) => (
            <article
              key={file.id}
              className="glass surface-hover flex items-center gap-3 rounded-2xl p-3"
            >
              <UserAvatar profile={file.uploader} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{file.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatBytes(file.size_bytes)} · {file.kind} ·{" "}
                  {fullName(file.uploader?.first_name, file.uploader?.last_name)} ·{" "}
                  {formatRelative(file.created_at)}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-xl"
                aria-label="Download"
                onClick={() => void onDownload(file)}
              >
                <Download className="h-4 w-4" />
              </Button>
              {file.uploaded_by === user?.id ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-xl text-destructive"
                  aria-label="Delete"
                  onClick={() => remove.mutate(file)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
