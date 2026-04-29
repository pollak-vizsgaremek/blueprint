"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEventDetail } from "../../../../../contexts/EventDetailContext";
import { isReducedMotionEnabled } from "@/lib/motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  Building2,
  CalendarDays,
  MapPin,
  UserRound,
  Users,
} from "lucide-react";

const formatDateTime = (value?: string) => {
  if (!value) return "Ismeretlen";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ismeretlen";
  return date.toLocaleString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateOnly = (value?: string) => {
  if (!value) return "Ismeretlen";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ismeretlen";
  return date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const EventDetailsTabPage = () => {
  const queryClient = useQueryClient();
  const { event, eventId } = useEventDetail();

  useGSAP(() => {
    if (isReducedMotionEnabled()) {
      return;
    }

    gsap.from(".page-content", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
  }, []);

  const { mutate: toggleRegistration, isPending: isRegistrationPending } =
    useMutation({
      mutationFn: async () => {
        if (!event) {
          return;
        }

        if (event.isUserRegistered) {
          await axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}/register`,
            {
              withCredentials: true,
            },
          );
          return;
        }

        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}/register`,
          {},
          {
            withCredentials: true,
          },
        );
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["events"] });
        queryClient.invalidateQueries({
          queryKey: ["events", "detail", eventId],
        });
        queryClient.invalidateQueries({ queryKey: ["myevents"] });
      },
    });

  if (!event) {
    return null;
  }

  const canRegister = event.isUserRegistered || !event.isFull;

  return (
    <div className="px-4 sm:px-6 lg:px-10 mt-5 pb-8 sm:pb-10 flex justify-between flex-col grow page-content">
      <div>
        <div className="text-2xl sm:text-3xl lg:text-4xl mb-3">
          {event.name}
        </div>
        <div className="text-gray-600 text-justify mb-5">
          {event.description}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <UserRound size={16} className="text-accent" />
            <span>Szervező: {event.creator || "Ismeretlen"}</span>
          </div>
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <CalendarDays size={16} className="text-accent" />
            <span>{formatDateTime(event.date)}</span>
          </div>
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <MapPin size={16} className="text-accent" />
            <span>{event.location || "Nincs helyszín"}</span>
          </div>
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <Building2 size={16} className="text-accent" />
            <span>{event.classroom || "Nincs tanterem"}</span>
          </div>
        </div>
      </div>
      <div className="w-full justify-between flex mt-8 sm:mt-10 items-center flex-wrap gap-3">
        <div className="text-sm text-faded px-3 py-2 inline-flex items-center gap-2">
          <CalendarDays size={16} className="" />
          <span>Létrehozva: {formatDateOnly(event.createdAt)}</span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-sm text-gray-600">
            {event.maxParticipants
              ? `${event.registrationCount}/${event.maxParticipants} jelentkező`
              : `${event.registrationCount} jelentkező`}
          </div>
          <button
            onClick={() => toggleRegistration()}
            disabled={!canRegister || isRegistrationPending}
            className="bg-accent text-white text-base sm:text-lg px-3 py-2 hover:bg-accent/60 transition ease-in-out active:scale-95 active:duration-75 rounded-xl cursor-pointer disabled:bg-faded disabled:cursor-not-allowed"
          >
            {isRegistrationPending
              ? "Feldolgozás..."
              : event.isUserRegistered
                ? "Lemondás"
                : "Jelentkezés"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsTabPage;
