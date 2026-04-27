"use client";

import { Spinner } from "@/components/Spinner";
import {
  TeacherAppointmentsResponse,
  TeacherEventsResponse,
  GetTeacherAvailabilityResponse,
} from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CalendarDays, CalendarRange, Clock3, Plus } from "lucide-react";
import Link from "next/link";
import { TeacherPageHeader } from "../components/TeacherPageHeader";

const TeacherDashboardPage = () => {
  const appointmentsQuery = useQuery({
    queryKey: ["teacher-appointments"],
    queryFn: async () => {
      const { data } = await axios.get<TeacherAppointmentsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher/appointments`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const availabilityQuery = useQuery({
    queryKey: ["teacher-own-availability"],
    queryFn: async () => {
      const { data } = await axios.get<GetTeacherAvailabilityResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher/availability`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const eventsQuery = useQuery({
    queryKey: ["teacher-events"],
    queryFn: async () => {
      const { data } = await axios.get<TeacherEventsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher/events`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const isLoading =
    appointmentsQuery.isLoading ||
    availabilityQuery.isLoading ||
    eventsQuery.isLoading;

  const isError =
    appointmentsQuery.isError ||
    availabilityQuery.isError ||
    eventsQuery.isError;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card-box h-auto! p-6 text-red-600">
        Nem sikerült betölteni a tanári áttekintést.
      </div>
    );
  }

  const appointments = appointmentsQuery.data?.appointments ?? [];
  const availability = availabilityQuery.data?.availability ?? [];
  const events = eventsQuery.data?.events ?? [];
  const now = Date.now();

  const upcomingAppointments = appointments.filter(
    (appointment) => new Date(appointment.startTime).getTime() >= now,
  ).length;
  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status === "pending",
  ).length;
  const upcomingEvents = events.filter(
    (event) => new Date(event.date).getTime() >= now,
  ).length;

  const statCards = [
    {
      label: "Időpontok",
      value: appointments.length,
      detail: `${pendingAppointments} függőben`,
      icon: Clock3,
      href: "/teacher/appointments",
    },
    {
      label: "Közelgő időpontok",
      value: upcomingAppointments,
      detail: "Jövőbeli foglalások",
      icon: CalendarDays,
      href: "/teacher/appointments",
    },
    {
      label: "Elérhetőségi sávok",
      value: availability.length,
      detail: "Aktív heti idősáv",
      icon: CalendarRange,
      href: "/teacher/availability",
    },
    {
      label: "Saját események",
      value: events.length,
      detail: `${upcomingEvents} jövőbeli`,
      icon: Plus,
      href: "/teacher/events",
    },
  ];

  return (
    <>
      <TeacherPageHeader
        title="Tanári áttekintés"
        description="Saját időpontjaid, elérhetőségeid és eseményeid kezelése egy helyen."
      />

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="card-box h-auto! p-5 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-faded">{card.label}</div>
                  <div className="text-3xl font-semibold mt-1">
                    {card.value}
                  </div>
                </div>
                <div className="rounded-2xl bg-accent/10 p-3 text-accent group-hover:bg-accent group-hover:text-white transition ease-in-out">
                  <Icon size={22} />
                </div>
              </div>
              <p className="text-sm text-faded mt-3">{card.detail}</p>
            </Link>
          );
        })}
      </section>
    </>
  );
};

export default TeacherDashboardPage;
