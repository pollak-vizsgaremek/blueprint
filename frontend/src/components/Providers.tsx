"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { PopupModalProvider } from "@/contexts/PopupModalContext";

export const Providers = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PopupModalProvider>{children}</PopupModalProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
