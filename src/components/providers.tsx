"use client";

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000 },
        },
        mutationCache: new MutationCache({
          onError: () => {
            toast.error("Action failed — try again");
          },
        }),
      }),
  );

  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
