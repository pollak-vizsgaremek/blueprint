"use client";

import { Spinner } from "@/components/Spinner";
import { useModal } from "@/contexts/ModalContext";
import { useAppSettings } from "@/lib/useAppSettings";
import {
  Appointment,
  EventWithRegistrationInfo,
  GetAppointmentsResponse,
  GetUserEventRegistrationsResponse,
  RegistrationWithEvent,
} from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  MapPin,
  Ticket,
} from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { isReducedMotionEnabled } from "@/lib/motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

type CalendarEventItem = {
  id: number;
  name: string;
  location: string;
  date: Date;
  status: RegistrationWithEvent["status"];
  modalEvent: EventWithRegistrationInfo;
};

type CalendarAppointmentItem = {
  id: number;
  teacherName: string;
  title: string;
  status: Appointment["status"];
  startTime: Date;
  endTime: Date;
};

type CalendarViewMode = "month" | "agenda";

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

const getIsoWeekNumber = (date: Date) => {
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
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

const formatTimeRange = (start: Date, end: Date) => {
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const appointmentStatusLabel: Record<Appointment["status"], string> = {
  pending: "Függőben",
  confirmed: "Megerősítve",
  cancelled: "Lemondva",
  completed: "Teljesítve",
};

const appointmentStatusClass: Record<Appointment["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-sky-100 text-sky-700",
};

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
  const [viewMode, setViewMode] = useState<CalendarViewMode>(
    settings.defaultCalendarView,
  );

  useEffect(() => {
    setViewMode(settings.defaultCalendarView);
  }, [settings.defaultCalendarView]);

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

  const {
    data: appointmentsData,
    isLoading: isAppointmentsLoading,
    isError: isAppointmentsError,
  } = useQuery({
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

  const allAppointments = useMemo(() => {
    const appointments = appointmentsData?.appointments ?? [];
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    return appointments
      .map((appointment) => {
        const startTime = new Date(appointment.startTime);
        const endTime = new Date(appointment.endTime);

        return {
          id: appointment.id,
          teacherName: appointment.teacher?.name ?? "Ismeretlen tanár",
          title: appointment.title || appointment.purpose || "Időpont",
          status: appointment.status,
          startTime,
          endTime,
        } satisfies CalendarAppointmentItem;
      })
      .filter(
        (appointment) =>
          !Number.isNaN(appointment.startTime.getTime()) &&
          !Number.isNaN(appointment.endTime.getTime()),
      )
      .filter(
        (appointment) =>
          !settings.hideCancelledAppointments ||
          appointment.status !== "cancelled",
      )
      .filter(
        (appointment) =>
          settings.showPastEvents || appointment.endTime >= todayStart,
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [
    appointmentsData,
    settings.hideCancelledAppointments,
    settings.showPastEvents,
  ]);

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

  const appointmentsByDay = useMemo(() => {
    return allAppointments.reduce<Map<string, CalendarAppointmentItem[]>>(
      (acc, appointment) => {
        const key = toDateKey(appointment.startTime);
        const current = acc.get(key) ?? [];
        current.push(appointment);
        acc.set(key, current);
        return acc;
      },
      new Map(),
    );
  }, [allAppointments]);

  const selectedDayAppointments = useMemo(() => {
    return appointmentsByDay.get(toDateKey(selectedDate)) ?? [];
  }, [appointmentsByDay, selectedDate]);

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
        eventEntries: eventsByDay.get(dateKey)?.length ?? 0,
        appointmentEntries: appointmentsByDay.get(dateKey)?.length ?? 0,
        eventCount:
          (eventsByDay.get(dateKey)?.length ?? 0) +
          (appointmentsByDay.get(dateKey)?.length ?? 0),
      };
    });
  }, [appointmentsByDay, eventsByDay, settings.weekStart, visibleMonth]);

  const weekDayNames = weekDayNamesByWeekStart[settings.weekStart];

  const isSameDate = (first: Date, second: Date) => {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  };

  const selectedDateLabel = selectedDate.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  useGSAP(() => {
    if (isReducedMotionEnabled() || isLoading || isAppointmentsLoading) {
      return;
    }

    gsap.from(".page-content", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
  }, [isLoading, isAppointmentsLoading]);

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

  if (isLoading || isAppointmentsLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Spinner />
      </div>
    );
  }

  if (isError || isAppointmentsError) {
    return (
      <main className="page-shell page-main">
        <div className="card-box h-auto">
          <div className="text-xl text-red-600">
            Nem sikerült betölteni a naptár adatokat.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell page-main page-content">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Naptár</h1>
        <p className="text-faded mt-1">
          Itt látod az összes jelentkezett eseményedet.
        </p>
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-5">
        <div className="card-box h-auto p-5">
          <div className="mb-3 flex items-center justify-end">
            <div className="inline-flex rounded-xl border border-faded/20 bg-secondary/50 p-1 text-sm">
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={cn(
                  "rounded-lg px-3 py-1.5 transition",
                  viewMode === "month"
                    ? "bg-accent text-white"
                    : "text-faded hover:bg-secondary",
                )}
              >
                Havi nézet
              </button>
              <button
                type="button"
                onClick={() => setViewMode("agenda")}
                className={cn(
                  "rounded-lg px-3 py-1.5 transition",
                  viewMode === "agenda"
                    ? "bg-accent text-white"
                    : "text-faded hover:bg-secondary",
                )}
              >
                Napi lista
              </button>
            </div>
          </div>

          {viewMode === "month" ? (
            <>
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
                  {monthNames[visibleMonth.getMonth()]}{" "}
                  {visibleMonth.getFullYear()}
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

              <div
                className={cn(
                  "grid gap-2 text-center mb-2",
                  settings.showWeekNumbers
                    ? "grid-cols-[42px_repeat(7,minmax(0,1fr))]"
                    : "grid-cols-7",
                )}
              >
                {settings.showWeekNumbers ? (
                  <div className="text-xs text-faded font-medium py-2">Hét</div>
                ) : null}
                {weekDayNames.map((weekDay) => (
                  <div
                    key={weekDay}
                    className="text-sm text-faded font-medium py-2"
                  >
                    {weekDay}
                  </div>
                ))}
              </div>

              <div
                className={cn(
                  "grid gap-2",
                  settings.showWeekNumbers
                    ? "grid-cols-[42px_repeat(7,minmax(0,1fr))]"
                    : "grid-cols-7",
                )}
              >
                {Array.from({ length: 6 }).map((_, weekIndex) => {
                  const weekDays = calendarDays.slice(
                    weekIndex * 7,
                    (weekIndex + 1) * 7,
                  );
                  const weekDate = weekDays[0]?.date;
                  return (
                    <div key={`week-${weekIndex}`} className="contents">
                      {settings.showWeekNumbers && weekDate ? (
                        <div className="flex items-start justify-center pt-2 text-xs text-faded font-medium">
                          {getIsoWeekNumber(weekDate)}
                        </div>
                      ) : null}
                      {weekDays.map((day) => {
                        const isToday = isSameDate(day.date, new Date());
                        const isSelected = isSameDate(day.date, selectedDate);

                        return (
                          <button
                            key={day.dateKey}
                            onClick={() => setSelectedDate(day.date)}
                            className={cn(
                              "rounded-xl border p-2 text-left flex flex-col justify-between transition ease-in-out cursor-pointer",
                              settings.compactCalendar
                                ? "min-h-[72px]"
                                : "min-h-[88px]",
                              day.isCurrentMonth
                                ? "border-faded/20 bg-secondary/50 hover:bg-secondary"
                                : "border-faded/10 bg-secondary/20 text-faded/70 hover:bg-secondary/40",
                              isSelected &&
                                "ring-2 ring-accent border-transparent",
                              isToday && !isSelected && "border-accent/40",
                            )}
                          >
                            <div
                              className={cn(
                                "font-medium inline-flex size-7 items-center justify-center rounded-full",
                                settings.compactCalendar
                                  ? "text-xs"
                                  : "text-sm",
                                isToday && "bg-accent/10 text-accent",
                              )}
                            >
                              {day.date.getDate()}
                            </div>

                            {day.eventCount > 0 ? (
                              <div className="flex items-center justify-between mt-2 gap-1">
                                <div className="flex items-center gap-1">
                                  {day.appointmentEntries > 0 && (
                                    <span
                                      className="inline-flex items-center justify-center size-7 rounded-full bg-amber-100 text-amber-700"
                                      title="Van időpont"
                                    >
                                      <CalendarClock
                                        size={20}
                                        className="shrink-0"
                                      />
                                    </span>
                                  )}
                                  {day.eventEntries > 0 && (
                                    <span
                                      className="inline-flex items-center justify-center size-7 rounded-full bg-emerald-100 text-emerald-700"
                                      title="Van esemény"
                                    >
                                      <GraduationCap size={20} />
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full shrink-0">
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
                  );
                })}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-faded/20 bg-secondary/30 p-4 text-sm text-faded">
              A havi naptár elrejtve. Válassz napot a jobb oldali napi listán.
            </div>
          )}
        </div>

        <div className="card-box h-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Napi nézet</h3>
            <span className="text-xs text-faded">
              {selectedDayEvents.length + selectedDayAppointments.length}{" "}
              bejegyzés
            </span>
          </div>

          <div className="text-faded mb-4 capitalize">{selectedDateLabel}</div>

          {allRegisteredEvents.length === 0 && allAppointments.length === 0 ? (
            <div className="min-h-[180px] sm:min-h-[220px] border border-dashed border-faded/30 rounded-xl flex items-center justify-center text-faded text-center px-4">
              Még nincs naptárbejegyzésed.
            </div>
          ) : selectedDayEvents.length === 0 &&
            selectedDayAppointments.length === 0 ? (
            <div className="min-h-[180px] sm:min-h-[220px] border border-dashed border-faded/30 rounded-xl flex items-center justify-center text-faded text-center px-4">
              Erre a napra nincs bejegyzésed.
            </div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {selectedDayAppointments.map((appointment) => (
                <div
                  key={`appointment-${appointment.id}`}
                  className="w-full border border-faded/20 rounded-xl p-3 text-left bg-secondary/30"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-lg leading-tight">
                      {appointment.title}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          appointmentStatusClass[appointment.status],
                        )}
                      >
                        {appointmentStatusLabel[appointment.status]}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-sm text-faded">
                    <div className="flex items-center gap-2">
                      <Clock3 size={14} />
                      <span>
                        {formatTimeRange(
                          appointment.startTime,
                          appointment.endTime,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket size={14} />
                      <span>Tanár: {appointment.teacherName}</span>
                    </div>
                  </div>
                </div>
              ))}

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
