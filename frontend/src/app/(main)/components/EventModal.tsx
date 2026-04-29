"use client";

import { useModal } from "@/contexts/ModalContext";
import { usePopupModal } from "@/contexts/PopupModalContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  CreateEventNewsResponse,
  CreateEventCommentResponse,
  DeleteEventNewsResponse,
  DeleteEventCommentResponse,
  GetEventCommentsResponse,
  GetEventNewsResponse,
  GetUsersLiteResponse,
  UpdateEventNewsResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ExternalLink, Users, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { EventModalDiscussionTab } from "@/components/events/modal/EventModalDiscussionTab";
import { EventModalDetailsTab } from "@/components/events/modal/EventModalDetailsTab";
import { EventModalNewsTab } from "@/components/events/modal/EventModalNewsTab";
import { EventModalPlaceTab } from "@/components/events/modal/EventModalPlaceTab";
import { EventModalTabs } from "@/components/events/modal/EventModalTabs";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  buildEventUpdatePayload,
  canManageEvent,
  createEventEditFormState,
  EventEditFormState,
} from "@/lib/eventManage";
import { queryKeys } from "@/lib/queryKeys";
import { notify } from "@/lib/notify";

export const EventModal = () => {
  const { isOpen, closeModal, selectedEvent, setEvent } = useModal();
  const { showAlert, showConfirm } = usePopupModal();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [commentContent, setCommentContent] = useState("");
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    "details" | "discussion" | "news" | "place"
  >("details");
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [eventForm, setEventForm] = useState<EventEditFormState>(
    createEventEditFormState(),
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab("details");
      setNewsTitle("");
      setNewsContent("");
      setPublishNow(false);
      setEditingDraftId(null);
      setIsEditingEvent(false);

      if (selectedEvent) {
        setEventForm(createEventEditFormState(selectedEvent));
      }
    }
  }, [isOpen, selectedEvent?.id]);

  const canManageSelectedEvent = canManageEvent(user, selectedEvent ?? null);

  const { data: usersLiteData } = useQuery({
    queryKey: queryKeys.usersLite,
    enabled: isOpen && canManageSelectedEvent,
    queryFn: async () => {
      const { data } = await axios.get<GetUsersLiteResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/users/list`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
  });

  const usersLite = usersLiteData?.users ?? [];

  useEffect(() => {
    if (isOpen) {
      closeModal();
    }
  }, [pathname]);

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

      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.invalidateQueries({ queryKey: queryKeys.myEvents });

      notify.success(
        selectedEvent.isUserRegistered
          ? "Sikeresen lemondtad a jelentkezést."
          : "Sikeresen jelentkeztél az eseményre.",
      );
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ??
          error.response?.data?.error ??
          "Jelentkezés sikertelen.";
        notify.error(errorMessage);
        return;
      }

      notify.error("Jelentkezés sikertelen.");
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
        queryKey: queryKeys.eventComments(selectedEvent.id),
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
          queryKey: queryKeys.eventComments(selectedEvent.id),
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
          queryKey: queryKeys.eventNews(selectedEvent.id),
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
          queryKey: queryKeys.eventNews(selectedEvent.id),
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
          queryKey: queryKeys.eventNews(selectedEvent.id),
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

  const { mutate: updateManagedEvent, isPending: isUpdateManagedEventPending } =
    useMutation({
      mutationFn: async () => {
        if (!selectedEvent) {
          return;
        }

        const payload = buildEventUpdatePayload(eventForm);

        return axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}`,
          payload,
          {
            withCredentials: true,
          },
        );
      },
      onSuccess: () => {
        if (!selectedEvent) {
          return;
        }

        setEvent({
          ...selectedEvent,
          name: eventForm.name.trim(),
          description: eventForm.description.trim(),
          location: eventForm.location.trim(),
          classroom: eventForm.classroom.trim(),
          date: new Date(eventForm.date).toISOString(),
          updatedBy: Number(eventForm.updatedBy),
          maxParticipants: eventForm.maxParticipants.trim()
            ? Number(eventForm.maxParticipants.trim())
            : null,
        });

        setIsEditingEvent(false);
        showAlert({ message: "Esemény frissítve.", tone: "success" });
        queryClient.invalidateQueries({ queryKey: queryKeys.events });
        queryClient.invalidateQueries({
          queryKey: queryKeys.eventDetail(selectedEvent.id),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.myEvents });
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          const errorMessage =
            error.response?.data?.message ??
            error.response?.data?.error ??
            "Esemény frissítése sikertelen.";
          showAlert({ message: errorMessage, tone: "error" });
          return;
        }

        showAlert({ message: "Esemény frissítése sikertelen.", tone: "error" });
      },
    });

  const { mutate: deleteManagedEvent, isPending: isDeleteManagedEventPending } =
    useMutation({
      mutationFn: async () => {
        if (!selectedEvent) {
          return;
        }

        return axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}`,
          {
            withCredentials: true,
          },
        );
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.events });
        queryClient.invalidateQueries({ queryKey: queryKeys.myEvents });
        closeModal();
        router.push("/events");
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          const errorMessage =
            error.response?.data?.message ??
            error.response?.data?.error ??
            "Esemény törlése sikertelen.";
          showAlert({ message: errorMessage, tone: "error" });
          return;
        }

        showAlert({ message: "Esemény törlése sikertelen.", tone: "error" });
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

  const confirmDeleteEvent = async () => {
    const confirmed = await showConfirm({
      message: "Biztosan törölni szeretnéd ezt az eseményt?",
      tone: "warning",
      confirmText: "Törlés",
      cancelText: "Mégse",
    });

    if (!confirmed) {
      return;
    }

    deleteManagedEvent();
  };

  const handleToggleRegistration = async () => {
    if (!selectedEvent?.isUserRegistered) {
      toggleRegistration();
      return;
    }

    const confirmed = await showConfirm({
      message:
        "Biztosan le szeretnéd mondani a jelentkezésedet erre az eseményre?",
      tone: "warning",
      confirmText: "Lemondás",
      cancelText: "Mégse",
    });

    if (!confirmed) {
      return;
    }

    toggleRegistration();
  };

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
    isOpen && (
      <div
        onClick={closeModal}
        className="fixed left-0 top-0 z-[1000] flex h-screen w-screen items-center justify-center bg-black/40 p-2 sm:p-4"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="flex h-[min(860px,calc(100vh-1rem))] w-[min(1200px,calc(100vw-1rem))] flex-col rounded-xl bg-secondary/70 backdrop-blur-xl sm:h-[min(860px,calc(100vh-2rem))] sm:w-[min(1200px,calc(100vw-2rem))]">
            <div className="relative h-[180px] shrink-0 w-full sm:h-[220px] md:h-[260px] lg:h-[300px]">
              <div className="absolute top-5 right-5 z-100 flex items-center gap-2">
                <Link
                  href={`/events/${selectedEvent?.id}/details`}
                  prefetch
                  onClick={closeModal}
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
                sizes="(max-width: 640px) calc(100vw - 1rem), (max-width: 1280px) calc(100vw - 2rem), 1200px"
                quality={75}
                className="rounded-t-xl object-cover"
              />
            </div>
            <EventModalTabs activeTab={activeTab} onSelect={setActiveTab} />
            {activeTab === "details" ? (
              <EventModalDetailsTab
                selectedEvent={selectedEvent ?? null}
                canManageSelectedEvent={canManageSelectedEvent}
                isEditingEvent={isEditingEvent}
                setIsEditingEvent={setIsEditingEvent}
                isDeleteManagedEventPending={isDeleteManagedEventPending}
                onDeleteEvent={confirmDeleteEvent}
                eventForm={eventForm}
                usersLite={usersLite}
                isUpdateManagedEventPending={isUpdateManagedEventPending}
                setEventForm={setEventForm}
                onSaveManagedEvent={updateManagedEvent}
                showWarning={(message) =>
                  showAlert({ message, tone: "warning" })
                }
                canRegister={Boolean(canRegister)}
                isRegisterPending={isPending}
                onToggleRegistration={handleToggleRegistration}
              />
            ) : activeTab === "news" ? (
              <EventModalNewsTab
                isEventNewsLoading={isEventNewsLoading}
                isEventNewsError={isEventNewsError}
                canManageNews={canManageNews}
                allNews={allNews}
                drafts={drafts}
                newsTitle={newsTitle}
                setNewsTitle={setNewsTitle}
                newsContent={newsContent}
                setNewsContent={setNewsContent}
                publishNow={publishNow}
                setPublishNow={setPublishNow}
                editingDraftId={editingDraftId}
                canUpdateDraft={canUpdateDraft}
                canSubmitNews={canSubmitNews}
                isCreateEventNewsPending={isCreateEventNewsPending}
                isUpdateEventNewsPending={isUpdateEventNewsPending}
                isNewsManagementPending={isNewsManagementPending}
                onCreateEventNews={createEventNews}
                onSubmitDraftChanges={submitDraftChanges}
                onCancelDraftEdit={() => {
                  setEditingDraftId(null);
                  setNewsTitle("");
                  setNewsContent("");
                  setPublishNow(false);
                }}
                onEditDraft={(news) => {
                  setEditingDraftId(news.id);
                  setNewsTitle(news.title);
                  setNewsContent(news.content);
                  setPublishNow(false);
                }}
                onPublishDraft={(newsId) =>
                  updateEventNews({
                    newsId,
                    isPublished: true,
                  })
                }
                onMovePublishedToDraft={(newsId) =>
                  updateEventNews({
                    newsId,
                    isPublished: false,
                  })
                }
                onDeleteNews={confirmDeleteNews}
              />
            ) : activeTab === "discussion" ? (
              <EventModalDiscussionTab
                commentContent={commentContent}
                setCommentContent={setCommentContent}
                canSubmitComment={canSubmitComment}
                isCommentPending={isCommentPending}
                onCreateComment={createComment}
                isCommentsLoading={isCommentsLoading}
                comments={commentsData?.comments ?? []}
                isDeleteCommentPending={isDeleteCommentPending}
                onDeleteComment={confirmDeleteComment}
              />
            ) : (
              <EventModalPlaceTab selectedEvent={selectedEvent ?? null} />
            )}
          </div>
        </div>
      </div>
    )
  );
};
