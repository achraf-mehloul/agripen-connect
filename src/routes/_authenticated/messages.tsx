import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ChatThread } from "@/components/chat/chat-thread";
import { UserAvatar } from "@/components/common/user-avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import { formatRelative, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ensureConversation,
  fetchDirectConversations,
  markConversationRead,
} from "@/services/message-service";
import { fetchTeam } from "@/services/profile-service";

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: (search: Record<string, unknown>) => ({
    c: typeof search["c"] === "string" ? (search["c"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Direct messages — AgriPen Team App" },
      { name: "description", content: "Private one-to-one messages with your AgriPen teammates." },
      { property: "og:title", content: "Direct messages — AgriPen Team App" },
      {
        property: "og:description",
        content: "Private one-to-one messages with your AgriPen teammates.",
      },
    ],
  }),
  component: MessagesPage,
});


function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { c: linkedConversationId } = Route.useSearch();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [search, setSearch] = useState("");


  const conversations = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => fetchDirectConversations(user!.id),
    enabled: Boolean(user?.id),
  });

  const team = useQuery({ queryKey: ["team"], queryFn: fetchTeam });

  const open = useMutation({
    mutationFn: (partnerId: string) => ensureConversation(user!.id, partnerId),
    onSuccess: (conversation) => {
      setConversationId(conversation.id);
      void queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Conversation could not be opened"),
  });

  useEffect(() => {
    if (!conversationId || !user?.id) return;
    void markConversationRead(conversationId, user.id);
  }, [conversationId, user?.id]);

  const others = (team.data ?? []).filter(
    (profile) =>
      profile.id !== user?.id &&
      fullName(profile.first_name, profile.last_name)
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );

  return (
    <section className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <aside className="glass space-y-3 rounded-3xl p-3">
        <h1 className="px-1 font-display text-lg font-bold tracking-tight">Messages</h1>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search teammates…"
          className="rounded-2xl"
        />

        {conversations.data?.length ? (
          <ul className="space-y-1">
            {conversations.data.map((row) => (
              <li key={row.conversation.id}>
                <button
                  type="button"
                  onClick={() => {
                    setConversationId(row.conversation.id);
                    setPartnerName(fullName(row.partner.first_name, row.partner.last_name));
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left transition",
                    conversationId === row.conversation.id
                      ? "bg-primary-soft text-primary"
                      : "hover:bg-muted/50",
                  )}
                >
                  <UserAvatar profile={row.partner} showPresence className="h-8 w-8" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {fullName(row.partner.first_name, row.partner.last_name)}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {row.lastMessage
                        ? `${row.lastMessage.body.slice(0, 32)} · ${formatRelative(row.lastMessage.created_at)}`
                        : "No messages yet"}
                    </span>
                  </span>
                  {row.unread ? (
                    <span className="rounded-full bg-primary px-1.5 text-[0.65rem] font-bold text-primary-foreground">
                      {row.unread}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="space-y-1 border-t border-border/60 pt-2">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Team
          </p>
          {others.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => {
                setPartnerName(fullName(profile.first_name, profile.last_name));
                open.mutate(profile.id);
              }}
              className="flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left text-sm transition hover:bg-muted/50"
            >
              <UserAvatar profile={profile} showPresence className="h-8 w-8" />
              <span className="min-w-0 flex-1 truncate">
                {fullName(profile.first_name, profile.last_name)}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="glass overflow-hidden rounded-3xl">
        {conversationId ? (
          <ChatThread channel={{ conversationId }} title={partnerName || "Direct message"} />
        ) : (
          <p className="p-6 text-sm text-muted-foreground">
            Pick a teammate to start a private conversation.
          </p>
        )}
      </div>
    </section>
  );
}
