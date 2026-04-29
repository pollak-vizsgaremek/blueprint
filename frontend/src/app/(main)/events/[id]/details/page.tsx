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
import { EventEditForm } from "@/components/events/EventEditForm";
import {
  Building2,
  CalendarDays,
  MapPin,
  UserRound,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDateOnlyHu, formatDateTimeHu } from "@/lib/dateFormat";
import {
  buildEventUpdatePayload,
  canManageEvent,
  createEventEditFormState,
  EventEditFormState,
  validateEventEditForm,
} from "@/lib/eventManage";
import { queryKeys } from "@/lib/queryKeys";

const EventDetailsTabPage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert, showConfirm } = usePopupModal();
  const { event, eventId } = useEventDetail();
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [eventForm, setEventForm] = useState<EventEditFormState>(
    createEventEditFormState(),
  );

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

    setEventForm(createEventEditFormState(event));
  }, [event]);

  const canManageSelectedEvent = canManageEvent(user, event);

  const { data: usersLiteData } = useQuery({
    queryKey: queryKeys.usersLite,
    enabled: canManageSelectedEvent,
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
        queryClient.invalidateQueries({ queryKey: queryKeys.events });
        queryClient.invalidateQueries({
          queryKey: queryKeys.eventDetail(eventId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.myEvents });
      },
    });

  const { mutate: updateManagedEvent, isPending: isUpdateManagedEventPending } =
    useMutation({
      mutationFn: async () => {
        if (!event) {
          return;
        }

        const payload = buildEventUpdatePayload(eventForm);

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
        queryClient.invalidateQueries({ queryKey: queryKeys.events });
        queryClient.invalidateQueries({
          queryKey: queryKeys.eventDetail(eventId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.myEvents });
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
        queryClient.invalidateQueries({ queryKey: queryKeys.events });
        queryClient.invalidateQueries({ queryKey: queryKeys.myEvents });
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
        {canManageSelectedEvent && (
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
        {canManageSelectedEvent && isEditingEvent && (
          <EventEditForm
            form={eventForm}
            usersLite={usersLite}
            isSaving={isUpdateManagedEventPending}
            onChange={setEventForm}
            onSave={() => {
              const validationMessage = validateEventEditForm(eventForm);

              if (validationMessage) {
                showAlert({ message: validationMessage, tone: "warning" });
                return;
              }

              updateManagedEvent();
            }}
            onCancel={() => {
              setIsEditingEvent(false);
              setEventForm(createEventEditFormState(event));
            }}
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <UserRound size={16} className="text-accent" />
            <span>Szervező: {event.creator || "Ismeretlen"}</span>
          </div>
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <CalendarDays size={16} className="text-accent" />
            <span>{formatDateTimeHu(event.date)}</span>
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
          <span>Létrehozva: {formatDateOnlyHu(event.createdAt)}</span>
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
