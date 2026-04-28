"use client";

import { Spinner } from "@/components/Spinner";
import { DataState } from "@/components/ui/DataState";
import {
  AdminAppointmentsResponse,
  AdminNewsResponse,
  GetAllEventsResponse,
  GetAllUsersResponse,
} from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  CalendarX2,
  CalendarDays,
  Clock3,
  MessageSquareWarning,
  Newspaper,
  Ticket,
  TriangleAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { AdminStatusBadge } from "../components/AdminStatusBadge";
import { formatDateTime, roleLabel } from "../components/adminFormat";

const AdminPage = () => {
  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await axios.get<GetAllUsersResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const eventsQuery = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data } = await axios.get<GetAllEventsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const appointmentsQuery = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: async () => {
      const { data } = await axios.get<AdminAppointmentsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/appointments`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const newsQuery = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data } = await axios.get<AdminNewsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/news`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const isLoading =
    usersQuery.isLoading ||
    eventsQuery.isLoading ||
    appointmentsQuery.isLoading ||
    newsQuery.isLoading;

  const isError =
    usersQuery.isError ||
    eventsQuery.isError ||
    appointmentsQuery.isError ||
    newsQuery.isError;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <DataState
        icon={TriangleAlert}
        title="Nem sikerült betölteni az admin áttekintést."
        tone="error"
      />
    );
  }

  const users = usersQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const appointments = appointmentsQuery.data?.appointments ?? [];
  const news = newsQuery.data?.news ?? [];
  const now = Date.now();

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((user) => (user.status ?? "active") === "active")
      .length,
    teachers: users.filter((user) => user.role === "teacher").length,
    totalEvents: events.length,
    upcomingEvents: events.filter(
      (event) => new Date(event.date).getTime() >= now,
    ).length,
    activeRegistrations: events.reduce(
      (total, event) => total + (event.registrationCount ?? 0),
      0,
    ),
    totalAppointments: appointments.length,
    pendingAppointments: appointments.filter(
      (appointment) => appointment.status === "pending",
    ).length,
    totalNews: news.length,
    publishedNews: news.filter((item) => item.isPublished !== false).length,
    draftNews: news.filter((item) => item.isPublished === false).length,
  };

  const recent = {
    users: [...users]
      .sort(
        (first, second) =>
          new Date(second.createdAt ?? 0).getTime() -
          new Date(first.createdAt ?? 0).getTime(),
      )
      .slice(0, 5),
    events: [...events]
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      )
      .slice(0, 5),
    appointments: [...appointments]
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      )
      .slice(0, 5),
    news: [...news]
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      )
      .slice(0, 5),
  };

  const statCards = [
    {
      label: "Felhasználók",
      value: stats.totalUsers,
      detail: `${stats.activeUsers} aktív, ${stats.teachers} tanár`,
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Események",
      value: stats.totalEvents,
      detail: `${stats.upcomingEvents} jövőbeli`,
      icon: CalendarDays,
      href: "/admin/events",
    },
    {
      label: "Jelentkezések",
      value: stats.activeRegistrations,
      detail: "Aktív esemény jelentkezés",
      icon: Ticket,
      href: "/admin/events",
    },
    {
      label: "Időpontok",
      value: stats.totalAppointments,
      detail: `${stats.pendingAppointments} függőben`,
      icon: Clock3,
      href: "/admin/appointments",
    },
    {
      label: "Hírek",
      value: stats.totalNews,
      detail: `${stats.publishedNews} publikált, ${stats.draftNews} piszkozat`,
      icon: Newspaper,
      href: "/admin/news",
    },
    {
      label: "Moderáció",
      value: "Esemény",
      detail: "Kommentek kezelése az esemény részleteinél",
      icon: MessageSquareWarning,
      href: "/admin/events",
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Admin áttekintés"
        description="Központi vezérlőpult az összes meglévő Blueprint funkció kezeléséhez."
        actions={
          <Link
            href="/admin/events"
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 transition ease-in-out"
          >
            Esemény létrehozása
          </Link>
        }
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

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card-box h-auto! p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Legutóbbi események</h2>
            <Link
              href="/admin/events"
              className="text-sm text-accent hover:text-accent/70"
            >
              Összes
            </Link>
          </div>
          <div className="space-y-3">
            {recent.events.length === 0 ? (
              <DataState icon={CalendarX2} title="Még nincs esemény." compact />
            ) : (
              recent.events.map((event) => (
                <Link
                  href={`/admin/events/${event.id}`}
                  key={event.id}
                  className="block rounded-xl border border-faded/20 bg-secondary/40 p-3 hover:bg-faded/10 transition ease-in-out"
                >
                  <div className="font-medium">{event.name}</div>
                  <div className="text-sm text-faded mt-1">
                    {formatDateTime(event.date)} • {event.registrationCount}{" "}
                    jelentkező
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="card-box h-auto! p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Új felhasználók</h2>
            <Link
              href="/admin/users"
              className="text-sm text-accent hover:text-accent/70"
            >
              Kezelés
            </Link>
          </div>
          <div className="space-y-3">
            {recent.users.length === 0 ? (
              <DataState icon={Users} title="Még nincs felhasználó." compact />
            ) : (
              recent.users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-xl border border-faded/20 bg-secondary/40 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-faded">{user.email}</div>
                    </div>
                    <AdminStatusBadge
                      tone={user.role === "admin" ? "accent" : "neutral"}
                    >
                      {roleLabel[user.role]}
                    </AdminStatusBadge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-box h-auto! p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Friss időpontok</h2>
            <Link
              href="/admin/appointments"
              className="text-sm text-accent hover:text-accent/70"
            >
              Összes
            </Link>
          </div>
          <div className="space-y-3">
            {recent.appointments.length === 0 ? (
              <DataState icon={Clock3} title="Nincs időpont." compact />
            ) : (
              recent.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-faded/20 bg-secondary/40 p-3"
                >
                  <div className="font-medium">
                    {appointment.title || "Időpont"}
                  </div>
                  <div className="text-sm text-faded mt-1">
                    {appointment.student?.name ?? "Ismeretlen diák"} →{" "}
                    {appointment.teacher?.name ?? "Ismeretlen tanár"}
                  </div>
                  <div className="text-sm text-faded">
                    {formatDateTime(appointment.startTime)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-box h-auto! p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Friss hírek</h2>
            <Link
              href="/admin/news"
              className="text-sm text-accent hover:text-accent/70"
            >
              Szerkesztés
            </Link>
          </div>
          <div className="space-y-3">
            {recent.news.length === 0 ? (
              <DataState icon={Newspaper} title="Nincs hír." compact />
            ) : (
              recent.news.map((news) => (
                <div
                  key={news.id}
                  className="rounded-xl border border-faded/20 bg-secondary/40 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{news.title}</div>
                      <div className="text-sm text-faded mt-1">
                        {news.author?.name ?? "Ismeretlen szerző"}
                      </div>
                    </div>
                    <AdminStatusBadge
                      tone={news.isPublished === false ? "amber" : "green"}
                    >
                      {news.isPublished === false ? "Piszkozat" : "Publikált"}
                    </AdminStatusBadge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminPage;
