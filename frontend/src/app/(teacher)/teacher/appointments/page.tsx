"use client";

import { Spinner } from "@/components/Spinner";
import { DataState } from "@/components/ui/DataState";
import {
  TeacherAppointment,
  TeacherAppointmentMutationResponse,
  TeacherAppointmentsResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  CalendarDays,
  CalendarX2,
  Clock3,
  Pencil,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { TeacherFormModal } from "../../components/TeacherFormModal";
import { TeacherPageHeader } from "../../components/TeacherPageHeader";

const statusLabel: Record<TeacherAppointment["status"], string> = {
  pending: "Függőben",
  confirmed: "Megerősítve",
  cancelled: "Lemondva",
  completed: "Teljesítve",
};

const statusBadgeClasses: Record<TeacherAppointment["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-sky-100 text-sky-700",
};

const formatDateTime = (value: string) => {
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

const TeacherAppointmentsPage = () => {
  const queryClient = useQueryClient();
  const [editingAppointment, setEditingAppointment] =
    useState<TeacherAppointment | null>(null);
  const [status, setStatus] = useState<TeacherAppointment["status"]>("pending");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    data: appointmentsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["teacher-appointments"],
    queryFn: async () => {
      const { data } = await axios.get<TeacherAppointmentsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher/appointments`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const appointments = appointmentsData?.appointments ?? [];

  const resetForm = () => {
    setEditingAppointment(null);
    setStatus("pending");
    setIsFormModalOpen(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editingAppointment) {
        throw new Error("No appointment selected");
      }

      const { data } = await axios.put<TeacherAppointmentMutationResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher/appointments/${editingAppointment.id}`,
        {
          status,
        },
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      resetForm();
      setMessage({ type: "success", text: "Időpont állapota frissítve." });
      queryClient.invalidateQueries({ queryKey: ["teacher-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Az időpont frissítése sikertelen."),
      });
    },
  });

  const startEditing = (appointment: TeacherAppointment) => {
    setMessage(null);
    setEditingAppointment(appointment);
    setStatus(appointment.status);
    setIsFormModalOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  return (
    <>
      <TeacherPageHeader
        title="Időpontjaim"
        description="A hozzád rendelt időpontok listája. Tanárként az állapotot módosíthatod."
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
          <h2 className="text-xl font-semibold">Foglalások</h2>
          <span className="text-sm text-faded">
            {appointments.length} időpont
          </span>
        </div>

        {isLoading ? (
          <div className="flex min-h-[220px] sm:min-h-[320px] items-center justify-center">
            <Spinner />
          </div>
        ) : isError ? (
          <DataState
            icon={TriangleAlert}
            title="Nem sikerült betölteni az időpontokat."
            tone="error"
          />
        ) : appointments.length === 0 ? (
          <DataState icon={CalendarX2} title="Nincs hozzád tartozó időpont." />
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
                      {appointment.title || appointment.purpose || "Időpont"}
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-faded">
                      <div className="inline-flex items-center gap-2">
                        <UserRound size={14} />
                        {appointment.student?.name ?? "Ismeretlen diák"}
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <CalendarDays size={14} />
                        {formatDateTime(appointment.startTime)} -{" "}
                        {formatDateTime(appointment.endTime)}
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <Clock3 size={14} />
                        Létrehozva: {formatDateTime(appointment.createdAt)}
                      </div>
                      <div className="inline-flex items-center gap-2">
                        Tanterem: {appointment.classroom || "Nincs megadva"}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses[appointment.status]}`}
                  >
                    {statusLabel[appointment.status]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <TeacherFormModal
        isOpen={isFormModalOpen}
        onClose={resetForm}
        title="Időpont állapot módosítása"
        description={
          editingAppointment?.title || editingAppointment?.purpose || "Időpont"
        }
        maxWidthClassName="max-w-xl"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm text-faded">Állapot</label>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as TeacherAppointment["status"])
              }
              className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
            >
              <option value="pending">Függőben</option>
              <option value="confirmed">Megerősítve</option>
              <option value="cancelled">Lemondva</option>
              <option value="completed">Teljesítve</option>
            </select>
          </div>

          <div className="rounded-xl border border-faded/20 bg-secondary/40 p-3 text-sm text-faded">
            <div>Diák: {editingAppointment?.student?.name ?? "-"}</div>
            <div>
              Kezdés:{" "}
              {editingAppointment
                ? formatDateTime(editingAppointment.startTime)
                : "-"}
            </div>
            <div>
              Befejezés:{" "}
              {editingAppointment
                ? formatDateTime(editingAppointment.endTime)
                : "-"}
            </div>
            <div>
              Tanterem: {editingAppointment?.classroom || "Nincs megadva"}
            </div>
          </div>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent/80 transition ease-in-out disabled:bg-faded disabled:cursor-not-allowed cursor-pointer"
          >
            <Pencil size={16} />
            {saveMutation.isPending ? "Mentés..." : "Állapot frissítése"}
          </button>
        </form>
      </TeacherFormModal>
    </>
  );
};

export default TeacherAppointmentsPage;
