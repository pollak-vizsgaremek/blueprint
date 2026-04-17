"Use client";
import { useModal } from "@/contexts/ModalContext";
import { Event } from "@/types";
import Image from "next/image";

export const EventTile = ({ event }: { event: Event }) => {
  const { openModal } = useModal();
  return (
    <div
      onClick={() => openModal(event)}
      className="h-80 cursor-pointer flex flex-col hover:shadow-md hover:shadow-gray-500 transition rounded-2xl"
    >
      <div className="h-[60%] w-full relative">
        <Image
          src={event.imageUrl!}
          alt="Event"
          fill
          priority
          className="rounded-t-2xl block object-center"
        />
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
          <div className="">{event.date.slice(0, 10)}</div>
        </div>
      </div>
    </div>
  );
};
