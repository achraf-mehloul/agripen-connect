import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ChatThread } from "@/components/chat/chat-thread";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import {
  createGroup,
  fetchGroups,
  fetchMyGroupIds,
  joinGroup,
  markGroupRead,
} from "@/services/group-service";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Group chat — AgriPen Team App" },
      { name: "description", content: "Real-time group channels for the AgriPen field team." },
      { property: "og:title", content: "Group chat — AgriPen Team App" },
      {
        property: "og:description",
        content: "Real-time group channels for the AgriPen field team.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🌱");

  const groups = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });
  const myGroups = useQuery({
    queryKey: ["my-groups", user?.id],
    queryFn: () => fetchMyGroupIds(user!.id),
    enabled: Boolean(user?.id),
  });

  const list = (groups.data ?? []).filter((group) => !group.is_archived);
  const active = list.find((group) => group.id === activeId) ?? list[0] ?? null;

  useEffect(() => {
    if (!active || !user?.id) return;
    void markGroupRead(active.id, user.id);
  }, [active?.id, user?.id]);

  const create = useMutation({
    mutationFn: () =>
      createGroup({
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim() || "🌱",
        isPrivate: false,
        createdBy: user!.id,
      }),
    onSuccess: async (group) => {
      if (user) await joinGroup(group.id, user.id);
      setOpen(false);
      setName("");
      setDescription("");
      setActiveId(group.id);
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Channel created");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not create the channel"),
  });

  const join = useMutation({
    mutationFn: (groupId: string) => joinGroup(groupId, user!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-groups", user?.id] });
      toast.success("You joined this channel");
    },
  });

  const isMember = active ? (myGroups.data ?? []).includes(active.id) : false;

  return (
    <section className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <aside className="glass rounded-3xl p-3">
        <div className="flex items-center justify-between px-1 pb-2">
          <h1 className="font-display text-lg font-bold tracking-tight">Channels</h1>
          {isAdmin ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="rounded-xl" aria-label="New channel">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🌱" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Channel name"
                  />
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this channel about?"
                  />
                </div>
                <DialogFooter>
                  <Button
                    disabled={!name.trim() || create.isPending}
                    onClick={() => create.mutate()}
                  >
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>

        <ul className="space-y-1">
          {list.map((group) => (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => setActiveId(group.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition",
                  active?.id === group.id ? "bg-primary-soft text-primary" : "hover:bg-muted/50",
                )}
              >
                <span aria-hidden>{group.icon}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{group.name}</span>
              </button>
            </li>
          ))}
          {!list.length ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No channels yet.</li>
          ) : null}
        </ul>
      </aside>

      <div className="glass overflow-hidden rounded-3xl">
        {active ? (
          <>
            {!isMember ? (
              <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2 text-xs">
                <span className="text-muted-foreground">
                  You are not a member of this channel yet.
                </span>
                <Button size="sm" className="rounded-xl" onClick={() => join.mutate(active.id)}>
                  Join
                </Button>
              </div>
            ) : null}
            <ChatThread
              channel={{ groupId: active.id }}
              title={`${active.icon} ${active.name}`}
            />
          </>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">
            No channel selected. Ask an administrator to create one.
          </p>
        )}
      </div>
    </section>
  );
}
