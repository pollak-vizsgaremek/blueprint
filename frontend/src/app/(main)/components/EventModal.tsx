"use client";

import { useModal } from "@/contexts/ModalContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { X } from "lucide-react";
import Image from "next/image";

export const EventModal = () => {
  const { isOpen, closeModal, selectedEvent, setEvent } = useModal();
  const queryClient = useQueryClient();

  const { mutate: toggleRegistration, isPending } = useMutation({
    mutationFn: async () => {
      if (!selectedEvent) {
        return;
      }

      if (selectedEvent.isUserRegistered) {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}/register`,
          {
            withCredentials: true,
          },
        );
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}/register`,
        {},
        {
          withCredentials: true,
        },
      );
    },
    onSuccess: () => {
      if (!selectedEvent) {
        return;
      }

      const nextRegistrationCount = selectedEvent.isUserRegistered
        ? Math.max(0, selectedEvent.registrationCount - 1)
        : selectedEvent.registrationCount + 1;

      const maxParticipants = selectedEvent.maxParticipants;

      setEvent({
        ...selectedEvent,
        isUserRegistered: !selectedEvent.isUserRegistered,
        userRegistration: selectedEvent.isUserRegistered
          ? null
          : {
              id: 0,
              registeredAt: new Date().toISOString(),
              status: "registered",
            },
        registrationCount: nextRegistrationCount,
        isFull: Boolean(
          maxParticipants && nextRegistrationCount >= maxParticipants,
        ),
      });

      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["myevents"] });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ??
          error.response?.data?.error ??
          "Jelentkezés sikertelen.";
        window.alert(errorMessage);
        return;
      }

      window.alert("Jelentkezés sikertelen.");
    },
  });

  const canRegister =
    selectedEvent && (selectedEvent.isUserRegistered || !selectedEvent.isFull);

  return (
    isOpen && (
      <>
        <div className="w-screen h-screen fixed z-[1000] left-0 top-0 bg-black/40" />
        <div className="w-screen h-screen fixed z-[2000] left-0 top-0 flex justify-center items-center">
          <div className="w-full rounded-xl overflow-scroll p-5 border-faded border-[1px]  max-w-[1000px] min-h-min max-h-[600px] bg-secondary">
            <button className="cursor-pointer mb-10" onClick={closeModal}>
              <X size={30} />
            </button>
            <div className="flex justify-between gap-5">
              <div className="relative size-96 ml-10 shrink-0">
                <Image
                  src={selectedEvent!.imageUrl!}
                  alt="Event"
                  fill
                  priority
                  className="rounded-2xl block object-center"
                />
              </div>
              <div className="px-4 flex flex-col justify-between">
                <div className="">
                  <div className="text-4xl mb-3">{selectedEvent?.name}</div>
                  <div className="text-faded text-justify">
                    {selectedEvent?.description}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="">Szervező: {selectedEvent?.creator}</div>
                  <div className="">
                    Dátum: {selectedEvent?.date.slice(0, 10)}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full justify-between flex mt-10 pr-4 pl-10 items-center">
              <div className="text-faded">
                Létrehozva: {selectedEvent?.createdAt.slice(0, 10)}
              </div>
              <button
                onClick={() => toggleRegistration()}
                disabled={!canRegister || isPending}
                className="bg-accent text-white px-3 py-2 hover:bg-accent/60 transition ease-in-out active:scale-95 active:duration-75 rounded-xl cursor-pointer disabled:bg-faded disabled:cursor-not-allowed"
              >
                {isPending
                  ? "Feldolgozás..."
                  : selectedEvent?.isUserRegistered
                    ? "Jelentkezés lemondása"
                    : "Jelentkezés"}
              </button>
            </div>
            <div className="w-full mt-4 px-10 text-sm text-faded flex justify-end">
              {selectedEvent && selectedEvent.maxParticipants
                ? `${selectedEvent.registrationCount}/${selectedEvent.maxParticipants} jelentkező`
                : selectedEvent
                  ? `${selectedEvent.registrationCount} jelentkező`
                  : ""}
            </div>
          </div>
        </div>
      </>
    )
  );
};
