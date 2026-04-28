"use client";

import { Spinner } from "@/components/Spinner";
import { DataState } from "@/components/ui/DataState";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { CircleAlert, ImageOff } from "lucide-react";
import {
  EventDetailProvider,
  useEventDetail,
} from "../../../../contexts/EventDetailContext";

const tabs = [
  { key: "details", label: "Részletek" },
  { key: "news", label: "Hírek" },
  { key: "place", label: "Helyszín" },
  { key: "discussion", label: "Beszélgetés" },
] as const;

const EventLayoutBody = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { eventId, event, isLoading, isError } = useEventDetail();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <main className="w-7/8 m-auto min-h-screen pt-24 pb-20">
        <DataState
          icon={CircleAlert}
          title="Az esemény nem található."
          tone="error"
        />
      </main>
    );
  }

  return (
    <main className="w-7/8 m-auto min-h-screen pt-24 pb-20">
      <div className="rounded-xl w-full min-h-[750px] flex flex-col">
        <div className="relative shrink-0 bg-gray-400/10 backdrop-blur-xl rounded-t-xl overflow-hidden">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.name}
              width={0}
              height={0}
              sizes="100vw"
              priority
              className="h-[400px] w-full object-cover"
            />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-faded bg-faded/10">
              <div className="flex items-center gap-2">
                <ImageOff size={22} />
                Nincs eseménykép
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center p-5 pb-5 border-b-[1px] bg-secondary/60 backdrop-blur-xl border-b-faded/20 text-2xl">
          {tabs.map((tab) => {
            const href = `/events/${eventId}/${tab.key}`;
            const isActive = pathname.endsWith(`/${tab.key}`);

            return (
              <Link
                key={tab.key}
                href={href}
                prefetch
                className={`px-4 relative transition ${
                  isActive
                    ? "after:content-[''] pointer-events-none after:block after:w-full after:h-[1px] after:bg-faded/80 after:absolute after:-bottom-[21px] after:left-0"
                    : "text-gray-400 cursor-pointer"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        {children}
      </div>
    </main>
  );
};

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);

  return (
    <EventDetailProvider eventId={eventId}>
      <EventLayoutBody>{children}</EventLayoutBody>
    </EventDetailProvider>
  );
}
