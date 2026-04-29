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
      <main className="page-shell page-main">
        <DataState
          icon={CircleAlert}
          title="Az esemény nem található."
          tone="error"
        />
      </main>
    );
  }

  return (
    <main className="page-shell min-h-screen px-0 pt-16 pb-8 sm:px-4 sm:pt-14 sm:pb-20">
      <div className="flex min-h-[100dvh] w-full flex-col rounded-none sm:min-h-[750px] sm:rounded-xl">
        <div className="relative shrink-0 overflow-hidden rounded-none bg-gray-400/10 backdrop-blur-xl sm:rounded-t-xl">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.name}
              width={0}
              height={0}
              sizes="100vw"
              priority
              className="h-[180px] w-full object-cover sm:h-[400px]"
            />
          ) : (
            <div className="flex h-[180px] items-center justify-center bg-faded/10 text-faded sm:h-[400px]">
              <div className="flex items-center gap-2">
                <ImageOff size={22} />
                Nincs eseménykép
              </div>
            </div>
          )}
        </div>

        <div className="border-b-[1px] border-b-faded/20 bg-secondary/60 px-2 py-3 backdrop-blur-xl sm:px-5 sm:py-5">
          <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap text-base sm:text-2xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => {
              const href = `/events/${eventId}/${tab.key}`;
              const isActive = pathname.endsWith(`/${tab.key}`);

              return (
                <Link
                  key={tab.key}
                  href={href}
                  prefetch
                  className={`relative shrink-0 rounded-lg px-3 py-1.5 transition sm:px-4 sm:py-0 ${
                    isActive
                      ? "after:content-[''] pointer-events-none after:block after:w-full after:h-[1px] after:bg-faded/80 after:absolute after:-bottom-[13px] sm:after:-bottom-[21px] after:left-0"
                      : "text-gray-400 cursor-pointer"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
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
