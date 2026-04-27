"use client";

import { Spinner } from "@/components/Spinner";
import { EventWithRegistrationInfo, TeacherEventsResponse } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { TeacherFormModal } from "../../components/TeacherFormModal";
import { TeacherPageHeader } from "../../components/TeacherPageHeader";

type EventFormState = {
  name: string;
  description: string;
  location: string;
  date: string;
  maxParticipants: string;
};

const initialFormState: EventFormState = {
  name: "",
  description: "",
  location: "",
  date: "",
  maxParticipants: "",
};

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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ?? error.response?.data?.error ?? fallback
    );
  }

  return fallback;
};

const TeacherEventsPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventFormState>(initialFormState);
  const [image, setImage] = useState<File | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    data: eventsData,
    isLoading,
    isError,
  } = useQuery({
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

  const events = eventsData?.events ?? [];

  const resetForm = () => {
    setForm(initialFormState);
    setImage(null);
    setIsFormModalOpen(false);
  };

  const openCreateModal = () => {
    setMessage(null);
    setForm(initialFormState);
    setImage(null);
    setIsFormModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("description", form.description.trim());
      payload.append("location", form.location.trim());
      payload.append("date", new Date(form.date).toISOString());

      if (form.maxParticipants.trim()) {
        payload.append("maxParticipants", form.maxParticipants.trim());
      }

      if (image) {
        payload.append("image", image);
      }

      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher/events`,
        payload,
        {
          withCredentials: true,
        },
      );

      return data;
    },
    onSuccess: () => {
      resetForm();
      setMessage({ type: "success", text: "Esemény létrehozva." });
      queryClient.invalidateQueries({ queryKey: ["teacher-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Az esemény létrehozása sikertelen."),
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.location.trim() ||
      !form.date
    ) {
      setMessage({
        type: "error",
        text: "A kötelező mezők kitöltése szükséges.",
      });
      return;
    }

    if (Number.isNaN(new Date(form.date).getTime())) {
      setMessage({ type: "error", text: "Érvénytelen esemény időpont." });
      return;
    }

    if (form.maxParticipants.trim() && Number(form.maxParticipants) <= 0) {
      setMessage({
        type: "error",
        text: "A maximális létszám pozitív szám legyen.",
      });
      return;
    }

    createMutation.mutate();
  };

  return (
    <>
      <TeacherPageHeader
        title="Saját eseményeim"
        description="Hozz létre új eseményeket, és kövesd a saját eseményeid listáját."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 transition ease-in-out cursor-pointer"
          >
            <Plus size={16} />
            Új esemény
          </button>
        }
      />

      {message ? (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="card-box h-auto! p-5 min-w-0">
        {isLoading ? (
          <div className="flex h-80 items-center justify-center">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Nem sikerült betölteni az eseményeidet.
          </div>
        ) : events.length === 0 ? (
          <div className="h-80 rounded-xl border border-dashed border-faded/30 flex items-center justify-center text-faded text-center px-4">
            Még nincs saját eseményed.
          </div>
        ) : (
          <div className="space-y-3 max-h-[820px] overflow-y-auto pr-1">
            {events.map((event: EventWithRegistrationInfo) => (
              <article
                key={event.id}
                className="rounded-xl border border-faded/20 bg-secondary/40 p-4"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {event.imageUrl ? (
                    <div className="relative h-32 md:h-28 md:w-40 rounded-xl overflow-hidden shrink-0 bg-faded/20">
                      <Image
                        src={event.imageUrl}
                        alt={event.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-32 md:h-28 md:w-40 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <CalendarDays size={32} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold leading-tight">
                      {event.name}
                    </h3>
                    <p className="text-sm text-faded line-clamp-2 mt-1">
                      {event.description}
                    </p>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-faded">
                      <div className="inline-flex items-center gap-2">
                        <MapPin size={15} />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <CalendarDays size={15} />
                        <span>{formatDateTime(event.date)}</span>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <Users size={15} />
                        <span>
                          {event.registrationCount}
                          {event.maxParticipants
                            ? ` / ${event.maxParticipants}`
                            : ""}{" "}
                          fő
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link
                        href={`/teacher/events/${event.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-faded/30 px-3 py-1.5 text-sm hover:bg-faded/10 transition ease-in-out"
                      >
                        Részletek
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <TeacherFormModal
        isOpen={isFormModalOpen}
        onClose={resetForm}
        title="Új esemény"
        description="Tanárként létrehozható publikus esemény"
        maxWidthClassName="max-w-4xl"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm text-faded">Cím</label>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
              placeholder="Esemény címe"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-faded">Leírás</label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="min-h-32 w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
              placeholder="Esemény leírása"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-faded">Helyszín</label>
              <input
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                placeholder="Helyszín"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-faded">Időpont</label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-faded">Maximális létszám</label>
              <input
                type="number"
                min={1}
                value={form.maxParticipants}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxParticipants: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                placeholder="Opcionális"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-faded">Kép</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent/80 transition ease-in-out disabled:bg-faded disabled:cursor-not-allowed cursor-pointer"
          >
            {createMutation.isPending ? "Mentés..." : "Létrehozás"}
          </button>
        </form>
      </TeacherFormModal>
    </>
  );
};

export default TeacherEventsPage;
