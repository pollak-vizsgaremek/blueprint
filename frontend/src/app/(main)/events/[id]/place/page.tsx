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
    <div className="pt-5 px-4 sm:px-6 lg:px-10 pb-6 flex grow overflow-y-auto flex-col page-content">
      <div className="text-lg font-semibold">Helyszín</div>
      <div className="text-faded mt-1 mb-4">{event.location}</div>

      <EventNavigationMap classroom={event.classroom} />
    </div>
  );
};

export default EventPlaceTabPage;
