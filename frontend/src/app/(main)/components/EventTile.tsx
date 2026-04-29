"use client";
import { useModal } from "@/contexts/ModalContext";
import { Event } from "@/types";
import {
  Building2,
  CalendarDays,
  ExternalLink,
  ImageOff,
  MapPin,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDateTimeHuCompact } from "@/lib/dateFormat";

export const EventTile = ({ event }: { event: Event }) => {
  const { openModal } = useModal();
  const registrationCount =
    "registrationCount" in event && typeof event.registrationCount === "number"
      ? event.registrationCount
      : 0;
  const registrationText = event.maxParticipants
    ? `${registrationCount}/${event.maxParticipants}`
    : `${registrationCount}`;

  return (
    <div
      onClick={() => openModal(event)}
      className="min-h-[400px] sm:min-h-[400px] cursor-pointer flex flex-col hover:shadow-md hover:shadow-gray-500 transition rounded-2xl"
    >
      <div className="h-[42%] w-full relative">
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
      <div className="h-[58%] bg-secondary/40 backdrop-blur-xl border-[0.5px] border-faded/10 rounded-b-2xl flex flex-col justify-between p-3">
        <div>
          <div className="font-semibold text-lg leading-tight line-clamp-2">
            {event.name}
          </div>
          <div className="text-slate-500 text-sm line-clamp-2 mt-1">
            {event.description}
          </div>
        </div>
        <div className="space-y-1.5 text-sm text-faded">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} />
            <span>{formatDateTimeHuCompact(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={14} />
            <span>{event.classroom || "Nincs tanterem"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} />
            <span>{registrationText} jelentkező</span>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
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
