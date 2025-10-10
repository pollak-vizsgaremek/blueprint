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
  LogOut,
  Menu,
  Pen,
  Settings,
  User,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
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
  useGSAP(() => {
    gsap.from(".header", {
      y: -100,
      scale: 0.9,
      ease: "expo.in",
      duration: 0.9,
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
      <div className="fixed top-5 w-full z-50 header">
        <header className="h-20 px-10 max-md:px-5 py-2 flex justify-between items-center bg-secondary/50 backdrop-blur-lg w-9/10 hover:bg-secondary transition ease-in-out shadow-sm shadow-accent/30 hover:shadow-lg rounded-2xl m-auto">
          <Link href="/">
            <div className="flex items-center gap-3 text-2xl hover:text-accent hover:scale-90 transition ease-in-out">
              <Image src="/blueprint.png" alt="Logo" width={50} height={50} />
              <div className={roboto.className}>Blueprint</div>
            </div>
          </Link>
          <div className="flex gap-5 pr-20 items-center max-md:hidden justify-center text-xl *:hover:text-faded *:hover:scale-90 *:transition *:ease-in-out">
            <Link
              href="/app"
              className={cn({
                "border-b-accent border-b-2 pointer-events-none":
                  path === "/app",
              })}
            >
              Főoldal
            </Link>
            <Link
              href="/app/events"
              className={cn({
                "border-b-accent border-b-2 pointer-events-none":
                  path === "/app/events",
              })}
            >
              Események
            </Link>
            <Link
              href="/app/appointments"
              className={cn({
                "border-b-accent border-b-2 pointer-events-none":
                  path === "/app/appointments",
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
                </div>
                <div className="grid gap-1 px-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Link
                      href="/app/profile"
                      className="flex w-full justify-start items-center gap-1"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Beállítások
                  </Button>
                  <Separator className="my-1 bg-black/20" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Naptár
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
                    <Bell className="mr-2 h-4 w-4" />
                    Értesítések
                  </Button>
                  <Separator className="my-1 bg-black/20" />
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
