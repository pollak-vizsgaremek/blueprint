"use client";

import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

type WorkspaceSwitcherProps = {
  className?: string;
};

export const WorkspaceSwitcher = ({ className }: WorkspaceSwitcherProps) => {
  const { user } = useAuth();
  const pathname = usePathname();

  const workspaces = [{ href: "/app", label: "Frontend" }];

  if (user?.role === "teacher") {
    workspaces.push({ href: "/teacher", label: "Tanári felület" });
  }

  if (user?.role === "admin") {
    workspaces.push({ href: "/admin", label: "Admin felület" });
  }

  if (workspaces.length <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-faded/20 bg-secondary/50 p-1",
        className,
      )}
    >
      {workspaces.map((workspace) => {
        const isActive =
          pathname === workspace.href ||
          pathname.startsWith(`${workspace.href}/`);

        return (
          <Link
            key={workspace.href}
            href={workspace.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition ease-in-out",
              isActive ? "bg-accent text-white" : "hover:bg-faded/20 text-text",
            )}
          >
            {workspace.label}
          </Link>
        );
      })}
    </div>
  );
};
