import { Event } from "@/types";
import Image from "next/image";

export const EventListItem = ({ event }: { event: Event }) => {
  return (
    <div
      key={event.id}
      className="h-20 rounded-2xl hover:bg-secondary transition ease-in-out border-black/20 border-[1px] px-2 bg-secondary/50 flex items-center justify-between"
    >
      <div className="flex items-center gap-5">
        <div className="w-30 h-16 relative">
          <Image
            src={event.imageUrl!}
            alt="Event"
            fill
            priority
            className="rounded-lg object-center"
          />
        </div>
        <div className="">{event.name}</div>
        <div className="text-slate-500 max-[800px]:hidden">
          {event.description.slice(0, 80) + "..."}
        </div>
      </div>
      <div className="flex gap-5 items-center">
        <div className="">{event.date.slice(0, 10)}</div>
        <button className="bg-accent py-2 px-3 text-white rounded-2xl hover:scale-90 transition ease-in-out cursor-pointer hover:bg-accent/70">
          Információ
        </button>
      </div>
    </div>
  );
};
