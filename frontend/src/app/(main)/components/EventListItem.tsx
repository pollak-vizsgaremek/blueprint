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

export const EventListItem = ({ event }: { event: Event }) => {
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
      key={event.id}
      className="rounded-2xl hover:bg-secondary transition ease-in-out border-black/20 border-[1px] p-3 bg-secondary/50 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-32 h-20 relative shrink-0">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.name}
              fill
              sizes="120px"
              priority
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="h-full w-full rounded-lg bg-faded/15 flex items-center justify-center text-faded">
              <ImageOff size={16} />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-lg leading-tight line-clamp-1">
            {event.name}
          </div>
          <div className="text-slate-500 text-sm line-clamp-1 mb-2">
            {event.description}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm text-faded">
            <div className="inline-flex items-center gap-2">
              <CalendarDays size={14} />
              <span>{formatDateTimeHuCompact(event.date)}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <MapPin size={14} />
              <span className="line-clamp-1">{event.location}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Building2 size={14} />
              <span>{event.classroom || "Nincs tanterem"}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Users size={14} />
              <span>{registrationText} jelentkező</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 items-center shrink-0">
        <Link
          href={`/events/${event.id}/details`}
          prefetch
          className="p-2 rounded-xl hover:bg-faded/30 transition ease-in-out"
          aria-label="Esemény oldal megnyitása"
        >
          <ExternalLink size={16} />
        </Link>
        <button
          onClick={() => openModal(event)}
          className="bg-accent py-2 px-3 text-white rounded-2xl hover:scale-90 transition ease-in-out cursor-pointer hover:bg-accent/70"
        >
          Információ
        </button>
      </div>
    </div>
  );
};
