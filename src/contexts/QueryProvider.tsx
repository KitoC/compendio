import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  // Create a client inside the component to ensure it's not shared between SSR requests
  const [queryClient] = useState(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          gcTime: 1000 * 60 * 10, // 10 minutes
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
      mutationCache: new MutationCache({
        onError: (error, variables, context) => {
          toast.error(
            (context as { errMessage: string })?.errMessage ||
              "Error in mutation"
          );
        },
      }),
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <div id="react-query-devtools-container" />
      )}
    </QueryClientProvider>
  );
};
