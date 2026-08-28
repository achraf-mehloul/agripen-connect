import { createFileRoute } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth/auth-context";
import { fullName } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AgriPen Team App" },
      { name: "description", content: "Your AgriPen workspace overview." },
      { property: "og:title", content: "Dashboard — AgriPen Team App" },
      { property: "og:description", content: "Your AgriPen workspace overview." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile } = useAuth();
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
    </section>
  );
}
