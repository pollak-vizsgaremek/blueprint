"use client";

import { Spinner } from "@/components/Spinner";
import { Calendar } from "@/components/ui/Calendar";
import { usePopupModal } from "@/contexts/PopupModalContext";
import { notify } from "@/lib/notify";
import { useAppSettings } from "@/lib/useAppSettings";
import { isReducedMotionEnabled } from "@/lib/motion";
import {
  Appointment,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  DeleteAppointmentResponse,
  GetAppointmentsResponse,
  GetTeacherAvailabilityResponse,
  GetTeacherOccupiedSlotsResponse,
  GetTeachersResponse,
  TeacherAvailability,
  TeacherOption,
} from "@/types";
import { useGSAP } from "@gsap/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import gsap from "gsap";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

const statusOptions: Array<{
  value: Appointment["status"];
  label: string;
}> = [
  { value: "pending", label: "Függőben" },
  { value: "confirmed", label: "Megerősítve" },
  { value: "cancelled", label: "Lemondva" },
  { value: "completed", label: "Teljesítve" },
];

const formatDateRange = (startTime: string, endTime: string) => {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Érvénytelen időpont";
  }

  const datePart = startDate.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const startTimePart = startDate.toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endTimePart = endDate.toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart}, ${startTimePart} - ${endTimePart}`;
};

const rangesOverlap = (
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
) => {
  return firstStart < secondEnd && firstEnd > secondStart;
};

const statusBadgeClasses: Record<Appointment["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-sky-100 text-sky-700",
};

type FormState = {
  teacherId: string;
  title: string;
  date: string;
  slotId: string;
};

const initialFormState: FormState = {
  teacherId: "",
  title: "",
  date: "",
  slotId: "",
};

const isoDayToLabel: Record<number, string> = {
  1: "Hétfő",
  2: "Kedd",
  3: "Szerda",
  4: "Csütörtök",
  5: "Péntek",
  6: "Szombat",
  7: "Vasárnap",
};

const toTimeLabel = (minutes: number) => {
  const safe = Math.max(0, Math.min(1439, minutes));
  const hours = String(Math.floor(safe / 60)).padStart(2, "0");
  const mins = String(safe % 60).padStart(2, "0");
  return `${hours}:${mins}`;
};

const toIsoDay = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 7 : day;
};

const toDateAndMinutesIso = (dateValue: string, minutes: number) => {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  date.setMinutes(minutes);
  return date.toISOString();
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AppointmentsPage = () => {
  const queryClient = useQueryClient();
  const { showConfirm } = usePopupModal();
  const { settings } = useAppSettings();

  const [form, setForm] = useState<FormState>(initialFormState);

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

  const {
    data: teachersData,
    isLoading: isTeachersLoading,
    isError: isTeachersError,
  } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data } = await axios.get<GetTeachersResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/users/teachers`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const selectedTeacherId = parseInt(form.teacherId, 10);
  const {
    data: availabilityData,
    isLoading: isAvailabilityLoading,
    isError: isAvailabilityError,
  } = useQuery({
    queryKey: ["teacher-availability", selectedTeacherId],
    enabled: !Number.isNaN(selectedTeacherId),
    queryFn: async () => {
      const { data } = await axios.get<GetTeacherAvailabilityResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher-availability/${selectedTeacherId}`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const {
    data: occupiedSlotsData,
    isLoading: isOccupiedSlotsLoading,
    isError: isOccupiedSlotsError,
  } = useQuery({
    queryKey: ["teacher-occupied-slots", selectedTeacherId],
    enabled: !Number.isNaN(selectedTeacherId),
    queryFn: async () => {
      const { data } = await axios.get<GetTeacherOccupiedSlotsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/teacher/${selectedTeacherId}/occupied`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const appointments = useMemo(
    () => appointmentsData?.appointments ?? [],
    [appointmentsData],
  );
  const visibleAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          !settings.hideCancelledAppointments ||
          appointment.status !== "cancelled",
      ),
    [appointments, settings.hideCancelledAppointments],
  );

  const teachers = useMemo(() => teachersData?.teachers ?? [], [teachersData]);

  const teacherAvailability = useMemo(
    () => availabilityData?.availability ?? [],
    [availabilityData],
  );
  const teacherOccupiedSlots = useMemo(
    () => occupiedSlotsData?.occupiedSlots ?? [],
    [occupiedSlotsData],
  );

  const selectedDate = form.date ? new Date(`${form.date}T00:00:00`) : null;
  const todayStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const teacherHasAvailabilityOnDate = (date: Date) => {
    const isoDay = toIsoDay(date);
    return teacherAvailability.some(
      (slot) => slot.isActive && slot.dayOfWeek === isoDay,
    );
  };

  const isDateDisabled = (date: Date) => {
    if (!form.teacherId) {
      return true;
    }

    const dateStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    if (dateStart < todayStart) {
      return true;
    }

    return !teacherHasAvailabilityOnDate(date);
  };

  const isSlotTakenOnDate = (
    dateValue: string,
    slot: Pick<TeacherAvailability, "startMinutes" | "endMinutes">,
  ) => {
    const slotStart = new Date(
      toDateAndMinutesIso(dateValue, slot.startMinutes),
    );
    const slotEnd = new Date(toDateAndMinutesIso(dateValue, slot.endMinutes));

    return teacherOccupiedSlots.some((occupiedSlot) => {
      const occupiedStart = new Date(occupiedSlot.startTime);
      const occupiedEnd = new Date(occupiedSlot.endTime);

      if (
        Number.isNaN(occupiedStart.getTime()) ||
        Number.isNaN(occupiedEnd.getTime())
      ) {
        return false;
      }

      return rangesOverlap(slotStart, slotEnd, occupiedStart, occupiedEnd);
    });
  };

  const getDailySlotsWithState = (date: Date) => {
    const dateValue = toDateInputValue(date);
    const day = toIsoDay(date);
    const slots = teacherAvailability
      .filter((slot) => slot.dayOfWeek === day && slot.isActive)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    return slots.map((slot) => ({
      ...slot,
      isTaken: isSlotTakenOnDate(dateValue, slot),
    }));
  };

  const isDayFullyBooked = (date: Date) => {
    if (!form.teacherId || isDateDisabled(date)) {
      return false;
    }

    const slots = getDailySlotsWithState(date);
    return slots.length > 0 && slots.every((slot) => slot.isTaken);
  };

  const hasAnyFreeSlotOnDate = (date: Date) => {
    if (!form.teacherId || isDateDisabled(date)) {
      return false;
    }

    const slots = getDailySlotsWithState(date);
    return slots.some((slot) => !slot.isTaken);
  };

  const selectedDaySlots = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    return getDailySlotsWithState(selectedDate);
  }, [selectedDate, teacherAvailability, teacherOccupiedSlots]);

  const resetForm = () => {
    setForm(initialFormState);
  };

  const { mutate: createAppointment, isPending: isCreating } = useMutation({
    mutationFn: async (payload: CreateAppointmentRequest) => {
      const { data } = await axios.post<CreateAppointmentResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments`,
        payload,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      notify.success("Időpont sikeresen létrehozva.");
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ??
          error.response?.data?.error ??
          "Időpont létrehozása sikertelen.";
        notify.error(errorMessage);
        return;
      }

      notify.error("Időpont létrehozása sikertelen.");
    },
  });

  const { mutate: deleteAppointment, isPending: isDeleting } = useMutation({
    mutationFn: async (appointmentId: number) => {
      const { data } = await axios.delete<DeleteAppointmentResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/${appointmentId}`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      notify.success("Időpont sikeresen törölve.");
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ??
          error.response?.data?.error ??
          "Időpont törlése sikertelen.";
        notify.error(errorMessage);
        return;
      }

      notify.error("Időpont törlése sikertelen.");
    },
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

  const submitLabel = "Időpont létrehozása";
  const isMutating = isCreating;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const teacherId = parseInt(form.teacherId, 10);
    if (Number.isNaN(teacherId)) {
      notify.warning("Kérlek válassz tanárt.");
      return;
    }

    const title = form.title.trim();
    if (!title) {
      notify.warning("Kérlek adj meg címet.");
      return;
    }

    if (!form.date) {
      notify.warning("Kérlek add meg a dátumot.");
      return;
    }

    const selectedSlot = selectedDaySlots.find(
      (slot) => String(slot.id) === form.slotId,
    );

    if (!selectedSlot) {
      notify.warning("Kérlek válassz elérhető idősávot.");
      return;
    }

    if (selectedSlot.isTaken) {
      notify.warning(
        "A kiválasztott idősáv már foglalt. Kérlek válassz másikat.",
      );
      return;
    }

    const startIso = toDateAndMinutesIso(form.date, selectedSlot.startMinutes);
    const endIso = toDateAndMinutesIso(form.date, selectedSlot.endMinutes);
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      notify.warning("Érvénytelen dátum formátum.");
      return;
    }

    if (endDate <= startDate) {
      notify.warning(
        "A befejezési időnek későbbinek kell lennie, mint a kezdés.",
      );
      return;
    }

    if (startDate.getTime() <= Date.now() || endDate.getTime() <= Date.now()) {
      notify.warning("Csak jövőbeli időpontot lehet foglalni.");
      return;
    }

    const hasStudentOverlap = appointments.some((appointment) => {
      if (
        appointment.status !== "pending" &&
        appointment.status !== "confirmed"
      ) {
        return false;
      }

      const appointmentStart = new Date(appointment.startTime);
      const appointmentEnd = new Date(appointment.endTime);

      if (
        Number.isNaN(appointmentStart.getTime()) ||
        Number.isNaN(appointmentEnd.getTime())
      ) {
        return false;
      }

      return rangesOverlap(
        startDate,
        endDate,
        appointmentStart,
        appointmentEnd,
      );
    });

    if (hasStudentOverlap) {
      notify.warning("Már van átfedő időpontod ebben az idősávban.");
      return;
    }

    const payload: CreateAppointmentRequest = {
      teacherId,
      title,
      startTime: startIso,
      endTime: endIso,
    };

    createAppointment(payload);
  };

  const handleDelete = async (appointmentId: number) => {
    const confirmed = await showConfirm({
      message: "Biztosan törölni szeretnéd ezt az időpontot?",
      tone: "warning",
      confirmText: "Törlés",
      cancelText: "Mégse",
    });

    if (!confirmed) {
      return;
    }

    deleteAppointment(appointmentId);
  };

  return (
    <main className="page-shell page-main page-content">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Időpontok</h1>
        <p className="text-faded mt-1">
          Foglalj időpontot tanárral, és kezeld a meglévő bejegyzéseidet.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.2fr]">
        <div className="card-box h-fit! p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Új időpont</h2>
          </div>

          {isTeachersLoading ? (
            <Spinner />
          ) : isTeachersError ? (
            <div className="text-red-600">
              Nem sikerült betölteni a tanárokat.
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-faded">Jelenleg nincs elérhető tanár.</div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-sm text-faded">Tanár</label>
                <select
                  value={form.teacherId}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      teacherId: event.target.value,
                      slotId: "",
                    }))
                  }
                  required
                  className="w-full border border-faded/25 rounded-xl px-3 py-2 bg-secondary/70 focus:outline-none focus:border-accent"
                >
                  <option disabled value="">
                    Válassz tanárt...
                  </option>
                  {teachers.map((teacher: TeacherOption) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-faded">Rövid leírás</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Pl. Konzultáció matematika témában"
                  className="w-full border border-faded/25 rounded-xl px-3 py-2 bg-secondary/70 focus:outline-none focus:border-accent"
                  maxLength={255}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-faded">Dátum</label>
                <div className="rounded-xl border border-faded/25 bg-secondary/70 p-2">
                  <Calendar
                    selected={selectedDate ?? undefined}
                    onSelect={(date) =>
                      setForm((previous) => ({
                        ...previous,
                        date: date ? toDateInputValue(date) : "",
                        slotId: "",
                      }))
                    }
                    disabled={isDateDisabled}
                    isAvailableDate={hasAnyFreeSlotOnDate}
                    isUnavailableDate={isDayFullyBooked}
                    fromYear={new Date().getFullYear()}
                    toYear={new Date().getFullYear() + 2}
                    weekStart={settings.weekStart}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-faded">Elérhető idősáv</label>
                {!form.teacherId ? (
                  <div className="text-faded text-sm">
                    Először válassz tanárt.
                  </div>
                ) : isAvailabilityLoading ? (
                  <Spinner />
                ) : isOccupiedSlotsLoading ? (
                  <Spinner />
                ) : isAvailabilityError ? (
                  <div className="text-red-600 text-sm">
                    Nem sikerült betölteni a tanár elérhetőségét.
                  </div>
                ) : isOccupiedSlotsError ? (
                  <div className="text-red-600 text-sm">
                    Nem sikerült betölteni a foglalt idősávokat.
                  </div>
                ) : !form.date ? (
                  <div className="text-faded text-sm">
                    Válassz dátumot az idősávokhoz.
                  </div>
                ) : selectedDaySlots.length === 0 ? (
                  <div className="text-faded text-sm">
                    Nincs elérhető idősáv erre a napra (
                    {isoDayToLabel[toIsoDay(new Date(`${form.date}T00:00:00`))]}
                    ).
                  </div>
                ) : (
                  <select
                    value={form.slotId}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        slotId: event.target.value,
                      }))
                    }
                    className="w-full border border-faded/25 rounded-xl px-3 py-2 bg-secondary/70 focus:outline-none focus:border-accent"
                    required
                  >
                    <option value="">Válassz idősávot...</option>
                    {selectedDaySlots.map((slot) => (
                      <option
                        key={slot.id}
                        value={slot.id}
                        disabled={slot.isTaken}
                      >
                        {toTimeLabel(slot.startMinutes)} -{" "}
                        {toTimeLabel(slot.endMinutes)}
                        {slot.isTaken ? " (foglalt)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="submit"
                disabled={isMutating}
                className="w-full bg-accent text-white rounded-xl py-2.5 font-medium hover:bg-accent/80 transition ease-in-out disabled:bg-faded disabled:cursor-not-allowed cursor-pointer"
              >
                {isMutating ? "Mentés folyamatban..." : submitLabel}
              </button>
            </form>
          )}
        </div>

        <div className="card-box max-h-[900px] overflow-clip p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Foglalt időpontjaid</h2>
            <span className="text-xs text-faded">
              {visibleAppointments.length} db
            </span>
          </div>

          {isAppointmentsLoading ? (
            <Spinner />
          ) : isAppointmentsError ? (
            <div className="text-red-600">
              Nem sikerült betölteni az időpontokat.
            </div>
          ) : visibleAppointments.length === 0 ? (
            <div className="h-56 border border-dashed border-faded/30 rounded-xl flex items-center justify-center text-faded text-center px-4">
              Még nincs foglalt időpontod.
            </div>
          ) : (
            <div className="space-y-3 max-h-[95%] overflow-y-scroll pr-1">
              {visibleAppointments.map((appointment) => {
                const statusLabel =
                  statusOptions.find(
                    (statusOption) => statusOption.value === appointment.status,
                  )?.label ?? appointment.status;

                return (
                  <article
                    key={appointment.id}
                    className="border border-faded/20 rounded-xl p-4 bg-secondary/40"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-lg font-semibold leading-tight">
                          {appointment.title ||
                            appointment.purpose ||
                            "Névtelen időpont"}
                        </h3>
                        <div className="text-sm text-faded mt-1 inline-flex items-center gap-2">
                          <UserRound size={14} />
                          <span>
                            {appointment.teacher?.name ?? "Ismeretlen tanár"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-xs px-2 py-1 rounded-full ${statusBadgeClasses[appointment.status]}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="text-sm text-faded flex flex-col gap-1 mb-3">
                      <div className="inline-flex items-center gap-2">
                        <CalendarDays size={14} />
                        <span>
                          {formatDateRange(
                            appointment.startTime,
                            appointment.endTime,
                          )}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <MapPin size={14} />
                        <span>
                          {appointment.classroom
                            ? `Tanterem: ${appointment.classroom}`
                            : "Tanterem nincs megadva"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between ">
                      <button
                        type="button"
                        onClick={() => handleDelete(appointment.id)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:text-faded disabled:border-faded/30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
                      >
                        <XCircle size={16} />
                        Lemondás
                      </button>
                      <div className="inline-flex items-center text-sm text-faded gap-2">
                        <Clock3 size={14} />
                        <span>
                          Létrehozva:{" "}
                          {new Date(appointment.createdAt).toLocaleString(
                            "hu-HU",
                          )}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default AppointmentsPage;
