"use client";

import { Spinner } from "@/components/Spinner";
import {
  AdminTeacherAvailabilityListResponse,
  GetAllUsersResponse,
  TeacherAvailability,
  TeacherAvailabilityMutationResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CalendarRange, Clock3, Plus, Trash2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { extractApiErrorMessage } from "@/lib/errors";
import { AdminFormModal } from "../../components/AdminFormModal";
import { AdminPageHeader } from "../../components/AdminPageHeader";

type AvailabilityFormState = {
  teacherId: string;
  dayOfWeek: string;
  startMinutes: string;
  endMinutes: string;
};

const initialFormState: AvailabilityFormState = {
  teacherId: "",
  dayOfWeek: "1",
  startMinutes: "540",
  endMinutes: "600",
};

const dayLabels: Record<number, string> = {
  1: "Hétfő",
  2: "Kedd",
  3: "Szerda",
  4: "Csütörtök",
  5: "Péntek",
  6: "Szombat",
  7: "Vasárnap",
};

const toTimeLabel = (minutes: number) => {
  if (!Number.isFinite(minutes)) {
    return "00:00";
  }

  const safe = Math.max(0, Math.min(1439, minutes));
  const h = String(Math.floor(safe / 60)).padStart(2, "0");
  const m = String(safe % 60).padStart(2, "0");
  return `${h}:${m}`;
};

const toMinutes = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) {
    return Number.NaN;
  }

  return h * 60 + m;
};

const toTimeInputValue = (minutes: number) => {
  return toTimeLabel(minutes);
};

