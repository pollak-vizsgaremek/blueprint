"use client";

import { Spinner } from "@/components/Spinner";
import { EventWithRegistrationInfo, TeacherEventsResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { TeacherPageHeader } from "../../../components/TeacherPageHeader";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TeacherEventDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const parsedId = parseInt(params.id, 10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["teacher-events", "details", parsedId],
    enabled: !Number.isNaN(parsedId),
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

  const event =
    data?.events.find(
      (item: EventWithRegistrationInfo) => item.id === parsedId,
    ) ?? null;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="card-box h-auto! p-6 text-red-600">
        Nem sikerült betölteni az esemény részleteit.
      </div>
    );
  }

  return (
    <>
      <TeacherPageHeader
        title={event.name}
        description="Saját esemény részletes adatai"
        actions={
          <button
            type="button"
            onClick={() => router.push("/teacher/events")}
            className="inline-flex items-center justify-center rounded-xl border border-faded/20 bg-secondary/50 px-4 py-2 text-sm hover:bg-secondary transition ease-in-out cursor-pointer"
          >
            Vissza
          </button>
        }
      />

      <section className="card-box h-auto! p-5 min-w-0 space-y-4">
        <div className="text-faded">{event.description}</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-faded/20 bg-secondary/40 p-3 inline-flex items-center gap-2">
            <MapPin size={15} />
            <span>{event.location}</span>
          </div>
          <div className="rounded-xl border border-faded/20 bg-secondary/40 p-3 inline-flex items-center gap-2">
            <CalendarDays size={15} />
            <span>{formatDateTime(event.date)}</span>
          </div>
          <div className="rounded-xl border border-faded/20 bg-secondary/40 p-3 inline-flex items-center gap-2">
            <Users size={15} />
            <span>
              {event.registrationCount}
              {event.maxParticipants ? ` / ${event.maxParticipants}` : ""} fő
            </span>
          </div>
        </div>
      </section>
    </>
  );
};

export default TeacherEventDetailsPage;
