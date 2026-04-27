"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const TeacherGuard = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== "teacher") {
      router.replace("/app");
    }
  }, [isLoading, router, user?.role]);

  if (isLoading || user?.role !== "teacher") {
    return <></>;
  }

  return <>{children}</>;
};
