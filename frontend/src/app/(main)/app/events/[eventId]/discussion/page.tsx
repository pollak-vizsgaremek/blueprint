"use client";

import { Spinner } from "@/components/Spinner";
import {
  CreateEventCommentResponse,
  DeleteEventCommentResponse,
  EventComment,
  GetEventCommentsResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

const EventDiscussionPage = () => {
  const params = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState("");

  const eventId = useMemo(() => Number(params.eventId), [params.eventId]);

  const {
    data: discussion,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["event-comments", eventId],
    enabled: Number.isFinite(eventId),
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

  const { mutate: createComment, isPending } = useMutation({
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
    onSuccess: (response) => {
      setCommentContent("");

      if (response?.data?.comment?.isDeleted) {
        window.alert(
          "A hozzászólás moderálás miatt el lett rejtve. Ezt csak adminok láthatják.",
        );
      }

      queryClient.invalidateQueries({ queryKey: ["event-comments", eventId] });
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
        await axios.delete<DeleteEventCommentResponse>(
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

  const canSubmit = commentContent.trim().length > 0 && !isPending;

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !discussion) {
    return (
      <main className="w-7/8 m-auto mb-20">
        <Link href="/app/events" className="text-accent hover:underline">
          Vissza az eseményekhez
        </Link>
        <div className="mt-4 text-red-600">
          Nem sikerült betölteni a beszélgetést.
        </div>
      </main>
    );
  }

  return (
    <main className="w-7/8 m-auto mb-20">
      <div className="flex items-start justify-between gap-4 mb-8 border-b border-faded/50 pb-4">
        <div>
          <Link href="/app/events" className="text-accent hover:underline">
            Vissza az eseményekhez
          </Link>
          <h1 className="text-3xl mt-2">
            {discussion.event.name} - beszélgetés
          </h1>
          <div className="text-faded text-sm">
            {discussion.event.location} |{" "}
            {new Date(discussion.event.date).toLocaleString("hu-HU")}
          </div>
        </div>
        <div className="text-sm text-faded">
          {discussion.comments.length} hozzászólás
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-faded/50 p-4 bg-secondary/40">
        <h2 className="text-xl mb-3">Új hozzászólás</h2>
        <textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Írd ide a hozzászólásodat..."
          className="w-full rounded-xl border border-faded px-3 py-2 bg-white/80"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => createComment()}
            disabled={!canSubmit}
            className="bg-accent text-white px-4 py-2 rounded-xl disabled:bg-faded disabled:cursor-not-allowed"
          >
            {isPending ? "Mentés..." : "Küldés"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        {discussion.comments.length ? (
          discussion.comments.map((comment: EventComment) => (
            <article
              key={comment.id}
              className={`rounded-2xl border p-4 ${
                comment.isDeleted
                  ? "border-slate-300/60 bg-slate-100/70"
                  : "border-faded/50 bg-secondary/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1 gap-3">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{comment.user.name}</div>
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
                <div className="flex items-center gap-3">
                  <div className="text-sm text-faded">
                    {new Date(comment.createdAt).toLocaleString("hu-HU")}
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
              </div>
              <p
                className={`whitespace-pre-wrap ${
                  comment.isDeleted ? "text-slate-500" : ""
                }`}
              >
                {comment.content}
              </p>
            </article>
          ))
        ) : (
          <div className="text-faded">
            Még nincs hozzászólás ehhez az eseményhez.
          </div>
        )}
      </section>
    </main>
  );
};

export default EventDiscussionPage;
