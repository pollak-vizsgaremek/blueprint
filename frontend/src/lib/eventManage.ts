import { EventWithRegistrationInfo, User } from "@/types";
import { toLocalDateTimeInput } from "@/lib/dateFormat";

export type EventEditFormState = {
  name: string;
  description: string;
  location: string;
  classroom: string;
  date: string;
  maxParticipants: string;
  updatedBy: string;
};

export const createEventEditFormState = (
  event?: EventWithRegistrationInfo | null,
): EventEditFormState => {
  if (!event) {
    return {
      name: "",
      description: "",
      location: "",
      classroom: "",
      date: "",
      maxParticipants: "",
      updatedBy: "",
    };
  }

  return {
    name: event.name,
    description: event.description,
    location: event.location,
    classroom: event.classroom,
    date: toLocalDateTimeInput(event.date),
    maxParticipants: event.maxParticipants ? String(event.maxParticipants) : "",
    updatedBy: event.updatedBy ? String(event.updatedBy) : "",
  };
};

export const canManageEvent = (
  user: User | null,
  event: EventWithRegistrationInfo | null,
) => {
  if (!user || !event) {
    return false;
  }

  return user.role === "admin" || event.updatedBy === user.id;
};

export const validateEventEditForm = (form: EventEditFormState) => {
  if (
    !form.name.trim() ||
    !form.description.trim() ||
    !form.location.trim() ||
    !form.classroom.trim() ||
    !form.date ||
    !form.updatedBy
  ) {
    return "Minden kötelező mezőt tölts ki.";
  }

  if (Number.isNaN(new Date(form.date).getTime())) {
    return "Érvénytelen dátum.";
  }

  if (
    form.maxParticipants.trim() &&
    (!Number.isInteger(Number(form.maxParticipants)) ||
      Number(form.maxParticipants) <= 0)
  ) {
    return "A maximális létszám pozitív egész szám legyen.";
  }

  return null;
};

export const buildEventUpdatePayload = (form: EventEditFormState) => {
  const payload: Record<string, string | number | null> = {
    name: form.name.trim(),
    description: form.description.trim(),
    location: form.location.trim(),
    classroom: form.classroom.trim(),
    date: new Date(form.date).toISOString(),
    updatedBy: Number(form.updatedBy),
  };

  if (form.maxParticipants.trim()) {
    payload.maxParticipants = Number(form.maxParticipants.trim());
  } else {
    payload.maxParticipants = null;
  }

  return payload;
};
