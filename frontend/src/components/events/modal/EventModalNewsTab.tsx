import { EventNewsItem } from "@/types";

type EventModalNewsTabProps = {
  isEventNewsLoading: boolean;
  isEventNewsError: boolean;
  canManageNews: boolean;
  allNews: EventNewsItem[];
  drafts: EventNewsItem[];
  newsTitle: string;
  setNewsTitle: (value: string) => void;
  newsContent: string;
  setNewsContent: (value: string) => void;
  publishNow: boolean;
  setPublishNow: (next: boolean | ((previous: boolean) => boolean)) => void;
  editingDraftId: number | null;
  canUpdateDraft: boolean;
  canSubmitNews: boolean;
  isCreateEventNewsPending: boolean;
  isUpdateEventNewsPending: boolean;
  isNewsManagementPending: boolean;
  onCreateEventNews: () => void;
  onSubmitDraftChanges: () => void;
  onCancelDraftEdit: () => void;
  onEditDraft: (news: EventNewsItem) => void;
  onPublishDraft: (newsId: number) => void;
  onMovePublishedToDraft: (newsId: number) => void;
  onDeleteNews: (newsId: number) => void;
};

export const EventModalNewsTab = ({
  isEventNewsLoading,
  isEventNewsError,
  canManageNews,
  allNews,
  drafts,
  newsTitle,
  setNewsTitle,
  newsContent,
  setNewsContent,
  publishNow,
  setPublishNow,
  editingDraftId,
  canUpdateDraft,
  canSubmitNews,
  isCreateEventNewsPending,
  isUpdateEventNewsPending,
  isNewsManagementPending,
  onCreateEventNews,
  onSubmitDraftChanges,
  onCancelDraftEdit,
  onEditDraft,
  onPublishDraft,
  onMovePublishedToDraft,
  onDeleteNews,
}: EventModalNewsTabProps) => {
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

  return (
    <div className="pt-2 px-4 sm:px-6 lg:px-10 pb-2 mt-5 flex grow overflow-y-auto flex-col">
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
                  onSubmitDraftChanges();
                  return;
                }

                onCreateEventNews();
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
                onClick={onCancelDraftEdit}
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
            {drafts.map((news) => (
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
                    onClick={() => onEditDraft(news)}
                    disabled={isNewsManagementPending}
                    className="text-xs px-2 py-1 rounded-lg bg-sky-100 text-sky-700 disabled:bg-faded/40 disabled:text-faded disabled:cursor-not-allowed"
                  >
                    Szerkesztés
                  </button>
                  <button
                    onClick={() => onPublishDraft(news.id)}
                    disabled={isNewsManagementPending}
                    className="text-xs px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 disabled:bg-faded/40 disabled:text-faded disabled:cursor-not-allowed"
                  >
                    Publikálás
                  </button>
                  <button
                    onClick={() => onDeleteNews(news.id)}
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
            .map((news) => (
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
                  {new Date(news.publishedAt || news.createdAt).toLocaleString(
                    "hu-HU",
                  )}
                  {news.author?.name ? ` • ${news.author.name}` : ""}
                </div>
                <div className="text-sm whitespace-pre-wrap">
                  {news.content}
                </div>
                {canManageNews && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => onMovePublishedToDraft(news.id)}
                      disabled={isNewsManagementPending}
                      className="text-xs px-2 py-1 rounded-lg bg-slate-200 text-slate-700 disabled:bg-faded/40 disabled:text-faded disabled:cursor-not-allowed"
                    >
                      Vázlatba
                    </button>
                    <button
                      onClick={() => onDeleteNews(news.id)}
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
