"use client";

import { Spinner } from "@/components/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) {
    return <></>;
  }

  return <>{children}</>;
};
