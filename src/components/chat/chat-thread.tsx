import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { formatBytes, formatClock, fullName } from "@/lib/format";
import { createClientId } from "@/lib/ids";
import { cn } from "@/lib/utils";
import type { ChannelRef } from "@/services/message-service";
import { fetchMessages, sendMessage } from "@/services/message-service";
import {
  classifyFile,
  uploadToWorkspace,
  validateUpload,
} from "@/services/storage-service";
import type { NewAttachmentInput } from "@/types/domain";

function channelKey(channel: ChannelRef): string {
  return "groupId" in channel ? `group:${channel.groupId}` : `dm:${channel.conversationId}`;
}

export function ChatThread({ channel, title }: { channel: ChannelRef; title: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = channelKey(channel);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const messages = useQuery({
    queryKey: ["messages", key],
    queryFn: () => fetchMessages(channel),
  });

  useEffect(() => {
    const subscription = supabase
      .channel(`chat-${key}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["messages", key] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(subscription);
    };
  }, [key, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be signed in.");
      const attachments: NewAttachmentInput[] = [];
      for (const file of files) {
        const path = await uploadToWorkspace(user.id, file, file.name, { folder: "chat" });
        attachments.push({
          storage_path: path,
          file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
          kind: classifyFile(file.type),
        });
      }
      return sendMessage({
        clientId: createClientId("msg"),
        authorId: user.id,
        body: body.trim(),
        channel,
        attachments,
      });
    },
    onSuccess: () => {
      setBody("");
      setFiles([]);
      void queryClient.invalidateQueries({ queryKey: ["messages", key] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Message could not be sent"),
  });

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[24rem] flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading messages…</p>
        ) : messages.data?.length ? (
          messages.data.map((message) => {
            const mine = message.author_id === user?.id;
            return (
              <div key={message.id} className={cn("flex gap-2", mine && "flex-row-reverse")}>
                <UserAvatar profile={message.author} className="h-8 w-8" />
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    mine ? "bg-primary text-primary-foreground" : "glass-subtle",
                  )}
                >
                  {!mine ? (
                    <p className="mb-0.5 text-[0.7rem] font-semibold opacity-80">
                      {fullName(message.author?.first_name, message.author?.last_name)}
                    </p>
                  ) : null}
                  {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}
                  {message.attachments.map((attachment) => (
                    <p key={attachment.id} className="mt-1 text-xs opacity-80">
                      📎 {attachment.file_name} · {formatBytes(attachment.size_bytes)}
                    </p>
                  ))}
                  <p className="mt-1 text-[0.65rem] opacity-70">
                    {formatClock(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">No messages yet. Say hello 👋</p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border/60 p-3">
        {files.length ? (
          <ul className="mb-2 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="glass-subtle flex items-center gap-2 rounded-xl px-2 py-1 text-xs"
              >
                <span className="max-w-[9rem] truncate">{file.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              const list = event.target.files;
              if (!list) return;
              const next: File[] = [];
              for (const file of Array.from(list)) {
                const problem = validateUpload(file);
                if (problem) toast.error(problem);
                else next.push(file);
              }
              setFiles((current) => [...current, ...next].slice(0, 4));
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-xl"
            aria-label="Attach a file"
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a message…"
            className="min-h-[42px] max-h-32 flex-1 resize-none rounded-2xl"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (body.trim() || files.length) mutation.mutate();
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            className="rounded-xl"
            aria-label="Send message"
            disabled={mutation.isPending || (!body.trim() && !files.length)}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
