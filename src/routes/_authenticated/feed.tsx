import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Feed — AgriPen Team App" },
      { name: "description", content: "Feed in the AgriPen team workspace." },
      { property: "og:title", content: "Feed — AgriPen Team App" },
      { property: "og:description", content: "Feed in the AgriPen team workspace." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Feed</h1>
      <p className="mt-1 text-sm text-muted-foreground">This section is coming next.</p>
    </section>
  );
}
