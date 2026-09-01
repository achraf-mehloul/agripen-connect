import { supabase } from "@/integrations/supabase/client";
import type {
  ChatMessage,
  Conversation,
  DirectConversation,
  MessageRow,
  NewAttachmentInput,
  Profile,
} from "@/types/domain";

import { fetchProfileMap } from "./hydrate";

export const MESSAGE_PAGE_SIZE = 40;

export type ChannelRef = { groupId: string } | { conversationId: string };

function applyChannel<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  channel: ChannelRef,
): T {
  return "groupId" in channel
    ? query.eq("group_id", channel.groupId)
    : query.eq("conversation_id", channel.conversationId);
}

export async function fetchMessages(channel: ChannelRef): Promise<ChatMessage[]> {
  const base = supabase
    .from("messages")
    .select("*, attachments:message_attachments(*)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(MESSAGE_PAGE_SIZE);

  const { data, error } = await applyChannel(base, channel);
  if (error) throw new Error(error.message);

  const rows = (data ?? []).slice().reverse();
  const profiles = await fetchProfileMap(rows.map((row) => row.author_id));
  return rows.map((row) => ({
    ...(row as unknown as MessageRow),
    attachments: row.attachments ?? [],
    author: profiles.get(row.author_id) ?? null,
  }));
}

export type SendMessageInput = {
  clientId: string;
  authorId: string;
  body: string;
  channel: ChannelRef;
  replyToId?: string | null;
  attachments?: NewAttachmentInput[];
};

export async function sendMessage(input: SendMessageInput): Promise<MessageRow> {
  const { data: existing } = await supabase
    .from("messages")
    .select("*")
    .eq("client_id", input.clientId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      client_id: input.clientId,
      author_id: input.authorId,
      body: input.body,
      reply_to_id: input.replyToId ?? null,
      group_id: "groupId" in input.channel ? input.channel.groupId : null,
      conversation_id: "conversationId" in input.channel ? input.channel.conversationId : null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  if (input.attachments?.length) {
    const { error: attachmentError } = await supabase
      .from("message_attachments")
      .insert(input.attachments.map((attachment) => ({ ...attachment, message_id: data.id })));
    if (attachmentError) throw new Error(attachmentError.message);
  }

  if ("conversationId" in input.channel) {
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", input.channel.conversationId);
  }

  return data;
}

export async function deleteMessage(messageId: string) {
  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString(), body: "" })
    .eq("id", messageId);
  if (error) throw new Error(error.message);
}

function pairKeyFor(a: string, b: string): string {
  return [a, b].sort().join(":");
}

/** Finds or creates the 1-to-1 conversation between two team members. */
export async function ensureConversation(userId: string, partnerId: string): Promise<Conversation> {
  const pairKey = pairKeyFor(userId, partnerId);
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("pair_key", pairKey)
    .maybeSingle();

  let conversation = existing ?? null;

  if (!conversation) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ pair_key: pairKey, created_by: userId })
      .select("*")
      .maybeSingle();

    if (data) {
      conversation = data;
    } else {
      // Another client may have created it first (unique pair_key).
      const { data: retry } = await supabase
        .from("conversations")
        .select("*")
        .eq("pair_key", pairKey)
        .maybeSingle();
      if (!retry) throw new Error(error?.message ?? "Conversation could not be created");
      conversation = retry;
    }
  }

  const { error: participantError } = await supabase
    .from("conversation_participants")
    .upsert(
      [
        { conversation_id: conversation.id, user_id: userId },
        { conversation_id: conversation.id, user_id: partnerId },
      ],
      { onConflict: "conversation_id,user_id", ignoreDuplicates: true },
    );
  if (participantError) throw new Error(participantError.message);
  return conversation;
}

export async function fetchDirectConversations(userId: string): Promise<DirectConversation[]> {
  const { data: memberships, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  const conversationIds = (memberships ?? []).map((row) => row.conversation_id);
  if (!conversationIds.length) return [];

  const [conversations, participants, messages] = await Promise.all([
    supabase.from("conversations").select("*").in("id", conversationIds),
    supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds),
    supabase
      .from("messages")
      .select("*")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
  ]);

  const partnerIds = (participants.data ?? [])
    .filter((row) => row.user_id !== userId)
    .map((row) => row.user_id);
  const profiles = await fetchProfileMap(partnerIds);
  const readMap = new Map((memberships ?? []).map((row) => [row.conversation_id, row.last_read_at]));

  return (conversations.data ?? [])
    .map((conversation) => {
      const partnerId = (participants.data ?? []).find(
        (row) => row.conversation_id === conversation.id && row.user_id !== userId,
      )?.user_id;
      const partner = partnerId ? profiles.get(partnerId) : undefined;
      if (!partner) return null;
      const conversationMessages = (messages.data ?? []).filter(
        (row) => row.conversation_id === conversation.id,
      );
      const lastReadAt = readMap.get(conversation.id) ?? conversation.created_at;
      return {
        conversation,
        partner,
        lastMessage: conversationMessages[0] ?? null,
        unread: conversationMessages.filter(
          (row) => row.author_id !== userId && row.created_at > lastReadAt,
        ).length,
      } satisfies DirectConversation;
    })
    .filter((row): row is DirectConversation => row !== null)
    .sort(
      (a, b) =>
        new Date(b.lastMessage?.created_at ?? b.conversation.created_at).getTime() -
        new Date(a.lastMessage?.created_at ?? a.conversation.created_at).getTime(),
    );
}

export async function markConversationRead(conversationId: string, userId: string) {
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
}

/** Latest moment the other participant opened this conversation (drives "Seen" ticks). */
export async function fetchPartnerReadAt(
  conversationId: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("conversation_participants")
    .select("user_id, last_read_at")
    .eq("conversation_id", conversationId)
    .neq("user_id", userId);
  if (error) throw new Error(error.message);
  const stamps = (data ?? []).map((row) => row.last_read_at).filter(Boolean);
  if (!stamps.length) return null;
  return stamps.sort().at(-1) ?? null;
}

/** Conversation ids the signed-in user takes part in (used for message alerts). */
export async function fetchMyConversationIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.conversation_id);
}

export async function hydrateMessage(row: MessageRow): Promise<ChatMessage> {
  const [{ data: attachments }, profiles] = await Promise.all([
    supabase.from("message_attachments").select("*").eq("message_id", row.id),
    fetchProfileMap([row.author_id]),
  ]);
  return {
    ...row,
    attachments: attachments ?? [],
    author: profiles.get(row.author_id) ?? null,
  };
}

export type { Profile };
