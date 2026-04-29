"use client";
import Image from "next/image";
import Link from "next/link";
import { Roboto_Mono } from "next/font/google";
import { Button } from "@/components/ui/Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Separator } from "@/components/ui/Separator";
import {
  Bell,
  Calendar,
  Newspaper,
  LogOut,
  Menu,
  Pen,
  Settings,
  Shield,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { isReducedMotionEnabled } from "@/lib/motion";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { GetUnreadNotificationCountResponse } from "@/types";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
const roboto = Roboto_Mono({
  subsets: ["latin"],
});
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useState } from "react";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const path = usePathname();
  const { user, logout } = useAuth();

  const appNavLinks = [
    { href: "/", label: "Főoldal" },
    { href: "/events", label: "Események" },
    { href: "/appointments", label: "Időpontok" },
  ] as const;

  const isAppNavActive = (href: string) => {
    if (href === "/") {
      return path === "/";
    }

    return path === href || path.startsWith(`${href}/`);
  };

  const { data: unreadData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const { data } = await axios.get<GetUnreadNotificationCountResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/unread-count`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
  });

  const unreadCount = unreadData?.unreadCount ?? 0;
  useGSAP(() => {
    if (isReducedMotionEnabled()) {
      return;
    }

    gsap.from(".header", {
      y: -100,
      scale: 0.9,
      ease: "expo.in",
      duration: 0.6,
    });
  }, []);
  return (
    <>
      {isMenuOpen && (
        <div className="fixed inset-0 z-[2000] md:hidden">
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Menü bezárása"
          />
          <aside className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-secondary/70 backdrop-blur-xl border-l border-faded/20 p-4 shadow-md shadow-black/20">
            <X
              strokeWidth={"1px"}
              size={32}
              className="cursor-pointer"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="mt-6 flex flex-col gap-3 text-lg">
              {appNavLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/news" onClick={() => setIsMenuOpen(false)}>
                Hírek
              </Link>
              <Link href="/calendar" onClick={() => setIsMenuOpen(false)}>
                Naptár
              </Link>
              <Link href="/notifications" onClick={() => setIsMenuOpen(false)}>
                Értesítések
              </Link>
              <Link href="/settings" onClick={() => setIsMenuOpen(false)}>
                Beállítások
              </Link>
              <button
                type="button"
                onClick={logout}
                className="mt-2 inline-flex items-center gap-2 text-red-600"
              >
                <LogOut className="size-5" />
                Kijelentkezés
              </button>
            </div>
          </aside>
        </div>
      )}
      <div className="mt-3 sm:mt-5 w-full header">
        <header className="h-16 sm:h-20 py-2 flex justify-between items-center page-shell transition ease-in-out rounded-2xl">
          <Link href="/">
            <div className="flex items-center select-none gap-2 sm:gap-3 text-xl sm:text-2xl hover:text-accent transition ease-in-out">
              <Image src="/blueprint.png" alt="Logo" width={44} height={44} />
              <div className={roboto.className}>Blueprint</div>
            </div>
          </Link>
          <div className="hidden md:flex gap-5 items-center justify-center text-xl *:hover:text-faded *:transition *:ease-in-out">
            {appNavLinks.map((item) => {
              const isActive = isAppNavActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative select-none pb-1 after:pointer-events-none after:absolute after:-bottom-0 after:left-1/2 after:block after:h-[2px] after:-translate-x-1/2 after:rounded-full after:bg-accent after:content-[''] after:transition-all after:duration-200",
                    {
                      "pointer-events-none after:w-[100%] after:opacity-100":
                        isActive,
                      "after:w-0 after:opacity-0": !isActive,
                    },
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center flex-row-reverse gap-3">
            <Menu
              className="md:hidden"
              size={35}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
            <Popover>
              <PopoverTrigger asChild className="max-md:hidden">
                <div className="">
                  <div className="rounded-full bg-faded flex justify-center items-center text-white size-10 shrink-0 cursor-pointer select-none hover:scale-90 transition ease-in-out">
                    {user?.name.slice(0, 1)}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="flex flex-col" align="end">
                <div className="flex items-center space-x-2 p-2 mb-4">
                  <div className="rounded-full bg-faded flex justify-center items-center text-white size-10 shrink-0 select-none">
                    {user?.name.slice(0, 1)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">{user?.name}</h4>
                    <p className="text-xs text-faded">{user?.email}</p>
                  </div>
                  <div className="">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                    >
                      <Link
                        href="/settings"
                        className="flex w-full justify-start items-center gap-1"
                      >
                        <Settings className="size-6" />
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="grid gap-1 px-4">
                  {user?.role === "admin" && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                    >
                      <Link
                        href="/admin"
                        className="flex w-full justify-start items-center gap-1"
                      >
                        <Shield className="mr-2 size-5" />
                        Admin felület
                      </Link>
                    </Button>
                  )}
                  {user?.role === "teacher" && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                    >
                      <Link
                        href="/teacher"
                        className="flex w-full justify-start items-center gap-1"
                      >
                        <Shield className="mr-2 size-5" />
                        Tanári felület
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Link
                      href="/calendar"
                      className="flex w-full justify-start items-center gap-1"
                    >
                      <Calendar className="mr-2 size-5" />
                      Naptár
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Link
                      href="/news"
                      className="flex w-full justify-start items-center gap-1"
                    >
                      <Newspaper className="mr-2 size-5" />
                      Hírek
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Link
                      href="/notifications"
                      className="flex w-full justify-start items-center gap-1"
                    >
                      <Bell className="mr-2 size-5" />
                      Értesítések
                      {unreadCount > 0 && (
                        <span className="ml-1 rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.5 leading-none">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </Button>
                  <Separator className="my-1 bg-faded/20" />
                  <Button
                    variant="destructive"
                    className="w-full justify-start cursor-pointer hover:bg-red-600/20 shadow-none text-red-600"
                    size="sm"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 size-5" />
                    Kijelentkezés
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>
      </div>
    </>
  );
};
