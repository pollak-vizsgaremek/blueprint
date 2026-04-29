import { Event } from "@/types";
import { EventListItem } from "./EventListItem";
import { useGSAP } from "@gsap/react";
import { isReducedMotionEnabled } from "@/lib/motion";
import gsap from "gsap";

export const EventList = ({ events }: { events: Event[] }) => {
  useGSAP(() => {
    if (isReducedMotionEnabled()) {
      return;
    }

    gsap.from(".page-content1", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
  }, []);

  return (
    <div className="pt-5 px-5 w-full flex flex-col gap-3 page-content1">
      {events.map((event: Event) => (
        <EventListItem event={event} key={event.id} />
      ))}
    </div>
  );
};
