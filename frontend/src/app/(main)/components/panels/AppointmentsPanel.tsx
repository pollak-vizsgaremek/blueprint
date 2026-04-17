"use client";
import { Event, RegistrationWithEvent } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";

export const AppointmentsPanel = () => {
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
    <div className="flex gap-2 grow w-full">
      {isLoading
        ? Array.from({ length: 4 }).map((_, index) => {
            return <div key={index} className="grow bg-faded/20 rounded-xl" />;
          })
        : data.registrations.length > 0 &&
          data.registrations
            .slice(0, 4)
            .map((registration: RegistrationWithEvent) => {
              return (
                <div
                  key={registration.event.id}
                  className="grow basis-[60px] border-faded/30 cursor-pointer border-[0.5px] rounded-xl flex flex-col group"
                >
                  <div className="w-full h-28 relative">
                    <Image
                      src={registration.event.imageUrl!}
                      alt={registration.event.name}
                      fill
                      className="rounded-t-xl w-full object-center"
                    />
                  </div>
                  <div className="flex justify-between p-2 items-end group-hover:bg-faded/20 transition ease-in-out group rounded-b-xl grow">
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
