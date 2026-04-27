"use client";

import { Spinner } from "@/components/Spinner";
import { usePopupModal } from "@/contexts/PopupModalContext";
import {
  GetTeacherAvailabilityResponse,
  TeacherAvailability,
  TeacherAvailabilityMutationResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CalendarRange, Clock3, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { TeacherFormModal } from "../../components/TeacherFormModal";
import { TeacherPageHeader } from "../../components/TeacherPageHeader";

type AvailabilityFormState = {
  dayOfWeek: string;
  startMinutes: string;
  endMinutes: string;
};

const initialFormState: AvailabilityFormState = {
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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ?? error.response?.data?.error ?? fallback
    );
  }

  return fallback;
};

const TeacherAvailabilityPage = () => {
  const queryClient = useQueryClient();
  const { showConfirm } = usePopupModal();
  const [form, setForm] = useState<AvailabilityFormState>(initialFormState);
  const [editingAvailability, setEditingAvailability] =
    useState<TeacherAvailability | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    data: availabilityData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["teacher-own-availability"],
    queryFn: async () => {
      const { data } = await axios.get<GetTeacherAvailabilityResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher/availability`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const availability = availabilityData?.availability ?? [];

  const resetForm = () => {
    setEditingAvailability(null);
    setForm(initialFormState);
    setIsFormModalOpen(false);
  };

  const openCreateModal = () => {
    setMessage(null);
    setEditingAvailability(null);
    setForm(initialFormState);
    setIsFormModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        dayOfWeek: Number(form.dayOfWeek),
        startMinutes: Number(form.startMinutes),
        endMinutes: Number(form.endMinutes),
      };

      if (editingAvailability) {
        const { data } = await axios.put<TeacherAvailabilityMutationResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/teacher/availability/${editingAvailability.id}`,
          payload,
          { withCredentials: true },
        );
        return data;
      }

      const { data } = await axios.post<TeacherAvailabilityMutationResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher/availability`,
        payload,
        { withCredentials: true },
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
      queryClient.invalidateQueries({ queryKey: ["teacher-own-availability"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-availability"] });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Az elérhetőség mentése sikertelen."),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (availabilityId: number) => {
      const { data } = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher/availability/${availabilityId}`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      resetForm();
      setMessage({ type: "success", text: "Elérhetőség törölve." });
      queryClient.invalidateQueries({ queryKey: ["teacher-own-availability"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-availability"] });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Az elérhetőség törlése sikertelen."),
      });
    },
  });

  const startEditing = (item: TeacherAvailability) => {
    setMessage(null);
    setEditingAvailability(item);
    setForm({
      dayOfWeek: String(item.dayOfWeek),
      startMinutes: String(item.startMinutes),
      endMinutes: String(item.endMinutes),
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const dayOfWeek = Number(form.dayOfWeek);
    const startMinutes = Number(form.startMinutes);
    const endMinutes = Number(form.endMinutes);

    if (
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

  const handleDelete = async () => {
    if (!editingAvailability) {
      return;
    }

    const confirmed = await showConfirm({
      message: "Biztosan törölni szeretnéd ezt az elérhetőségi sávot?",
      tone: "warning",
      confirmText: "Törlés",
      cancelText: "Mégse",
    });

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(editingAvailability.id);
  };

  return (
    <>
      <TeacherPageHeader
        title="Elérhetőségeim"
        description="A heti foglalható idősávok kezelése. A diákok csak ezeket a sávokat foglalhatják."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 transition ease-in-out cursor-pointer"
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
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Nem sikerült betölteni az elérhetőségi sávokat.
          </div>
        ) : availability.length === 0 ? (
          <div className="h-48 rounded-xl border border-dashed border-faded/30 flex items-center justify-center text-faded">
            Még nincs rögzített elérhetőségi sávod.
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
                <div className="font-semibold text-lg leading-tight inline-flex items-center gap-2">
                  <CalendarRange size={18} />
                  {dayLabels[item.dayOfWeek]}
                </div>
                <div className="mt-2 text-sm text-faded inline-flex items-center gap-2">
                  <Clock3 size={14} />
                  {toTimeLabel(item.startMinutes)} -{" "}
                  {toTimeLabel(item.endMinutes)}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <TeacherFormModal
        isOpen={isFormModalOpen}
        onClose={resetForm}
        title={editingAvailability ? "Sáv szerkesztése" : "Új sáv"}
        description="Heti elérhetőségi idősáv"
        maxWidthClassName="max-w-2xl"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
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
                value={toTimeLabel(Number(form.startMinutes))}
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
                value={toTimeLabel(Number(form.endMinutes))}
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
      </TeacherFormModal>
    </>
  );
};

export default TeacherAvailabilityPage;
