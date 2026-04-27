"use client";

import { PopupModal } from "@/components/PopupModal";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type PopupTone = "info" | "success" | "warning" | "error";

type PopupMode = "alert" | "confirm";

type PopupRequest = {
  id: number;
  mode: PopupMode;
  title: string;
  message: string;
  tone: PopupTone;
  confirmText: string;
  cancelText: string;
  resolve: (value: boolean) => void;
};

type AlertOptions = {
  title?: string;
  message: string;
  tone?: PopupTone;
  confirmText?: string;
};

type ConfirmOptions = {
  title?: string;
  message: string;
  tone?: PopupTone;
  confirmText?: string;
  cancelText?: string;
};

type PopupModalContextType = {
  showAlert: (options: AlertOptions) => Promise<void>;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
};

const PopupModalContext = createContext<PopupModalContextType | undefined>(
  undefined,
);

export const usePopupModal = () => {
  const context = useContext(PopupModalContext);
  if (!context) {
    throw new Error("usePopupModal must be used within PopupModalProvider");
  }

  return context;
};

const toRequestId = () => Date.now() + Math.floor(Math.random() * 10000);

export const PopupModalProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<PopupRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<PopupRequest | null>(null);

  useEffect(() => {
    if (activeRequest || queue.length === 0) {
      return;
    }

    const [nextRequest, ...rest] = queue;
    setActiveRequest(nextRequest);
    setQueue(rest);
  }, [activeRequest, queue]);

  useEffect(() => {
    if (!activeRequest) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [activeRequest]);

  const enqueue = (payload: Omit<PopupRequest, "id" | "resolve">) => {
    return new Promise<boolean>((resolve) => {
      setQueue((previous) => [
        ...previous,
        {
          id: toRequestId(),
          ...payload,
          resolve,
        },
      ]);
    });
  };

  const showAlert = async (options: AlertOptions) => {
    await enqueue({
      mode: "alert",
      title: options.title ?? "Üzenet",
      message: options.message,
      tone: options.tone ?? "info",
      confirmText: options.confirmText ?? "Rendben",
      cancelText: "Mégse",
    });
  };

  const showConfirm = (options: ConfirmOptions) => {
    return enqueue({
      mode: "confirm",
      title: options.title ?? "Megerősítés",
      message: options.message,
      tone: options.tone ?? "warning",
      confirmText: options.confirmText ?? "Megerősítés",
      cancelText: options.cancelText ?? "Mégse",
    });
  };

  const resolveActive = (value: boolean) => {
    if (!activeRequest) {
      return;
    }

    activeRequest.resolve(value);
    setActiveRequest(null);
  };

  const value = useMemo(
    () => ({
      showAlert,
      showConfirm,
    }),
    [],
  );

  return (
    <PopupModalContext.Provider value={value}>
      {children}
      <PopupModal request={activeRequest} onResolve={resolveActive} />
    </PopupModalContext.Provider>
  );
};
