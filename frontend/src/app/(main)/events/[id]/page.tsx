"use client";

import { useParams, redirect } from "next/navigation";

const EventPageRedirect = () => {
  const params = useParams<{ id: string }>();

  redirect(`/events/${params.id}/details`);
};

export default EventPageRedirect;
