"use client";

import {
  CreateEventCommentResponse,
  DeleteEventCommentResponse,
  EventComment,
  GetEventCommentsResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useEventDetail } from "../../../../../contexts/EventDetailContext";
import { isReducedMotionEnabled } from "@/lib/motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const EventDiscussionTabPage = () => {
  const queryClient = useQueryClient();
  const { eventId } = useEventDetail();
  const [commentContent, setCommentContent] = useState("");

  const { data: commentsData, isLoading: isCommentsLoading } = useQuery({
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

  useGSAP(() => {
    if (isReducedMotionEnabled() || isCommentsLoading) {
      return;
    }

    gsap.from(".page-content", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
  }, [isCommentsLoading]);

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

  const canSubmitComment =
    commentContent.trim().length > 0 && !isCommentPending;

  if (isCommentsLoading) {
    return;
  }

  return (
    <div className="pt-2 px-10 pb-2 flex grow overflow-y-scroll flex-col page-content">
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
                <div className="text-sm font-semibold">{comment.user.name}</div>
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
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
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

export default EventDiscussionTabPage;
