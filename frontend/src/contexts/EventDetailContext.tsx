"use client";

import { GetAllEventsResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { createContext, useContext, useMemo } from "react";

type EventDetailContextValue = {
  eventId: number;
  event: GetAllEventsResponse[number] | null;
  isLoading: boolean;
  isError: boolean;
};

const EventDetailContext = createContext<EventDetailContextValue | undefined>(
  undefined,
);

export const EventDetailProvider = ({
  eventId,
  children,
}: {
  eventId: number;
  children: React.ReactNode;
}) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", "detail", eventId],
    enabled: Number.isFinite(eventId),
    queryFn: async () => {
      const { data } = await axios.get<GetAllEventsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
  });

  const event = useMemo(
    () => data?.find((candidate) => candidate.id === eventId) ?? null,
    [data, eventId],
  );

  return (
    <EventDetailContext.Provider value={{ eventId, event, isLoading, isError }}>
      {children}
    </EventDetailContext.Provider>
  );
};

export const useEventDetail = () => {
  const context = useContext(EventDetailContext);

  if (!context) {
    throw new Error("useEventDetail must be used within EventDetailProvider");
  }

  return context;
};
