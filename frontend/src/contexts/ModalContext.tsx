"use client";
import { Event } from "@/types";
import React, { createContext, ReactNode, useContext, useState } from "react";

const ModalContext = createContext<
  | {
      isOpen: boolean;
      openModal: (event: Event) => void;
      closeModal: () => void;
      selectedEvent: Event | null;
      setEvent: (event: Event) => void;
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
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const openModal = (event: Event) => {
    setIsOpen(true);
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedEvent(null);
  };
  const setEvent = (event: Event) => {
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
