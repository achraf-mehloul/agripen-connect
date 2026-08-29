import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { PostCard } from "@/components/feed/post-card";
import { PostComposer } from "@/components/feed/post-composer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { fetchGroups } from "@/services/group-service";
import { fetchFeedPage } from "@/services/post-service";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Team feed — AgriPen Team App" },
      { name: "description", content: "Updates, field notes and media from the AgriPen team." },
      { property: "og:title", content: "Team feed — AgriPen Team App" },
      {
        property: "og:description",
        content: "Updates, field notes and media from the AgriPen team.",
      },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const queryClient = useQueryClient();
  const { data: groups = [] } = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });

  const feed = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => fetchFeedPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, _all, lastPage) => (last.hasMore ? lastPage + 1 : undefined),
  });

  // Live updates: any post/comment/reaction change refreshes the feed.
  useEffect(() => {
    const channel = supabase
      .channel("feed-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["feed"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "post_reactions" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["feed"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const posts = feed.data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <section className="mx-auto w-full max-w-2xl space-y-4">
      <header className="px-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Team feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share updates, findings and media with the whole team.
        </p>
      </header>

      <PostComposer groups={groups} />

      {feed.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-40 w-full rounded-3xl" />
          ))}
        </div>
      ) : posts.length ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="glass rounded-3xl p-6 text-sm text-muted-foreground">
          No posts yet — be the first to share an update.
        </p>
      )}

      {feed.hasNextPage ? (
        <Button
          variant="secondary"
          className="w-full rounded-2xl"
          disabled={feed.isFetchingNextPage}
          onClick={() => void feed.fetchNextPage()}
        >
          {feed.isFetchingNextPage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Load older posts
        </Button>
      ) : null}
    </section>
  );
}
