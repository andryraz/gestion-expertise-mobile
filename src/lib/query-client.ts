import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Une donnée reste "fraîche" 30s : si l'utilisateur revient très vite
      // sur un écran déjà visité, pas de refetch réseau inutile. Passé ce
      // délai, React Query refetch automatiquement au prochain montage.
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
});
