import { Event } from "@/types";
import Image from "next/image";

export const Evenlist = ({ events }: { events: Event[] }) => {
  return (
    <div className="pt-5 px-5 w-full">
      {events.map((event: Event) => {
        return (
          <div
            key={event.id}
            className="h-20 border-b-[1px] last:border-0 last:rounded-b-2xl first:rounded-t-2xl px-2 bg-secondary border-b-faded flex items-center justify-between"
          >
            <div className="flex items-center gap-5">
              <Image
                src={event.imageUrl!}
                alt="Event"
                width={80}
                height={80}
                className="rounded-lg"
              />
              <div className="">{event.name}</div>
              <div className="text-slate-500">
                {event.description.slice(0, 50)}
              </div>
            </div>
            <div className="flex gap-5 items-center">
              <div className="">{event.date.slice(0, 10)}</div>
              <button className="bg-accent py-2 px-3 text-white rounded-2xl">
                Információ
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
