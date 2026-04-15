"use client";
import { Event, EventWithRegistrationInfo } from "@/types";
import React, { createContext, ReactNode, useContext, useState } from "react";

type ModalEvent = EventWithRegistrationInfo;

const normalizeEventForModal = (
  event: Event | EventWithRegistrationInfo,
): ModalEvent => {
  const enrichedEvent = event as EventWithRegistrationInfo;

  return {
    ...event,
    registrationCount: enrichedEvent.registrationCount ?? 0,
    userRegistration: enrichedEvent.userRegistration ?? null,
    isUserRegistered: enrichedEvent.isUserRegistered ?? false,
    isFull: enrichedEvent.isFull ?? false,
  };
};

const ModalContext = createContext<
  | {
      isOpen: boolean;
      openModal: (event: Event | EventWithRegistrationInfo) => void;
      closeModal: () => void;
      selectedEvent: ModalEvent | null;
      setEvent: (event: ModalEvent) => void;
    }
  | undefined
>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ModalEvent | null>(null);
  const openModal = (event: Event | EventWithRegistrationInfo) => {
    setIsOpen(true);
    setSelectedEvent(normalizeEventForModal(event));
    document.body.style.overflow = "hidden"; // Disable scrolling
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedEvent(null);
    document.body.style.overflow = "auto"; // Enable scrolling
  };

  const setEvent = (event: ModalEvent) => {
    setSelectedEvent(event);
  };

  return (
    <ModalContext.Provider
      value={{ isOpen, openModal, closeModal, selectedEvent, setEvent }}
    >
      {children}
    </ModalContext.Provider>
  );
};
