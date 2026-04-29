import axios from "axios";

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error ??
      fallbackMessage
    );
  }

  return fallbackMessage;
};
