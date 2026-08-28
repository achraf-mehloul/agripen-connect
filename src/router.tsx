import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Offline-first: keep data usable for a week and never hard-fail a
        // cached screen just because the device dropped connectivity.
        staleTime: 30_000,
        gcTime: 1000 * 60 * 60 * 24 * 7,
        retry: 1,
        refetchOnWindowFocus: false,
        networkMode: "offlineFirst",
      },
      mutations: { networkMode: "offlineFirst", retry: 0 },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
