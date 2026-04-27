"use client";

import { Spinner } from "@/components/Spinner";
import { usePopupModal } from "@/contexts/PopupModalContext";
import { isReducedMotionEnabled } from "@/lib/motion";
import {
  Appointment,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  DeleteAppointmentResponse,
  GetAppointmentsResponse,
  GetTeachersResponse,
  TeacherOption,
  UpdateAppointmentRequest,
  UpdateAppointmentResponse,
} from "@/types";
import { useGSAP } from "@gsap/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import gsap from "gsap";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  Trash2,
  UserRound,
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

const toLocalInputValue = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

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
  startTime: string;
};

const initialFormState: FormState = {
  teacherId: "",
  title: "",
  startTime: "",
};

const AppointmentsPage = () => {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = usePopupModal();

  const [form, setForm] = useState<FormState>(initialFormState);
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    number | null
  >(null);

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

  const appointments = useMemo(
    () => appointmentsData?.appointments ?? [],
    [appointmentsData],
  );

  const teachers = useMemo(() => teachersData?.teachers ?? [], [teachersData]);

  const resetForm = () => {
    setForm(initialFormState);
    setEditingAppointmentId(null);
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
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ??
          error.response?.data?.error ??
          "Időpont létrehozása sikertelen.";
        showAlert({ message: errorMessage, tone: "error" });
        return;
      }

      showAlert({ message: "Időpont létrehozása sikertelen.", tone: "error" });
    },
  });

  const { mutate: updateAppointment, isPending: isUpdating } = useMutation({
    mutationFn: async ({
      appointmentId,
      payload,
    }: {
      appointmentId: number;
      payload: UpdateAppointmentRequest;
    }) => {
      const { data } = await axios.put<UpdateAppointmentResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/${appointmentId}`,
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
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ??
          error.response?.data?.error ??
          "Időpont módosítása sikertelen.";
        showAlert({ message: errorMessage, tone: "error" });
        return;
      }

      showAlert({ message: "Időpont módosítása sikertelen.", tone: "error" });
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
      if (editingAppointmentId !== null) {
        resetForm();
      }
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ??
          error.response?.data?.error ??
          "Időpont törlése sikertelen.";
        showAlert({ message: errorMessage, tone: "error" });
        return;
      }

      showAlert({ message: "Időpont törlése sikertelen.", tone: "error" });
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

  const submitLabel = editingAppointmentId
    ? "Időpont frissítése"
    : "Időpont létrehozása";
  const isMutating = isCreating || isUpdating;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const teacherId = parseInt(form.teacherId, 10);
    if (Number.isNaN(teacherId)) {
      await showAlert({ message: "Kérlek válassz tanárt.", tone: "warning" });
      return;
    }

    const title = form.title.trim();
    if (!title) {
      await showAlert({ message: "Kérlek adj meg címet.", tone: "warning" });
      return;
    }

    if (!form.startTime) {
      await showAlert({
        message: "Kérlek add meg a kezdő időpontot.",
        tone: "warning",
      });
      return;
    }

    const startDate = new Date(form.startTime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      await showAlert({
        message: "Érvénytelen dátum formátum.",
        tone: "warning",
      });
      return;
    }

    if (endDate <= startDate) {
      await showAlert({
        message: "A befejezési időnek későbbinek kell lennie, mint a kezdés.",
        tone: "warning",
      });
      return;
    }

    if (startDate.getTime() <= Date.now() || endDate.getTime() <= Date.now()) {
      await showAlert({
        message: "Csak jövőbeli időpontot lehet foglalni.",
        tone: "warning",
      });
      return;
    }

    const hasStudentOverlap = appointments.some((appointment) => {
      if (editingAppointmentId && appointment.id === editingAppointmentId) {
        return false;
      }

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
      await showAlert({
        message: "Már van átfedő időpontod ebben az idősávban.",
        tone: "warning",
      });
      return;
    }

    const payload: CreateAppointmentRequest = {
      teacherId,
      title,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    };

    if (editingAppointmentId) {
      updateAppointment({
        appointmentId: editingAppointmentId,
        payload,
      });
      return;
    }

    createAppointment(payload);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointmentId(appointment.id);
    setForm({
      teacherId: String(appointment.teacherId),
      title: appointment.title || appointment.purpose || "",
      startTime: toLocalInputValue(appointment.startTime),
    });
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
    <main className="w-7/8 m-auto min-h-screen pt-24 pb-20 page-content">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Időpontok</h1>
        <p className="text-faded mt-1">
          Foglalj időpontot tanárral, és kezeld a meglévő bejegyzéseidet.
        </p>
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-5">
        <div className="card-box h-fit! p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {editingAppointmentId ? "Időpont szerkesztése" : "Új időpont"}
            </h2>
            {editingAppointmentId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-faded hover:text-text transition cursor-pointer"
              >
                Mégse
              </button>
            )}
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
                    }))
                  }
                  className="w-full border border-faded/25 rounded-xl px-3 py-2 bg-secondary/70 focus:outline-none focus:border-accent"
                >
                  <option value="">Válassz tanárt...</option>
                  {teachers.map((teacher: TeacherOption) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-faded">Cím</label>
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
                <label className="text-sm text-faded">Kezdés</label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      startTime: event.target.value,
                    }))
                  }
                  className="w-full border border-faded/25 rounded-xl px-3 py-2 bg-secondary/70 focus:outline-none focus:border-accent"
                  required
                />
                <p className="text-xs text-faded">
                  A befejezés automatikusan 1 órával a kezdés után lesz.
                </p>
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

        <div className="card-box h-130! overflow-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Foglalt időpontjaid</h2>
            <span className="text-xs text-faded">{appointments.length} db</span>
          </div>

          {isAppointmentsLoading ? (
            <Spinner />
          ) : isAppointmentsError ? (
            <div className="text-red-600">
              Nem sikerült betölteni az időpontokat.
            </div>
          ) : appointments.length === 0 ? (
            <div className="h-56 border border-dashed border-faded/30 rounded-xl flex items-center justify-center text-faded text-center px-4">
              Még nincs foglalt időpontod.
            </div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {appointments.map((appointment) => {
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
                        <Clock3 size={14} />
                        <span>
                          Létrehozva:{" "}
                          {new Date(appointment.createdAt).toLocaleString(
                            "hu-HU",
                          )}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <MapPin size={14} />
                        <span>
                          {appointment.teacher?.email ??
                            "Tanár e-mail nincs megadva"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(appointment)}
                        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-faded/30 hover:bg-faded/10 transition cursor-pointer"
                      >
                        <Pencil size={14} />
                        Szerkesztés
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(appointment.id)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:text-faded disabled:border-faded/30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Trash2 size={14} />
                        Törlés
                      </button>
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
