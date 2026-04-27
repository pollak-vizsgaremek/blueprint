"use client";

import { useModal } from "@/contexts/ModalContext";
import { usePopupModal } from "@/contexts/PopupModalContext";
import {
  CreateEventNewsResponse,
  CreateEventCommentResponse,
  DeleteEventNewsResponse,
  DeleteEventCommentResponse,
  EventComment,
  EventNewsItem,
  GetEventCommentsResponse,
  GetEventNewsResponse,
  UpdateEventNewsResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ExternalLink, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export const EventModal = () => {
  const { isOpen, closeModal, selectedEvent, setEvent } = useModal();
  const { showAlert, showConfirm } = usePopupModal();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState("");
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    "details" | "discussion" | "news" | "place"
  >("details");

  useEffect(() => {
    if (isOpen) {
      setActiveTab("details");
      setNewsTitle("");
      setNewsContent("");
      setPublishNow(false);
      setEditingDraftId(null);
    }
  }, [isOpen, selectedEvent?.id]);

  const { mutate: toggleRegistration, isPending } = useMutation({
    mutationFn: async () => {
      if (!selectedEvent) {
        return;
      }

      if (selectedEvent.isUserRegistered) {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}/register`,
          {
            withCredentials: true,
          },
        );
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}/register`,
        {},
        {
          withCredentials: true,
        },
      );
    },
    onSuccess: () => {
      if (!selectedEvent) {
        return;
      }

      const nextRegistrationCount = selectedEvent.isUserRegistered
        ? Math.max(0, selectedEvent.registrationCount - 1)
        : selectedEvent.registrationCount + 1;

      const maxParticipants = selectedEvent.maxParticipants;

      setEvent({
        ...selectedEvent,
        isUserRegistered: !selectedEvent.isUserRegistered,
        userRegistration: selectedEvent.isUserRegistered
          ? null
          : {
              id: 0,
              registeredAt: new Date().toISOString(),
              status: "registered",
            },
        registrationCount: nextRegistrationCount,
        isFull: Boolean(
          maxParticipants && nextRegistrationCount >= maxParticipants,
        ),
      });

      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["myevents"] });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ??
          error.response?.data?.error ??
          "Jelentkezés sikertelen.";
        showAlert({ message: errorMessage, tone: "error" });
        return;
      }

      showAlert({ message: "Jelentkezés sikertelen.", tone: "error" });
    },
  });

  const { data: commentsData, isLoading: isCommentsLoading } = useQuery({
    queryKey: ["event-comments", selectedEvent?.id, 3],
    enabled: isOpen && activeTab === "discussion" && Boolean(selectedEvent?.id),
    queryFn: async () => {
      const { data } = await axios.get<GetEventCommentsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent!.id}/comments`,
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
    queryKey: ["event-news", selectedEvent?.id],
    enabled: isOpen && activeTab === "news" && Boolean(selectedEvent?.id),
    queryFn: async () => {
      const { data } = await axios.get<GetEventNewsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent!.id}/news`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
  });

  const { mutate: createComment, isPending: isCommentPending } = useMutation({
    mutationFn: async () => {
      if (!selectedEvent) {
        return;
      }

      return axios.post<CreateEventCommentResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}/comments`,
        {
          content: commentContent.trim(),
        },
        {
          withCredentials: true,
        },
      );
    },
    onSuccess: (response) => {
      setCommentContent("");

      if (!selectedEvent) {
        return;
      }

      if (response?.data?.comment?.isDeleted) {
        showAlert({
          message:
            "A hozzászólás moderálás miatt el lett rejtve. Ezt csak adminok láthatják.",
          tone: "warning",
        });
      }

      queryClient.invalidateQueries({
        queryKey: ["event-comments", selectedEvent.id],
      });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ??
          error.response?.data?.error ??
          "Hozzászólás mentése sikertelen.";
        showAlert({ message: errorMessage, tone: "error" });
        return;
      }

      showAlert({ message: "Hozzászólás mentése sikertelen.", tone: "error" });
    },
  });

  const { mutate: deleteComment, isPending: isDeleteCommentPending } =
    useMutation({
      mutationFn: async (commentId: number) => {
        if (!selectedEvent) {
          return;
        }

        await axios.delete<DeleteEventCommentResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}/comments/${commentId}`,
          {
            withCredentials: true,
          },
        );
      },
      onSuccess: () => {
        if (!selectedEvent) {
          return;
        }

        queryClient.invalidateQueries({
          queryKey: ["event-comments", selectedEvent.id],
        });
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          const errorMessage =
            error.response?.data?.message ??
            error.response?.data?.error ??
            "Hozzászólás törlése sikertelen.";
          showAlert({ message: errorMessage, tone: "error" });
          return;
        }

        showAlert({
          message: "Hozzászólás törlése sikertelen.",
          tone: "error",
        });
      },
    });

  const { mutate: createEventNews, isPending: isCreateEventNewsPending } =
    useMutation({
      mutationFn: async () => {
        if (!selectedEvent) {
          return;
        }

        return axios.post<CreateEventNewsResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}/news`,
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
        if (!selectedEvent) {
          return;
        }

        setNewsTitle("");
        setNewsContent("");
        setPublishNow(false);

        queryClient.invalidateQueries({
          queryKey: ["event-news", selectedEvent.id],
        });
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          const errorMessage =
            error.response?.data?.message ??
            error.response?.data?.error ??
            "Hír mentése sikertelen.";
          showAlert({ message: errorMessage, tone: "error" });
          return;
        }

        showAlert({ message: "Hír mentése sikertelen.", tone: "error" });
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
        if (!selectedEvent) {
          return;
        }

        return axios.put<UpdateEventNewsResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}/news/${newsId}`,
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
        if (!selectedEvent) {
          return;
        }

        setEditingDraftId(null);
        setNewsTitle("");
        setNewsContent("");
        setPublishNow(false);

        queryClient.invalidateQueries({
          queryKey: ["event-news", selectedEvent.id],
        });
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          const errorMessage =
            error.response?.data?.message ??
            error.response?.data?.error ??
            "Hír frissítése sikertelen.";
          showAlert({ message: errorMessage, tone: "error" });
          return;
        }

        showAlert({ message: "Hír frissítése sikertelen.", tone: "error" });
      },
    });

  const { mutate: deleteEventNews, isPending: isDeleteEventNewsPending } =
    useMutation({
      mutationFn: async (newsId: number) => {
        if (!selectedEvent) {
          return;
        }

        return axios.delete<DeleteEventNewsResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}/news/${newsId}`,
          {
            withCredentials: true,
          },
        );
      },
      onSuccess: () => {
        if (!selectedEvent) {
          return;
        }

        queryClient.invalidateQueries({
          queryKey: ["event-news", selectedEvent.id],
        });
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          const errorMessage =
            error.response?.data?.message ??
            error.response?.data?.error ??
            "Hír törlése sikertelen.";
          showAlert({ message: errorMessage, tone: "error" });
          return;
        }

        showAlert({ message: "Hír törlése sikertelen.", tone: "error" });
      },
    });

  const canRegister =
    selectedEvent && (selectedEvent.isUserRegistered || !selectedEvent.isFull);

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

  const confirmDeleteNews = async (newsId: number) => {
    const confirmed = await showConfirm({
      message: "Biztosan törölni szeretnéd ezt a hírt?",
      tone: "warning",
      confirmText: "Törlés",
      cancelText: "Mégse",
    });

    if (!confirmed) {
      return;
    }

    deleteEventNews(newsId);
  };

  const confirmDeleteComment = async (commentId: number) => {
    const confirmed = await showConfirm({
      message: "Biztosan törölni szeretnéd ezt a hozzászólást?",
      tone: "warning",
      confirmText: "Törlés",
      cancelText: "Mégse",
    });

    if (!confirmed) {
      return;
    }

    deleteComment(commentId);
  };

  const renderNewsTab = () => {
    if (isEventNewsLoading) {
      return <div className="text-faded">Betöltés...</div>;
    }

    if (isEventNewsError) {
      return (
        <div className="text-red-600">
          Nem sikerült betölteni az esemény híreit.
        </div>
      );
    }

    const canManageNews = eventNewsData?.canManageNews ?? false;
    const allNews = eventNewsData?.news ?? [];
    const drafts = allNews.filter((news) => !news.isPublished);

    const submitDraftChanges = () => {
      if (!editingDraftId) {
        return;
      }

      updateEventNews({
        newsId: editingDraftId,
        isPublished: publishNow,
        title: newsTitle.trim(),
        content: newsContent.trim(),
      });
    };

    return (
      <div className="pt-2 px-10 pb-2 flex grow overflow-y-scroll flex-col">
        {canManageNews && (
          <div className="mb-5 rounded-xl border border-faded/40 bg-white/30 p-3">
            <div className="text-lg mb-2">
              {editingDraftId ? "Vázlat szerkesztése" : "Új hír létrehozása"}
            </div>
            <div className="flex flex-col gap-2">
              <input
                value={newsTitle}
                onChange={(event) => setNewsTitle(event.target.value)}
                maxLength={200}
                placeholder="Hír címe"
                className="w-full border border-faded/60 focus:outline-2 focus:outline-accent rounded-xl px-3 py-2 bg-white/20"
              />
              <textarea
                value={newsContent}
                onChange={(event) => setNewsContent(event.target.value)}
                maxLength={4000}
                rows={4}
                placeholder="Hír tartalma..."
                className="w-full border border-faded/60 focus:outline-2 focus:outline-accent rounded-xl px-3 py-2 bg-white/20"
              />
              <div className="flex items-center justify-between gap-3 border border-faded/20 rounded-xl px-3 py-2 bg-secondary/40">
                <div className="text-sm text-faded">Azonnal publikálás</div>
                <button
                  type="button"
                  onClick={() => setPublishNow((previous) => !previous)}
                  className="shrink-0 w-14 h-8 rounded-full border border-faded/20 bg-secondary/80 p-1 cursor-pointer"
                  aria-pressed={publishNow}
                  aria-label="Azonnal publikálás kapcsoló"
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
                    submitDraftChanges();
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
              {editingDraftId && (
                <button
                  onClick={() => {
                    setEditingDraftId(null);
                    setNewsTitle("");
                    setNewsContent("");
                    setPublishNow(false);
                  }}
                  className="text-sm text-faded hover:text-text self-start"
                >
                  Mégse
                </button>
              )}
            </div>
          </div>
        )}

        {canManageNews && drafts.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-faded mb-2">Vázlatok</div>
            <div className="space-y-2">
              {drafts.map((news: EventNewsItem) => (
                <div
                  key={`draft-${news.id}`}
                  className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="font-semibold">{news.title}</div>
                    <span className="text-[10px] rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                      Vázlat
                    </span>
                  </div>
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
                      className="text-xs px-2 py-1 rounded-lg bg-sky-100 text-sky-700 disabled:bg-faded/40 disabled:text-faded disabled:cursor-not-allowed"
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
                      className="text-xs px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 disabled:bg-faded/40 disabled:text-faded disabled:cursor-not-allowed"
                    >
                      Publikálás
                    </button>
                    <button
                      onClick={() => confirmDeleteNews(news.id)}
                      disabled={isNewsManagementPending}
                      className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 disabled:bg-faded/40 disabled:text-faded disabled:cursor-not-allowed"
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
          {allNews.length ? (
            allNews
              .filter((news) => news.isPublished)
              .map((news: EventNewsItem) => (
                <div
                  key={news.id}
                  className="rounded-xl border border-faded/50 bg-white/40 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="font-semibold">{news.title}</div>
                    <span className="text-[10px] rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">
                      Publikált
                    </span>
                  </div>
                  <div className="text-xs text-faded mb-2">
                    {new Date(
                      news.publishedAt || news.createdAt,
                    ).toLocaleString("hu-HU")}
                    {news.author?.name ? ` • ${news.author.name}` : ""}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {news.content}
                  </div>
                  {canManageNews && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() =>
                          updateEventNews({
                            newsId: news.id,
                            isPublished: false,
                          })
                        }
                        disabled={isNewsManagementPending}
                        className="text-xs px-2 py-1 rounded-lg bg-slate-200 text-slate-700 disabled:bg-faded/40 disabled:text-faded disabled:cursor-not-allowed"
                      >
                        Vázlatba
                      </button>
                      <button
                        onClick={() => confirmDeleteNews(news.id)}
                        disabled={isNewsManagementPending}
                        className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 disabled:bg-faded/40 disabled:text-faded disabled:cursor-not-allowed"
                      >
                        Törlés
                      </button>
                    </div>
                  )}
                </div>
              ))
          ) : (
            <div className="text-faded text-xl text-center mt-10">
              Ehhez az eseményhez még nincs publikált hír.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDiscussionTab = () => {
    return (
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
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">
                      {comment.user.name}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        comment.isVerified
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {comment.isVerified
                        ? "AI ellenőrzött"
                        : "Nincs AI ellenőrzés"}
                    </span>
                    {comment.isDeleted && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] bg-red-100 text-red-700">
                        Törölt
                      </span>
                    )}
                  </div>
                  {comment.canDelete && !comment.isDeleted && (
                    <button
                      onClick={() => confirmDeleteComment(comment.id)}
                      disabled={isDeleteCommentPending}
                      className="text-xs text-red-600 hover:underline disabled:text-slate-400 disabled:no-underline"
                    >
                      Törlés
                    </button>
                  )}
                </div>
                <div className="text-sm text-faded mb-1">
                  {new Date(comment.createdAt).toLocaleString("hu-HU")}
                </div>
                <p
                  className={`text-sm whitespace-pre-wrap ${
                    comment.isDeleted ? "text-slate-500" : ""
                  }`}
                >
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
    );
  };

  return (
    isOpen && (
      <div
        onClick={closeModal}
        className="w-screen h-screen fixed z-[1000] flex justify-center items-center left-0 top-0 bg-black/40"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="rounded-xl w-[1000px] h-[750px] flex flex-col bg-secondary/70 backdrop-blur-xl">
            <div className="relative shrink-0 w-auto h-[300px]">
              <div className="absolute top-5 right-5 z-100 flex items-center gap-2">
                <Link
                  href={`/app/events/${selectedEvent?.id}/details`}
                  prefetch
                  className="bg-white/30 backdrop-blur-sm p-1.5 rounded-full hover:bg-white/45 transition ease-in-out"
                  aria-label="Esemény oldal megnyitása"
                >
                  <ExternalLink size={22} />
                </Link>
                <button
                  className="cursor-pointer bg-white/30 backdrop-blur-sm p-1 rounded-full hover:bg-white/45 transition ease-in-out"
                  onClick={closeModal}
                  aria-label="Bezárás"
                >
                  <X size={25} />
                </button>
              </div>
              <Image
                src={selectedEvent!.imageUrl!}
                alt="Event"
                fill
                priority
                className="rounded-t-xl"
              />
            </div>
            <div className="flex items-center p-5 pb-5 border-b-[1px] bg-secondary/30 border-b-faded/20 text-2xl">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 relative transition ${
                  activeTab === "details"
                    ? "after:content-[''] pointer-events-none after:block after:w-full after:h-[1px] after:bg-faded/80 after:absolute after:-bottom-[21px] after:left-0"
                    : "text-gray-400 cursor-pointer"
                }`}
              >
                Részletek
              </button>
              <button
                onClick={() => setActiveTab("news")}
                className={`px-4 relative transition ${
                  activeTab === "news"
                    ? "after:content-[''] pointer-events-none after:block after:w-full after:h-[1px] after:bg-faded/80 after:absolute after:-bottom-[21px] after:left-0"
                    : "text-gray-400 cursor-pointer"
                }`}
              >
                Hírek
              </button>
              <button
                onClick={() => setActiveTab("place")}
                className={`px-4 relative transition ${
                  activeTab === "place"
                    ? "after:content-[''] pointer-events-none after:block after:w-full after:h-[1px] after:bg-faded/80 after:absolute after:-bottom-[21px] after:left-0"
                    : "text-gray-400 cursor-pointer"
                }`}
              >
                Helyszín
              </button>
              <button
                onClick={() => setActiveTab("discussion")}
                className={`px-4 relative transition ${
                  activeTab === "discussion"
                    ? "after:content-[''] pointer-events-none after:block after:w-full after:h-[1px] after:bg-faded/80 after:absolute after:-bottom-[21px] after:left-0"
                    : "text-gray-400 cursor-pointer"
                }`}
              >
                Beszélgetés
              </button>
            </div>
            {activeTab === "details" ? (
              <div className="px-10 pb-10 flex justify-between flex-col grow">
                <div className="">
                  <div className="text-4xl mb-3">{selectedEvent?.name}</div>
                  <div className="text-gray-600 text-justify mb-5">
                    {selectedEvent?.description}
                  </div>
                  <div className="flex justify-between">
                    <div className="">Szervező: {selectedEvent?.creator}</div>
                    <div className="">
                      Dátum: {selectedEvent?.date.slice(0, 10)}
                    </div>
                  </div>
                </div>
                <div className="w-full justify-between flex mt-10 items-center">
                  <div className="text-gray-600">
                    Létrehozva: {selectedEvent?.createdAt.slice(0, 10)}
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="text-sm text-gray-600">
                      {selectedEvent && selectedEvent.maxParticipants
                        ? `${selectedEvent.registrationCount}/${selectedEvent.maxParticipants} jelentkező`
                        : selectedEvent
                          ? `${selectedEvent.registrationCount} jelentkező`
                          : ""}
                    </div>
                    <button
                      onClick={() => toggleRegistration()}
                      disabled={!canRegister || isPending}
                      className="bg-accent text-white text-xl px-3 py-2 hover:bg-accent/60 transition ease-in-out active:scale-95 active:duration-75 rounded-xl cursor-pointer disabled:bg-faded disabled:cursor-not-allowed"
                    >
                      {isPending
                        ? "Feldolgozás..."
                        : selectedEvent?.isUserRegistered
                          ? "Lemondás"
                          : "Jelentkezés"}
                    </button>
                  </div>
                </div>
              </div>
            ) : activeTab === "news" ? (
              renderNewsTab()
            ) : activeTab === "discussion" ? (
              renderDiscussionTab()
            ) : (
              <div className="mt-2 px-10 pb-2 flex grow overflow-y-scroll flex-col text-faded">
                Helyszín információ hamarosan.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  );
};
