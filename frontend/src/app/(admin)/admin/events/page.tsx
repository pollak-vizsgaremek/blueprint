"use client";

import { Spinner } from "@/components/Spinner";
import {
  EventMapMutationResponse,
  EventMapPreset,
  EventWithRegistrationInfo,
  GetAllEventsResponse,
  GetEventMapsResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  CalendarDays,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminFormModal } from "../../components/AdminFormModal";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { AdminStatusBadge } from "../../components/AdminStatusBadge";
import {
  formatDateTime,
  toLocalInputValue,
} from "../../components/adminFormat";

type EventFormState = {
  name: string;
  creator: string;
  description: string;
  location: string;
  date: string;
  maxParticipants: string;
  eventMapId: string;
};

const initialFormState: EventFormState = {
  name: "",
  creator: "",
  description: "",
  location: "",
  date: "",
  maxParticipants: "",
  eventMapId: "",
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ?? error.response?.data?.error ?? fallback
    );
  }

  return fallback;
};

const EventsAdminPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventFormState>(initialFormState);
  const [image, setImage] = useState<File | null>(null);
  const [editingEvent, setEditingEvent] =
    useState<EventWithRegistrationInfo | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [mapMessage, setMapMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [newMapName, setNewMapName] = useState("");
  const [newMapImage, setNewMapImage] = useState<File | null>(null);
  const [editingMap, setEditingMap] = useState<EventMapPreset | null>(null);
  const [editingMapName, setEditingMapName] = useState("");
  const [editingMapImage, setEditingMapImage] = useState<File | null>(null);
  const [filter, setFilter] = useState("all");

  const {
    data: events = [],
    isLoading,
    isError,
  } = useQuery({
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

  const { data: eventMapsData, isLoading: isEventMapsLoading } = useQuery({
    queryKey: ["admin-event-maps"],
    queryFn: async () => {
      const { data } = await axios.get<GetEventMapsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/event-maps`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
  });

  const eventMaps = eventMapsData?.eventMaps ?? [];

  const resetForm = () => {
    setForm(initialFormState);
    setImage(null);
    setEditingEvent(null);
    setIsFormModalOpen(false);
  };

  const openCreateModal = () => {
    setMessage(null);
    setForm(initialFormState);
    setImage(null);
    setEditingEvent(null);
    setIsFormModalOpen(true);
  };

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((event) => {
      const eventTime = new Date(event.date).getTime();
      if (filter === "future") {
        return eventTime >= now;
      }
      if (filter === "past") {
        return eventTime < now;
      }
      return true;
    });
  }, [events, filter]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("creator", form.creator.trim());
      payload.append("description", form.description.trim());
      payload.append("location", form.location.trim());
      payload.append("date", new Date(form.date).toISOString());

      if (form.maxParticipants.trim()) {
        payload.append("maxParticipants", form.maxParticipants.trim());
      }

      payload.append("eventMapId", form.eventMapId);

      if (image) {
        payload.append("image", image);
      }

      const url = editingEvent
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${editingEvent.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/events`;

      const { data } = await axios.request({
        url,
        method: editingEvent ? "PUT" : "POST",
        data: payload,
        withCredentials: true,
      });

      return data;
    },
    onSuccess: () => {
      const wasEditing = Boolean(editingEvent);
      resetForm();
      setMessage({
        type: "success",
        text: wasEditing ? "Esemény frissítve." : "Esemény létrehozva.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Az esemény mentése sikertelen."),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const { data } = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      resetForm();
      setMessage({ type: "success", text: "Esemény törölve." });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Az esemény törlése sikertelen."),
      });
    },
  });

  const createEventMapMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append("name", newMapName.trim());

      if (newMapImage) {
        payload.append("image", newMapImage);
      }

      const { data } = await axios.post<EventMapMutationResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/event-maps`,
        payload,
        {
          withCredentials: true,
        },
      );

      return data;
    },
    onSuccess: () => {
      setNewMapName("");
      setNewMapImage(null);
      setMapMessage({
        type: "success",
        text: "Térkép preset létrehozva.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-event-maps"] });
    },
    onError: (error) => {
      setMapMessage({
        type: "error",
        text: getErrorMessage(error, "A térkép preset mentése sikertelen."),
      });
    },
  });

  const updateEventMapMutation = useMutation({
    mutationFn: async () => {
      if (!editingMap) {
        throw new Error("Nincs kiválasztott térkép preset");
      }

      const payload = new FormData();
      payload.append("name", editingMapName.trim());

      if (editingMapImage) {
        payload.append("image", editingMapImage);
      }

      const { data } = await axios.put<EventMapMutationResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/event-maps/${editingMap.id}`,
        payload,
        {
          withCredentials: true,
        },
      );

      return data;
    },
    onSuccess: () => {
      setEditingMap(null);
      setEditingMapName("");
      setEditingMapImage(null);
      setMapMessage({
        type: "success",
        text: "Térkép preset frissítve.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-event-maps"] });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["myevents"] });
    },
    onError: (error) => {
      setMapMessage({
        type: "error",
        text: getErrorMessage(error, "A térkép preset frissítése sikertelen."),
      });
    },
  });

  const deleteEventMapMutation = useMutation({
    mutationFn: async (mapId: number) => {
      const { data } = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/event-maps/${mapId}`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
    onSuccess: () => {
      setMapMessage({ type: "success", text: "Térkép preset törölve." });
      if (editingMap) {
        setEditingMap(null);
        setEditingMapName("");
        setEditingMapImage(null);
      }

      queryClient.invalidateQueries({ queryKey: ["admin-event-maps"] });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
    onError: (error) => {
      setMapMessage({
        type: "error",
        text: getErrorMessage(error, "A térkép preset törlése sikertelen."),
      });
    },
  });

  const startEditing = (event: EventWithRegistrationInfo) => {
    setEditingEvent(event);
    setImage(null);
    setForm({
      name: event.name,
      creator: event.creator,
      description: event.description,
      location: event.location,
      date: toLocalInputValue(event.date),
      maxParticipants: event.maxParticipants?.toString() ?? "",
      eventMapId: event.eventMapId ? String(event.eventMapId) : "",
    });
    setMessage(null);
    setIsFormModalOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.creator.trim() ||
      !form.description.trim() ||
      !form.location.trim() ||
      !form.date
    ) {
      setMessage({
        type: "error",
        text: "A kötelező mezők kitöltése szükséges (szervezővel együtt).",
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

    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (!editingEvent) {
      return;
    }

    if (!window.confirm("Biztosan törölni szeretnéd ezt az eseményt?")) {
      return;
    }

    deleteMutation.mutate(editingEvent.id);
  };

  const startMapEditing = (eventMap: EventMapPreset) => {
    setEditingMap(eventMap);
    setEditingMapName(eventMap.name);
    setEditingMapImage(null);
    setMapMessage(null);
  };

  const cancelMapEditing = () => {
    setEditingMap(null);
    setEditingMapName("");
    setEditingMapImage(null);
  };

  const handleMapCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newMapName.trim() || !newMapImage) {
      setMapMessage({
        type: "error",
        text: "Adj meg nevet és képet az új presethez.",
      });
      return;
    }

    createEventMapMutation.mutate();
  };

  const handleMapUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingMap) {
      return;
    }

    if (!editingMapName.trim()) {
      setMapMessage({
        type: "error",
        text: "A preset neve nem lehet üres.",
      });
      return;
    }

    updateEventMapMutation.mutate();
  };

  const handleMapDelete = (eventMap: EventMapPreset) => {
    if (
      !window.confirm(
        `Biztosan törölni szeretnéd a(z) \"${eventMap.name}\" térkép presetet?`,
      )
    ) {
      return;
    }

    deleteEventMapMutation.mutate(eventMap.id);
  };

  return (
    <>
      <AdminPageHeader
        title="Események kezelése"
        description="Hozz létre, szerkessz és törölj eseményeket, majd kezeld a hozzájuk tartozó jelentkezéseket, híreket és kommenteket."
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

      <section className="card-box h-auto! p-5 min-w-0 mb-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Térkép presetek</h2>
            <p className="text-sm text-faded">
              Hozz létre új termet/osztálytérképet, majd válaszd ki eseményeknél.
            </p>
          </div>
          <div className="text-sm text-faded">
            {eventMaps.length} mentett preset
          </div>
        </div>

        {mapMessage ? (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              mapMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {mapMessage.text}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form
            onSubmit={handleMapCreate}
            className="rounded-xl border border-faded/20 bg-secondary/40 p-4 space-y-3"
          >
            <h3 className="font-medium">Új preset</h3>
            <div className="space-y-1">
              <label className="text-sm text-faded">Név</label>
              <input
                value={newMapName}
                onChange={(event) => setNewMapName(event.target.value)}
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                placeholder="Pl.: Matek II"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-faded">Térkép kép</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setNewMapImage(event.target.files?.[0] ?? null)
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <button
              type="submit"
              disabled={createEventMapMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 transition ease-in-out disabled:bg-faded disabled:cursor-not-allowed cursor-pointer"
            >
              {createEventMapMutation.isPending ? "Mentés..." : "Preset mentése"}
            </button>
          </form>

          <div className="rounded-xl border border-faded/20 bg-secondary/40 p-4 space-y-3">
            <h3 className="font-medium">Mentett presetek</h3>
            {isEventMapsLoading ? (
              <div className="text-sm text-faded">Presetek betöltése...</div>
            ) : eventMaps.length === 0 ? (
              <div className="text-sm text-faded">Még nincs mentett preset.</div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {eventMaps.map((eventMap) => {
                  const isEditingMap = editingMap?.id === eventMap.id;

                  return (
                    <div
                      key={eventMap.id}
                      className="rounded-lg border border-faded/20 bg-secondary/50 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{eventMap.name}</div>
                          <div className="text-xs text-faded">
                            {eventMap.eventCount} hozzárendelt esemény
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startMapEditing(eventMap)}
                            className="rounded-md border border-faded/30 p-1.5 hover:bg-faded/10 transition ease-in-out cursor-pointer"
                            title="Szerkesztés"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMapDelete(eventMap)}
                            disabled={deleteEventMapMutation.isPending}
                            className="rounded-md border border-red-300/50 p-1.5 text-red-700 hover:bg-red-50 transition ease-in-out disabled:text-faded disabled:border-faded/30 disabled:cursor-not-allowed cursor-pointer"
                            title="Törlés"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {isEditingMap ? (
                        <form onSubmit={handleMapUpdate} className="mt-3 space-y-2">
                          <input
                            value={editingMapName}
                            onChange={(event) => setEditingMapName(event.target.value)}
                            className="w-full rounded-lg border border-faded/25 bg-secondary/70 px-3 py-2 text-sm focus:outline-none focus:border-accent"
                            placeholder="Preset név"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              setEditingMapImage(event.target.files?.[0] ?? null)
                            }
                            className="w-full rounded-lg border border-faded/25 bg-secondary/70 px-3 py-2 text-sm focus:outline-none focus:border-accent"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="submit"
                              disabled={updateEventMapMutation.isPending}
                              className="rounded-lg bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent/80 transition ease-in-out disabled:bg-faded disabled:cursor-not-allowed cursor-pointer"
                            >
                              {updateEventMapMutation.isPending
                                ? "Mentés..."
                                : "Frissítés"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelMapEditing}
                              className="rounded-lg border border-faded/30 px-3 py-1.5 text-sm hover:bg-faded/10 transition ease-in-out cursor-pointer"
                            >
                              Mégse
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="card-box h-auto! p-5 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Eseménylista</h2>
            <p className="text-sm text-faded">
              {filteredEvents.length} megjelenített esemény
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-faded/20 bg-secondary/50 p-1 self-start">
            {[
              { value: "all", label: "Összes" },
              { value: "future", label: "Jövőbeli" },
              { value: "past", label: "Befejezett" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-lg px-3 py-1.5 text-sm transition ease-in-out cursor-pointer ${
                  filter === option.value
                    ? "bg-accent text-white"
                    : "hover:bg-faded/20"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-80 items-center justify-center">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Nem sikerült betölteni az eseményeket.
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="h-80 rounded-xl border border-dashed border-faded/30 flex items-center justify-center text-faded text-center px-4">
            Nincs megjeleníthető esemény.
          </div>
        ) : (
          <div className="space-y-3 max-h-[820px] overflow-y-auto pr-1">
            {filteredEvents.map((event) => {
              const isSelected =
                editingEvent?.id === event.id && isFormModalOpen;
              const isPast = new Date(event.date).getTime() < Date.now();

              return (
                <article
                  key={event.id}
                  className={`rounded-xl border p-4 transition ease-in-out ${
                    isSelected
                      ? "border-accent bg-accent/5"
                      : "border-faded/20 bg-secondary/40 hover:bg-faded/10"
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {event.imageUrl ? (
                      <div className="relative h-36 md:h-28 md:w-40 rounded-xl overflow-hidden shrink-0 bg-faded/20">
                        <Image
                          src={event.imageUrl}
                          alt={event.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-36 md:h-28 md:w-40 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                        <CalendarDays size={34} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold leading-tight">
                            {event.name}
                          </h3>
                          <p className="text-sm text-faded line-clamp-2 mt-1">
                            {event.description}
                          </p>
                        </div>
                        <AdminStatusBadge tone={isPast ? "neutral" : "green"}>
                          {isPast ? "Befejezett" : "Aktív"}
                        </AdminStatusBadge>
                      </div>

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

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(event)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-faded/30 px-3 py-1.5 text-sm hover:bg-faded/10 transition ease-in-out cursor-pointer"
                        >
                          <Pencil size={14} />
                          Szerkesztés
                        </button>
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-faded/30 px-3 py-1.5 text-sm hover:bg-faded/10 transition ease-in-out"
                        >
                          <Eye size={14} />
                          Részletek
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <AdminFormModal
        isOpen={isFormModalOpen}
        onClose={resetForm}
        title={editingEvent ? "Esemény szerkesztése" : "Új esemény"}
        description={
          editingEvent ? editingEvent.name : "Publikus esemény létrehozása"
        }
        maxWidthClassName="max-w-4xl"
      >
        {message ? (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

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
            <label className="text-sm text-faded">Szervező</label>
            <input
              value={form.creator}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  creator: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
              placeholder="Szervező neve"
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
              <label className="text-sm text-faded">Terem/osztálytérkép</label>
              <select
                value={form.eventMapId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    eventMapId: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
              >
                <option value="">Nincs kiválasztva</option>
                {eventMaps.map((eventMap) => (
                  <option key={eventMap.id} value={eventMap.id}>
                    {eventMap.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-faded">Kép</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div className="rounded-xl border border-faded/20 bg-secondary/40 p-3 text-sm text-faded">
              {form.eventMapId
                ? `Kiválasztott preset: ${
                    eventMaps.find((item) => String(item.id) === form.eventMapId)
                      ?.name ?? "Ismeretlen"
                  }`
                : "Nincs térkép preset kiválasztva."}
            </div>
          </div>

          {editingEvent?.imageUrl ? (
            <div className="rounded-xl border border-faded/20 bg-secondary/40 p-3 text-sm text-faded">
              Jelenlegi kép:
              <div className="relative mt-2 h-28 w-40 overflow-hidden rounded-xl">
                <Image
                  src={editingEvent.imageUrl}
                  alt={editingEvent.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent/80 transition ease-in-out disabled:bg-faded disabled:cursor-not-allowed cursor-pointer"
            >
              {saveMutation.isPending
                ? "Mentés..."
                : editingEvent
                  ? "Frissítés"
                  : "Létrehozás"}
            </button>
            {editingEvent ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/50 bg-red-50 px-4 py-2.5 font-medium text-red-700 hover:bg-red-100 transition ease-in-out disabled:text-faded disabled:bg-transparent disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 size={16} />
                Törlés
              </button>
            ) : null}
          </div>
        </form>
      </AdminFormModal>
    </>
  );
};

export default EventsAdminPage;
