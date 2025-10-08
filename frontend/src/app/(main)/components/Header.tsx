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
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
const roboto = Roboto_Mono({
  subsets: ["latin"],
});

export const Header = () => {
  const path = usePathname();
  const { user, logout } = useAuth();
  return (
    <div className="fixed top-5 w-full z-50">
      <header className="h-20 px-10 max-md:px-5 py-2 flex justify-between items-center bg-secondary/50 backdrop-blur-md w-9/10 hover:bg-secondary transition ease-in-out shadow-sm shadow-accent/30 hover:shadow-lg rounded-2xl m-auto">
        <Link href="/">
          <div className="flex items-center gap-3 text-2xl hover:text-accent hover:scale-90 transition ease-in-out">
            <Image src="/blueprint.png" alt="Logo" width={50} height={50} />
            <div className={roboto.className}>Blueprint</div>
          </div>
        </Link>
        <div className="flex gap-2 items-center max-md:hidden justify-center text-xl *:hover:text-faded *:hover:scale-90 *:transition *:ease-in-out">
          <Link
            href="/app"
            className={cn({
              "border-b-accent border-b-2 pointer-events-none": path === "/app",
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
            href="/app/reservation"
            className={cn({
              "border-b-accent border-b-2 pointer-events-none":
                path === "/app/reservation",
            })}
          >
            Időpontok
          </Link>
        </div>
        <div className="flex items-center flex-row-reverse gap-3">
          <Menu className="min-md:hidden" size={35} />
          <Popover>
            <PopoverTrigger asChild>
              <div className="rounded-full bg-faded flex justify-center items-center text-white size-10 shrink-0 cursor-pointer select-none hover:scale-90 transition ease-in-out">
                {user?.name.slice(0, 1)}
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
                  <User className="mr-2 h-4 w-4" />
                  Profil
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
  );
};
