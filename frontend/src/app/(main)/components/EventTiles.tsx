import { Event } from "@/types";
import { EventTile } from "./EventTile";

export const EventTiles = ({
  events,
  filter,
}: {
  events: Event[];
  filter: string;
}) => {
  return (
    <div className="pt-5 px-5 flex gap-5 flex-wrap">
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
