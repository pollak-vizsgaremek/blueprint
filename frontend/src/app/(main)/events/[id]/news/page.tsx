"use client";

import {
  CreateEventNewsResponse,
  DeleteEventNewsResponse,
  GetEventNewsResponse,
  UpdateEventNewsResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, useState } from "react";
import { useEventDetail } from "../../../../../contexts/EventDetailContext";
import { isReducedMotionEnabled } from "@/lib/motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const EventNewsTabPage = () => {
  const { eventId } = useEventDetail();
  const queryClient = useQueryClient();
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);

  const {
    data: eventNewsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["event-news", eventId],
    enabled: Number.isFinite(eventId),
    queryFn: async () => {
      const { data } = await axios.get<GetEventNewsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/news`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
  });

  useGSAP(() => {
    if (isReducedMotionEnabled()) {
      return;
    }

    gsap.from(".page-content", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
  }, []);

  const { mutate: createEventNews, isPending: isCreateEventNewsPending } =
    useMutation({
      mutationFn: async () => {
        return axios.post<CreateEventNewsResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/news`,
          {
            title: newsTitle.trim(),
            content: newsContent.trim(),
            isPublished: publishNow,
          },
          {
            withCredentials: true,
          },
        );
      },
      onSuccess: () => {
        setNewsTitle("");
        setNewsContent("");
        setPublishNow(false);
        setEditingDraftId(null);
        queryClient.invalidateQueries({ queryKey: ["event-news", eventId] });
      },
    });

  const { mutate: updateEventNews, isPending: isUpdateEventNewsPending } =
    useMutation({
      mutationFn: async ({
        newsId,
        isPublished,
        title,
        content,
      }: {
        newsId: number;
        isPublished: boolean;
        title?: string;
        content?: string;
      }) => {
        return axios.put<UpdateEventNewsResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/news/${newsId}`,
          {
            isPublished,
            ...(title !== undefined ? { title } : {}),
            ...(content !== undefined ? { content } : {}),
          },
          {
            withCredentials: true,
          },
        );
      },
      onSuccess: () => {
        setEditingDraftId(null);
        setNewsTitle("");
        setNewsContent("");
        setPublishNow(false);
        queryClient.invalidateQueries({ queryKey: ["event-news", eventId] });
      },
    });

  const { mutate: deleteEventNews, isPending: isDeleteEventNewsPending } =
    useMutation({
      mutationFn: async (newsId: number) => {
        return axios.delete<DeleteEventNewsResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/news/${newsId}`,
          {
            withCredentials: true,
          },
        );
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["event-news", eventId] });
      },
    });

  const publishedNews = useMemo(
    () => (eventNewsData?.news ?? []).filter((news) => news.isPublished),
    [eventNewsData],
  );
  const draftNews = useMemo(
    () => (eventNewsData?.news ?? []).filter((news) => !news.isPublished),
    [eventNewsData],
  );

  const canSubmitNews =
    newsTitle.trim().length > 0 &&
    newsContent.trim().length > 0 &&
    !isCreateEventNewsPending;
  const canUpdateDraft =
    editingDraftId !== null &&
    newsTitle.trim().length > 0 &&
    newsContent.trim().length > 0 &&
    !isUpdateEventNewsPending;
  const isNewsManagementPending =
    isCreateEventNewsPending ||
    isUpdateEventNewsPending ||
    isDeleteEventNewsPending;

  return (
    <div className="mt-4 flex grow flex-col overflow-y-auto px-4 pb-2 pt-2 page-content sm:mt-5 sm:px-6 lg:px-10">
      {isLoading ? (
        <div className="text-faded">Betöltés...</div>
      ) : isError ? (
        <div className="text-red-600">
          Nem sikerült betölteni az esemény híreit.
        </div>
      ) : (
        <>
          {eventNewsData?.canManageNews && (
            <div className="mb-5 rounded-xl border border-faded/40 bg-white/30 p-3">
              <div className="text-lg mb-2">
                {editingDraftId ? "Vázlat szerkesztése" : "Új hír létrehozása"}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  maxLength={200}
                  placeholder="Hír címe"
                  className="w-full border border-faded/60 focus:outline-2 focus:outline-accent rounded-xl px-3 py-2 bg-white/20"
                />
                <textarea
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  maxLength={4000}
                  rows={4}
                  placeholder="Hír tartalma..."
                  className="w-full border border-faded/60 focus:outline-2 focus:outline-accent rounded-xl px-3 py-2 bg-white/20"
                />
                <div className="flex items-center justify-between gap-3 border border-faded/20 rounded-xl px-3 py-2 bg-secondary/40">
                  <div className="text-sm text-faded">Azonnal publikálás</div>
                  <button
                    type="button"
                    onClick={() => setPublishNow((prev) => !prev)}
                    className="shrink-0 w-14 h-8 rounded-full border border-faded/20 bg-secondary/80 p-1 cursor-pointer"
                  >
                    <span
                      className={`block h-6 w-6 rounded-full transition ease-in-out ${
                        publishNow
                          ? "translate-x-6 bg-accent"
                          : "translate-x-0 bg-faded/60"
                      }`}
                    />
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (editingDraftId) {
                      updateEventNews({
                        newsId: editingDraftId,
                        isPublished: publishNow,
                        title: newsTitle.trim(),
                        content: newsContent.trim(),
                      });
                      return;
                    }

                    createEventNews();
                  }}
                  disabled={editingDraftId ? !canUpdateDraft : !canSubmitNews}
                  className="bg-accent text-white px-4 py-2 rounded-xl disabled:bg-faded disabled:cursor-not-allowed self-start"
                >
                  {isCreateEventNewsPending || isUpdateEventNewsPending
                    ? "Mentés..."
                    : editingDraftId
                      ? "Vázlat frissítése"
                      : "Mentés"}
                </button>
              </div>
            </div>
          )}

          {eventNewsData?.canManageNews && draftNews.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-faded mb-2">Vázlatok</div>
              <div className="space-y-2">
                {draftNews.map((news) => (
                  <div
                    key={news.id}
                    className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2"
                  >
                    <div className="font-semibold mb-1">{news.title}</div>
                    <div className="text-sm text-faded whitespace-pre-wrap">
                      {news.content}
                    </div>
                    <div className="text-xs text-faded mt-1">
                      Utoljára frissítve:{" "}
                      {new Date(news.updatedAt).toLocaleString("hu-HU")}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setEditingDraftId(news.id);
                          setNewsTitle(news.title);
                          setNewsContent(news.content);
                          setPublishNow(false);
                        }}
                        disabled={isNewsManagementPending}
                        className="text-xs px-2 py-1 rounded-lg bg-sky-100 text-sky-700"
                      >
                        Szerkesztés
                      </button>
                      <button
                        onClick={() =>
                          updateEventNews({
                            newsId: news.id,
                            isPublished: true,
                          })
                        }
                        disabled={isNewsManagementPending}
                        className="text-xs px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700"
                      >
                        Publikálás
                      </button>
                      <button
                        onClick={() => deleteEventNews(news.id)}
                        disabled={isNewsManagementPending}
                        className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700"
                      >
                        Törlés
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {publishedNews.length ? (
              publishedNews.map((news) => (
                <div
                  key={news.id}
                  className="rounded-xl border border-faded/50 bg-white/40 px-3 py-2"
                >
                  <div className="font-semibold mb-1">{news.title}</div>
                  <div className="text-xs text-faded mb-2">
                    {new Date(
                      news.publishedAt || news.createdAt,
                    ).toLocaleString("hu-HU")}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {news.content}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-faded text-xl text-center mt-10">
                Ehhez az eseményhez még nincs publikált hír.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EventNewsTabPage;
