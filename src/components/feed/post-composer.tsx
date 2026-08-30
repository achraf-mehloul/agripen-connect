import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Paperclip, Send, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth-context";
import { formatBytes } from "@/lib/format";
import { createClientId } from "@/lib/ids";
import { prepareFiles } from "@/services/media-service";
import { createPost } from "@/services/post-service";
import {
  classifyFile,
  uploadToWorkspace,
  validateUpload,
} from "@/services/storage-service";
import type { Group, NewAttachmentInput, PostKind } from "@/types/domain";

export function PostComposer({ groups }: { groups: Group[] }) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [groupId, setGroupId] = useState<string>("none");
  const [files, setFiles] = useState<File[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be signed in.");
      // Shrink photos in the browser, then upload every attachment in parallel.
      const prepared = await prepareFiles(files);
      const attachments: NewAttachmentInput[] = await Promise.all(
        prepared.map(async (file) => {
          const path = await uploadToWorkspace(user.id, file, file.name, { folder: "feed" });
          return {
            storage_path: path,
            file_name: file.name,
            mime_type: file.type || "application/octet-stream",
            size_bytes: file.size,
            kind: classifyFile(file.type),
          } satisfies NewAttachmentInput;
        }),
      );
      const kind: PostKind = attachments.length
        ? attachments[0]!.kind === "image"
          ? "image"
          : attachments[0]!.kind === "video"
            ? "video"
            : "file"
        : "update";

      return createPost({
        clientId: createClientId("post"),
        authorId: user.id,
        kind,
        body: body.trim(),
        groupId: groupId === "none" ? null : groupId,
        attachments,
      });
    },
    onSuccess: () => {
      setBody("");
      setFiles([]);
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Posted to the team feed");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not post"),
  });

  const onPick = (list: FileList | null) => {
    if (!list) return;
    const next: File[] = [];
    for (const file of Array.from(list)) {
      const problem = validateUpload(file);
      if (problem) toast.error(problem);
      else next.push(file);
    }
    setFiles((current) => [...current, ...next].slice(0, 6));
  };

  const disabled = mutation.isPending || (!body.trim() && !files.length);

  return (
    <div className="glass rounded-3xl p-4 sm:p-5">
      <div className="flex gap-3">
        <UserAvatar profile={profile} />
        <div className="min-w-0 flex-1 space-y-3">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share an update, a finding or a field note…"
            className="min-h-[84px] resize-none border-none bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
          />

          {files.length ? (
            <ul className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="glass-subtle flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs"
                >
                  <span className="max-w-[10rem] truncate font-medium">{file.name}</span>
                  <span className="text-muted-foreground">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => onPick(event.target.files)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => inputRef.current?.click()}
            >
              <Paperclip className="mr-1.5 h-4 w-4" /> Attach
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => {
                if (inputRef.current) inputRef.current.accept = "image/*,video/*";
                inputRef.current?.click();
              }}
            >
              <ImagePlus className="mr-1.5 h-4 w-4" /> Media
            </Button>

            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger className="h-9 w-[10.5rem] rounded-xl text-xs">
                <SelectValue placeholder="Whole team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Whole team</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.icon} {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              size="sm"
              className="ml-auto rounded-xl"
              disabled={disabled}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-4 w-4" />
              )}
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
