import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/emails")({
  head: () => ({
    meta: [
      { title: "Emails — AgriPen Team App" },
      { name: "description", content: "Emails in the AgriPen team workspace." },
      { property: "og:title", content: "Emails — AgriPen Team App" },
      { property: "og:description", content: "Emails in the AgriPen team workspace." },
    ],
  }),
  component: EmailsPage,
});

function EmailsPage() {
  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Emails</h1>
      <p className="mt-1 text-sm text-muted-foreground">This section is coming next.</p>
    </section>
  );
}
