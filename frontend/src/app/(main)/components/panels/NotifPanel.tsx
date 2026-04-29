"use client";

import { Spinner } from "@/components/Spinner";
import { DataState } from "@/components/ui/DataState";
import { isReducedMotionEnabled } from "@/lib/motion";
import { GetNotificationsResponse } from "@/types";
import { useGSAP } from "@gsap/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import gsap from "gsap";
import { BellRing } from "lucide-react";
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

  useGSAP(() => {
    if (isReducedMotionEnabled() || isLoading || !data?.notifications?.length) {
      return;
    }

    gsap.fromTo(
      ".bell",
      { repeat: -1, rotate: 10, yoyo: true, duration: 0.5 },
      {
        repeat: -1,
        rotate: -10,
        yoyo: true,
        duration: 0.5,
      },
    );
  }, [isLoading, data]);

  if (isLoading) {
    return (
      <div className="grow flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <DataState
        icon={BellRing}
        title="Nem sikerült betölteni az értesítéseket."
        tone="error"
        compact
      />
    );
  }

  const notifications = data?.notifications ?? [];
  const latestNotification = notifications[0] ?? null;

  if (!notifications.length) {
    return (
      <Link
        href="/notifications"
        className="flex pt-4 cursor-pointer justify-center items-center grow flex-col gap-3 text-center text-sm rounded-xl px-4 relative hover:bg-faded/20 transition ease-in-out"
      >
        <BellRing className="size-16 text-faded" />
        <div className="text-faded">Nincs új értesítésed.</div>
      </Link>
    );
  }

  return (
    <Link
      href="/notifications"
      aria-label="Legfrissebb értesítés megnyitása"
      className="pt-4 cursor-pointer grow text-sm rounded-xl px-4 text-center relative hover:bg-faded/20 transition ease-in-out"
    >
      <BellRing className="size-20 mb-4 mx-auto bell" />
      <div className="size-4 bg-red-500 rounded-full absolute top-0 right-[30%]"></div>
      <div className="font-semibold text-lg leading-tight line-clamp-2 max-w-[18rem]">
        {latestNotification?.title ?? "Értesítések"}
      </div>
      <div className="text-faded mb-3 line-clamp-2">
        {latestNotification?.message || ""}
      </div>
    </Link>
  );
};
