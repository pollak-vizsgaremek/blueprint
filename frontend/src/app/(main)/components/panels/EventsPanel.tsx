"use client";
import { useModal } from "@/contexts/ModalContext";
import { EventWithRegistrationInfo, RegistrationWithEvent } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";

export const EventsPanel = () => {
  const { openModal } = useModal();
  const { data, isLoading } = useQuery({
    queryKey: ["myevents"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/events/my-registrations`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });
  return (
    <div className="gap-2 grow w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {isLoading
        ? Array.from({ length: 4 }).map((_, index) => {
            return <div key={index} className="grow bg-faded/20 rounded-xl" />;
          })
        : data.registrations.length > 0 &&
          data.registrations
            .slice(0, 4)
            .map((registration: RegistrationWithEvent) => {
              const eventForModal: EventWithRegistrationInfo = {
                ...registration.event,
                registrationCount: 0,
                userRegistration: {
                  id: registration.id,
                  registeredAt: registration.registeredAt,
                  status: registration.status,
                },
                isUserRegistered: registration.status === "registered",
                isFull: false,
              };

              if (
                registration.event.date &&
                new Date(registration.event.date).getTime() < Date.now()
              ) {
                return null;
              }

              return (
                <div
                  onClick={() => openModal(eventForModal)}
                  key={registration.event.id}
                  className="h-45 border-faded/30 cursor-pointer border-[0.5px] rounded-xl flex flex-col group"
                >
                  <div className="w-full h-28 relative">
                    <Image
                      src={registration.event.imageUrl!}
                      alt={registration.event.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="rounded-t-xl w-full object-center"
                    />
                  </div>
                  <div className="flex flex-col justify-between p-2 items-start group-hover:bg-faded/20 transition ease-in-out group rounded-b-xl grow">
                    <div className="">{registration.event.name}</div>
                    <div className="">
                      {registration.event.date.slice(0, 10)}
                    </div>
                  </div>
                </div>
              );
            })}
    </div>
  );
};
