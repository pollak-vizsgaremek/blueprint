import { Event } from "@/types";
import { EventListItem } from "./EventListItem";

export const Evenlist = ({
  events,
  filter,
}: {
  events: Event[];
  filter: string;
}) => {
  return (
    <div className="pt-5 px-5 w-full">
      {events.map((event: Event) => {
        if (filter == "future" && new Date(event.date) > new Date()) {
          return <EventListItem event={event} key={event.id} />;
        }
        if (filter == "past" && new Date(event.date) < new Date()) {
          return <EventListItem event={event} key={event.id} />;
        }
        if (filter === "all") {
          return <EventListItem event={event} key={event.id} />;
        }
      })}
    </div>
  );
};
