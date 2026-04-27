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
  User,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { isReducedMotionEnabled } from "@/lib/motion";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { GetUnreadNotificationCountResponse } from "@/types";
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
        <div className="w-8/10 p-2 max-w-[500px] h-screen bg-secondary/40 backdrop-blur-xl fixed top-0 right-0 z-[2000] shadow-md shadow-black/20">
          <X
            strokeWidth={"0.5px"}
            size={40}
            className="cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
        </div>
      )}
      {isMenuOpen && (
        <div className="w-2/10 h-screen fixed z-[1000] left-0 top-0 bg-black/40"></div>
      )}
      <div className="mt-5 w-full header">
        <header className="h-20 max-md:px-5 py-2 flex justify-between items-center w-9/10 transition ease-in-out  rounded-2xl m-auto">
          <Link href="/">
            <div className="flex items-center select-none gap-3 text-2xl hover:text-accent hover:scale-90 transition ease-in-out">
              <Image src="/blueprint.png" alt="Logo" width={50} height={50} />
              <div className={roboto.className}>Blueprint</div>
            </div>
          </Link>
          <div className="flex gap-5 items-center relative max-md:hidden -translate-x-15 justify-center text-xl *:hover:text-faded *:hover:scale-90 *:transition *:ease-in-out">
            <div
              className={cn(
                "bg-accent h-[2px] absolute bottom-0 transition left-0 ease-in-out",
                {
                  "w-17 translate-x-0": path === "/app",
                  "w-27 translate-x-22": path === "/app/events",
                  "w-26 translate-x-53": path === "/app/appointments",
                },
              )}
            ></div>
            <Link
              href="/app"
              className={cn("select-none", {
                "pointer-events-none": path === "/app",
              })}
            >
              Főoldal
            </Link>
            <Link
              href="/app/events"
              className={cn("select-none", {
                "pointer-events-none": path === "/app/events",
              })}
            >
              Események
            </Link>
            <Link
              href="/app/appointments"
              className={cn("select-none", {
                "pointer-events-none": path === "/app/appointments",
              })}
            >
              Időpontok
            </Link>
          </div>
          <div className="flex items-center flex-row-reverse gap-3">
            <Menu
              className="min-md:hidden"
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
                        href="/app/settings"
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
                        <Shield className="mr-2 h-4 w-4" />
                        Admin felület
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Link
                      href="/app/calendar"
                      className="flex w-full justify-start items-center gap-1"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Naptár
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Link
                      href="/app/news"
                      className="flex w-full justify-start items-center gap-1"
                    >
                      <Newspaper className="mr-2 h-4 w-4" />
                      Hírek
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Pen className="mr-2 h-4 w-4" />
                    Jelentkezések
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Link
                      href="/app/notifications"
                      className="flex w-full justify-start items-center gap-1"
                    >
                      <Bell className="mr-2 h-4 w-4" />
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
                    <LogOut className="mr-2 h-4 w-4" />
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
