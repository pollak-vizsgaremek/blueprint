import { Event } from "@/types";
import Image from "next/image";

export const EventTiles = ({ events }: { events: Event[] }) => {
  return (
    <div className="pt-5 px-5 flex gap-5 flex-wrap">
      {events.map((event) => {
        return (
          <div
            key={event.id}
            className="w-80 h-80 flex flex-col hover:shadow-md hover:shadow-gray-500 transition rounded-2xl"
          >
            <div className="h-[60%] w-full relative">
              <Image
                src={event.imageUrl!}
                alt="Event"
                fill
                priority
                className="rounded-t-2xl block object-cover"
              />
            </div>
            <div className="h-[40%] bg-secondary rounded-b-2xl flex flex-col justify-between p-2">
              <div className="">
                <div className="">{event.name}</div>
                <div className="text-slate-500">
                  {event.description.slice(0, 50) + "..."}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="">{event.location}</div>
                <div className="">{event.date.slice(0, 10)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
