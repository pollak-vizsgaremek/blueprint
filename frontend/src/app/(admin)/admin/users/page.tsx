"use client";

import { Spinner } from "@/components/Spinner";
import { AdminUserMutationResponse, GetAllUsersResponse, User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Mail, Plus, Search, Shield, Trash2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminFormModal } from "../../components/AdminFormModal";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { AdminStatusBadge } from "../../components/AdminStatusBadge";
import {
  formatDate,
  roleLabel,
  userStatusLabel,
} from "../../components/adminFormat";

type UserFormState = {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string;
  role: User["role"];
  status: "active" | "inactive" | "banned";
  emailVerified: boolean;
};

const initialFormState: UserFormState = {
  name: "",
  email: "",
  password: "",
  dateOfBirth: "",
  role: "user",
  status: "active",
  emailVerified: false,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ?? error.response?.data?.error ?? fallback
    );
  }

  return fallback;
};

const UsersAdminPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UserFormState>(initialFormState);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
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

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((user) =>
      `${user.name} ${user.email} ${user.role} ${user.status ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [search, users]);

  const resetForm = () => {
    setForm(initialFormState);
    setEditingUser(null);
    setIsFormModalOpen(false);
  };

  const openCreateModal = () => {
    setForm(initialFormState);
    setEditingUser(null);
    setMessage(null);
    setIsFormModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<UserFormState> = {
        name: form.name.trim(),
        email: form.email.trim(),
        dateOfBirth: form.dateOfBirth,
        role: form.role,
        status: form.status,
        emailVerified: form.emailVerified,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (editingUser) {
        const { data } = await axios.put<AdminUserMutationResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${editingUser.id}`,
          payload,
          {
            withCredentials: true,
          },
        );
        return data;
      }

      const { data } = await axios.post<AdminUserMutationResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users`,
        payload,
        {
          withCredentials: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      const wasEditing = Boolean(editingUser);
      resetForm();
      setMessage({
        type: "success",
        text: wasEditing ? "Felhasználó frissítve." : "Felhasználó létrehozva.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "A felhasználó mentése sikertelen."),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`,
        { status: "inactive" },
        { withCredentials: true },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      resetForm();
      setMessage({
        type: "success",
        text: "Felhasználó deaktiválva.",
      });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "A felhasználó deaktiválása sikertelen."),
      });
    },
  });

  const startEditing = (user: User) => {
    setEditingUser(user);
    setMessage(null);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      dateOfBirth: user.dateOfBirth ?? "",
      role: user.role,
      status: user.status ?? "active",
      emailVerified: Boolean(user.emailVerified),
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.dateOfBirth) {
      setMessage({
        type: "error",
        text: "A név, email és születési dátum kötelező.",
      });
      return;
    }

    if (!editingUser && !form.password) {
      setMessage({
        type: "error",
        text: "Új felhasználóhoz jelszó szükséges.",
      });
      return;
    }

    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (!editingUser) {
      return;
    }

    if (!window.confirm("Biztosan deaktiválni szeretnéd ezt a felhasználót?")) {
      return;
    }

    deleteMutation.mutate(editingUser.id);
  };

  return (
    <>
      <AdminPageHeader
        title="Felhasználók kezelése"
        description="Hozz létre felhasználókat, módosíts szerepkört, állapotot és alap fiókadatokat."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 transition ease-in-out cursor-pointer"
          >
            <Plus size={16} />
            Új felhasználó
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Felhasználólista</h2>
            <p className="text-sm text-faded">{filteredUsers.length} találat</p>
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-faded"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Keresés név, email, szerepkör alapján"
              className="w-full rounded-xl border border-faded/25 bg-secondary/70 py-2 pl-9 pr-3 focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-80 items-center justify-center">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Nem sikerült betölteni a felhasználókat.
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="h-80 rounded-xl border border-dashed border-faded/30 flex items-center justify-center text-faded">
            Nincs találat.
          </div>
        ) : (
          <div className="space-y-3 max-h-[820px] overflow-y-auto pr-1">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => startEditing(user)}
                className={`w-full rounded-xl border p-4 text-left transition ease-in-out cursor-pointer ${
                  editingUser?.id === user.id && isFormModalOpen
                    ? "border-accent bg-accent/5"
                    : "border-faded/20 bg-secondary/40 hover:bg-faded/10"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-faded text-white size-10 flex items-center justify-center shrink-0">
                        {user.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{user.name}</div>
                        <div className="text-sm text-faded truncate inline-flex items-center gap-1">
                          <Mail size={13} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-faded">
                      <div>Született: {formatDate(user.dateOfBirth)}</div>
                      <div>Regisztrált: {formatDate(user.createdAt)}</div>
                      <div>Jelentkezés: {user._count?.registrations ?? 0}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <AdminStatusBadge
                      tone={
                        user.role === "admin"
                          ? "accent"
                          : user.role === "teacher"
                            ? "blue"
                            : "neutral"
                      }
                    >
                      {roleLabel[user.role]}
                    </AdminStatusBadge>
                    <AdminStatusBadge
                      tone={
                        (user.status ?? "active") === "active" ? "green" : "red"
                      }
                    >
                      {userStatusLabel[user.status ?? "active"]}
                    </AdminStatusBadge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="mt-5 rounded-xl border border-faded/20 bg-secondary/40 p-4 text-sm text-faded">
        <div className="mb-2 flex items-center gap-2 font-medium text-text">
          <Shield size={16} className="text-accent" />
          Jogosultsági megjegyzés
        </div>
        Admin szerepkörrel minden admin oldal elérhető. Tanár szerepkör
        időpontfoglaláshoz választható célként.
      </div>

      <AdminFormModal
        isOpen={isFormModalOpen}
        onClose={resetForm}
        title={editingUser ? "Felhasználó szerkesztése" : "Új felhasználó"}
        description={editingUser ? editingUser.email : "Admin által létrehozott fiók"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-faded">Név</label>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-faded">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-faded">Jelszó</label>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                placeholder={editingUser ? "Csak módosításhoz" : "Kötelező"}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-faded">Születési dátum</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dateOfBirth: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-faded">Szerepkör</label>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value as User["role"],
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
              >
                <option value="user">Felhasználó</option>
                <option value="teacher">Tanár</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-faded">Állapot</label>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as UserFormState["status"],
                  }))
                }
                className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
              >
                <option value="active">Aktív</option>
                <option value="inactive">Inaktív</option>
                <option value="banned">Tiltott</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-faded/20 bg-secondary/40 p-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.emailVerified}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  emailVerified: event.target.checked,
                }))
              }
              className="size-4 accent-accent"
            />
            Email cím ellenőrizve
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent/80 transition ease-in-out disabled:bg-faded disabled:cursor-not-allowed cursor-pointer"
            >
              <UserRound size={16} />
              {saveMutation.isPending
                ? "Mentés..."
                : editingUser
                  ? "Frissítés"
                  : "Létrehozás"}
            </button>
            {editingUser ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/50 bg-red-50 px-4 py-2.5 font-medium text-red-700 hover:bg-red-100 transition ease-in-out disabled:text-faded disabled:bg-transparent disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 size={16} />
                Deaktiválás
              </button>
            ) : null}
          </div>
        </form>
      </AdminFormModal>
    </>
  );
};

export default UsersAdminPage;
