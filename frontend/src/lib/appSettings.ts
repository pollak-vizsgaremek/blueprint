export type AppSettings = {
  emailReminders: boolean;
  eventUpdates: boolean;
  commentsReplies: boolean;
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
  emailReminders: true,
  eventUpdates: true,
  commentsReplies: false,
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

export const readAppSettings = (): AppSettings => {
  if (typeof window === "undefined") {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const rawSettings = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
    if (!rawSettings) {
      return DEFAULT_APP_SETTINGS;
    }

    const parsedSettings = JSON.parse(rawSettings) as Partial<AppSettings>;

    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsedSettings,
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
};
