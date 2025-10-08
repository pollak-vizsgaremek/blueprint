"use client";

import { useAuth } from "@/contexts/AuthContext";

export const Name = () => {
  const { user } = useAuth();
  return <span>{user?.name}</span>;
};
