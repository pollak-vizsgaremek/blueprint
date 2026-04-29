export const queryKeys = {
  events: ["events"] as const,
  eventDetail: (eventId: number) => ["events", "detail", eventId] as const,
  myEvents: ["myevents"] as const,
  usersLite: ["users-lite"] as const,
  eventNews: (eventId: number) => ["event-news", eventId] as const,
  eventComments: (eventId: number) => ["event-comments", eventId] as const,
  eventCommentsModerated: (eventId: number) =>
    ["event-comments", eventId, 3] as const,
};
