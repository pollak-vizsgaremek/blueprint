"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEventDetail } from "../../../../../contexts/EventDetailContext";
import { isReducedMotionEnabled } from "@/lib/motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useAuth } from "@/contexts/AuthContext";
import { usePopupModal } from "@/contexts/PopupModalContext";
import { GetUsersLiteResponse } from "@/types";
import {
  Building2,
  CalendarDays,
  MapPin,
  UserRound,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const formatDateTime = (value?: string) => {
  if (!value) return "Ismeretlen";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ismeretlen";
  return date.toLocaleString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateOnly = (value?: string) => {
  if (!value) return "Ismeretlen";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ismeretlen";
  return date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const toLocalInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

type EventEditFormState = {
  name: string;
  description: string;
  location: string;
  classroom: string;
  date: string;
  maxParticipants: string;
  updatedBy: string;
};

const EventDetailsTabPage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert, showConfirm } = usePopupModal();
  const { event, eventId } = useEventDetail();
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [eventForm, setEventForm] = useState<EventEditFormState>({
    name: "",
    description: "",
    location: "",
    classroom: "",
    date: "",
    maxParticipants: "",
    updatedBy: "",
  });

  useGSAP(() => {
    if (isReducedMotionEnabled()) {
      return;
    }

    gsap.from(".page-content", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
  }, []);

  useEffect(() => {
    if (!event) {
      return;
    }

    setEventForm({
      name: event.name,
      description: event.description,
      location: event.location,
      classroom: event.classroom,
      date: toLocalInputValue(event.date),
      maxParticipants: event.maxParticipants
        ? String(event.maxParticipants)
        : "",
      updatedBy: event.updatedBy ? String(event.updatedBy) : "",
    });
  }, [event]);

  const canManageEvent =
    Boolean(user) &&
    Boolean(event) &&
    (user?.role === "admin" ||
      (event?.updatedBy !== null && event?.updatedBy === user?.id));

  const { data: usersLiteData } = useQuery({
    queryKey: ["users-lite"],
    enabled: canManageEvent,
    queryFn: async () => {
      const { data } = await axios.get<GetUsersLiteResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/users/list`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
  });

  const usersLite = usersLiteData?.users ?? [];

  const { mutate: toggleRegistration, isPending: isRegistrationPending } =
    useMutation({
      mutationFn: async () => {
        if (!event) {
          return;
        }

        if (event.isUserRegistered) {
          await axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}/register`,
            {
              withCredentials: true,
            },
          );
          return;
        }

        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}/register`,
          {},
          {
            withCredentials: true,
          },
        );
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["events"] });
        queryClient.invalidateQueries({
          queryKey: ["events", "detail", eventId],
        });
        queryClient.invalidateQueries({ queryKey: ["myevents"] });
      },
    });

  const { mutate: updateManagedEvent, isPending: isUpdateManagedEventPending } =
    useMutation({
      mutationFn: async () => {
        if (!event) {
          return;
        }

        const payload: Record<string, string | number | null> = {
          name: eventForm.name.trim(),
          description: eventForm.description.trim(),
          location: eventForm.location.trim(),
          classroom: eventForm.classroom.trim(),
          date: new Date(eventForm.date).toISOString(),
          updatedBy: Number(eventForm.updatedBy),
        };

        if (eventForm.maxParticipants.trim()) {
          payload.maxParticipants = Number(eventForm.maxParticipants.trim());
        } else {
          payload.maxParticipants = null;
        }

        return axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}`,
          payload,
          {
            withCredentials: true,
          },
        );
      },
      onSuccess: () => {
        setIsEditingEvent(false);
        showAlert({ message: "Esemény frissítve.", tone: "success" });
        queryClient.invalidateQueries({ queryKey: ["events"] });
        queryClient.invalidateQueries({
          queryKey: ["events", "detail", eventId],
        });
        queryClient.invalidateQueries({ queryKey: ["myevents"] });
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          const errorMessage =
            error.response?.data?.message ??
            error.response?.data?.error ??
            "Esemény frissítése sikertelen.";
          showAlert({ message: errorMessage, tone: "error" });
          return;
        }

        showAlert({ message: "Esemény frissítése sikertelen.", tone: "error" });
      },
    });

  const { mutate: deleteManagedEvent, isPending: isDeleteManagedEventPending } =
    useMutation({
      mutationFn: async () => {
        if (!event) {
          return;
        }

        return axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}`,
          {
            withCredentials: true,
          },
        );
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["events"] });
        queryClient.invalidateQueries({ queryKey: ["myevents"] });
        router.push("/events");
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          const errorMessage =
            error.response?.data?.message ??
            error.response?.data?.error ??
            "Esemény törlése sikertelen.";
          showAlert({ message: errorMessage, tone: "error" });
          return;
        }

        showAlert({ message: "Esemény törlése sikertelen.", tone: "error" });
      },
    });

  if (!event) {
    return null;
  }

  const canRegister = event.isUserRegistered || !event.isFull;

  const validateEventForm = () => {
    if (
      !eventForm.name.trim() ||
      !eventForm.description.trim() ||
      !eventForm.location.trim() ||
      !eventForm.classroom.trim() ||
      !eventForm.date ||
      !eventForm.updatedBy
    ) {
      showAlert({
        message: "Minden kötelező mezőt tölts ki.",
        tone: "warning",
      });
      return false;
    }

    if (Number.isNaN(new Date(eventForm.date).getTime())) {
      showAlert({ message: "Érvénytelen dátum.", tone: "warning" });
      return false;
    }

    if (
      eventForm.maxParticipants.trim() &&
      (!Number.isInteger(Number(eventForm.maxParticipants)) ||
        Number(eventForm.maxParticipants) <= 0)
    ) {
      showAlert({
        message: "A maximális létszám pozitív egész szám legyen.",
        tone: "warning",
      });
      return false;
    }

    return true;
  };

  const confirmDeleteEvent = async () => {
    const confirmed = await showConfirm({
      message: "Biztosan törölni szeretnéd ezt az eseményt?",
      tone: "warning",
      confirmText: "Törlés",
      cancelText: "Mégse",
    });

    if (!confirmed) {
      return;
    }

    deleteManagedEvent();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 mt-5 pb-8 sm:pb-10 flex justify-between flex-col grow page-content">
      <div>
        <div className="text-2xl sm:text-3xl lg:text-4xl mb-3">
          {event.name}
        </div>
        <div className="text-gray-600 text-justify mb-5">
          {event.description}
        </div>
        {canManageEvent && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditingEvent((previous) => !previous)}
              className="rounded-xl bg-sky-100 px-3 py-2 text-sm text-sky-700 hover:bg-sky-200 transition"
            >
              {isEditingEvent ? "Szerkesztés bezárása" : "Szerkesztés"}
            </button>
            <button
              onClick={confirmDeleteEvent}
              disabled={isDeleteManagedEventPending}
              className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 hover:bg-red-200 transition disabled:bg-faded disabled:text-faded disabled:cursor-not-allowed"
            >
              {isDeleteManagedEventPending ? "Törlés..." : "Törlés"}
            </button>
          </div>
        )}
        {canManageEvent && isEditingEvent && (
          <div className="mb-5 rounded-xl border border-faded/40 bg-white/30 p-3">
            <div className="text-lg mb-2">Esemény szerkesztése</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                value={eventForm.name}
                onChange={(inputEvent) =>
                  setEventForm((previous) => ({
                    ...previous,
                    name: inputEvent.target.value,
                  }))
                }
                placeholder="Esemény neve"
                className="w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
              />
              <input
                value={eventForm.location}
                onChange={(inputEvent) =>
                  setEventForm((previous) => ({
                    ...previous,
                    location: inputEvent.target.value,
                  }))
                }
                placeholder="Helyszín"
                className="w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
              />
              <input
                value={eventForm.classroom}
                onChange={(inputEvent) =>
                  setEventForm((previous) => ({
                    ...previous,
                    classroom: inputEvent.target.value,
                  }))
                }
                placeholder="Tanterem"
                className="w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
              />
              <input
                type="datetime-local"
                value={eventForm.date}
                onChange={(inputEvent) =>
                  setEventForm((previous) => ({
                    ...previous,
                    date: inputEvent.target.value,
                  }))
                }
                className="w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
              />
              <input
                value={eventForm.maxParticipants}
                onChange={(inputEvent) =>
                  setEventForm((previous) => ({
                    ...previous,
                    maxParticipants: inputEvent.target.value,
                  }))
                }
                placeholder="Max létszám (opcionális)"
                className="w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
              />
              <select
                value={eventForm.updatedBy}
                onChange={(inputEvent) =>
                  setEventForm((previous) => ({
                    ...previous,
                    updatedBy: inputEvent.target.value,
                  }))
                }
                className="w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
              >
                <option value="">Válassz frissítőt</option>
                {usersLite.map((candidate) => (
                  <option key={candidate.id} value={String(candidate.id)}>
                    {candidate.name} ({candidate.role})
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={eventForm.description}
              onChange={(inputEvent) =>
                setEventForm((previous) => ({
                  ...previous,
                  description: inputEvent.target.value,
                }))
              }
              rows={3}
              placeholder="Leírás"
              className="mt-2 w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  if (!validateEventForm()) {
                    return;
                  }

                  updateManagedEvent();
                }}
                disabled={isUpdateManagedEventPending}
                className="rounded-xl bg-accent px-3 py-2 text-white disabled:bg-faded disabled:cursor-not-allowed"
              >
                {isUpdateManagedEventPending ? "Mentés..." : "Mentés"}
              </button>
              <button
                onClick={() => {
                  setIsEditingEvent(false);
                  setEventForm({
                    name: event.name,
                    description: event.description,
                    location: event.location,
                    classroom: event.classroom,
                    date: toLocalInputValue(event.date),
                    maxParticipants: event.maxParticipants
                      ? String(event.maxParticipants)
                      : "",
                    updatedBy: event.updatedBy ? String(event.updatedBy) : "",
                  });
                }}
                className="rounded-xl border border-faded/40 px-3 py-2 text-faded"
              >
                Mégse
              </button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <UserRound size={16} className="text-accent" />
            <span>Szervező: {event.creator || "Ismeretlen"}</span>
          </div>
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <CalendarDays size={16} className="text-accent" />
            <span>{formatDateTime(event.date)}</span>
          </div>
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <MapPin size={16} className="text-accent" />
            <span>{event.location || "Nincs helyszín"}</span>
          </div>
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <Building2 size={16} className="text-accent" />
            <span>{event.classroom || "Nincs tanterem"}</span>
          </div>
        </div>
      </div>
      <div className="w-full justify-between flex mt-8 sm:mt-10 items-center flex-wrap gap-3">
        <div className="text-sm text-faded px-3 py-2 inline-flex items-center gap-2">
          <CalendarDays size={16} className="" />
          <span>Létrehozva: {formatDateOnly(event.createdAt)}</span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-sm text-gray-600">
            {event.maxParticipants
              ? `${event.registrationCount}/${event.maxParticipants} jelentkező`
              : `${event.registrationCount} jelentkező`}
          </div>
          <button
            onClick={() => toggleRegistration()}
            disabled={!canRegister || isRegistrationPending}
            className="bg-accent text-white text-base sm:text-lg px-3 py-2 hover:bg-accent/60 transition ease-in-out active:scale-95 active:duration-75 rounded-xl cursor-pointer disabled:bg-faded disabled:cursor-not-allowed"
          >
            {isRegistrationPending
              ? "Feldolgozás..."
              : event.isUserRegistered
                ? "Lemondás"
                : "Jelentkezés"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsTabPage;
