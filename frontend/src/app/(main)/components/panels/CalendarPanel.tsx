"use client";

import {
  GetUserEventRegistrationsResponse,
  RegistrationWithEvent,
} from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";

const monthNames = [
  "Január",
  "Február",
  "Március",
  "Április",
  "Május",
  "Június",
  "Július",
  "Augusztus",
  "Szeptember",
  "Október",
  "November",
  "December",
];

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const CalendarPanel = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["myevents"],
    queryFn: async () => {
      const { data } = await axios.get<GetUserEventRegistrationsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events/my-registrations`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const upcomingEvent = (data?.registrations ?? [])
    .filter(
      (registration: RegistrationWithEvent) =>
        registration.status === "registered" &&
        new Date(registration.event.date).getTime() >= Date.now(),
    )
    .sort(
      (first: RegistrationWithEvent, second: RegistrationWithEvent) =>
        new Date(first.event.date).getTime() -
        new Date(second.event.date).getTime(),
    )[0];

  const focusDate = upcomingEvent?.event.date
    ? toDateKey(new Date(upcomingEvent.event.date))
    : toDateKey(new Date());

  const previewDate = upcomingEvent?.event.date
    ? new Date(upcomingEvent.event.date)
    : new Date();

  return (
    <Link
      href={`/app/calendar?date=${focusDate}`}
      className="grow flex p-2 justify-between cursor-pointer rounded-xl"
    >
      <div className="w-2/3 m-auto h-full hover:bg-faded/30 transition ease-in-out border-[2px] flex flex-col justify-between rounded-md border-faded/20 ">
        <div className="flex justify-center grow items-center flex-col gap-2">
          <div className="text-6xl font-bold">{previewDate.getDate()}.</div>
          <div className="tracking-wider text-sm text-faded">
            {monthNames[previewDate.getMonth()]}
          </div>
        </div>
        <div className="text-center py-1 text-white text-sm w-full bg-accent rounded-b-sm px-2 truncate">
          {isLoading
            ? "Betöltés..."
            : upcomingEvent
              ? `${new Date(upcomingEvent.event.date).toLocaleTimeString(
                  "hu-HU",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )} ${upcomingEvent.event.name}`
              : "Nincs közelgő esemény"}
        </div>
      </div>
    </Link>
  );
};
