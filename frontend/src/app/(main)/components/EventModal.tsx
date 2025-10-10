"use client";

import { useModal } from "@/contexts/ModalContext";
import { X } from "lucide-react";
import Image from "next/image";

export const EventModal = () => {
  const { isOpen, closeModal, selectedEvent } = useModal();
  return (
    isOpen && (
      <>
        <div className="w-screen h-screen fixed z-[1000] left-0 top-0 bg-black/40" />
        <div className=""></div>
        <div className="w-screen h-screen fixed z-[2000] left-0 top-0 flex justify-center items-center">
          <div className="w-full rounded-xl overflow-scroll p-5 border-faded border-[1px]  max-w-[1000px] h-6/10 bg-secondary">
            <button className="cursor-pointer mb-10" onClick={closeModal}>
              <X size={30} />
            </button>
            <div className="flex justify-between gap-5">
              <div className="relative size-96 ml-10 shrink-0">
                <Image
                  src={selectedEvent!.imageUrl!}
                  alt="Event"
                  fill
                  priority
                  className="rounded-2xl block object-center"
                />
              </div>
              <div className="px-4 flex flex-col justify-between">
                <div className="">
                  <div className="text-4xl mb-3">{selectedEvent?.name}</div>
                  <div className="text-faded">{selectedEvent?.description}</div>
                </div>
                <div className="flex justify-between">
                  <div className="">Szervező: {selectedEvent?.creator}</div>
                  <div className="">{selectedEvent?.date.slice(0, 10)}</div>
                </div>
              </div>
            </div>
            <div className="w-full justify-end flex mt-10 pr-4">
              <button className="bg-accent text-white px-3 py-2 rounded-xl cursor-pointer">
                Jelentkezés
              </button>
            </div>
          </div>
        </div>
      </>
    )
  );
};
