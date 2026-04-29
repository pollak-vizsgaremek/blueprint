export type AppSettings = {
  inAppReminders: boolean;
  eventUpdates: boolean;
  appointmentUpdates: boolean;
  marketingNews: boolean;
  showPastEvents: boolean;
  autoOpenEventModal: boolean;
  compactCalendar: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  weekStart: "monday" | "sunday";
  showWeekNumbers: boolean;
  defaultCalendarView: "month" | "agenda";
  hideCancelledAppointments: boolean;
};

export type BooleanAppSettingKey = {
  [K in keyof AppSettings]: AppSettings[K] extends boolean ? K : never;
}[keyof AppSettings];

export const APP_SETTINGS_STORAGE_KEY = "blueprint-settings-v1";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  inAppReminders: true,
  eventUpdates: true,
  appointmentUpdates: true,
  marketingNews: false,
  showPastEvents: true,
  autoOpenEventModal: true,
  compactCalendar: false,
  reducedMotion: false,
  highContrast: false,
  weekStart: "monday",
  showWeekNumbers: false,
  defaultCalendarView: "month",
  hideCancelledAppointments: true,
};

type LegacyAppSettings = Partial<AppSettings> & {
  emailReminders?: boolean;
  commentsReplies?: boolean;
};

export const normalizeAppSettings = (
  input: LegacyAppSettings | null | undefined,
): AppSettings => {
  const legacy = input ?? {};

  return {
    ...DEFAULT_APP_SETTINGS,
    ...legacy,
    appointmentUpdates:
      legacy.appointmentUpdates ?? legacy.commentsReplies ?? true,
    inAppReminders: legacy.inAppReminders ?? legacy.emailReminders ?? true,
  };
};

export const readAppSettings = (): AppSettings => {
  if (typeof window === "undefined") {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const rawSettings = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
    if (!rawSettings) {
      return DEFAULT_APP_SETTINGS;
    }

    const parsedSettings = JSON.parse(rawSettings) as LegacyAppSettings;
    return normalizeAppSettings(parsedSettings);
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
};
