"use client";

import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CalendarRange,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/teacher", label: "Áttekintés", icon: LayoutDashboard },
  { href: "/teacher/events", label: "Események", icon: CalendarDays },
  { href: "/teacher/appointments", label: "Időpontok", icon: Clock3 },
  {
    href: "/teacher/availability",
    label: "Elérhetőségek",
    icon: CalendarRange,
  },
];

const isActivePath = (pathname: string, href: string) => {
  if (href === "/teacher") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export const TeacherShell = ({ children }: { children: React.ReactNode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navContent = (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ease-in-out",
              isActive
                ? "bg-accent text-white shadow-sm shadow-accent/20"
                : "hover:bg-faded/20 text-text",
            )}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-40 pt-4 pb-3 backdrop-blur-md bg-primary/70 border-b border-faded/10">
        <div className="page-shell flex items-center justify-between gap-3 sm:gap-4">
          <Link
            href="/teacher"
            className="flex items-center gap-3 hover:text-accent transition ease-in-out"
          >
            <Image
              src="/blueprint.png"
              alt="Blueprint"
              width={42}
              height={42}
            />
            <div>
              <div className="text-xl font-semibold leading-tight">
                Blueprint
              </div>
              <div className="text-xs text-faded uppercase tracking-[0.2em]">
                Teacher
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <WorkspaceSwitcher />
            <div className="rounded-xl border border-faded/20 bg-secondary/50 px-3 py-2 text-sm">
              <span className="text-faded">Tanár:</span>{" "}
              <span className="font-medium">{user?.name ?? "-"}</span>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300/40 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 transition ease-in-out cursor-pointer"
            >
              <LogOut size={16} />
              Kilépés
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden rounded-xl border border-faded/20 bg-secondary/50 p-2"
            aria-label="Tanári menü megnyitása"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Tanári menü bezárása"
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-secondary/70 backdrop-blur-xl border-l border-faded/20 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 font-semibold">
                <Shield size={18} className="text-accent" />
                Tanári menü
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg border border-faded/20 p-2"
                aria-label="Tanári menü bezárása"
              >
                <X size={18} />
              </button>
            </div>
            {navContent}
            <button
              onClick={logout}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300/40 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <LogOut size={16} />
              Kilépés
            </button>
          </aside>
        </div>
      )}

      <div className="page-shell grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-4 sm:gap-5 pt-4 sm:pt-5">
        <aside className="hidden lg:block card-box h-fit! p-3 sticky top-28">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-faded uppercase tracking-[0.2em]">
              Kezelés
            </div>
          </div>
          {navContent}
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
};
