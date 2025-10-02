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
import { LogOut, Settings, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
const roboto = Roboto_Mono({
  subsets: ["latin"],
});

export const Header = () => {
  const path = usePathname();
  return (
    <div className="fixed top-5 w-full z-50">
      <header className="h-20 px-10 py-2 flex justify-between items-center bg-secondary/50 backdrop-blur-md w-9/10 hover:bg-secondary transition ease-in-out shadow-sm shadow-accent/30 hover:shadow-lg rounded-2xl m-auto">
        <Link href="/">
          <div className="flex items-center gap-3 text-2xl hover:text-accent hover:scale-90 transition ease-in-out">
            <Image src="/blueprint.png" alt="Logo" width={50} height={50} />
            <div className={roboto.className}>Blueprint</div>
          </div>
        </Link>
        <div className="flex gap-2 items-center justify-center text-xl *:hover:text-faded *:hover:scale-90 *:transition *:ease-in-out">
          <Link
            href="/"
            className={cn({ "border-b-accent border-b-2": path === "/" })}
          >
            Főoldal
          </Link>
          <Link
            href="/events"
            className={cn({ "border-b-accent border-b-2": path === "/events" })}
          >
            Események
          </Link>
          <Link
            href="/reservation"
            className={cn({
              "border-b-accent border-b-2": path === "/reservation",
            })}
          >
            Időpontok
          </Link>
        </div>
        <div className="">
          <Popover>
            <PopoverTrigger asChild>
              <Image
                src="https://placehold.co/50x50"
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full ml-5 cursor-pointer hover:scale-90 transition ease-in-out"
              />
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="flex items-center space-x-2 p-2">
                <Image
                  src="https://placehold.co/50x50"
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">@shadcn</h4>
                  <p className="text-xs text-faded">shadcn@example.com</p>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="grid gap-1">
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
                <Separator className="my-1" />
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  size="sm"
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