const TeacherAvailabilityAdminPage = () => {
  const queryClient = useQueryClient();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [form, setForm] = useState<AvailabilityFormState>(initialFormState);
  const [editingAvailability, setEditingAvailability] =
    useState<TeacherAvailability | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  const teachers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.role === "teacher" && (user.status ?? "active") === "active",
      ),
    [users],
  );

  const activeTeacherId = selectedTeacherId || form.teacherId;
  const parsedTeacherId = parseInt(activeTeacherId, 10);
  const {
    data: availabilityData,
    isLoading: isAvailabilityLoading,
    isError: isAvailabilityError,
  } = useQuery({
    queryKey: ["admin-teacher-availability", parsedTeacherId],
    enabled: !Number.isNaN(parsedTeacherId),
    queryFn: async () => {
      const { data } = await axios.get<AdminTeacherAvailabilityListResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/teacher-availability/${parsedTeacherId}`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const availability = useMemo(
    () => availabilityData?.availability ?? [],
    [availabilityData],
  );

  const resetForm = () => {
    setEditingAvailability(null);
    setForm({
      ...initialFormState,
      teacherId: selectedTeacherId || "",
    });
    setIsFormModalOpen(false);
  };

  const openCreateModal = () => {
    setMessage(null);
    setEditingAvailability(null);
    setForm({
      ...initialFormState,
      teacherId: selectedTeacherId || "",
    });
    setIsFormModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        teacherId: Number(form.teacherId),
        dayOfWeek: Number(form.dayOfWeek),
        startMinutes: Number(form.startMinutes),
        endMinutes: Number(form.endMinutes),
      };

      if (editingAvailability) {
        const { data } = await axios.put<TeacherAvailabilityMutationResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/teacher-availability/${editingAvailability.id}`,
          payload,
          {
            withCredentials: true,
          },
        );
        return data;
      }

      const { data } = await axios.post<TeacherAvailabilityMutationResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/teacher-availability`,
        payload,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      const wasEditing = Boolean(editingAvailability);
      resetForm();
      setMessage({
        type: "success",
        text: wasEditing ? "Elérhetőség frissítve." : "Elérhetőség létrehozva.",
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-teacher-availability"],
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-availability"] });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: extractApiErrorMessage(
          error,
          "Az elérhetőség mentése sikertelen.",
        ),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (availabilityId: number) => {
      const { data } = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/teacher-availability/${availabilityId}`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      resetForm();
      setMessage({ type: "success", text: "Elérhetőség törölve." });
      queryClient.invalidateQueries({
        queryKey: ["admin-teacher-availability"],
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-availability"] });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: extractApiErrorMessage(
          error,
          "Az elérhetőség törlése sikertelen.",
        ),
      });
    },
  });

  const startEditing = (item: TeacherAvailability) => {
    setMessage(null);
    setEditingAvailability(item);
    setForm({
      teacherId: String(item.teacherId),
      dayOfWeek: String(item.dayOfWeek),
      startMinutes: String(item.startMinutes),
      endMinutes: String(item.endMinutes),
    });
    if (!selectedTeacherId) {
      setSelectedTeacherId(String(item.teacherId));
    }
    setIsFormModalOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const teacherId = Number(form.teacherId);
    const dayOfWeek = Number(form.dayOfWeek);
    const startMinutes = Number(form.startMinutes);
    const endMinutes = Number(form.endMinutes);

    if (
      Number.isNaN(teacherId) ||
      Number.isNaN(dayOfWeek) ||
      Number.isNaN(startMinutes) ||
      Number.isNaN(endMinutes)
    ) {
      setMessage({ type: "error", text: "Minden mező kitöltése kötelező." });
      return;
    }

    if (dayOfWeek < 1 || dayOfWeek > 7) {
      setMessage({ type: "error", text: "A nap értéke 1 és 7 közé essen." });
      return;
    }

    if (startMinutes < 0 || endMinutes > 1439 || endMinutes <= startMinutes) {
      setMessage({
        type: "error",
        text: "Érvényes időtartam szükséges (befejezés > kezdés).",
      });
      return;
    }

    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (!editingAvailability) {
      return;
    }

    if (
      !window.confirm("Biztosan törölni szeretnéd ezt az elérhetőségi sávot?")
    ) {
      return;
    }

    deleteMutation.mutate(editingAvailability.id);
  };

  return (
    <>
      <AdminPageHeader
        title="Tanári elérhetőségek"
        description="Heti foglalható idősávok kezelése tanáronként. Az időpontfoglalás csak ezekre a sávokra lehetséges."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            disabled={!selectedTeacherId}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 transition ease-in-out cursor-pointer disabled:bg-faded disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Új sáv
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
        <div className="grid grid-cols-1 gap-3 mb-4 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-xl font-semibold">Elérhetőségi sávok</h2>
            <p className="text-sm text-faded">
              Válassz tanárt, majd kezeld a heti idősávokat.
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-faded">Tanár</label>
            <select
              value={selectedTeacherId}
              onChange={(event) => {
                setSelectedTeacherId(event.target.value);
                setMessage(null);
              }}
              className="w-full md:min-w-[280px] rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
            >
              <option value="">Válassz tanárt...</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {isUsersLoading ? (
          <div className="flex min-h-[180px] sm:min-h-[220px] items-center justify-center">
            <Spinner />
          </div>
        ) : !selectedTeacherId ? (
          <div className="min-h-[180px] sm:min-h-[220px] rounded-xl border border-dashed border-faded/30 flex items-center justify-center text-faded">
            Először válassz tanárt.
          </div>
        ) : isAvailabilityLoading ? (
          <div className="flex min-h-[180px] sm:min-h-[220px] items-center justify-center">
            <Spinner />
          </div>
        ) : isAvailabilityError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Nem sikerült betölteni az elérhetőségi sávokat.
          </div>
        ) : availability.length === 0 ? (
          <div className="min-h-[180px] sm:min-h-[220px] rounded-xl border border-dashed border-faded/30 flex items-center justify-center text-faded">
            Ennek a tanárnak még nincs elérhetőségi sávja.
          </div>
        ) : (
          <div className="space-y-3 max-h-[820px] overflow-y-auto pr-1">
            {availability.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => startEditing(item)}
                className={`w-full rounded-xl border p-4 text-left transition ease-in-out cursor-pointer ${
                  editingAvailability?.id === item.id && isFormModalOpen
                    ? "border-accent bg-accent/5"
                    : "border-faded/20 bg-secondary/40 hover:bg-faded/10"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-semibold text-lg leading-tight inline-flex items-center gap-2">
                      <CalendarRange size={18} />
                      {dayLabels[item.dayOfWeek]}
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-faded">
                      <div className="inline-flex items-center gap-2">
                        <Clock3 size={14} />
                        {toTimeLabel(item.startMinutes)} -{" "}
                        {toTimeLabel(item.endMinutes)}
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <UserRound size={14} />
                        Tanár ID: {item.teacherId}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <AdminFormModal
        isOpen={isFormModalOpen}
        onClose={resetForm}
        title={editingAvailability ? "Sáv szerkesztése" : "Új sáv"}
        description="Tanári heti elérhetőség"
        maxWidthClassName="max-w-2xl"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-faded">Nap</label>
              <select
                value={form.dayOfWeek}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dayOfWeek: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                required
              >
                {Object.entries(dayLabels).map(([day, label]) => (
                  <option key={day} value={day}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-faded">Kezdés</label>
              <input
                type="time"
                value={toTimeInputValue(Number(form.startMinutes))}
                onChange={(event) => {
                  const parsed = toMinutes(event.target.value);
                  if (Number.isNaN(parsed)) {
                    return;
                  }

                  setForm((current) => ({
                    ...current,
                    startMinutes: String(parsed),
                  }));
                }}
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-faded">Befejezés</label>
              <input
                type="time"
                value={toTimeInputValue(Number(form.endMinutes))}
                onChange={(event) => {
                  const parsed = toMinutes(event.target.value);
                  if (Number.isNaN(parsed)) {
                    return;
                  }

                  setForm((current) => ({
                    ...current,
                    endMinutes: String(parsed),
                  }));
                }}
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                required
              />
            </div>
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
                : editingAvailability
                  ? "Frissítés"
                  : "Létrehozás"}
            </button>

            {editingAvailability ? (
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

export default TeacherAvailabilityAdminPage;
