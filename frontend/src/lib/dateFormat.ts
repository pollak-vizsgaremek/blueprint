const UNKNOWN_DATE_LABEL = "Ismeretlen";

export const formatDateTimeHu = (value?: string | null) => {
  if (!value) return UNKNOWN_DATE_LABEL;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return UNKNOWN_DATE_LABEL;

  return date.toLocaleString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateOnlyHu = (value?: string | null) => {
  if (!value) return UNKNOWN_DATE_LABEL;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return UNKNOWN_DATE_LABEL;

  return date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatDateTimeHuCompact = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const toLocalDateTimeInput = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
