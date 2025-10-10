"use client";
import { NotifPanel } from "../components/panels/NotifPanel";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useAuth } from "@/contexts/AuthContext";
import { EventsPanel } from "../components/panels/EventsPanel";
import { NewsPanel } from "../components/panels/NewsPanel";
import { CalendarPanel } from "../components/panels/CalendarPanel";
import { AppointmentsPanel } from "../components/panels/AppointmentsPanel";
import { LogOut, Settings, User } from "lucide-react";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  useGSAP(() => {
    let lt = gsap.timeline();
    lt.from("#name", { x: -500, ease: "expo.in", duration: 1 });
    lt.from("#box", {
      scale: 0,
      duration: 1,
      ease: "expo.inOut",
    });
    lt.from("#icons", { y: -100, ease: "expo.in", duration: 1, opacity: 0 });
  }, []);

  return (
    <main className="w-7/8 m-auto mb-96">
      <div className="text-3xl max-md:text-2xl mb-8" id="name">
        Szép napot, <span className="font-bold text-accent">{user?.name}</span>
      </div>
      <div className="flex w-full gap-4 mb-4 max-md:flex-wrap" id="box">
        <div className="card-box flex flex-col basis-2/5">
          <div className="card-title">Hírek</div>
          <NewsPanel />
        </div>
        <div className="card-box flex flex-col basis-3/5">
          <div className="card-title mb-3">Jelentkezett események</div>
          <EventsPanel />
        </div>
      </div>
      <div className="flex w-full gap-4 max-md:flex-wrap" id="box">
        <div className="card-box flex flex-col basis-1/5">
          <div className="card-title">Naptár</div>
          <CalendarPanel />
        </div>
        <div className="card-box flex flex-col basis-3/5">
          <div className="card-title mb-3">Közelgő időpontok</div>
          <AppointmentsPanel />
        </div>
        <div className="card-box basis-1/5 flex flex-col">
          <div className="card-title">Értesítések</div>
          <NotifPanel />
        </div>
      </div>
      <div className="w-full gap-3 flex justify-end mt-5" id="icons">
        <button className="bg-secondary/50 py-2 px-3 rounded-xl border-[1px] border-faded transition hover:shadow-lg shadow-md shadow-black/20 ease-in-out hover:bg-faded/20 cursor-pointer">
          <User />
        </button>
        <button className="bg-secondary/50 py-2 px-3 rounded-xl border-[1px] border-faded transition hover:shadow-lg shadow-md shadow-black/20 ease-in-out hover:bg-faded/20 cursor-pointer">
          <Settings />
        </button>
        <button
          onClick={logout}
          className="flex gap-2 justify-center items-center text-red-500 bg-secondary/50 py-2 px-3 rounded-xl border-[1px] border-faded transition hover:shadow-lg shadow-md shadow-black/20 ease-in-out hover:bg-red-100 cursor-pointer"
        >
          <LogOut />
          Kijelentkezés
        </button>
      </div>
    </main>
  );
};

export default DashboardPage;
