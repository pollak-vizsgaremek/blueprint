"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEventDetail } from "../../../../../contexts/EventDetailContext";
import { isReducedMotionEnabled } from "@/lib/motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

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
    <div className="px-10 pt-5 pb-10 flex justify-between flex-col grow page-content">
      <div>
        <div className="text-4xl mb-3">{event.name}</div>
        <div className="text-gray-600 text-justify mb-5">
          {event.description}
        </div>
        <div className="flex justify-between">
          <div>Szervező: {event.creator}</div>
          <div>Dátum: {event.date.slice(0, 10)}</div>
        </div>
      </div>
      <div className="w-full justify-between flex mt-10 items-center">
        <div className="text-gray-600">
          Létrehozva: {event.createdAt.slice(0, 10)}
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
            className="bg-accent text-white text-xl px-3 py-2 hover:bg-accent/60 transition ease-in-out active:scale-95 active:duration-75 rounded-xl cursor-pointer disabled:bg-faded disabled:cursor-not-allowed"
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
