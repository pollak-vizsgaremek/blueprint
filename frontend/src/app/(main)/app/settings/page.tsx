"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  APP_SETTINGS_STORAGE_KEY,
  AppSettings,
  BooleanAppSettingKey,
  DEFAULT_APP_SETTINGS,
} from "@/lib/appSettings";
import { APP_SETTINGS_UPDATED_EVENT } from "@/lib/useAppSettings";
import {
  Bell,
  CalendarDays,
  Eye,
  Globe,
  Lock,
  Palette,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

type ToggleOption = {
  id: BooleanAppSettingKey;
  label: string;
  description: string;
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
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);
  const hasInitializedFromDb = useRef(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    try {
      const rawSettings = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
      const parsedSettings = rawSettings
        ? (JSON.parse(rawSettings) as Partial<AppSettings>)
        : {};

      const dbNotificationSettings = {
        emailReminders:
          user.settingJson?.emailReminders ??
          DEFAULT_APP_SETTINGS.emailReminders,
        eventUpdates:
          user.settingJson?.eventUpdates ?? DEFAULT_APP_SETTINGS.eventUpdates,
        commentsReplies:
          user.settingJson?.commentsReplies ??
          DEFAULT_APP_SETTINGS.commentsReplies,
        marketingNews:
          user.settingJson?.marketingNews ?? DEFAULT_APP_SETTINGS.marketingNews,
      };

      setSettings({
        ...DEFAULT_APP_SETTINGS,
        ...parsedSettings,
        ...dbNotificationSettings,
      });
    } catch {
      // Ignore invalid local storage payload and keep defaults.
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

    const timeoutId = window.setTimeout(async () => {
      try {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
          {
            settingJson: {
              emailReminders: settings.emailReminders,
              eventUpdates: settings.eventUpdates,
              commentsReplies: settings.commentsReplies,
              marketingNews: settings.marketingNews,
            },
          },
          {
            withCredentials: true,
          },
        );
      } catch {
        // Ignore sync failures and keep local settings.
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isHydrated, settings]);

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
  ];

  const privacyOptions: ToggleOption[] = [
    {
      id: "showEmailOnProfile",
      label: "Email megjelenítése profilon",
      description: "Más felhasználók láthatják az email címedet.",
    },
    {
      id: "mentionByEmail",
      label: "Megemlítés email alapján",
      description: "Kereshető legyél beszélgetésekben email szerint.",
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
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Beállítások</h1>
        <p className="text-faded mt-1">
          Kezeld a fiók és alkalmazás beállításait.
        </p>
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
              <button className="w-full sm:w-auto px-3 py-2 rounded-lg border border-faded/20 bg-secondary/60 hover:bg-secondary transition ease-in-out cursor-pointer text-sm">
                Profil szerkesztése
              </button>
              <button
                onClick={logout}
                className="w-full sm:w-auto px-3 py-2 rounded-lg border border-red-300/40 bg-red-50 text-red-700 hover:bg-red-100 transition ease-in-out cursor-pointer text-sm"
              >
                Kijelentkezés minden eszközről
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm pt-1">
              <span className="text-faded">Hét kezdete</span>
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
          </div>
        </div>

        <div className="card-box h-auto! p-5 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={18} className="text-accent" />
            <h2 className="text-xl font-semibold">Adatvédelem</h2>
          </div>
          <div className="space-y-3 text-sm">
            {privacyOptions.map((option) => (
              <ToggleRow
                key={option.id}
                option={option}
                value={settings[option.id]}
                onToggle={() => setToggle(option.id)}
              />
            ))}
            <button className="w-full mt-1 px-3 py-2 rounded-lg border border-faded/20 bg-secondary/60 hover:bg-secondary transition ease-in-out cursor-pointer text-sm text-left">
              Adatok exportálása
            </button>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
              <span className="text-faded">Nyelv</span>
              <div className="inline-flex self-start rounded-lg overflow-hidden border border-faded/20">
                <button
                  onClick={() => setSettingValue("language", "hu")}
                  className={`px-3 py-1 text-sm ${
                    settings.language === "hu"
                      ? "bg-accent text-white"
                      : "bg-secondary/70"
                  }`}
                >
                  HU
                </button>
                <button
                  onClick={() => setSettingValue("language", "en")}
                  className={`px-3 py-1 text-sm ${
                    settings.language === "en"
                      ? "bg-accent text-white"
                      : "bg-secondary/70"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card-box h-auto! p-5 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-accent" />
            <h2 className="text-xl font-semibold">Régió</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-faded/20 pb-3">
              <span className="text-faded">Időzóna</span>
              <select
                value={settings.timezone}
                onChange={(event) =>
                  setSettingValue(
                    "timezone",
                    event.target.value as AppSettings["timezone"],
                  )
                }
                className="w-full sm:w-auto border border-faded/20 bg-secondary/70 rounded-lg px-2 py-1 cursor-pointer"
              >
                <option value="Europe/Budapest">Europe/Budapest</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-faded">Dátumformátum</span>
              <select
                value={settings.dateFormat}
                onChange={(event) =>
                  setSettingValue(
                    "dateFormat",
                    event.target.value as AppSettings["dateFormat"],
                  )
                }
                className="w-full sm:w-auto border border-faded/20 bg-secondary/70 rounded-lg px-2 py-1 cursor-pointer"
              >
                <option value="YYYY.MM.DD">YYYY.MM.DD</option>
                <option value="DD.MM.YYYY">DD.MM.YYYY</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-box h-auto! p-5 xl:col-span-2 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-accent" />
            <h2 className="text-xl font-semibold">Biztonság és hozzáférés</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
            <div className="border border-faded/20 rounded-xl p-4 bg-secondary/40 min-w-0">
              <div className="font-medium mb-2 flex items-center gap-2">
                <Shield size={16} className="text-accent" />
                Kétlépcsős azonosítás
              </div>
              <p className="text-sm text-faded mb-3">
                Növeld a fiókod biztonságát SMS vagy authenticator
                alkalmazással.
              </p>
              <button className="w-full sm:w-auto px-3 py-2 rounded-lg border border-faded/20 bg-secondary/70 hover:bg-secondary transition ease-in-out cursor-pointer text-sm">
                Bekapcsolás
              </button>
            </div>

            <div className="border border-faded/20 rounded-xl p-4 bg-secondary/40 min-w-0">
              <div className="font-medium mb-2">Aktív munkamenetek</div>
              <p className="text-sm text-faded mb-3">
                Kezeld, hogy mely eszközök maradhatnak bejelentkezve.
              </p>
              <button className="w-full sm:w-auto px-3 py-2 rounded-lg border border-faded/20 bg-secondary/70 hover:bg-secondary transition ease-in-out cursor-pointer text-sm">
                Munkamenetek megtekintése
              </button>
            </div>
          </div>
        </div>

        <div className="card-box h-auto! p-5 xl:col-span-2 border-red-300/40 min-w-0">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Veszélyzóna
          </h2>
          <p className="text-sm text-faded mb-4">
            Fiók törlése minden adatot végleg eltávolít. Ez a művelet nem
            visszavonható.
          </p>
          <button className="px-4 py-2 rounded-lg border border-red-300/50 bg-red-50 text-red-700 cursor-not-allowed text-sm">
            Fiók törlése (hamarosan)
          </button>
        </div>
      </section>
    </main>
  );
};

export default SettingsPage;
