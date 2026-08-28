import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/files")({
  head: () => ({
    meta: [
      { title: "Files — AgriPen Team App" },
      { name: "description", content: "Files in the AgriPen team workspace." },
      { property: "og:title", content: "Files — AgriPen Team App" },
      { property: "og:description", content: "Files in the AgriPen team workspace." },
    ],
  }),
  component: FilesPage,
});

function FilesPage() {
  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Files</h1>
      <p className="mt-1 text-sm text-muted-foreground">This section is coming next.</p>
    </section>
  );
}
