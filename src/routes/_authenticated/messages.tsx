import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — AgriPen Team App" },
      { name: "description", content: "Messages in the AgriPen team workspace." },
      { property: "og:title", content: "Messages — AgriPen Team App" },
      { property: "og:description", content: "Messages in the AgriPen team workspace." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">This section is coming next.</p>
    </section>
  );
}
