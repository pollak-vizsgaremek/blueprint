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
  const [activeTab, setActiveTab] = useState<"details" | "discussion">(
    "details",
  );

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
        `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent!.id}/comments?limit=3`,
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
      <>
        <div className="w-screen h-screen fixed z-[1000] left-0 top-0 bg-black/40" />
        <div className="w-screen h-screen fixed z-[2000] left-0 top-0 flex justify-center items-center">
          <div className="w-full rounded-xl overflow-scroll p-5 border-faded border-[1px]  max-w-[1000px] min-h-min max-h-[600px] bg-secondary">
            <button className="cursor-pointer mb-10" onClick={closeModal}>
              <X size={30} />
            </button>
            <div className="mb-6 px-10">
              <div className="inline-flex rounded-xl border border-faded/60 overflow-hidden">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-4 py-2 text-sm transition ${
                    activeTab === "details"
                      ? "bg-accent text-white"
                      : "bg-white/40 hover:bg-white/70"
                  }`}
                >
                  Részletek
                </button>
                <button
                  onClick={() => setActiveTab("discussion")}
                  className={`px-4 py-2 text-sm transition ${
                    activeTab === "discussion"
                      ? "bg-accent text-white"
                      : "bg-white/40 hover:bg-white/70"
                  }`}
                >
                  Beszélgetés
                </button>
              </div>
            </div>

            {activeTab === "details" ? (
              <>
                <div className="flex justify-between gap-5">
                  <div className="relative size-96 ml-10 shrink-0">
                    <Image
                      src={selectedEvent!.imageUrl!}
                      alt="Event"
                      fill
                      priority
                      className="rounded-2xl block object-center"
                    />
                  </div>
                  <div className="px-4 flex flex-col justify-between">
                    <div className="">
                      <div className="text-4xl mb-3">{selectedEvent?.name}</div>
                      <div className="text-faded text-justify">
                        {selectedEvent?.description}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="">Szervező: {selectedEvent?.creator}</div>
                      <div className="">
                        Dátum: {selectedEvent?.date.slice(0, 10)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full justify-between flex mt-10 pr-4 pl-10 items-center">
                  <div className="text-faded">
                    Létrehozva: {selectedEvent?.createdAt.slice(0, 10)}
                  </div>
                  <button
                    onClick={() => toggleRegistration()}
                    disabled={!canRegister || isPending}
                    className="bg-accent text-white px-3 py-2 hover:bg-accent/60 transition ease-in-out active:scale-95 active:duration-75 rounded-xl cursor-pointer disabled:bg-faded disabled:cursor-not-allowed"
                  >
                    {isPending
                      ? "Feldolgozás..."
                      : selectedEvent?.isUserRegistered
                        ? "Jelentkezés lemondása"
                        : "Jelentkezés"}
                  </button>
                </div>
                <div className="w-full mt-4 px-10 text-sm text-faded flex justify-end">
                  {selectedEvent && selectedEvent.maxParticipants
                    ? `${selectedEvent.registrationCount}/${selectedEvent.maxParticipants} jelentkező`
                    : selectedEvent
                      ? `${selectedEvent.registrationCount} jelentkező`
                      : ""}
                </div>
              </>
            ) : (
              <div className="mt-2 border-t border-faded/50 px-10 pt-6 pb-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl">Hozzászólások</h3>
                  {selectedEvent && (
                    <Link
                      href={`/app/events/${selectedEvent.id}/discussion`}
                      onClick={closeModal}
                      className="text-accent hover:underline"
                    >
                      Összes megnyitása
                    </Link>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    maxLength={2000}
                    placeholder="Írj egy hozzászólást..."
                    className="w-full border border-faded rounded-xl px-3 py-2 bg-white/70"
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
                          {!comment.isDeleted && (
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
                    <div className="text-faded">Még nincs hozzászólás.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    )
  );
};
