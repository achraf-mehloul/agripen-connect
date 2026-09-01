import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { fullName } from "@/lib/format";
import { showDeviceNotification } from "@/lib/notifications/device-notifications";
import { fetchMyConversationIds } from "@/services/message-service";
import { fetchProfileMap } from "@/services/hydrate";
import type { MessageRow } from "@/types/domain";

/**
 * Alerts the signed-in user about new direct messages from anywhere in the app:
 * an in-app toast that opens the thread, plus a real device notification whose
 * click deep-links to the conversation.
 */
export function useDirectMessageAlerts(): void {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const conversations = useQuery({
    queryKey: ["my-conversation-ids", user?.id],
    queryFn: () => fetchMyConversationIds(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });

  const ids = (conversations.data ?? []).join(",");

  useEffect(() => {
    if (!user?.id || !ids) return;
    const allowed = new Set(ids.split(","));

    const channel = supabase
      .channel(`dm-alerts-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const message = payload.new as MessageRow;
          if (!message.conversation_id || !allowed.has(message.conversation_id)) return;
          if (message.author_id === user.id) return;

          void queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });

          void (async () => {
            const profiles = await fetchProfileMap([message.author_id]);
            const author = profiles.get(message.author_id);
            const name = author
              ? fullName(author.first_name, author.last_name)
              : "A teammate";
            const preview = message.body?.trim() || "📎 Attachment";
            const link = `/messages?c=${message.conversation_id}`;

            toast(name, {
              description: preview,
              action: {
                label: "Open",
                onClick: () =>
                  void navigate({
                    to: "/messages",
                    search: { c: message.conversation_id! },
                  }),
              },
            });

            void showDeviceNotification({
              title: name,
              body: preview,
              tag: `dm-${message.conversation_id}`,
              link,
            });
          })();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ids, navigate, queryClient, user?.id]);
}
