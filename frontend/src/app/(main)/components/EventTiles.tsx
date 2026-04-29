import { Event } from "@/types";
import { EventTile } from "./EventTile";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { isReducedMotionEnabled } from "@/lib/motion";

export const EventTiles = ({ events }: { events: Event[] }) => {
  useGSAP(() => {
    if (isReducedMotionEnabled()) {
      return;
    }

    gsap.from(".tiles", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
  }, []);
  return (
    <div className="pt-5 px-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[1800px] m-auto tiles">
      {events.map((event) => (
        <EventTile event={event} key={event.id} />
      ))}
    </div>
  );
};
