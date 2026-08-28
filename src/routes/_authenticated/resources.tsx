import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({
    meta: [
      { title: "Resources — AgriPen Team App" },
      { name: "description", content: "Resources in the AgriPen team workspace." },
      { property: "og:title", content: "Resources — AgriPen Team App" },
      { property: "og:description", content: "Resources in the AgriPen team workspace." },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Resources</h1>
      <p className="mt-1 text-sm text-muted-foreground">This section is coming next.</p>
    </section>
  );
}
