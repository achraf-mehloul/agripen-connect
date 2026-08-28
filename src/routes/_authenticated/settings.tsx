import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AgriPen Team App" },
      { name: "description", content: "Settings in the AgriPen team workspace." },
      { property: "og:title", content: "Settings — AgriPen Team App" },
      { property: "og:description", content: "Settings in the AgriPen team workspace." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">This section is coming next.</p>
    </section>
  );
}
