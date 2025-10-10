import { Event } from "@/types";
import { EventTile } from "./EventTile";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export const EventTiles = ({
  events,
  filter,
}: {
  events: Event[];
  filter: string;
}) => {
  useGSAP(() => {
    gsap.from(".tiles", {
      scale: 0.9,
      opacity: 0,
      delay: 0.6,
      ease: "expo.in",
      duration: 0.5,
    });
  }, []);
  return (
    <div className="tiles pt-5 px-5 flex gap-5 flex-wrap">
      {events.map((event) => {
        if (filter == "future" && new Date(event.date) > new Date()) {
          return <EventTile event={event} key={event.id} />;
        }
        if (filter == "past" && new Date(event.date) < new Date()) {
          return <EventTile event={event} key={event.id} />;
        }
        if (filter === "all") {
          return <EventTile event={event} key={event.id} />;
        }
      })}
    </div>
  );
};
