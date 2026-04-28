"use client";

import { useParams } from "next/navigation";
import { EventDetailsView } from "../EventDetailsView";

const EventDetailsTabPage = () => {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);

  return <EventDetailsView eventId={eventId} activeTab="details" />;
};

export default EventDetailsTabPage;
