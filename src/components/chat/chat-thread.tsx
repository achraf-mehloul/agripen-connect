import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCheck, Loader2, Paperclip, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { formatBytes, formatClock, fullName } from "@/lib/format";
import { createClientId } from "@/lib/ids";
import { cn } from "@/lib/utils";
import { prepareFiles } from "@/services/media-service";
import type { ChannelRef } from "@/services/message-service";
import { fetchMessages, fetchPartnerReadAt, sendMessage } from "@/services/message-service";
import {
  classifyFile,
  uploadToWorkspace,
  validateUpload,
} from "@/services/storage-service";
import type { NewAttachmentInput } from "@/types/domain";

function channelKey(channel: ChannelRef): string {
  return "groupId" in channel ? `group:${channel.groupId}` : `dm:${channel.conversationId}`;
}

type UploadJob = {
  id: string;
  label: string;
  percent: number;
  phase: "preparing" | "uploading" | "sending";
};

export function ChatThread({ channel, title }: { channel: ChannelRef; title: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = channelKey(channel);
  const conversationId = "conversationId" in channel ? channel.conversationId : null;
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [jobs, setJobs] = useState<UploadJob[]>([]);

  const messages = useQuery({
    queryKey: ["messages", key],
    queryFn: () => fetchMessages(channel),
  });

  // Read receipts: the other participant's last_read_at, refreshed live.
  const partnerRead = useQuery({
    queryKey: ["partner-read", conversationId, user?.id],
    queryFn: () => fetchPartnerReadAt(conversationId!, user!.id),
    enabled: Boolean(conversationId && user?.id),
    refetchInterval: 20_000,
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
    if (!conversationId) return;
    const subscription = supabase
      .channel(`reads-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["partner-read", conversationId, user?.id],
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(subscription);
    };
  }, [conversationId, queryClient, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length]);

  const busy = jobs.length > 0;

  /**
   * Sends in the background: the composer clears immediately, then each
   * attachment is compressed and uploaded in parallel with a live percentage.
   */
  const send = useCallback(async () => {
    if (!user) {
      toast.error("You must be signed in.");
      return;
    }
    const text = body.trim();
    const picked = files;
    if (!text && !picked.length) return;

    setBody("");
    setFiles([]);

    const jobId = createClientId("job");
    const label = picked.length
      ? picked.length > 1
        ? `${picked.length} attachments`
        : picked[0]!.name
      : "Message";
    setJobs((current) => [
      ...current,
      { id: jobId, label, percent: 0, phase: picked.length ? "preparing" : "sending" },
    ]);

    const patch = (update: Partial<UploadJob>) =>
      setJobs((current) => current.map((job) => (job.id === jobId ? { ...job, ...update } : job)));

    try {
      let attachments: NewAttachmentInput[] = [];
      if (picked.length) {
        const prepared = await prepareFiles(picked);
        patch({ phase: "uploading", percent: 0 });

        const progress = new Map<number, number>();
        attachments = await Promise.all(
          prepared.map(async (file, index) => {
            const path = await uploadToWorkspace(user.id, file, file.name, {
              folder: "chat",
              onProgress: (percent) => {
                progress.set(index, percent);
                const total =
                  [...progress.values()].reduce((sum, value) => sum + value, 0) / prepared.length;
                patch({ percent: Math.round(total) });
              },
            });
            return {
              storage_path: path,
              file_name: file.name,
              mime_type: file.type || "application/octet-stream",
              size_bytes: file.size,
              kind: classifyFile(file.type),
            } satisfies NewAttachmentInput;
          }),
        );
      }

      patch({ phase: "sending", percent: 100 });
      await sendMessage({
        clientId: createClientId("msg"),
        authorId: user.id,
        body: text,
        channel,
        attachments,
      });
      void queryClient.invalidateQueries({ queryKey: ["messages", key] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Message could not be sent");
      setBody((current) => current || text);
      setFiles((current) => (current.length ? current : picked));
    } finally {
      setJobs((current) => current.filter((job) => job.id !== jobId));
    }
  }, [body, channel, files, key, queryClient, user]);

  const readAt = partnerRead.data ?? null;
  const lastMine = [...(messages.data ?? [])].reverse().find((row) => row.author_id === user?.id);

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
            const seen = Boolean(mine && readAt && message.created_at <= readAt);
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
                    <ChatAttachment key={attachment.id} attachment={attachment} />
                  ))}

                  <span className="mt-1 flex items-center gap-1 text-[0.65rem] opacity-70">
                    {formatClock(message.created_at)}
                    {mine && conversationId ? (
                      seen ? (
                        <>
                          <CheckCheck className="h-3 w-3" aria-hidden />
                          {message.id === lastMine?.id ? <span>Seen</span> : null}
                        </>
                      ) : (
                        <Check className="h-3 w-3" aria-hidden />
                      )
                    ) : null}
                  </span>
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
        {jobs.length ? (
          <ul className="mb-2 space-y-1" aria-live="polite">
            {jobs.map((job) => (
              <li key={job.id} className="glass-subtle rounded-xl px-3 py-2 text-xs">
                <span className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">
                    {job.phase === "preparing"
                      ? `Optimising ${job.label}…`
                      : job.phase === "uploading"
                        ? `Uploading ${job.label} · ${job.percent}%`
                        : "Sending…"}
                  </span>
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                </span>
                {job.phase === "uploading" ? (
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(4, job.percent)}%` }}
                    />
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

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
                if (body.trim() || files.length) void send();
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            className="rounded-xl"
            aria-label="Send message"
            disabled={!body.trim() && !files.length}
            onClick={() => void send()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
