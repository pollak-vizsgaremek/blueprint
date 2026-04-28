"Use client";
import { useModal } from "@/contexts/ModalContext";
import { Event } from "@/types";
import { ImageOff } from "lucide-react";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const EventTile = ({ event }: { event: Event }) => {
  const { openModal } = useModal();
  return (
    <div
      onClick={() => openModal(event)}
      className="h-80 cursor-pointer flex flex-col hover:shadow-md hover:shadow-gray-500 transition rounded-2xl"
    >
      <div className="h-[60%] w-full relative">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority
            className="rounded-t-2xl block object-cover"
          />
        ) : (
          <div className="h-full w-full rounded-t-2xl bg-faded/15 flex items-center justify-center text-faded">
            <ImageOff size={28} />
          </div>
        )}
      </div>
      <div className="h-[40%] bg-secondary/40 backdrop-blur-xl border-[0.5px] border-faded/10 rounded-b-2xl flex flex-col justify-between p-2">
        <div className="">
          <div className="">{event.name}</div>
          <div className="text-slate-500">
            {event.description.slice(0, 50) + "..."}
          </div>
        </div>
        <div className="flex justify-between">
          <div className="">{event.location}</div>
          <div className="flex items-center gap-2">
            <div className="">{event.date.slice(0, 10)}</div>
            <Link
              href={`/events/${event.id}/details`}
              prefetch
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded-md hover:bg-faded/30 transition ease-in-out"
              aria-label="Esemény oldal megnyitása"
            >
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
