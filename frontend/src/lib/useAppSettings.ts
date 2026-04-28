"use client";

import {
  APP_SETTINGS_STORAGE_KEY,
  AppSettings,
  DEFAULT_APP_SETTINGS,
  readAppSettings,
} from "@/lib/appSettings";
import { useEffect, useState } from "react";

export const APP_SETTINGS_UPDATED_EVENT = "app-settings-updated";

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-contrast",
      settings.highContrast ? "high" : "normal",
    );
  }, [settings.highContrast]);

  useEffect(() => {
    setSettings(readAppSettings());
    setIsHydrated(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== APP_SETTINGS_STORAGE_KEY) {
        return;
      }

      setSettings(readAppSettings());
    };

    const onSettingsUpdated = () => {
      setSettings(readAppSettings());
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(APP_SETTINGS_UPDATED_EVENT, onSettingsUpdated);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(APP_SETTINGS_UPDATED_EVENT, onSettingsUpdated);
    };
  }, []);

  return {
    settings,
    isHydrated,
  };
};
