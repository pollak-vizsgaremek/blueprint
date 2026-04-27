"use client";

import { Spinner } from "@/components/Spinner";
import {
  AdminNewsItem,
  AdminNewsMutationResponse,
  AdminNewsResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { AdminFormModal } from "../../components/AdminFormModal";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { AdminStatusBadge } from "../../components/AdminStatusBadge";
import { formatDateTime } from "../../components/adminFormat";

type NewsFormState = {
  title: string;
  content: string;
  imageUrl: string;
  isPublished: boolean;
};

const initialFormState: NewsFormState = {
  title: "",
  content: "",
  imageUrl: "",
  isPublished: false,
};

const NewsAdminPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewsFormState>(initialFormState);
  const [editingNews, setEditingNews] = useState<AdminNewsItem | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data } = await axios.get<AdminNewsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/news`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const newsItems = data?.news ?? [];

  const resetForm = () => {
    setForm(initialFormState);
    setEditingNews(null);
    setIsFormModalOpen(false);
  };

  const openCreateModal = () => {
    setMessage(null);
    setForm(initialFormState);
    setEditingNews(null);
    setIsFormModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        imageUrl: form.imageUrl.trim() || null,
        isPublished: form.isPublished,
      };

      if (editingNews) {
        const { data } = await axios.put<AdminNewsMutationResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/news/${editingNews.id}`,
          payload,
          { withCredentials: true },
        );
        return data;
      }

      const { data } = await axios.post<AdminNewsMutationResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/news`,
        payload,
        { withCredentials: true },
      );
      return data;
    },
    onSuccess: () => {
      const wasEditing = Boolean(editingNews);
      resetForm();
      setMessage({
        type: "success",
        text: wasEditing ? "Hír frissítve." : "Hír létrehozva.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      queryClient.invalidateQueries({ queryKey: ["published-news"] });
      queryClient.invalidateQueries({ queryKey: ["latest-news"] });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: axios.isAxiosError(error)
          ? (error.response?.data?.message ??
            error.response?.data?.error ??
            "A hír mentése sikertelen.")
          : "A hír mentése sikertelen.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (newsId: number) => {
      const { data } = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/news/${newsId}`,
        { withCredentials: true },
      );
      return data;
    },
    onSuccess: () => {
      resetForm();
      setMessage({ type: "success", text: "Hír törölve." });
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      queryClient.invalidateQueries({ queryKey: ["published-news"] });
      queryClient.invalidateQueries({ queryKey: ["latest-news"] });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: axios.isAxiosError(error)
          ? (error.response?.data?.message ??
            error.response?.data?.error ??
            "A hír törlése sikertelen.")
          : "A hír törlése sikertelen.",
      });
    },
  });

  const startEditing = (news: AdminNewsItem) => {
    setEditingNews(news);
    setMessage(null);
    setForm({
      title: news.title,
      content: news.content,
      imageUrl: news.imageUrl ?? "",
      isPublished: news.isPublished,
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      setMessage({ type: "error", text: "A cím és tartalom kötelező." });
      return;
    }

    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (!editingNews) {
      return;
    }

    if (!window.confirm("Biztosan törölni szeretnéd ezt a hírt?")) {
      return;
    }

    deleteMutation.mutate(editingNews.id);
  };

  return (
    <>
      <AdminPageHeader
        title="Hírek kezelése"
        description="Globális, frontend híroldalon megjelenő hírek és közlemények publikálása."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 transition ease-in-out cursor-pointer"
          >
            <Plus size={16} />
            Új hír
          </button>
        }
      />

      {message ? (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="card-box h-auto! p-5 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Hírfolyam</h2>
            <p className="text-sm text-faded">{newsItems.length} aktív hír</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-80 items-center justify-center">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Nem sikerült betölteni a híreket.
          </div>
        ) : newsItems.length === 0 ? (
          <div className="h-80 rounded-xl border border-dashed border-faded/30 flex items-center justify-center text-faded">
            Nincs hír.
          </div>
        ) : (
          <div className="space-y-3 max-h-[820px] overflow-y-auto pr-1">
            {newsItems.map((news) => (
              <article
                key={news.id}
                className={`rounded-xl border p-4 transition ease-in-out ${
                  editingNews?.id === news.id && isFormModalOpen
                    ? "border-accent bg-accent/5"
                    : "border-faded/20 bg-secondary/40"
                }`}
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {news.imageUrl ? (
                    <div className="relative h-32 md:h-28 md:w-40 shrink-0 overflow-hidden rounded-xl bg-faded/20">
                      <Image
                        src={news.imageUrl}
                        alt={news.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-32 md:h-28 md:w-40 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <Newspaper size={34} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold leading-tight">
                          {news.title}
                        </h3>
                        <p className="text-sm text-faded line-clamp-3 mt-1">
                          {news.content}
                        </p>
                      </div>
                      <AdminStatusBadge tone={news.isPublished ? "green" : "amber"}>
                        {news.isPublished ? "Publikált" : "Piszkozat"}
                      </AdminStatusBadge>
                    </div>
                    <div className="text-sm text-faded mt-3">
                      {news.author?.name ?? "Ismeretlen szerző"} -{" "}
                      {formatDateTime(news.publishedAt ?? news.createdAt)}
                    </div>
                    <button
                      type="button"
                      onClick={() => startEditing(news)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-faded/30 px-3 py-1.5 text-sm hover:bg-faded/10 transition ease-in-out cursor-pointer"
                    >
                      <Pencil size={14} />
                      Szerkesztés
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <AdminFormModal
        isOpen={isFormModalOpen}
        onClose={resetForm}
        title={editingNews ? "Hír szerkesztése" : "Új hír"}
        description={editingNews ? editingNews.title : "Közlemény létrehozása"}
      >
        {message ? (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm text-faded">Cím</label>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-faded">Tartalom</label>
            <textarea
              value={form.content}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
              className="min-h-52 w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-faded">Kép URL</label>
            <input
              value={form.imageUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
              placeholder="Opcionális"
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-faded/20 bg-secondary/40 p-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isPublished: event.target.checked,
                }))
              }
              className="size-4 accent-accent"
            />
            Publikálva jelenjen meg a frontend híroldalon
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent/80 transition ease-in-out disabled:bg-faded disabled:cursor-not-allowed cursor-pointer"
            >
              <Newspaper size={16} />
              {saveMutation.isPending
                ? "Mentés..."
                : editingNews
                  ? "Frissítés"
                  : "Létrehozás"}
            </button>
            {editingNews ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/50 bg-red-50 px-4 py-2.5 font-medium text-red-700 hover:bg-red-100 transition ease-in-out disabled:text-faded disabled:bg-transparent disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 size={16} />
                Törlés
              </button>
            ) : null}
          </div>
        </form>
      </AdminFormModal>
    </>
  );
};

export default NewsAdminPage;
