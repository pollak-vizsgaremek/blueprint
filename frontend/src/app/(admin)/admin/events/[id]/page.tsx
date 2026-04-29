"use client";

import { Spinner } from "@/components/Spinner";
import {
  AdminEventRegistrationsResponse,
  AdminRegistration,
  EventComment,
  EventNewsItem,
  GetAllEventsResponse,
  GetAllUsersResponse,
  GetEventCommentsResponse,
  GetEventNewsResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  MessageSquare,
  Newspaper,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminFormModal } from "../../../components/AdminFormModal";
import { AdminPageHeader } from "../../../components/AdminPageHeader";
import { AdminStatusBadge } from "../../../components/AdminStatusBadge";
import {
  formatDateTime,
  registrationStatusLabel,
} from "../../../components/adminFormat";

type RegistrationFormState = {
  userId: string;
  status: AdminRegistration["status"];
};

type EventNewsFormState = {
  title: string;
  content: string;
  imageUrl: string;
  isPublished: boolean;
};

const initialRegistrationForm: RegistrationFormState = {
  userId: "",
  status: "registered",
};

const initialNewsForm: EventNewsFormState = {
  title: "",
  content: "",
  imageUrl: "",
  isPublished: false,
};

const registrationTone: Record<
  AdminRegistration["status"],
  "green" | "amber" | "blue"
> = {
  registered: "green",
  cancelled: "amber",
  attended: "blue",
};

const registrationManagementUnavailableMessage =
  "A backend jelenleg csak saját jelentkezés létrehozását és törlését támogatja.";
const commentUpdateUnavailableMessage =
  "A backend kommenteknél jelenleg csak a törlés végpontot támogatja.";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ?? error.response?.data?.error ?? fallback
    );
  }

  return fallback;
};

const AdminEventDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const queryClient = useQueryClient();
  const [registrationForm, setRegistrationForm] =
    useState<RegistrationFormState>(initialRegistrationForm);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] =
    useState<AdminRegistration | null>(null);
  const [newsForm, setNewsForm] = useState<EventNewsFormState>(initialNewsForm);
  const [editingNews, setEditingNews] = useState<EventNewsItem | null>(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const closeRegistrationModal = () => {
    setIsRegistrationModalOpen(false);
    setEditingRegistration(null);
    setRegistrationForm(initialRegistrationForm);
  };

  const closeNewsModal = () => {
    setIsNewsModalOpen(false);
    setEditingNews(null);
    setNewsForm(initialNewsForm);
  };

  const eventsQuery = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data } = await axios.get<GetAllEventsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const registrationsQuery = useQuery({
    queryKey: ["admin-event-registrations", eventId],
    enabled: Number.isFinite(eventId),
    queryFn: async () => {
      const { data } = await axios.get<AdminEventRegistrationsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/registrations`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await axios.get<GetAllUsersResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
  });

  const newsQuery = useQuery({
    queryKey: ["admin-event-news", eventId],
    enabled: Number.isFinite(eventId),
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

  const commentsQuery = useQuery({
    queryKey: ["admin-event-comments", eventId],
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

  const event = useMemo(
    () => eventsQuery.data?.find((item) => item.id === eventId),
    [eventId, eventsQuery.data],
  );

  const users = usersQuery.data ?? [];
  const registrations = registrationsQuery.data?.registrations ?? [];
  const newsItems = newsQuery.data?.news ?? [];
  const comments = commentsQuery.data?.comments ?? [];

  const availableUsers = useMemo(() => {
    const registeredUserIds = new Set(
      registrations.map((registration) => registration.user.id),
    );
    return users.filter(
      (user) =>
        !registeredUserIds.has(user.id) &&
        (user.status ?? "active") === "active",
    );
  }, [registrations, users]);

  const invalidateEventDetails = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    queryClient.invalidateQueries({
      queryKey: ["admin-event-registrations", eventId],
    });
    queryClient.invalidateQueries({ queryKey: ["admin-event-news", eventId] });
    queryClient.invalidateQueries({
      queryKey: ["admin-event-comments", eventId],
    });
    queryClient.invalidateQueries({ queryKey: ["published-news"] });
    queryClient.invalidateQueries({ queryKey: ["latest-news"] });
  };

  const saveRegistrationMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        userId: Number(registrationForm.userId),
        status: registrationForm.status,
      };

      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}/registrations`,
        payload,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      closeRegistrationModal();
      setMessage({ type: "success", text: "Jelentkezés sikeresen hozzáadva." });
      invalidateEventDetails();
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "A jelentkezés hozzáadása sikertelen."),
      });
    },
  });

  const updateRegistrationMutation = useMutation({
    mutationFn: async (payload: {
      registrationId: number;
      status: AdminRegistration["status"];
    }) => {
      const { data } = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}/registrations/${payload.registrationId}`,
        { status: payload.status },
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      closeRegistrationModal();
      setMessage({ type: "success", text: "Jelentkezés állapota frissítve." });
      invalidateEventDetails();
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "A jelentkezés frissítése sikertelen."),
      });
    },
  });

  const deleteRegistrationMutation = useMutation({
    mutationFn: async (registrationId: number) => {
      const { data } = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}/registrations/${registrationId}`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      closeRegistrationModal();
      setMessage({ type: "success", text: "Jelentkezés törölve." });
      invalidateEventDetails();
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "A jelentkezés törlése sikertelen."),
      });
    },
  });

  const saveNewsMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: newsForm.title.trim(),
        content: newsForm.content.trim(),
        imageUrl: newsForm.imageUrl.trim() || null,
        isPublished: newsForm.isPublished,
      };

      if (editingNews) {
        const { data } = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/news/${editingNews.id}`,
          payload,
          {
            withCredentials: true,
          },
        );
        return data;
      }

      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/news`,
        payload,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      const wasEditing = Boolean(editingNews);
      closeNewsModal();
      setMessage({
        type: "success",
        text: wasEditing ? "Eseményhír frissítve." : "Eseményhír létrehozva.",
      });
      invalidateEventDetails();
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Az eseményhír mentése sikertelen."),
      });
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: async (newsId: number) => {
      const { data } = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/news/${newsId}`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      closeNewsModal();
      setMessage({ type: "success", text: "Eseményhír törölve." });
      invalidateEventDetails();
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Az eseményhír törlése sikertelen."),
      });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async (payload: {
      commentId: number;
      payload: Partial<EventComment> & { isDeleted?: boolean };
    }) => {
      const { data } = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}/comments/${payload.commentId}`,
        payload.payload,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      setMessage({ type: "success", text: "Komment frissítve." });
      invalidateEventDetails();
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "A komment frissítése sikertelen."),
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const { data } = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/comments/${commentId}`,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      setMessage({ type: "success", text: "Komment elrejtve." });
      invalidateEventDetails();
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "A komment törlése sikertelen."),
      });
    },
  });

  const startEditingNews = (news: EventNewsItem) => {
    setEditingNews(news);
    setNewsForm({
      title: news.title,
      content: news.content,
      imageUrl: news.imageUrl ?? "",
      isPublished: news.isPublished,
    });
    setIsNewsModalOpen(true);
  };

  const openCreateRegistrationModal = () => {
    setMessage(null);
    setEditingRegistration(null);
    setRegistrationForm(initialRegistrationForm);
    setIsRegistrationModalOpen(true);
  };

  const openEditRegistrationModal = (registration: AdminRegistration) => {
    setMessage(null);
    setEditingRegistration(registration);
    setRegistrationForm({
      userId: String(registration.user.id),
      status: registration.status,
    });
    setIsRegistrationModalOpen(true);
  };

  const openCreateNewsModal = () => {
    setMessage(null);
    setEditingNews(null);
    setNewsForm(initialNewsForm);
    setIsNewsModalOpen(true);
  };

  const handleDeleteEditingRegistration = () => {
    if (!editingRegistration) {
      return;
    }

    if (!window.confirm("Biztosan törölni szeretnéd ezt a jelentkezést?")) {
      return;
    }

    deleteRegistrationMutation.mutate(editingRegistration.id);
  };

  const handleDeleteEditingNews = () => {
    if (!editingNews) {
      return;
    }

    if (!window.confirm("Biztosan törölni szeretnéd ezt az eseményhírt?")) {
      return;
    }

    deleteNewsMutation.mutate(editingNews.id);
  };

  const handleSaveRegistration = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingRegistration) {
      updateRegistrationMutation.mutate({
        registrationId: editingRegistration.id,
        status: registrationForm.status,
      });
      return;
    }

    if (!registrationForm.userId) {
      setMessage({ type: "error", text: "Válassz felhasználót." });
      return;
    }

    saveRegistrationMutation.mutate();
  };

  const handleSaveNews = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newsForm.title.trim() || !newsForm.content.trim()) {
      setMessage({
        type: "error",
        text: "Az eseményhír címe és tartalma kötelező.",
      });
      return;
    }

    saveNewsMutation.mutate();
  };

  if (
    eventsQuery.isLoading ||
    registrationsQuery.isLoading ||
    newsQuery.isLoading ||
    commentsQuery.isLoading
  ) {
    return (
      <div className="flex min-h-[45vh] sm:min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!event || Number.isNaN(eventId)) {
    return (
      <div className="card-box h-auto! p-6">
        <div className="text-xl font-semibold mb-2">Esemény nem található</div>
        <Link href="/admin/events" className="text-accent hover:text-accent/70">
          Vissza az eseményekhez
        </Link>
      </div>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={event.name}
        description="Eseményhez kapcsolódó jelentkezések, eseményhírek és kommentmoderáció kezelése."
        actions={
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 rounded-xl border border-faded/20 bg-secondary/60 px-4 py-2 text-sm hover:bg-secondary transition ease-in-out"
          >
            <ArrowLeft size={16} />
            Vissza
          </Link>
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

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-5">
        <div className="card-box h-auto! p-5 xl:col-span-2">
          <h2 className="text-xl font-semibold mb-3">Esemény adatok</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-faded">Időpont</div>
              <div className="font-medium">{formatDateTime(event.date)}</div>
            </div>
            <div>
              <div className="text-faded">Helyszín</div>
              <div className="font-medium">{event.location}</div>
            </div>
            <div>
              <div className="text-faded">Létrehozó</div>
              <div className="font-medium">{event.creator}</div>
            </div>
            <div>
              <div className="text-faded">Kapacitás</div>
              <div className="font-medium">
                {
                  registrations.filter(
                    (registration) => registration.status === "registered",
                  ).length
                }
                {event.maxParticipants ? ` / ${event.maxParticipants}` : ""} fő
              </div>
            </div>
          </div>
        </div>
        <div className="card-box h-auto! p-5">
          <div className="text-sm text-faded">Jelentkezések</div>
          <div className="text-3xl font-semibold mt-1">
            {registrations.length}
          </div>
        </div>
        <div className="card-box h-auto! p-5">
          <div className="text-sm text-faded">Kommentek</div>
          <div className="text-3xl font-semibold mt-1">{comments.length}</div>
        </div>
      </section>

      <section className="grid grid-cols-1 2xl:grid-cols-2 gap-5">
        <div className="card-box h-auto! p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users size={18} className="text-accent" />
              Jelentkezések
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-faded">
                {registrations.length} db
              </span>
              <button
                type="button"
                onClick={openCreateRegistrationModal}
                className="inline-flex items-center gap-1.5 rounded-lg border border-faded/30 px-3 py-1.5 text-sm hover:bg-faded/10 transition ease-in-out cursor-pointer"
              >
                <Plus size={14} />
                Új
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {registrations.length === 0 ? (
              <div className="min-h-[180px] sm:min-h-[220px] rounded-xl border border-dashed border-faded/30 flex items-center justify-center text-faded">
                Nincs jelentkezés.
              </div>
            ) : (
              registrations.map((registration) => (
                <div
                  key={registration.id}
                  className="rounded-xl border border-faded/20 bg-secondary/40 p-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {registration.user.name}
                      </div>
                      <div className="text-sm text-faded">
                        {registration.user.email}
                      </div>
                      <div className="text-xs text-faded mt-1">
                        {formatDateTime(registration.registeredAt)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <AdminStatusBadge
                        tone={registrationTone[registration.status]}
                      >
                        {registrationStatusLabel[registration.status]}
                      </AdminStatusBadge>
                      <button
                        type="button"
                        onClick={() => openEditRegistrationModal(registration)}
                        className="rounded-lg border border-faded/30 px-3 py-1.5 text-sm hover:bg-faded/10 transition ease-in-out cursor-pointer"
                      >
                        Szerkesztés
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-box h-auto! p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Newspaper size={18} className="text-accent" />
              Eseményhírek
            </h2>
            <button
              type="button"
              onClick={openCreateNewsModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-faded/30 px-3 py-1.5 text-sm hover:bg-faded/10 transition ease-in-out cursor-pointer"
            >
              <Plus size={14} />
              Új hír
            </button>
          </div>

          <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
            {newsItems.length === 0 ? (
              <div className="min-h-[180px] sm:min-h-[220px] rounded-xl border border-dashed border-faded/30 flex items-center justify-center text-faded">
                Nincs eseményhír.
              </div>
            ) : (
              newsItems.map((news) => (
                <article
                  key={news.id}
                  className="rounded-xl border border-faded/20 bg-secondary/40 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{news.title}</div>
                      <p className="text-sm text-faded line-clamp-2 mt-1">
                        {news.content}
                      </p>
                      <div className="text-xs text-faded mt-2">
                        {formatDateTime(news.publishedAt ?? news.createdAt)}
                      </div>
                    </div>
                    <AdminStatusBadge
                      tone={news.isPublished ? "green" : "amber"}
                    >
                      {news.isPublished ? "Publikált" : "Piszkozat"}
                    </AdminStatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditingNews(news)}
                      className="rounded-lg border border-faded/30 px-3 py-1.5 text-sm hover:bg-faded/10 transition ease-in-out cursor-pointer"
                    >
                      Szerkesztés
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNewsMutation.mutate(news.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition ease-in-out cursor-pointer"
                    >
                      Törlés
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="card-box h-auto! p-5 min-w-0 2xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare size={18} className="text-accent" />
              Kommentmoderáció
            </h2>
            <span className="text-sm text-faded">
              {comments.length} komment
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {comments.length === 0 ? (
              <div className="min-h-[180px] sm:min-h-[220px] rounded-xl border border-dashed border-faded/30 flex items-center justify-center text-faded xl:col-span-2">
                Nincs komment.
              </div>
            ) : (
              comments.map((comment) => (
                <article
                  key={comment.id}
                  className="rounded-xl border border-faded/20 bg-secondary/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-medium">{comment.user.name}</div>
                      <div className="text-xs text-faded">
                        {formatDateTime(comment.createdAt)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <AdminStatusBadge
                        tone={comment.isVerified ? "green" : "amber"}
                      >
                        {comment.isVerified ? "Ellenőrzött" : "Nem ellenőrzött"}
                      </AdminStatusBadge>
                      {comment.isDeleted ? (
                        <AdminStatusBadge tone="red">Rejtett</AdminStatusBadge>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateCommentMutation.mutate({
                          commentId: comment.id,
                          payload: { isVerified: !comment.isVerified },
                        })
                      }
                      className="rounded-lg border border-faded/30 px-3 py-1.5 text-sm hover:bg-faded/10 transition ease-in-out cursor-pointer"
                    >
                      {comment.isVerified
                        ? "Ellenőrzés visszavonása"
                        : "Ellenőrzött"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateCommentMutation.mutate({
                          commentId: comment.id,
                          payload: { isDeleted: !comment.isDeleted },
                        })
                      }
                      className="rounded-lg border border-faded/30 px-3 py-1.5 text-sm hover:bg-faded/10 transition ease-in-out cursor-pointer"
                    >
                      {comment.isDeleted ? "Visszaállítás" : "Elrejtés"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition ease-in-out cursor-pointer"
                    >
                      Törlés
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <AdminFormModal
        isOpen={isRegistrationModalOpen}
        onClose={closeRegistrationModal}
        title={
          editingRegistration ? "Jelentkezés szerkesztése" : "Új jelentkezés"
        }
        description={event.name}
      >
        <form className="space-y-4" onSubmit={handleSaveRegistration}>
          {editingRegistration ? (
            <div className="rounded-xl border border-faded/20 bg-secondary/40 p-3 text-sm">
              <div className="font-medium">{editingRegistration.user.name}</div>
              <div className="text-faded">{editingRegistration.user.email}</div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-sm text-faded">Felhasználó</label>
              <select
                value={registrationForm.userId}
                onChange={(event) =>
                  setRegistrationForm((current) => ({
                    ...current,
                    userId: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
              >
                <option value="">Felhasználó hozzáadása...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm text-faded">Állapot</label>
            <select
              value={registrationForm.status}
              onChange={(event) =>
                setRegistrationForm((current) => ({
                  ...current,
                  status: event.target.value as AdminRegistration["status"],
                }))
              }
              className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
            >
              <option value="registered">Jelentkezve</option>
              <option value="cancelled">Lemondva</option>
              <option value="attended">Részt vett</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={
                saveRegistrationMutation.isPending ||
                updateRegistrationMutation.isPending
              }
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent/80 transition ease-in-out disabled:bg-faded cursor-pointer"
            >
              {saveRegistrationMutation.isPending ||
              updateRegistrationMutation.isPending
                ? "Mentés..."
                : editingRegistration
                  ? "Frissítés"
                  : "Létrehozás"}
            </button>
            {editingRegistration ? (
              <button
                type="button"
                onClick={handleDeleteEditingRegistration}
                disabled={deleteRegistrationMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/50 bg-red-50 px-4 py-2.5 font-medium text-red-700 hover:bg-red-100 transition ease-in-out disabled:text-faded disabled:bg-transparent disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 size={16} />
                Törlés
              </button>
            ) : null}
          </div>
        </form>
      </AdminFormModal>

      <AdminFormModal
        isOpen={isNewsModalOpen}
        onClose={closeNewsModal}
        title={editingNews ? "Eseményhír szerkesztése" : "Új eseményhír"}
        description={event.name}
      >
        <form className="space-y-3" onSubmit={handleSaveNews}>
          <input
            value={newsForm.title}
            onChange={(event) =>
              setNewsForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Hír címe"
            className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
          />
          <textarea
            value={newsForm.content}
            onChange={(event) =>
              setNewsForm((current) => ({
                ...current,
                content: event.target.value,
              }))
            }
            placeholder="Hír tartalma"
            className="min-h-28 w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
          />
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
            <input
              value={newsForm.imageUrl}
              onChange={(event) =>
                setNewsForm((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }))
              }
              placeholder="Kép URL (opcionális)"
              className="rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
            />
            <label className="flex items-center gap-2 rounded-xl border border-faded/20 bg-secondary/40 px-3 py-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newsForm.isPublished}
                onChange={(event) =>
                  setNewsForm((current) => ({
                    ...current,
                    isPublished: event.target.checked,
                  }))
                }
                className="size-4 accent-accent"
              />
              Publikált
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={saveNewsMutation.isPending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent/80 transition ease-in-out disabled:bg-faded cursor-pointer"
            >
              {saveNewsMutation.isPending
                ? "Mentés..."
                : editingNews
                  ? "Eseményhír frissítése"
                  : "Eseményhír létrehozása"}
            </button>
            {editingNews ? (
              <button
                type="button"
                onClick={handleDeleteEditingNews}
                disabled={deleteNewsMutation.isPending}
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

export default AdminEventDetailsPage;
