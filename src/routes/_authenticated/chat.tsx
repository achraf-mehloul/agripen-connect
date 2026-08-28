import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Chat — AgriPen Team App" },
      { name: "description", content: "Chat in the AgriPen team workspace." },
      { property: "og:title", content: "Chat — AgriPen Team App" },
      { property: "og:description", content: "Chat in the AgriPen team workspace." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Chat</h1>
      <p className="mt-1 text-sm text-muted-foreground">This section is coming next.</p>
    </section>
  );
}
