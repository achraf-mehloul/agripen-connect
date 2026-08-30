import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Ban, Copy, Loader2, ShieldCheck, Trash2, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/common/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { removeUser, setUserAccess, setUserRole } from "@/lib/auth/admin.functions";
import { useAuth } from "@/lib/auth/auth-context";
import { formatRelative, fullName } from "@/lib/format";
import {
  createInvitation,
  fetchInvitations,
  invitationLink,
  invitationStatus,
  revokeInvitation,
} from "@/services/invitation-service";
import { fetchTeam } from "@/services/profile-service";
import type { AppRole } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin & invitations — AgriPen Team App" },
      {
        name: "description",
        content: "Invite teammates, manage roles and control access to the AgriPen workspace.",
      },
      { property: "og:title", content: "Admin & invitations — AgriPen Team App" },
      {
        property: "og:description",
        content: "Invite teammates, manage roles and control access to the AgriPen workspace.",
      },
    ],
  }),
  component: AdminPage,
});

const statusTone: Record<string, string> = {
  active: "bg-primary-soft text-primary",
  used: "bg-muted text-muted-foreground",
  revoked: "bg-destructive/15 text-destructive",
  expired: "bg-muted text-muted-foreground",
};

function AdminPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("member");
  const [note, setNote] = useState("");
  const [days, setDays] = useState("14");

  const invitations = useQuery({
    queryKey: ["invitations"],
    queryFn: fetchInvitations,
    enabled: isAdmin,
  });

  const team = useQuery({ queryKey: ["team"], queryFn: fetchTeam, enabled: isAdmin });

  const roles = useQuery({
    queryKey: ["all-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const create = useMutation({
    mutationFn: () =>
      createInvitation({
        createdBy: user!.id,
        email: email || null,
        role,
        note: note || null,
        expiresInDays: Number(days) || 14,
      }),
    onSuccess: async (invitation) => {
      setEmail("");
      setNote("");
      await queryClient.invalidateQueries({ queryKey: ["invitations"] });
      const link = invitationLink(invitation.token);
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Invitation created and link copied");
      } catch {
        toast.success("Invitation created");
      }
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not create the invitation"),
  });

  const revoke = useMutation({
    mutationFn: revokeInvitation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation revoked");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not revoke"),
  });

  const changeRole = useServerFn(setUserRole);
  const changeAccess = useServerFn(setUserAccess);
  const deleteUser = useServerFn(removeUser);

  const memberAction = useMutation({
    mutationFn: async (input: { kind: "role" | "access" | "remove"; userId: string; value?: unknown }) => {
      if (input.kind === "role")
        return changeRole({ data: { userId: input.userId, role: input.value as AppRole } });
      if (input.kind === "access")
        return changeAccess({ data: { userId: input.userId, disabled: Boolean(input.value) } });
      return deleteUser({ data: { userId: input.userId } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team"] });
      void queryClient.invalidateQueries({ queryKey: ["all-roles"] });
      toast.success("Member updated");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Action failed"),
  });

  if (!isAdmin) {
    return (
      <section className="glass rounded-3xl p-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You need administrator access to open this section.
        </p>
      </section>
    );
  }

  const roleOf = (userId: string): AppRole =>
    roles.data?.some((row) => row.user_id === userId && row.role === "admin") ? "admin" : "member";

  return (
    <div className="space-y-6">
      <section className="glass rounded-3xl p-5 sm:p-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Admin & invitations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a private invitation link, share it with a teammate, and manage who can work in the
          workspace.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email (optional)</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@agripen.com"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Valid for</Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-note">Note (optional)</Label>
            <Input
              id="invite-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Field agronomist"
              className="rounded-xl"
            />
          </div>
        </div>

        <Button
          className="mt-4 rounded-xl"
          disabled={create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          Create invitation link
        </Button>
      </section>

      <section className="glass rounded-3xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Invitations</h2>
        {invitations.isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        ) : invitations.data?.length ? (
          <ul className="mt-4 space-y-2">
            {invitations.data.map((invitation) => {
              const status = invitationStatus(invitation);
              return (
                <li
                  key={invitation.id}
                  className="glass-subtle flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {invitation.email ?? "Open invitation"}
                      {invitation.note ? (
                        <span className="ml-2 text-xs text-muted-foreground">{invitation.note}</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invitation.role} · created {formatRelative(invitation.created_at)} · expires{" "}
                      {formatRelative(invitation.expires_at)}
                    </p>
                  </div>
                  <Badge className={statusTone[status]} variant="secondary">
                    {status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(invitationLink(invitation.token));
                        toast.success("Link copied");
                      } catch {
                        toast.error("Copy the link manually from the address bar");
                      }
                    }}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy link
                  </Button>
                  {status === "active" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-destructive"
                      onClick={() => revoke.mutate(invitation.id)}
                    >
                      Revoke
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No invitations yet.</p>
        )}
      </section>

      <section className="glass rounded-3xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Members</h2>
        <ul className="mt-4 space-y-2">
          {team.data?.map((member) => {
            const memberRole = roleOf(member.id);
            const isSelf = member.id === user?.id;
            return (
              <li
                key={member.id}
                className="glass-subtle flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
              >
                <UserAvatar profile={member} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {fullName(member.first_name, member.last_name)}
                    {member.is_disabled ? (
                      <span className="ml-2 text-xs text-destructive">suspended</span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.job_title || member.specialization || "Team member"}
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  {memberRole === "admin" ? <ShieldCheck className="h-3 w-3" /> : null}
                  {memberRole}
                </Badge>
                {!isSelf ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl"
                      disabled={memberAction.isPending}
                      onClick={() =>
                        memberAction.mutate({
                          kind: "role",
                          userId: member.id,
                          value: memberRole === "admin" ? "member" : "admin",
                        })
                      }
                    >
                      <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                      {memberRole === "admin" ? "Make member" : "Make admin"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl"
                      disabled={memberAction.isPending}
                      onClick={() =>
                        memberAction.mutate({
                          kind: "access",
                          userId: member.id,
                          value: !member.is_disabled,
                        })
                      }
                    >
                      <Ban className="mr-1.5 h-3.5 w-3.5" />
                      {member.is_disabled ? "Restore" : "Suspend"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-destructive"
                      disabled={memberAction.isPending}
                      onClick={() => {
                        if (!window.confirm(`Remove ${member.first_name} permanently?`)) return;
                        memberAction.mutate({ kind: "remove", userId: member.id });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
