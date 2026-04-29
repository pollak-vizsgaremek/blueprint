import { EventComment } from "@/types";

type EventModalDiscussionTabProps = {
  commentContent: string;
  setCommentContent: (value: string) => void;
  canSubmitComment: boolean;
  isCommentPending: boolean;
  onCreateComment: () => void;
  isCommentsLoading: boolean;
  comments: EventComment[];
  isDeleteCommentPending: boolean;
  onDeleteComment: (commentId: number) => void;
};

export const EventModalDiscussionTab = ({
  commentContent,
  setCommentContent,
  canSubmitComment,
  isCommentPending,
  onCreateComment,
  isCommentsLoading,
  comments,
  isDeleteCommentPending,
  onDeleteComment,
}: EventModalDiscussionTabProps) => {
  return (
    <div className="mt-4 flex grow flex-col overflow-y-auto px-4 pb-2 pt-2 sm:mt-5 sm:px-6 lg:px-10">
      <div className="mb-4 mt-1 flex flex-col gap-2 sm:flex-row">
        <input
          value={commentContent}
          onChange={(event) => setCommentContent(event.target.value)}
          maxLength={2000}
          placeholder="Írj egy hozzászólást..."
          className="w-full border border-faded/60 focus:outline-2 focus:outline-accent rounded-xl px-3 py-2 bg-white/20"
        />
        <button
          onClick={onCreateComment}
          disabled={!canSubmitComment}
          className="rounded-xl bg-accent px-4 py-2 text-white disabled:bg-faded disabled:cursor-not-allowed sm:w-auto"
        >
          {isCommentPending ? "Mentés..." : "Küldés"}
        </button>
      </div>

      <div className="space-y-3">
        {isCommentsLoading ? (
          <div className="text-faded">Betöltés...</div>
        ) : comments.length ? (
          comments.map((comment) => (
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
                    onClick={() => onDeleteComment(comment.id)}
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
