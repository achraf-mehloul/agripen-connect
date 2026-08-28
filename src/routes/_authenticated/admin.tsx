import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — AgriPen Team App" },
      { name: "description", content: "Admin in the AgriPen team workspace." },
      { property: "og:title", content: "Admin — AgriPen Team App" },
      { property: "og:description", content: "Admin in the AgriPen team workspace." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">This section is coming next.</p>
    </section>
  );
}
