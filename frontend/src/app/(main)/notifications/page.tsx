"use client";

import { Spinner } from "@/components/Spinner";
import { DataState } from "@/components/ui/DataState";
import {
  DeleteNotificationResponse,
  GetNotificationsResponse,
  MarkAllNotificationsAsReadResponse,
  MarkNotificationAsReadResponse,
  NotificationItem,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { BellRing, TriangleAlert } from "lucide-react";
import gsap from "gsap";
import { isReducedMotionEnabled } from "@/lib/motion";
import { useGSAP } from "@gsap/react";

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await axios.get<GetNotificationsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications?limit=100`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
  });

  useGSAP(() => {
    if (isReducedMotionEnabled() || isLoading) {
      return;
    }

    gsap.from(".page-content", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
  }, [isLoading]);

  const { mutate: markAsRead, isPending: isMarkingRead } = useMutation({
    mutationFn: async (notificationId: number) => {
      const { data } = await axios.patch<MarkNotificationAsReadResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/read`,
        {},
        {
          withCredentials: true,
        },
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
      queryClient.invalidateQueries({ queryKey: ["notifications", "panel"] });
    },
  });

  const { mutate: markAllRead, isPending: isMarkingAllRead } = useMutation({
    mutationFn: async () => {
      const { data } = await axios.patch<MarkAllNotificationsAsReadResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/read-all`,
        {},
        {
          withCredentials: true,
        },
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
      queryClient.invalidateQueries({ queryKey: ["notifications", "panel"] });
    },
  });

  const { mutate: deleteNotification, isPending: isDeleting } = useMutation({
    mutationFn: async (notificationId: number) => {
      const { data } = await axios.delete<DeleteNotificationResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
      queryClient.invalidateQueries({ queryKey: ["notifications", "panel"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-screen">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <main className="page-shell page-main">
        <DataState
          icon={TriangleAlert}
          title="Nem sikerült betölteni az értesítéseket."
          tone="error"
        />
      </main>
    );
  }

  const notifications = data?.notifications ?? [];

  return (
    <main className="page-shell page-main page-content">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Értesítések</h1>
          <p className="text-faded mt-1">
            Kövesd az események és időpontok frissítéseit.
          </p>
        </div>
        <button
          onClick={() => markAllRead()}
          disabled={isMarkingAllRead || notifications.length === 0}
          className="px-3 py-2 rounded-lg border border-faded/20 bg-secondary/70 hover:bg-secondary transition ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMarkingAllRead ? "Feldolgozás..." : "Összes olvasottra"}
        </button>
      </div>

      {notifications.length === 0 ? (
        <DataState
          icon={BellRing}
          title="Jelenleg nincs értesítésed."
          description="Az események és időpontok frissítései itt jelennek meg."
        />
      ) : (
        <section className="space-y-3">
          {notifications.map((notification: NotificationItem) => (
            <article
              key={notification.id}
              className={`card-box h-auto! p-4 border ${
                notification.isRead ? "border-faded/10" : "border-accent/30"
              }`}
            >
              <div className="flex items-start max-md:flex-col justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-lg leading-tight">
                      {notification.title}
                    </h2>
                    {!notification.isRead && (
                      <span className="text-[10px] rounded-full bg-accent/20 text-accent px-2 py-0.5">
                        Új
                      </span>
                    )}
                  </div>
                  <p className="text-faded text-sm whitespace-pre-wrap">
                    {notification.message}
                  </p>
                  <div className="text-xs text-faded mt-2">
                    {new Date(notification.createdAt).toLocaleString("hu-HU")}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      disabled={isMarkingRead}
                      className="text-xs px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 disabled:opacity-60"
                    >
                      Olvasott
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    disabled={isDeleting}
                    className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 disabled:opacity-60"
                  >
                    Törlés
                  </button>
                  {notification.url && (
                    <Link
                      href={notification.url}
                      className="text-xs px-2 py-1 rounded-lg bg-secondary/70 border border-faded/20 hover:bg-secondary"
                    >
                      Megnyitás
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default NotificationsPage;
