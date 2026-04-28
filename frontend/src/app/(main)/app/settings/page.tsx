"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  APP_SETTINGS_STORAGE_KEY,
  AppSettings,
  BooleanAppSettingKey,
  DEFAULT_APP_SETTINGS,
} from "@/lib/appSettings";
import { APP_SETTINGS_UPDATED_EVENT } from "@/lib/useAppSettings";
import { UserSettingJson } from "@/types";
import axios from "axios";
import { Bell, CalendarDays, Palette, User, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ToggleOption = {
  id: BooleanAppSettingKey;
  label: string;
  description: string;
};

type AccountFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const ToggleRow = ({
  option,
  value,
  onToggle,
}: {
  option: ToggleOption;
  value: boolean;
  onToggle: () => void;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 border-b border-faded/20 pb-3 min-w-0">
      <div className="min-w-0">
        <div className="font-medium break-words">{option.label}</div>
        <div className="text-faded text-sm">{option.description}</div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 self-start sm:self-auto w-14 h-8 rounded-full border border-faded/20 bg-secondary/80 p-1 cursor-pointer"
      >
        <span
          className={`block h-6 w-6 rounded-full transition ease-in-out ${
            value ? "translate-x-6 bg-accent" : "translate-x-0 bg-faded/60"
          }`}
        />
      </button>
    </div>
  );
};

const SettingsPage = () => {
  const { user, refreshUser, logout } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);
  const hasInitializedFromDb = useRef(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [accountMessage, setAccountMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const allowedSettingJson = useMemo<UserSettingJson>(
    () => ({
      emailReminders: settings.emailReminders,
      eventUpdates: settings.eventUpdates,
      commentsReplies: settings.commentsReplies,
      marketingNews: settings.marketingNews,
      showPastEvents: settings.showPastEvents,
      autoOpenEventModal: settings.autoOpenEventModal,
      compactCalendar: settings.compactCalendar,
      reducedMotion: settings.reducedMotion,
      highContrast: settings.highContrast,
      weekStart: settings.weekStart,
      showWeekNumbers: settings.showWeekNumbers,
      defaultCalendarView: settings.defaultCalendarView,
      hideCancelledAppointments: settings.hideCancelledAppointments,
    }),
    [settings],
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    try {
      const rawSettings = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
      const parsedSettings = rawSettings
        ? (JSON.parse(rawSettings) as Partial<AppSettings>)
        : {};

      setSettings({
        ...DEFAULT_APP_SETTINGS,
        ...parsedSettings,
        ...(user.settingJson ?? {}),
      });
    } catch {
      setSettings({
        ...DEFAULT_APP_SETTINGS,
        ...(user.settingJson ?? {}),
      });
    } finally {
      hasInitializedFromDb.current = true;
      setIsHydrated(true);
    }
  }, [user]);

  useEffect(() => {
    if (!isHydrated || !hasInitializedFromDb.current) {
      return;
    }

    window.localStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
    window.dispatchEvent(new Event(APP_SETTINGS_UPDATED_EVENT));
    setSaveState("saving");

    const timeoutId = window.setTimeout(async () => {
      try {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
          { settingJson: allowedSettingJson },
          { withCredentials: true },
        );
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 1200);
      } catch {
        setSaveState("idle");
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [allowedSettingJson, isHydrated, settings]);

  const setToggle = (id: BooleanAppSettingKey) => {
    setSettings((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const setSettingValue = <K extends keyof AppSettings>(
    id: K,
    value: AppSettings[K],
  ) => {
    setSettings((current) => ({
      ...current,
      [id]: value,
    }));
  };

  const openAccountModal = () => {
    setAccountMessage(null);
    setAccountForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      confirmPassword: "",
    });
    setIsAccountModalOpen(true);
  };

  const closeAccountModal = () => {
    if (isSavingAccount) {
      return;
    }
    setIsAccountModalOpen(false);
  };

  const notificationOptions: ToggleOption[] = [
    {
      id: "emailReminders",
      label: "Email emlékeztetők",
      description: "Emlékeztető üzenet esemény előtt 24 órával.",
    },
    {
      id: "eventUpdates",
      label: "Esemény frissítések",
      description: "Értesítés időpont- vagy helyszínváltozásról.",
    },
    {
      id: "commentsReplies",
      label: "Komment válaszok",
      description: "Értesítés, ha válaszolnak a hozzászólásodra.",
    },
    {
      id: "marketingNews",
      label: "Hírek és újdonságok",
      description: "Platform fejlesztések és új funkciók.",
    },
  ];

  const calendarOptions: ToggleOption[] = [
    {
      id: "showPastEvents",
      label: "Korábbi események megjelenítése",
      description: "Naptárban és listákban lásd a múltbeli eseményeket is.",
    },
    {
      id: "autoOpenEventModal",
      label: "Automatikus modal megnyitás",
      description: "Egyetlen napi eseménynél azonnal nyissa meg a részleteket.",
    },
    {
      id: "compactCalendar",
      label: "Kompakt naptár nézet",
      description: "Sűrített napkártyák kevesebb üres hellyel.",
    },
    {
      id: "showWeekNumbers",
      label: "Hétszámok mutatása",
      description: "A havi nézetben lásd az ISO hétszámot soronként.",
    },
    {
      id: "hideCancelledAppointments",
      label: "Lemondott időpontok elrejtése",
      description: "A naptárból és időpontlistákból rejti a lemondottakat.",
    },
  ];

  const appearanceOptions: ToggleOption[] = [
    {
      id: "reducedMotion",
      label: "Csökkentett animáció",
      description: "Kímélőbb mozgások az oldalváltásoknál.",
    },
    {
      id: "highContrast",
      label: "Nagy kontraszt",
      description: "Erősebb kontraszt a jobb olvashatóságért.",
    },
  ];

  return (
    <main className="w-7/8 m-auto min-h-screen pt-24 pb-20">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Beállítások</h1>
          <p className="text-faded mt-1">
            Kezeld a fiók és alkalmazás beállításait.
          </p>
        </div>
        <div className="text-xs text-faded pt-2">
          {saveState === "saving"
            ? "Beállítások mentése..."
            : saveState === "saved"
              ? "Mentve"
              : ""}
        </div>
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card-box h-auto! p-5 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-accent" />
            <h2 className="text-xl font-semibold">Fiók</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-faded/20 pb-2">
              <span className="text-faded">Név</span>
              <span className="font-medium break-all text-right">
                {user?.name ?? "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-faded/20 pb-2">
              <span className="text-faded">Email</span>
              <span className="font-medium break-all text-right">
                {user?.email ?? "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-faded/20 pb-2">
              <span className="text-faded">Szerepkör</span>
              <span className="font-medium capitalize">
                {user?.role ?? "-"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={openAccountModal}
                className="w-full sm:w-auto px-3 py-2 rounded-lg border border-faded/20 bg-secondary/60 hover:bg-secondary transition ease-in-out cursor-pointer text-sm"
              >
                Fiók szerkesztése
              </button>
            </div>
          </div>
        </div>

        <div className="card-box h-auto! p-5 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-accent" />
            <h2 className="text-xl font-semibold">Értesítések</h2>
          </div>
          <div className="space-y-3 text-sm">
            {notificationOptions.map((option) => (
              <ToggleRow
                key={option.id}
                option={option}
                value={settings[option.id]}
                onToggle={() => setToggle(option.id)}
              />
            ))}
          </div>
        </div>

        <div className="card-box h-auto! p-5 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={18} className="text-accent" />
            <h2 className="text-xl font-semibold">Naptár és események</h2>
          </div>
          <div className="space-y-3 text-sm">
            {calendarOptions.map((option) => (
              <ToggleRow
                key={option.id}
                option={option}
                value={settings[option.id]}
                onToggle={() => setToggle(option.id)}
              />
            ))}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm pt-1 border-b border-faded/20 pb-3">
              <div className="flex flex-col">
                <span className="font-medium">Hét kezdete</span>
                <span className="text-faded">
                  A naptár hete melyik nappal kezdődjön
                </span>
              </div>
              <select
                value={settings.weekStart}
                onChange={(event) =>
                  setSettingValue(
                    "weekStart",
                    event.target.value as AppSettings["weekStart"],
                  )
                }
                className="w-full sm:w-auto border border-faded/20 bg-secondary/70 rounded-lg px-2 py-1 cursor-pointer"
              >
                <option value="monday">Hétfő</option>
                <option value="sunday">Vasárnap</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm pt-1">
              <div className="flex flex-col">
                <span className="font-medium">Alap naptár nézet</span>
                <span className="text-faded">
                  A naptár megnyitásakor melyik nézet legyen alapértelmezett
                </span>
              </div>
              <select
                value={settings.defaultCalendarView}
                onChange={(event) =>
                  setSettingValue(
                    "defaultCalendarView",
                    event.target.value as AppSettings["defaultCalendarView"],
                  )
                }
                className="w-full sm:w-auto border border-faded/20 bg-secondary/70 rounded-lg px-2 py-1 cursor-pointer"
              >
                <option value="month">Havi nézet</option>
                <option value="agenda">Napi lista</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-box h-auto! p-5 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={18} className="text-accent" />
            <h2 className="text-xl font-semibold">Megjelenés</h2>
          </div>
          <div className="space-y-3 text-sm">
            {appearanceOptions.map((option) => (
              <ToggleRow
                key={option.id}
                option={option}
                value={settings[option.id]}
                onToggle={() => setToggle(option.id)}
              />
            ))}
          </div>
        </div>

        <div className="card-box h-auto! p-5 min-w-0 border-red-300/40 xl:col-span-2">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Veszélyzóna
          </h2>
          <p className="text-sm text-faded mb-4">
            A fiók törlése minden személyes adatodat deaktiválja, és
            kijelentkeztet. Ez a művelet nem visszavonható.
          </p>
          <button
            type="button"
            disabled={isDeletingAccount}
            onClick={async () => {
              const confirmed = window.confirm(
                "Biztosan törölni szeretnéd a fiókodat? Ez a művelet nem visszavonható.",
              );

              if (!confirmed) {
                return;
              }

              setIsDeletingAccount(true);
              try {
                await axios.delete(
                  `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
                  {
                    withCredentials: true,
                  },
                );
                await logout();
              } catch (error) {
                if (axios.isAxiosError(error)) {
                  setAccountMessage({
                    type: "error",
                    text:
                      error.response?.data?.message ||
                      error.response?.data?.error ||
                      "A fiók törlése sikertelen.",
                  });
                } else {
                  setAccountMessage({
                    type: "error",
                    text: "A fiók törlése sikertelen.",
                  });
                }
              } finally {
                setIsDeletingAccount(false);
              }
            }}
            className="px-4 py-2 rounded-lg border border-red-300/50 bg-red-50 text-red-700 hover:bg-red-100 transition ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeletingAccount ? "Fiók törlése..." : "Fiók törlése"}
          </button>
        </div>
      </section>

      {isAccountModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-faded/20 bg-primary p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xl font-semibold">Fiók szerkesztése</h3>
                <p className="text-sm text-faded mt-1">
                  Frissítsd a neved, email címed és jelszavad.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAccountModal}
                className="rounded-lg border border-faded/20 p-2 hover:bg-secondary transition ease-in-out cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {accountMessage ? (
              <div
                className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                  accountMessage.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {accountMessage.text}
              </div>
            ) : null}

            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                setAccountMessage(null);

                const nextName = accountForm.name.trim();
                const nextEmail = accountForm.email.trim();
                const nextPassword = accountForm.password;

                if (!nextName || !nextEmail) {
                  setAccountMessage({
                    type: "error",
                    text: "A név és email mező kötelező.",
                  });
                  return;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(nextEmail)) {
                  setAccountMessage({
                    type: "error",
                    text: "Érvénytelen email formátum.",
                  });
                  return;
                }

                if (nextPassword && nextPassword.length < 8) {
                  setAccountMessage({
                    type: "error",
                    text: "A jelszónak legalább 8 karakterből kell állnia.",
                  });
                  return;
                }

                if (nextPassword !== accountForm.confirmPassword) {
                  setAccountMessage({
                    type: "error",
                    text: "A jelszavak nem egyeznek.",
                  });
                  return;
                }

                setIsSavingAccount(true);
                try {
                  const { data } = await axios.put(
                    `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
                    {
                      name: nextName,
                      email: nextEmail,
                      ...(nextPassword ? { password: nextPassword } : {}),
                    },
                    {
                      withCredentials: true,
                    },
                  );

                  await refreshUser();

                  setAccountForm((current) => ({
                    ...current,
                    password: "",
                    confirmPassword: "",
                  }));

                  setAccountMessage({
                    type: "success",
                    text:
                      data?.requiresEmailVerification === true
                        ? "A fiók adatai frissültek. Kérlek erősítsd meg az új email címedet."
                        : "A fiók adatai sikeresen frissültek.",
                  });
                } catch (error) {
                  if (axios.isAxiosError(error)) {
                    setAccountMessage({
                      type: "error",
                      text:
                        error.response?.data?.message ||
                        error.response?.data?.error ||
                        "A fiók frissítése sikertelen.",
                    });
                  } else {
                    setAccountMessage({
                      type: "error",
                      text: "A fiók frissítése sikertelen.",
                    });
                  }
                } finally {
                  setIsSavingAccount(false);
                }
              }}
            >
              <div className="space-y-1">
                <label className="text-sm text-faded">Név</label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={(event) =>
                    setAccountForm((current) => ({
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
                  value={accountForm.email}
                  onChange={(event) =>
                    setAccountForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-faded">
                  Új jelszó (opcionális)
                </label>
                <input
                  type="password"
                  value={accountForm.password}
                  onChange={(event) =>
                    setAccountForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                  minLength={8}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-faded">
                  Új jelszó megerősítése
                </label>
                <input
                  type="password"
                  value={accountForm.confirmPassword}
                  onChange={(event) =>
                    setAccountForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-faded/25 bg-secondary/70 px-3 py-2 focus:outline-none focus:border-accent"
                  minLength={8}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAccountModal}
                  className="rounded-xl border border-faded/25 px-4 py-2 hover:bg-secondary transition ease-in-out"
                >
                  Bezárás
                </button>
                <button
                  type="submit"
                  disabled={isSavingAccount}
                  className="rounded-xl bg-accent px-4 py-2 text-white font-medium hover:bg-accent/85 transition disabled:bg-faded disabled:cursor-not-allowed"
                >
                  {isSavingAccount ? "Mentés..." : "Mentés"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default SettingsPage;
