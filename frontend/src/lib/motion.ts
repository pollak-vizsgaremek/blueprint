import { readAppSettings } from "@/lib/appSettings";

export const isReducedMotionEnabled = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const appSettings = readAppSettings();
  const systemPrefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  return appSettings.reducedMotion || systemPrefersReducedMotion;
};
