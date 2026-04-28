"use client";
import { DataState } from "@/components/ui/DataState";
import { Appointment, GetAppointmentsResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  CalendarX2,
  Clock3,
  MapPin,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import Link from "next/link";

const statusLabelMap: Record<Appointment["status"], string> = {
  pending: "Függőben",
  confirmed: "Megerősítve",
  cancelled: "Lemondva",
  completed: "Teljesítve",
};

const statusClassMap: Record<Appointment["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-sky-100 text-sky-700",
};

export const AppointmentsPanel = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data } = await axios.get<GetAppointmentsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const upcomingAppointments = (data?.appointments ?? [])
    .filter(
      (appointment) => new Date(appointment.endTime).getTime() > Date.now(),
    )
    .sort(
      (first, second) =>
        new Date(first.startTime).getTime() -
        new Date(second.startTime).getTime(),
    )
    .slice(0, 4);

  return (
    <div className="gap-2 grow w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, index) => {
          return <div key={index} className="grow bg-faded/20 rounded-xl" />;
        })
      ) : isError ? (
        <DataState
          icon={TriangleAlert}
          title="Nem sikerült betölteni az időpontokat."
          tone="error"
          compact
        />
      ) : upcomingAppointments.length > 0 ? (
        upcomingAppointments.slice(0, 3).map((appointment) => {
          const dateLabel = new Date(appointment.startTime).toLocaleDateString(
            "hu-HU",
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            },
          );

          const timeLabel = `${new Date(
            appointment.startTime,
          ).toLocaleTimeString("hu-HU", {
            hour: "2-digit",
            minute: "2-digit",
          })} - ${new Date(appointment.endTime).toLocaleTimeString("hu-HU", {
            hour: "2-digit",
            minute: "2-digit",
          })}`;

          return (
            <Link
              key={appointment.id}
              href="/appointments"
              className=" border-faded/30 cursor-pointer border-[0.5px] rounded-xl flex flex-col p-3 hover:bg-faded/20 transition ease-in-out"
            >
              <div className="mt-2">
                <div className="font-medium text-xl float-left line-clamp-2 mb-2 ml-1">
                  {appointment.title || "Időpont"}
                </div>
                <div
                  className={`text-sm px-2 float-right grow-0 py-1 rounded-full  ${statusClassMap[appointment.status]}`}
                >
                  {statusLabelMap[appointment.status]}
                </div>
              </div>
              <div className="mt-auto text-sm text-faded truncate mb-2">
                <UserRound size={14} className="inline mr-1" />
                Tanár: {appointment.teacher?.name ?? "Ismeretlen"}
              </div>
              <div className=" text-sm text-faded truncate mb-4">
                <MapPin size={14} className="inline mr-1" />
                Terem: {appointment.teacher?.classroom ?? "Ismeretlen"}
              </div>
              <div className="flex justify-between">
                <div className="text-sm text-faded mb-3 flex items-center gap-1">
                  <Clock3 size={14} /> {timeLabel}
                </div>
                <div className=" text-sm text-faded mb-1">{dateLabel}</div>
              </div>
            </Link>
          );
        })
      ) : (
        <DataState icon={CalendarX2} title="Nincs közelgő időpont." compact />
      )}
    </div>
  );
};
