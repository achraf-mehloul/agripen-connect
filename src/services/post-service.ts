import { supabase } from "@/integrations/supabase/client";
import type {
  FeedPost,
  NewAttachmentInput,
  PostComment,
  PostKind,
  PostRow,
  Profile,
} from "@/types/domain";

import { fetchProfileMap } from "./hydrate";

export const FEED_PAGE_SIZE = 12;

export type FeedFilter = { groupId?: string | null; kind?: PostKind | null; authorId?: string };

export async function fetchFeedPage(
  page: number,
  filter: FeedFilter = {},
): Promise<{ posts: FeedPost[]; hasMore: boolean }> {
  const from = page * FEED_PAGE_SIZE;
  let query = supabase
    .from("posts")
    .select(
      "*, attachments:post_attachments(*), reactions:post_reactions(*), comments:post_comments(count), group:group_id(id,name,slug,icon)",
    )
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + FEED_PAGE_SIZE);

  if (filter.groupId) query = query.eq("group_id", filter.groupId);
  if (filter.kind) query = query.eq("kind", filter.kind);
  if (filter.authorId) query = query.eq("author_id", filter.authorId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const hasMore = rows.length > FEED_PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows;
  const profiles = await fetchProfileMap(pageRows.map((row) => row.author_id));

  const posts = pageRows.map((row) => {
    const commentAggregate = row.comments as unknown as { count: number }[] | null;
    return {
      ...(row as unknown as PostRow),
      author: profiles.get(row.author_id) ?? null,
      group: row.group ?? null,
      attachments: row.attachments ?? [],
      reactions: row.reactions ?? [],
      comments: { count: commentAggregate?.[0]?.count ?? 0 },
    } as FeedPost;
  });

  return { posts, hasMore };
}

export type CreatePostInput = {
  clientId: string;
  authorId: string;
  kind: PostKind;
  title?: string | null;
  body: string;
  linkUrl?: string | null;
  groupId?: string | null;
  attachments?: NewAttachmentInput[];
};

export async function createPost(input: CreatePostInput): Promise<PostRow> {
  const { data: existing } = await supabase
    .from("posts")
    .select("*")
    .eq("client_id", input.clientId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      client_id: input.clientId,
      author_id: input.authorId,
      kind: input.kind,
      title: input.title ?? null,
      body: input.body,
      link_url: input.linkUrl ?? null,
      group_id: input.groupId ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  if (input.attachments?.length) {
    const { error: attachmentError } = await supabase
      .from("post_attachments")
      .insert(input.attachments.map((attachment) => ({ ...attachment, post_id: data.id })));
    if (attachmentError) throw new Error(attachmentError.message);
  }

  return data;
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);
}

export async function setPostPinned(postId: string, isPinned: boolean) {
  const { error } = await supabase.from("posts").update({ is_pinned: isPinned }).eq("id", postId);
  if (error) throw new Error(error.message);
}

export async function fetchComments(
  postId: string,
): Promise<(PostComment & { author: Profile | null })[]> {
  const { data, error } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const profiles = await fetchProfileMap(rows.map((row) => row.author_id));
  return rows.map((row) => ({ ...row, author: profiles.get(row.author_id) ?? null }));
}

export async function createComment(input: {
  clientId: string;
  postId: string;
  authorId: string;
  body: string;
}) {
  const { data: existing } = await supabase
    .from("post_comments")
    .select("id")
    .eq("client_id", input.clientId)
    .maybeSingle();
  if (existing) return;

  const { error } = await supabase.from("post_comments").insert({
    client_id: input.clientId,
    post_id: input.postId,
    author_id: input.authorId,
    body: input.body,
  });
  if (error) throw new Error(error.message);
}

export async function toggleReaction(input: {
  postId: string;
  userId: string;
  emoji: string;
  active: boolean;
}) {
  if (input.active) {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", input.postId)
      .eq("user_id", input.userId)
      .eq("emoji", input.emoji);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase
    .from("post_reactions")
    .upsert(
      { post_id: input.postId, user_id: input.userId, emoji: input.emoji },
      { onConflict: "post_id,user_id,emoji" },
    );
  if (error) throw new Error(error.message);
}
