import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical, MessageSquare, Newspaper, Users } from "lucide-react";

import { UserAvatar } from "@/components/common/user-avatar";
import { PostCard } from "@/components/feed/post-card";
import { useAuth } from "@/lib/auth/auth-context";
import { formatRelative, fullName } from "@/lib/format";
import { fetchGroups } from "@/services/group-service";
import { fetchFeedPage } from "@/services/post-service";
import { fetchTeam } from "@/services/profile-service";
import { fetchActivity, fetchExperiments } from "@/services/workspace-service";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AgriPen Team App" },
      { name: "description", content: "Your AgriPen workspace overview: activity, team, feed." },
      { property: "og:title", content: "Dashboard — AgriPen Team App" },
      {
        property: "og:description",
        content: "Your AgriPen workspace overview: activity, team, feed.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile } = useAuth();
  const team = useQuery({ queryKey: ["team"], queryFn: fetchTeam });
  const groups = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });
  const experiments = useQuery({ queryKey: ["experiments"], queryFn: () => fetchExperiments() });
  const feed = useQuery({ queryKey: ["dashboard", "feed"], queryFn: () => fetchFeedPage(0) });
  const activity = useQuery({ queryKey: ["dashboard", "activity"], queryFn: () => fetchActivity(12) });

  const stats = [
    { label: "Team members", value: team.data?.length ?? 0, icon: Users, to: "/team" },
    { label: "Channels", value: groups.data?.length ?? 0, icon: MessageSquare, to: "/chat" },
    { label: "Experiments", value: experiments.data?.length ?? 0, icon: FlaskConical, to: "/experiments" },
    { label: "Posts", value: feed.data?.posts.length ?? 0, icon: Newspaper, to: "/feed" },
  ] as const;

  return (
    <section className="space-y-4">
      <header className="glass rounded-3xl p-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Welcome, {fullName(profile?.first_name, profile?.last_name)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your field research workspace: feed, groups, files and experiments.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to as never}
            className="glass flex items-center gap-3 rounded-3xl p-4 transition hover:border-primary/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <stat.icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-display text-xl font-bold">{stat.value}</span>
              <span className="block text-xs text-muted-foreground">{stat.label}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Latest from the team
          </h2>
          {feed.data?.posts.slice(0, 4).map((post) => <PostCard key={post.id} post={post} />)}
          {!feed.isLoading && !feed.data?.posts.length ? (
            <p className="glass rounded-3xl p-6 text-sm text-muted-foreground">
              Nothing posted yet. Head to the{" "}
              <Link to="/feed" className="text-primary underline">
                feed
              </Link>{" "}
              to share the first update.
            </p>
          ) : null}
        </div>

        <aside className="glass h-fit rounded-3xl p-4">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <ul className="mt-3 space-y-3">
            {activity.data?.map((entry) => (
              <li key={entry.id} className="flex gap-2 text-xs">
                <UserAvatar profile={entry.actor} className="h-7 w-7" />
                <span className="min-w-0">
                  <span className="block leading-snug">{entry.summary}</span>
                  <span className="text-muted-foreground">{formatRelative(entry.created_at)}</span>
                </span>
              </li>
            ))}
            {!activity.data?.length ? (
              <li className="text-xs text-muted-foreground">No activity recorded yet.</li>
            ) : null}
          </ul>
        </aside>
      </div>
    </section>
  );
}
