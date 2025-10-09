"use client";
import { BellRing, Circle } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export const NotifPanel = () => {
  useGSAP(() => {
    gsap.fromTo(
      ".bell",
      { repeat: -1, rotate: 10, yoyo: true, duration: 0.5 },
      {
        repeat: -1,
        rotate: -10,
        yoyo: true,
        duration: 0.5,
      },
    );
  }, []);
  return (
    <div className="flex pt-4 cursor-pointer justify-center items-center grow flex-col gap-3 text-center text-sm rounded-xl px-4 relative hover:bg-faded/20 transition ease-in-out">
      <Circle
        color="red"
        fill="red"
        size={16}
        className="absolute right-20 top-2"
      />
      <BellRing className="size-20 bell" />
      <div className="">
        A(z) <span className="text-accent">Esport</span> eseménybe új hírt
        küldtek
      </div>
    </div>
  );
};
