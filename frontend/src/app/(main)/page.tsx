"use client";
import { NotifPanel } from "./components/panels/NotifPanel";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useAuth } from "@/contexts/AuthContext";
import { isReducedMotionEnabled } from "@/lib/motion";
import { EventsPanel } from "./components/panels/EventsPanel";
import { NewsPanel } from "./components/panels/NewsPanel";
import { CalendarPanel } from "./components/panels/CalendarPanel";
import { AppointmentsPanel } from "./components/panels/AppointmentsPanel";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  useGSAP(() => {
    if (isReducedMotionEnabled()) {
      return;
    }

    gsap.from("#name", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
    gsap.from("#box", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
    gsap.from("#icons", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
  }, []);

  return (
    <main className="page-shell min-h-screen pt-24 pb-16 sm:pt-28">
      <div className="text-2xl sm:text-3xl mb-6 sm:mb-8" id="name">
        Szép napot, <span className="font-bold text-accent">{user?.name}</span>
      </div>
      <div
        className="grid w-full gap-4 mb-4 grid-cols-1 xl:grid-cols-5"
        id="box"
      >
        <div className="card-box flex flex-col xl:col-span-2">
          <div className="card-title">Hírek</div>
          <NewsPanel />
        </div>
        <div className="card-box flex flex-col xl:col-span-3">
          <div className="card-title mb-3">Közelgő események</div>
          <EventsPanel />
        </div>
      </div>
      <div className="grid w-full gap-4 grid-cols-1 xl:grid-cols-5" id="box">
        <div className="card-box flex flex-col xl:col-span-1">
          <div className="card-title mb-3">Naptár</div>
          <CalendarPanel />
        </div>
        <div className="card-box flex flex-col xl:col-span-3">
          <div className="card-title mb-3">Közelgő időpontok</div>
          <AppointmentsPanel />
        </div>
        <div className="card-box xl:col-span-1 flex flex-col">
          <div className="card-title">Értesítések</div>
          <NotifPanel />
        </div>
      </div>
      <div className="w-full gap-3 flex flex-wrap justify-end mt-5" id="icons">
        <button className="bg-secondary/40 backdrop-blur-xl py-2 px-3 rounded-xl border-[0.5px] border-faded/10 transition ease-in-out hover:bg-faded/40 cursor-pointer">
          <Link href="/settings">
            <Settings />
          </Link>
        </button>
        <button
          onClick={logout}
          className="flex gap-2 justify-center items-center text-red-500 bg-secondary/40 backdrop-blur-xl py-2 px-3 rounded-xl border-[0.5px] border-faded/10 transition ease-in-out hover:bg-red-100 cursor-pointer"
        >
          <LogOut />
          Kijelentkezés
        </button>
      </div>
    </main>
  );
};

export default DashboardPage;
