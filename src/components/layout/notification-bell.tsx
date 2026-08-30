import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bell, BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { formatRelative } from "@/lib/format";
import {
  notificationPermission,
  notificationsEnabled,
  requestNotificationPermission,
  showDeviceNotification,
} from "@/lib/notifications/device-notifications";
import { fetchNotifications, markNotificationsRead } from "@/services/workspace-service";

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userId = user?.id;

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => fetchNotifications(userId!),
    enabled: Boolean(userId),
  });

  const [pushOn, setPushOn] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setPermission(notificationPermission());
    setPushOn(notificationsEnabled());
  }, []);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
          const row = payload.new as { id?: string; title?: string; body?: string; link?: string | null };
          void showDeviceNotification({
            title: row.title ?? "AgriPen",
            body: row.body ?? "",
            link: row.link ?? null,
            ...(row.id ? { tag: row.id } : {}),
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  const enablePush = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    setPushOn(notificationsEnabled());
    if (result === "granted") toast.success("Device notifications are on");
    else if (result === "denied")
      toast.error("Notifications are blocked in your browser settings");
    else if (result === "unsupported") toast.error("This device does not support notifications");
  };

  const markRead = useMutation({
    mutationFn: () => markNotificationsRead(userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  const unread = notifications.filter((item) => !item.read_at).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl" aria-label="Notifications">
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="glass-strong w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 ? (
            <button
              onClick={() => markRead.mutate()}
              className="text-xs font-medium text-primary hover:underline"
            >
              Mark all read
            </button>
          ) : null}
        </div>
        {!pushOn && permission !== "unsupported" ? (
          <button
            onClick={() => void enablePush()}
            className="flex w-full items-center gap-2 border-b border-border px-4 py-2.5 text-left text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
          >
            <BellRing className="h-3.5 w-3.5" />
            Turn on device notifications
          </button>
        ) : null}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              You're all caught up.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => item.link && navigate({ to: item.link })}
                    className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-primary-soft"
                  >
                    <span className="flex items-center gap-2">
                      {!item.read_at ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
                      <span className="text-sm font-medium">{item.title}</span>
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">{item.body}</span>
                    <span className="text-[0.68rem] text-muted-foreground">
                      {formatRelative(item.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
