import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, MessageSquare, Pin, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { useAuth } from "@/lib/auth/auth-context";
import { formatBytes, formatRelative, fullName } from "@/lib/format";
import { createClientId } from "@/lib/ids";
import { cn } from "@/lib/utils";
import {
  createComment,
  deletePost,
  fetchComments,
  setPostPinned,
  toggleReaction,
} from "@/services/post-service";
import { downloadFile, WORKSPACE_BUCKET } from "@/services/storage-service";
import type { FeedPost, PostAttachment } from "@/types/domain";

const EMOJIS = ["👍", "🌱", "🔥", "🎉"];

function AttachmentView({ attachment }: { attachment: PostAttachment }) {
  const { data: url, refresh } = useSignedUrl(attachment.storage_path, WORKSPACE_BUCKET);
  const [viewing, setViewing] = useState(false);

  const lightbox =
    viewing && url ? (
      <MediaLightbox
        item={{
          url,
          fileName: attachment.file_name,
          storagePath: attachment.storage_path,
          bucket: WORKSPACE_BUCKET,
          kind: attachment.kind === "video" ? "video" : "image",
        }}
        onClose={() => setViewing(false)}
      />
    ) : null;

  if (attachment.kind === "image") {
    return url ? (
      <>
        <button
          type="button"
          onClick={() => setViewing(true)}
          className="block w-full"
          aria-label={`Open ${attachment.file_name}`}
        >
          <img
            src={url}
            alt={attachment.file_name}
            loading="lazy"
            onError={refresh}
            className="max-h-[26rem] w-full rounded-2xl border border-border object-cover"
          />
        </button>
        {lightbox}
      </>
    ) : (
      <div className="h-48 w-full animate-pulse rounded-2xl bg-muted" />
    );
  }
  if (attachment.kind === "video") {
    return url ? (
      <>
        <video
          src={url}
          controls
          onError={refresh}
          className="w-full rounded-2xl border border-border"
        />
        {lightbox}
      </>
    ) : null;
  }
  if (attachment.kind === "audio") {
    return url ? <audio src={url} controls onError={refresh} className="w-full" /> : null;
  }
  return (
    <button
      type="button"
      onClick={() =>
        void downloadFile(attachment.storage_path, attachment.file_name).catch((error) =>
          toast.error(error instanceof Error ? error.message : "Download failed"),
        )
      }
      className="glass-subtle surface-hover flex w-full items-center gap-3 rounded-2xl p-3 text-left"
    >
      <Download className="h-4 w-4 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{attachment.file_name}</span>
        <span className="text-xs text-muted-foreground">{formatBytes(attachment.size_bytes)}</span>
      </span>
    </button>
  );
}


export function PostCard({ post }: { post: FeedPost }) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const userId = user?.id ?? "";

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["feed"] });
  };

  const { data: comments = [] } = useQuery({
    queryKey: ["post-comments", post.id],
    queryFn: () => fetchComments(post.id),
    enabled: showComments,
  });

  const react = useMutation({
    mutationFn: (emoji: string) =>
      toggleReaction({
        postId: post.id,
        userId,
        emoji,
        active: post.reactions.some((row) => row.user_id === userId && row.emoji === emoji),
      }),
    onSuccess: invalidate,
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not react"),
  });

  const comment = useMutation({
    mutationFn: () =>
      createComment({
        clientId: createClientId("cm"),
        postId: post.id,
        authorId: userId,
        body: draft.trim(),
      }),
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] });
      invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not comment"),
  });

  const remove = useMutation({
    mutationFn: () => deletePost(post.id),
    onSuccess: () => {
      toast.success("Post deleted");
      invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not delete"),
  });

  const pin = useMutation({
    mutationFn: () => setPostPinned(post.id, !post.is_pinned),
    onSuccess: invalidate,
  });

  const canManage = isAdmin || post.author_id === userId;

  return (
    <article className="glass rounded-3xl p-4 sm:p-5">
      <header className="flex items-start gap-3">
        <UserAvatar profile={post.author} showPresence />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {fullName(post.author?.first_name, post.author?.last_name)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {formatRelative(post.created_at)}
            {post.group ? ` · ${post.group.icon} ${post.group.name}` : " · Whole team"}
          </p>
        </div>
        {post.is_pinned ? <Pin className="h-4 w-4 shrink-0 text-primary" /> : null}
        {canManage ? (
          <div className="flex shrink-0 items-center gap-0.5">
            {isAdmin ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                aria-label="Pin post"
                onClick={() => pin.mutate()}
              >
                <Pin className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-destructive"
              aria-label="Delete post"
              onClick={() => remove.mutate()}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </header>

      {post.title ? <h3 className="mt-3 font-display text-lg font-semibold">{post.title}</h3> : null}
      {post.body ? (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{post.body}</p>
      ) : null}

      {post.attachments.length ? (
        <div className="mt-3 space-y-2">
          {post.attachments.map((attachment) => (
            <AttachmentView key={attachment.id} attachment={attachment} />
          ))}
        </div>
      ) : null}

      <footer className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        {EMOJIS.map((emoji) => {
          const count = post.reactions.filter((row) => row.emoji === emoji).length;
          const mine = post.reactions.some((row) => row.user_id === userId && row.emoji === emoji);
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => react.mutate(emoji)}
              className={cn(
                "surface-hover rounded-full border border-border px-2.5 py-1 text-xs",
                mine && "border-primary bg-primary-soft text-primary",
              )}
            >
              {emoji} {count > 0 ? count : ""}
            </button>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto rounded-xl text-xs"
          onClick={() => setShowComments((open) => !open)}
        >
          <MessageSquare className="mr-1.5 h-4 w-4" />
          {post.comments.count || 0}
        </Button>
      </footer>

      {showComments ? (
        <div className="mt-3 space-y-3">
          {comments.map((row) => (
            <div key={row.id} className="flex gap-2">
              <UserAvatar profile={row.author} className="h-7 w-7" />
              <div className="glass-subtle min-w-0 flex-1 rounded-2xl px-3 py-2">
                <p className="text-xs font-semibold">
                  {fullName(row.author?.first_name, row.author?.last_name)}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {formatRelative(row.created_at)}
                  </span>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{row.body}</p>
              </div>
            </div>
          ))}
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (draft.trim()) comment.mutate();
            }}
          >
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a comment…"
              className="rounded-xl"
            />
            <Button type="submit" size="icon" className="rounded-xl" disabled={!draft.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : null}
    </article>
  );
}
