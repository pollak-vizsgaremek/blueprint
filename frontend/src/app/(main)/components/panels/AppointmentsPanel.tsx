"use client";
import { Appointment, GetAppointmentsResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
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
  const { data, isLoading } = useQuery({
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
              href="/app/appointments"
              className=" border-faded/30 cursor-pointer border-[0.5px] rounded-xl flex flex-col p-3 hover:bg-faded/20 transition ease-in-out"
            >
              <div className="text-sm text-faded mb-1">{dateLabel}</div>
              <div className="font-medium line-clamp-2 mb-2">
                {appointment.title || "Időpont"}
              </div>
              <div className="text-sm text-faded truncate mb-2">
                Tanár: {appointment.teacher?.name ?? "Ismeretlen"}
              </div>
              <div className="text-xs text-faded mb-3">{timeLabel}</div>
              <div
                className={`text-[10px] px-2 py-1 rounded-full self-start ${statusClassMap[appointment.status]}`}
              >
                {statusLabelMap[appointment.status]}
              </div>
            </Link>
          );
        })
      ) : (
        <div className="text-faded h-full w-full flex items-center justify-center text-sm">
          Nincs közelgő időpont.
        </div>
      )}
    </div>
  );
};
