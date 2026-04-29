"use client";

import { Spinner } from "@/components/Spinner";
import {
  AdminAppointment,
  AdminAppointmentMutationResponse,
  AdminAppointmentsResponse,
  GetAllUsersResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CalendarDays, Clock3, Plus, Trash2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminFormModal } from "../../components/AdminFormModal";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { AdminStatusBadge } from "../../components/AdminStatusBadge";
import {
  appointmentStatusLabel,
  formatDateTime,
  toLocalInputValue,
} from "../../components/adminFormat";

type AppointmentFormState = {
  teacherId: string;
  studentId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: AdminAppointment["status"];
};

const initialFormState: AppointmentFormState = {
  teacherId: "",
  studentId: "",
  title: "",
  startTime: "",
  endTime: "",
  status: "pending",
};

const statusTone: Record<
  AdminAppointment["status"],
  "amber" | "green" | "red" | "blue"
> = {
  pending: "amber",
  confirmed: "green",
  cancelled: "red",
  completed: "blue",
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ?? error.response?.data?.error ?? fallback
    );
  }

  return fallback;
};

const AppointmentsAdminPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AppointmentFormState>(initialFormState);
  const [editingAppointment, setEditingAppointment] =
    useState<AdminAppointment | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    data: appointmentsData,
    isLoading: isAppointmentsLoading,
    isError: isAppointmentsError,
  } = useQuery({
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

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
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

  const appointments = appointmentsData?.appointments ?? [];
  const teachers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.role === "teacher" && (user.status ?? "active") === "active",
      ),
    [users],
  );
  const students = useMemo(
    () => users.filter((user) => (user.status ?? "active") === "active"),
    [users],
  );

  const resetForm = () => {
    setForm(initialFormState);
    setEditingAppointment(null);
    setIsFormModalOpen(false);
  };

  const openCreateModal = () => {
    setMessage(null);
    setForm(initialFormState);
    setEditingAppointment(null);
    setIsFormModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        teacherId: Number(form.teacherId),
        studentId: Number(form.studentId),
        title: form.title.trim(),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        status: form.status,
      };

      if (editingAppointment) {
        const { data } = await axios.put<AdminAppointmentMutationResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/appointments/${editingAppointment.id}`,
          payload,
          {
            withCredentials: true,
          },
        );
        return data;
      }

      const { data } = await axios.post<AdminAppointmentMutationResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/appointments`,
        payload,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      const wasEditing = Boolean(editingAppointment);
      resetForm();
      setMessage({
        type: "success",
        text: wasEditing ? "Időpont frissítve." : "Időpont létrehozva.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Az időpont mentése sikertelen."),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const { data } = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/appointments/${appointmentId}`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      resetForm();
      setMessage({ type: "success", text: "Időpont törölve." });
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Az időpont törlése sikertelen."),
      });
    },
  });

  const startEditing = (appointment: AdminAppointment) => {
    setEditingAppointment(appointment);
    setMessage(null);
    setForm({
      teacherId: String(appointment.teacherId),
      studentId: String(appointment.studentId),
      title: appointment.title || appointment.purpose || "",
      startTime: toLocalInputValue(appointment.startTime),
      endTime: toLocalInputValue(appointment.endTime),
      status: appointment.status,
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);

    if (!form.teacherId || !form.studentId || !form.title.trim()) {
      setMessage({
        type: "error",
        text: "Tanár, diák és cím megadása kötelező.",
      });
      return;
    }

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      setMessage({
        type: "error",
        text: "Érvényes kezdési és befejezési idő szükséges.",
      });
      return;
    }

    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (!editingAppointment) {
      return;
    }

    if (!window.confirm("Biztosan törölni szeretnéd ezt az időpontot?")) {
      return;
    }

    deleteMutation.mutate(editingAppointment.id);
  };

  return (
    <>
      <AdminPageHeader
        title="Időpontok kezelése"
        description="Minden tanár-diák foglalás áttekintése, létrehozása, állapotkezelése és törlése."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 transition ease-in-out cursor-pointer"
          >
            <Plus size={16} />
            Új időpont
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Foglalások</h2>
            <p className="text-sm text-faded">{appointments.length} időpont</p>
          </div>
        </div>

        {isAppointmentsLoading ? (
          <div className="flex min-h-[220px] sm:min-h-[320px] items-center justify-center">
            <Spinner />
          </div>
        ) : isAppointmentsError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Nem sikerült betölteni az időpontokat.
          </div>
        ) : appointments.length === 0 ? (
          <div className="min-h-[220px] sm:min-h-[320px] rounded-xl border border-dashed border-faded/30 flex items-center justify-center text-faded">
            Nincs időpont.
          </div>
        ) : (
          <div className="space-y-3 max-h-[820px] overflow-y-auto pr-1">
            {appointments.map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                onClick={() => startEditing(appointment)}
                className={`w-full rounded-xl border p-4 text-left transition ease-in-out cursor-pointer ${
                  editingAppointment?.id === appointment.id && isFormModalOpen
                    ? "border-accent bg-accent/5"
                    : "border-faded/20 bg-secondary/40 hover:bg-faded/10"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-lg leading-tight">
                      {appointment.title || "Névtelen időpont"}
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-faded">
                      <div className="inline-flex items-center gap-2">
                        <UserRound size={14} />
                        {appointment.student?.name ?? "Ismeretlen diák"} -{" "}
                        {appointment.teacher?.name ?? "Ismeretlen tanár"}
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <CalendarDays size={14} />
                        {formatDateTime(appointment.startTime)}
                      </div>
                      <div className="inline-flex items-center gap-2">
                        Tanterem: {appointment.classroom || "Nincs megadva"}
                      </div>
                    </div>
                  </div>
                  <AdminStatusBadge tone={statusTone[appointment.status]}>
                    {appointmentStatusLabel[appointment.status]}
                  </AdminStatusBadge>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <AdminFormModal
        isOpen={isFormModalOpen}
        onClose={resetForm}
        title={editingAppointment ? "Időpont szerkesztése" : "Új időpont"}
        description="Adminisztrátori foglaláskezelés"
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

        {isUsersLoading ? (
          <Spinner />
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-faded">Tanár</label>
                <select
                  value={form.teacherId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      teacherId: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                  required
                >
                  <option value="">Válassz tanárt...</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-faded">Diák / felhasználó</label>
                <select
                  value={form.studentId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      studentId: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                  required
                >
                  <option value="">Válassz felhasználót...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-faded">Cím / cél</label>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-faded">Kezdés</label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(event) => {
                    const start = new Date(event.target.value);
                    const nextEnd = Number.isNaN(start.getTime())
                      ? form.endTime
                      : toLocalInputValue(
                          new Date(
                            start.getTime() + 60 * 60 * 1000,
                          ).toISOString(),
                        );
                    setForm((current) => ({
                      ...current,
                      startTime: event.target.value,
                      endTime: current.endTime || nextEnd,
                    }));
                  }}
                  className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-faded">Befejezés</label>
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-faded">Állapot</label>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as AdminAppointment["status"],
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
              >
                <option value="pending">Függőben</option>
                <option value="confirmed">Megerősítve</option>
                <option value="cancelled">Lemondva</option>
                <option value="completed">Teljesítve</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent/80 transition ease-in-out disabled:bg-faded disabled:cursor-not-allowed cursor-pointer"
              >
                <Clock3 size={16} />
                {saveMutation.isPending
                  ? "Mentés..."
                  : editingAppointment
                    ? "Frissítés"
                    : "Létrehozás"}
              </button>
              {editingAppointment ? (
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
        )}
      </AdminFormModal>
    </>
  );
};

export default AppointmentsAdminPage;
