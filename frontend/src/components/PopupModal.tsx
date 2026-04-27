"use client";

import { isReducedMotionEnabled } from "@/lib/motion";
import { PopupTone } from "@/contexts/PopupModalContext";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PopupRequest = {
  id: number;
  mode: "alert" | "confirm";
  title: string;
  message: string;
  tone: PopupTone;
  confirmText: string;
  cancelText: string;
};

const toneStyles: Record<PopupTone, { icon: React.ReactNode; accent: string }> =
  {
    info: {
      icon: <Info size={18} />,
      accent: "text-sky-700 bg-sky-100 border-sky-200",
    },
    success: {
      icon: <CheckCircle2 size={18} />,
      accent: "text-emerald-700 bg-emerald-100 border-emerald-200",
    },
    warning: {
      icon: <TriangleAlert size={18} />,
      accent: "text-amber-700 bg-amber-100 border-amber-200",
    },
    error: {
      icon: <AlertCircle size={18} />,
      accent: "text-red-700 bg-red-100 border-red-200",
    },
  };

export const PopupModal = ({
  request,
  onResolve,
}: {
  request: PopupRequest | null;
  onResolve: (value: boolean) => void;
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const closeDelay = reducedMotion ? 0 : 180;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setReducedMotion(isReducedMotionEnabled());
  }, []);

  useEffect(() => {
    if (!request) {
      setIsVisible(false);
      return;
    }

    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [request]);

  useEffect(() => {
    if (!request) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsVisible(false);
        window.setTimeout(() => onResolve(false), closeDelay);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeDelay, onResolve, request]);

  const handleResolve = (value: boolean) => {
    if (!request) {
      return;
    }

    setIsVisible(false);
    window.setTimeout(() => onResolve(value), closeDelay);
  };

  const tone = useMemo(() => {
    return request ? toneStyles[request.tone] : toneStyles.info;
  }, [request]);

  if (!request) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[5000] flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => handleResolve(false)}
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
      <div
        className={`relative card-box h-auto! w-full max-w-md p-5 border border-faded/25 shadow-2xl transition-all duration-200 ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-1 scale-[0.98]"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className={`rounded-full border p-1.5 ${tone.accent}`}>
            {tone.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold leading-tight">
              {request.title}
            </h3>
            <p className="text-faded mt-1 text-sm whitespace-pre-wrap">
              {request.message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          {request.mode === "confirm" && (
            <button
              type="button"
              onClick={() => handleResolve(false)}
              className="px-3 py-2 rounded-lg border border-faded/25 bg-secondary/60 hover:bg-secondary transition ease-in-out cursor-pointer"
            >
              {request.cancelText}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => handleResolve(true)}
            className="px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent/85 transition ease-in-out cursor-pointer"
          >
            {request.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
