"use client";

import { Spinner } from "@/components/Spinner";
import { GetNotificationsResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { BellRing, Circle } from "lucide-react";
import Link from "next/link";

export const NotifPanel = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications", "panel"],
    queryFn: async () => {
      const { data } = await axios.get<GetNotificationsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications?limit=3`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grow flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grow flex items-center justify-center text-red-600 text-sm text-center px-2">
        Nem sikerült betölteni az értesítéseket.
      </div>
    );
  }

  const notifications = data?.notifications ?? [];

  if (!notifications.length) {
    return (
      <Link
        href="/app/notifications"
        className="flex pt-4 cursor-pointer justify-center items-center grow flex-col gap-3 text-center text-sm rounded-xl px-4 relative hover:bg-faded/20 transition ease-in-out"
      >
        <BellRing className="size-16 text-faded" />
        <div className="text-faded">Nincs új értesítésed.</div>
      </Link>
    );
  }

  return (
    <Link
      href="/app/notifications"
      className="flex pt-2 cursor-pointer grow flex-col gap-2 text-sm rounded-xl px-2 relative hover:bg-faded/20 transition ease-in-out"
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="rounded-xl border border-faded/20 bg-white/30 p-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold text-sm leading-tight">
              {notification.title}
            </div>
            {!notification.isRead && (
              <Circle
                color="red"
                fill="red"
                size={10}
                className="shrink-0 mt-1"
              />
            )}
          </div>
          <div className="text-faded text-xs mt-1 line-clamp-2">
            {notification.message}
          </div>
        </div>
      ))}
    </Link>
  );
};
