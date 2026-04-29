"use client";

import { EventNavigationMap } from "@/components/navigation/EventNavigationMap";
import { useEventDetail } from "../../../../../contexts/EventDetailContext";
import { isReducedMotionEnabled } from "@/lib/motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const EventPlaceTabPage = () => {
  const { event } = useEventDetail();

  if (!event) {
    return null;
  }

  useGSAP(() => {
    if (isReducedMotionEnabled()) {
      return;
    }

    gsap.from(".page-content", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
  }, []);

  return (
    <div className="mt-4 flex grow flex-col overflow-y-auto px-4 pb-6 pt-2 page-content sm:mt-5 sm:px-6 lg:px-10">
      <div className="text-lg font-semibold">Helyszín</div>
      <div className="text-faded mt-1 mb-4">{event.location}</div>

      <EventNavigationMap classroom={event.classroom} />
    </div>
  );
};

export default EventPlaceTabPage;
