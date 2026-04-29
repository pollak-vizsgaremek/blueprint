"use client";

import { Spinner } from "@/components/Spinner";
import {
  TeacherAppointmentsResponse,
  TeacherEventsResponse,
  GetTeacherAvailabilityResponse,
  TeacherProfileResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CalendarDays, CalendarRange, Clock3, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TeacherPageHeader } from "../components/TeacherPageHeader";

const TeacherDashboardPage = () => {
  const queryClient = useQueryClient();
  const [classroom, setClassroom] = useState("");
  const [classroomMessage, setClassroomMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const profileQuery = useQuery({
    queryKey: ["teacher-profile"],
    queryFn: async () => {
      const { data } = await axios.get<TeacherProfileResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher/profile`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

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
    profileQuery.isLoading ||
    appointmentsQuery.isLoading ||
    availabilityQuery.isLoading ||
    eventsQuery.isLoading;

  const isError =
    profileQuery.isError ||
    appointmentsQuery.isError ||
    availabilityQuery.isError ||
    eventsQuery.isError;

  const saveClassroomMutation = useMutation({
    mutationFn: async (value: string) => {
      const { data } = await axios.put<TeacherProfileResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher/profile`,
        { classroom: value },
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: (data) => {
      setClassroom(data.teacher.classroom ?? "");
      setClassroomMessage({ type: "success", text: "Tanterem mentve." });
      queryClient.invalidateQueries({ queryKey: ["teacher-profile"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
    },
    onError: () => {
      setClassroomMessage({
        type: "error",
        text: "A tanterem mentése sikertelen.",
      });
    },
  });

  const teacherProfile = profileQuery.data?.teacher;

  useEffect(() => {
    setClassroom(teacherProfile?.classroom ?? "");
  }, [teacherProfile?.classroom]);

  if (isLoading) {
    return (
      <div className="flex min-h-[45vh] sm:min-h-[60vh] items-center justify-center">
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

      <section className="card-box h-auto! p-5 max-w-2xl">
        <div className="mb-3">
          <h2 className="text-xl font-semibold">Saját tanterem</h2>
          <p className="text-sm text-faded mt-1">
            Ezt a termet mentjük az új időpontokhoz, így a diákok látják, hová
            kell menniük.
          </p>
        </div>

        {classroomMessage ? (
          <div
            className={`mb-3 rounded-xl border px-3 py-2 text-sm ${
              classroomMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {classroomMessage.text}
          </div>
        ) : null}

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            setClassroomMessage(null);
            saveClassroomMutation.mutate(classroom.trim());
          }}
        >
          <div className="space-y-1">
            <label className="text-sm text-faded">Tanterem</label>
            <input
              type="text"
              value={classroom}
              onChange={(event) => setClassroom(event.target.value)}
              placeholder="Pl. B épület 204"
              className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
              maxLength={120}
            />
          </div>
          <button
            type="submit"
            disabled={saveClassroomMutation.isPending}
            className="rounded-xl bg-accent px-4 py-2 text-white font-medium hover:bg-accent/85 transition disabled:bg-faded disabled:cursor-not-allowed"
          >
            {saveClassroomMutation.isPending ? "Mentés..." : "Mentés"}
          </button>
        </form>
      </section>
    </>
  );
};

export default TeacherDashboardPage;
