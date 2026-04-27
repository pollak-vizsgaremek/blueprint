"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type AdminFormModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
};

export const AdminFormModal = ({
  isOpen,
  title,
  description,
  onClose,
  children,
  maxWidthClassName = "max-w-3xl",
}: AdminFormModalProps) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Modal bezárása"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        className={`relative w-full ${maxWidthClassName} max-h-[92vh] overflow-hidden rounded-2xl border border-faded/20 bg-primary shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-faded/15 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold leading-tight">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-faded">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-faded/20 p-2 hover:bg-faded/10 transition ease-in-out cursor-pointer"
            aria-label="Bezárás"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-84px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
};
