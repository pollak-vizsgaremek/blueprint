"use client";

import { useModal } from "@/contexts/ModalContext";
import {
  CreateEventCommentResponse,
  DeleteEventCommentResponse,
  EventComment,
  GetEventCommentsResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export const EventModal = () => {
  const { isOpen, closeModal, selectedEvent, setEvent } = useModal();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState("");
  const [activeTab, setActiveTab] = useState<
    "details" | "discussion" | "news" | "place"
  >("details");

  useEffect(() => {
    if (isOpen) {
      setActiveTab("details");
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
        window.alert(errorMessage);
        return;
      }

      window.alert("Jelentkezés sikertelen.");
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
        window.alert(
          "A hozzászólás moderálás miatt el lett rejtve. Ezt csak adminok láthatják.",
        );
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
        window.alert(errorMessage);
        return;
      }

      window.alert("Hozzászólás mentése sikertelen.");
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
          window.alert(errorMessage);
          return;
        }

        window.alert("Hozzászólás törlése sikertelen.");
      },
    });

  const canRegister =
    selectedEvent && (selectedEvent.isUserRegistered || !selectedEvent.isFull);

  const canSubmitComment =
    commentContent.trim().length > 0 && !isCommentPending;

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
              <button
                className="cursor-pointer absolute top-5 right-5 z-100 bg-white/30 backdrop-blur-sm p-1 rounded-full"
                onClick={closeModal}
              >
                <X size={25} />
              </button>
              <Image
                src={selectedEvent!.imageUrl!}
                alt="Event"
                fill
                priority
                className="rounded-t-xl"
              />
            </div>
            <div className="flex items-center p-5 pb-5 mb-5 border-b-[1px] bg-secondary/30 border-b-faded/20 text-2xl">
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
            ) : (
              <div className="mt-2 px-10 pb-2 flex grow overflow-y-scroll flex-col">
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
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Biztosan törölni szeretnéd ezt a hozzászólást?",
                                  )
                                ) {
                                  deleteComment(comment.id);
                                }
                              }}
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
            )}
          </div>
        </div>
      </div>
    )
  );
};
