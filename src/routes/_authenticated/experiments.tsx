import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/experiments")({
  head: () => ({
    meta: [
      { title: "Experiments — AgriPen Team App" },
      { name: "description", content: "Experiments in the AgriPen team workspace." },
      { property: "og:title", content: "Experiments — AgriPen Team App" },
      { property: "og:description", content: "Experiments in the AgriPen team workspace." },
    ],
  }),
  component: ExperimentsPage,
});

function ExperimentsPage() {
  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Experiments</h1>
      <p className="mt-1 text-sm text-muted-foreground">This section is coming next.</p>
    </section>
  );
}
