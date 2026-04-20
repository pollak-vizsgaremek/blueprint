"use client";

import { useParams } from "next/navigation";
import { EventDetailsView } from "../EventDetailsView";

const EventPlaceTabPage = () => {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);

  return <EventDetailsView eventId={eventId} activeTab="place" />;
};

export default EventPlaceTabPage;
