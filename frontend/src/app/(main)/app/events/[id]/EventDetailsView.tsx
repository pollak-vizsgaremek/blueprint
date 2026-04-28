"use client";

import { Spinner } from "@/components/Spinner";
import {
  CreateEventCommentResponse,
  CreateEventNewsResponse,
  DeleteEventCommentResponse,
  DeleteEventNewsResponse,
  EventComment,
  GetAllEventsResponse,
  GetEventCommentsResponse,
  GetEventNewsResponse,
  UpdateEventNewsResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { EventNavigationMap } from "@/components/navigation/EventNavigationMap";
import Link from "next/link";
import { useMemo, useState } from "react";

export type EventTab = "details" | "news" | "place" | "discussion";

const tabs: Array<{ key: EventTab; label: string }> = [
  { key: "details", label: "Részletek" },
  { key: "news", label: "Hírek" },
  { key: "place", label: "Helyszín" },
  { key: "discussion", label: "Beszélgetés" },
];

export const EventDetailsView = ({
  eventId,
  activeTab,
}: {
  eventId: number;
  activeTab: EventTab;
}) => {
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState("");
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);

  const {
    data: event,
    isLoading: isEventLoading,
    isError: isEventError,
  } = useQuery({
    queryKey: ["events", "detail", eventId],
    enabled: Number.isFinite(eventId),
    queryFn: async () => {
      const { data } = await axios.get<GetAllEventsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events`,
        {
          withCredentials: true,
        },
      );

      const foundEvent = data.find((candidate) => candidate.id === eventId);
      if (!foundEvent) {
        throw new Error("Event not found");
      }

      return foundEvent;
    },
  });

  const { data: commentsData, isLoading: isCommentsLoading } = useQuery({
    queryKey: ["event-comments", eventId],
    enabled: activeTab === "discussion" && Number.isFinite(eventId),
    queryFn: async () => {
      const { data } = await axios.get<GetEventCommentsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/comments`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
  });

  const {
    data: eventNewsData,
    isLoading: isEventNewsLoading,
    isError: isEventNewsError,
  } = useQuery({
    queryKey: ["event-news", eventId],
    enabled: activeTab === "news" && Number.isFinite(eventId),
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

  const { mutate: toggleRegistration, isPending: isRegistrationPending } =
    useMutation({
      mutationFn: async () => {
        if (!event) {
          return;
        }

        if (event.isUserRegistered) {
          await axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}/register`,
            {
              withCredentials: true,
            },
          );
          return;
        }

        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}/register`,
          {},
          {
            withCredentials: true,
          },
        );
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["events"] });
        queryClient.invalidateQueries({
          queryKey: ["events", "detail", eventId],
        });
        queryClient.invalidateQueries({ queryKey: ["myevents"] });
      },
    });

  const { mutate: createComment, isPending: isCommentPending } = useMutation({
    mutationFn: async () => {
      return axios.post<CreateEventCommentResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/comments`,
        {
          content: commentContent.trim(),
        },
        {
          withCredentials: true,
        },
      );
    },
    onSuccess: () => {
      setCommentContent("");
      queryClient.invalidateQueries({ queryKey: ["event-comments", eventId] });
    },
  });

  const { mutate: deleteComment, isPending: isDeleteCommentPending } =
    useMutation({
      mutationFn: async (commentId: number) => {
        return axios.delete<DeleteEventCommentResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/comments/${commentId}`,
          {
            withCredentials: true,
          },
        );
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["event-comments", eventId],
        });
      },
    });

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

  const canSubmitComment =
    commentContent.trim().length > 0 && !isCommentPending;
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

  const canRegister = event && (event.isUserRegistered || !event.isFull);

  const publishedNews = useMemo(
    () => (eventNewsData?.news ?? []).filter((news) => news.isPublished),
    [eventNewsData],
  );
  const draftNews = useMemo(
    () => (eventNewsData?.news ?? []).filter((news) => !news.isPublished),
    [eventNewsData],
  );

  if (isEventLoading) {
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  if (isEventError || !event) {
    return (
      <main className="w-7/8 m-auto min-h-screen pt-24 pb-20">
        <div className="card-box h-auto p-5 text-red-600">
          Az esemény nem található.
        </div>
      </main>
    );
  }

  return (
    <main className="w-7/8 m-auto min-h-screen pt-24 pb-20">
      <div className="rounded-xl w-full min-h-[750px] flex flex-col">
        <div className="relative shrink-0 bg-gray-400/10 backdrop-blur-xl rounded-t-xl overflow-hidden">
          <Image
            src={event.imageUrl!}
            alt="Event"
            width={0}
            height={0}
            sizes="100vw"
            priority
            className="m-auto"
            style={{ width: "auto", height: "400px" }}
          />
        </div>

        <div className="flex items-center p-5 pb-5 border-b-[1px] bg-secondary/60 backdrop-blur-xl border-b-faded/20 text-2xl">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/app/events/${eventId}/${tab.key}`}
              prefetch
              className={`px-4 relative transition ${
                activeTab === tab.key
                  ? "after:content-[''] pointer-events-none after:block after:w-full after:h-[1px] after:bg-faded/80 after:absolute after:-bottom-[21px] after:left-0"
                  : "text-gray-400 cursor-pointer"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {activeTab === "details" ? (
          <div className="px-10 pt-5 pb-10 flex justify-between flex-col grow">
            <div>
              <div className="text-4xl mb-3">{event.name}</div>
              <div className="text-gray-600 text-justify mb-5">
                {event.description}
              </div>
              <div className="flex justify-between">
                <div>Szervező: {event.creator}</div>
                <div>Dátum: {event.date.slice(0, 10)}</div>
              </div>
            </div>
            <div className="w-full justify-between flex mt-10 items-center">
              <div className="text-gray-600">
                Létrehozva: {event.createdAt.slice(0, 10)}
              </div>
              <div className="flex gap-4 items-center">
                <div className="text-sm text-gray-600">
                  {event.maxParticipants
                    ? `${event.registrationCount}/${event.maxParticipants} jelentkező`
                    : `${event.registrationCount} jelentkező`}
                </div>
                <button
                  onClick={() => toggleRegistration()}
                  disabled={!canRegister || isRegistrationPending}
                  className="bg-accent text-white text-xl px-3 py-2 hover:bg-accent/60 transition ease-in-out active:scale-95 active:duration-75 rounded-xl cursor-pointer disabled:bg-faded disabled:cursor-not-allowed"
                >
                  {isRegistrationPending
                    ? "Feldolgozás..."
                    : event.isUserRegistered
                      ? "Lemondás"
                      : "Jelentkezés"}
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === "news" ? (
          <div className="pt-2 px-10 pb-2 flex grow overflow-y-scroll flex-col">
            {isEventNewsLoading ? (
              <div className="text-faded">Betöltés...</div>
            ) : isEventNewsError ? (
              <div className="text-red-600">
                Nem sikerült betölteni az esemény híreit.
              </div>
            ) : (
              <>
                {eventNewsData?.canManageNews && (
                  <div className="mb-5 rounded-xl border border-faded/40 bg-white/30 p-3">
                    <div className="text-lg mb-2">
                      {editingDraftId
                        ? "Vázlat szerkesztése"
                        : "Új hír létrehozása"}
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
                        <div className="text-sm text-faded">
                          Azonnal publikálás
                        </div>
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
                        disabled={
                          editingDraftId ? !canUpdateDraft : !canSubmitNews
                        }
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
                          <div className="mt-2 flex gap-2">
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
        ) : activeTab === "discussion" ? (
          <div className="pt-2 px-10 pb-2 flex grow overflow-y-scroll flex-col">
            <div className="flex gap-2 mb-4 mt-1">
              <input
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                maxLength={2000}
                placeholder="Írj egy hozzászólást..."
                className="w-full border border-faded/60 focus:outline-2 focus:outline-accent rounded-xl px-3 py-2 bg-white/20"
              />
              <button
                onClick={() => createComment()}
                disabled={!canSubmitComment}
                className="bg-accent text-white px-4 py-2 rounded-xl disabled:bg-faded disabled:cursor-not-allowed"
              >
                {isCommentPending ? "Mentés..." : "Küldés"}
              </button>
            </div>
            <div className="space-y-3">
              {isCommentsLoading ? (
                <div className="text-faded">Betöltés...</div>
              ) : commentsData?.comments.length ? (
                commentsData.comments.map((comment: EventComment) => (
                  <div
                    key={comment.id}
                    className={`rounded-xl border px-3 py-2 ${
                      comment.isDeleted
                        ? "border-slate-300/60 bg-slate-100/70"
                        : "border-faded/50 bg-white/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">
                        {comment.user.name}
                      </div>
                      {comment.canDelete && !comment.isDeleted && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          disabled={isDeleteCommentPending}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Törlés
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-faded mb-1">
                      {new Date(comment.createdAt).toLocaleString("hu-HU")}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-faded text-xl text-center mt-10">
                  Még nincs hozzászólás.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="pt-2 px-10 pb-6 flex grow overflow-y-scroll flex-col">
            <div className="text-lg font-semibold">Helyszín</div>
            <div className="text-faded mt-1 mb-4">{event.location}</div>

            <EventNavigationMap classroom={event.classroom} />
          </div>
        )}
      </div>
    </main>
  );
};
