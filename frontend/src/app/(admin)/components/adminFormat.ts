import { Appointment, Registration, User } from "@/types";

export const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

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

export const toLocalInputValue = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

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

export const roleLabel: Record<User["role"], string> = {
  admin: "Admin",
  teacher: "Tanár",
  user: "Felhasználó",
};

export const userStatusLabel: Record<string, string> = {
  active: "Aktív",
  inactive: "Inaktív",
  banned: "Tiltott",
};

export const appointmentStatusLabel: Record<Appointment["status"], string> = {
  pending: "Függőben",
  confirmed: "Megerősítve",
  cancelled: "Lemondva",
  completed: "Teljesítve",
};

export const registrationStatusLabel: Record<Registration["status"], string> = {
  registered: "Jelentkezve",
  cancelled: "Lemondva",
  attended: "Részt vett",
};
