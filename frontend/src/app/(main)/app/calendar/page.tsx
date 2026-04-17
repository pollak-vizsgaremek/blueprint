"use client";

import { Spinner } from "@/components/Spinner";
import { useModal } from "@/contexts/ModalContext";
import { useAppSettings } from "@/lib/useAppSettings";
import {
  EventWithRegistrationInfo,
  GetUserEventRegistrationsResponse,
  RegistrationWithEvent,
} from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Ticket,
} from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type CalendarEventItem = {
  id: number;
  name: string;
  location: string;
  date: Date;
  status: RegistrationWithEvent["status"];
  modalEvent: EventWithRegistrationInfo;
};

const monthNames = [
  "Január",
  "Február",
  "Március",
  "Április",
  "Május",
  "Június",
  "Július",
  "Augusztus",
  "Szeptember",
  "Október",
  "November",
  "December",
];

const weekDayNamesByWeekStart = {
  monday: ["H", "K", "Sze", "Cs", "P", "Szo", "V"],
  sunday: ["V", "H", "K", "Sze", "Cs", "P", "Szo"],
} as const;

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateParam = (value: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearPart, monthPart, dayPart] = value.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);

  const parsedDate = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
};

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const CalendarContent = () => {
  const searchParams = useSearchParams();
  const { openModal } = useModal();
  const { settings } = useAppSettings();
  const lastAutoOpenedDayKeyRef = useRef<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const dateFromQuery = parseDateParam(searchParams.get("date"));
    return dateFromQuery ?? new Date();
  });
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );

  useEffect(() => {
    const dateFromQuery = parseDateParam(searchParams.get("date"));
    if (!dateFromQuery) {
      return;
    }

    setSelectedDate(dateFromQuery);
    setVisibleMonth(
      new Date(dateFromQuery.getFullYear(), dateFromQuery.getMonth(), 1),
    );
  }, [searchParams]);

  const {
    data: registrationsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["myevents"],
    queryFn: async () => {
      const { data } = await axios.get<GetUserEventRegistrationsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events/my-registrations`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const allRegisteredEvents = useMemo(() => {
    const registrations = registrationsData?.registrations ?? [];
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    return registrations
      .filter((registration) => registration.status === "registered")
      .map((registration) => {
        const eventDate = new Date(registration.event.date);

        const modalEvent: EventWithRegistrationInfo = {
          ...registration.event,
          registrationCount: 0,
          userRegistration: {
            id: registration.id,
            registeredAt: registration.registeredAt,
            status: registration.status,
          },
          isUserRegistered: registration.status === "registered",
          isFull: false,
        };

        return {
          id: registration.event.id,
          name: registration.event.name,
          location: registration.event.location,
          date: eventDate,
          status: registration.status,
          modalEvent,
        } satisfies CalendarEventItem;
      })
      .filter((event) => settings.showPastEvents || event.date >= todayStart)
      .filter((event) => !Number.isNaN(event.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [registrationsData, settings.showPastEvents]);

  const eventsByDay = useMemo(() => {
    return allRegisteredEvents.reduce<Map<string, CalendarEventItem[]>>(
      (acc, event) => {
        const key = toDateKey(event.date);
        const current = acc.get(key) ?? [];
        current.push(event);
        acc.set(key, current);
        return acc;
      },
      new Map(),
    );
  }, [allRegisteredEvents]);

  const selectedDayEvents = useMemo(() => {
    return eventsByDay.get(toDateKey(selectedDate)) ?? [];
  }, [eventsByDay, selectedDate]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const firstDayIndex =
      settings.weekStart === "monday" ? (firstDay + 6) % 7 : firstDay;

    return Array.from({ length: 42 }, (_, index) => {
      const dayOffset = index - firstDayIndex + 1;
      const date = new Date(year, month, dayOffset);
      const dateKey = toDateKey(date);

      return {
        date,
        dateKey,
        isCurrentMonth: date.getMonth() === month,
        eventCount: eventsByDay.get(dateKey)?.length ?? 0,
      };
    });
  }, [eventsByDay, settings.weekStart, visibleMonth]);

  const weekDayNames = weekDayNamesByWeekStart[settings.weekStart];

  const isSameDate = (first: Date, second: Date) => {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  };

  const selectedDateLabel = selectedDate.toLocaleDateString(
    settings.language === "hu" ? "hu-HU" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      timeZone: settings.timezone,
    },
  );

  useEffect(() => {
    const selectedDayKey = toDateKey(selectedDate);

    if (!settings.autoOpenEventModal || selectedDayEvents.length !== 1) {
      lastAutoOpenedDayKeyRef.current = null;
      return;
    }

    if (lastAutoOpenedDayKeyRef.current === selectedDayKey) {
      return;
    }

    openModal(selectedDayEvents[0].modalEvent);
    lastAutoOpenedDayKeyRef.current = selectedDayKey;
  }, [openModal, selectedDate, selectedDayEvents, settings.autoOpenEventModal]);

  if (isLoading) {
    return <Spinner />;
  }

  if (isError) {
    return (
      <main className="w-7/8 m-auto min-h-screen pt-24 pb-20">
        <div className="card-box h-auto">
          <div className="text-xl text-red-600">
            Nem sikerült betölteni az eseményeket.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-7/8 m-auto min-h-screen pt-24 pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Naptár</h1>
        <p className="text-faded mt-1">
          Itt látod az összes jelentkezett eseményedet.
        </p>
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-5">
        <div className="card-box h-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              className="border border-faded/20 rounded-lg p-2 hover:bg-faded/10 transition ease-in-out cursor-pointer"
              onClick={() => {
                setVisibleMonth(
                  (previous) =>
                    new Date(
                      previous.getFullYear(),
                      previous.getMonth() - 1,
                      1,
                    ),
                );
              }}
              aria-label="Előző hónap"
            >
              <ChevronLeft size={18} />
            </button>

            <h2 className="text-xl font-semibold">
              {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
            </h2>

            <button
              className="border border-faded/20 rounded-lg p-2 hover:bg-faded/10 transition ease-in-out cursor-pointer"
              onClick={() => {
                setVisibleMonth(
                  (previous) =>
                    new Date(
                      previous.getFullYear(),
                      previous.getMonth() + 1,
                      1,
                    ),
                );
              }}
              aria-label="Következő hónap"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {weekDayNames.map((weekDay) => (
              <div
                key={weekDay}
                className="text-sm text-faded font-medium py-2"
              >
                {weekDay}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const isToday = isSameDate(day.date, new Date());
              const isSelected = isSameDate(day.date, selectedDate);

              return (
                <button
                  key={day.dateKey}
                  onClick={() => setSelectedDate(day.date)}
                  className={cn(
                    "rounded-xl border p-2 text-left flex flex-col justify-between transition ease-in-out cursor-pointer",
                    settings.compactCalendar ? "min-h-[72px]" : "min-h-[88px]",
                    day.isCurrentMonth
                      ? "border-faded/20 bg-secondary/50 hover:bg-secondary"
                      : "border-faded/10 bg-secondary/20 text-faded/70 hover:bg-secondary/40",
                    isSelected && "ring-2 ring-accent border-transparent",
                    isToday && !isSelected && "border-accent/40",
                  )}
                >
                  <div
                    className={cn(
                      "font-medium inline-flex size-7 items-center justify-center rounded-full",
                      settings.compactCalendar ? "text-xs" : "text-sm",
                      isToday && "bg-accent/10 text-accent",
                    )}
                  >
                    {day.date.getDate()}
                  </div>

                  {day.eventCount > 0 ? (
                    <div className="flex items-center justify-between mt-2">
                      <span className="size-2 rounded-full bg-accent" />
                      <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full">
                        {day.eventCount}
                      </span>
                    </div>
                  ) : (
                    <div className="h-[14px]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card-box h-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Napi nézet</h3>
            <span className="text-xs text-faded">
              {selectedDayEvents.length} esemény
            </span>
          </div>

          <div className="text-faded mb-4 capitalize">{selectedDateLabel}</div>

          {allRegisteredEvents.length === 0 ? (
            <div className="h-48 border border-dashed border-faded/30 rounded-xl flex items-center justify-center text-faded text-center px-4">
              Még nincs jelentkezett eseményed.
            </div>
          ) : selectedDayEvents.length === 0 ? (
            <div className="h-48 border border-dashed border-faded/30 rounded-xl flex items-center justify-center text-faded text-center px-4">
              Erre a napra nincs eseményed.
            </div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {selectedDayEvents.map((event) => (
                <button
                  key={`${event.id}-${event.date.toISOString()}`}
                  onClick={() => openModal(event.modalEvent)}
                  className="w-full border border-faded/20 rounded-xl p-3 text-left bg-secondary/40 hover:bg-secondary transition ease-in-out cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-lg leading-tight">
                      {event.name}
                    </h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                      Jelentkezve
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 text-sm text-faded">
                    <div className="flex items-center gap-2">
                      <Clock3 size={14} />
                      <span>{formatTime(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className="mt-3 text-accent text-sm inline-flex items-center gap-1">
                    <Ticket size={14} />
                    Megnyitás
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

const CalendarPage = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <CalendarContent />
    </Suspense>
  );
};

export default CalendarPage;
