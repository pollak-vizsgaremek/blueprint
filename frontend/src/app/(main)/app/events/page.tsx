"use client";

import axios from "axios";
import { PiSquaresFourFill } from "react-icons/pi";
import { FaList } from "react-icons/fa6";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/Spinner";
import { useSearchParams } from "next/navigation";
import { EventTiles } from "../../components/EventTiles";
import { Evenlist } from "../../components/EventList";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { isReducedMotionEnabled } from "@/lib/motion";

const EventsContent = () => {
  const searchParams = useSearchParams();
  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/events`,
        {
          withCredentials: true, // Include cookies in request
        },
      );
      return data;
    },
  });
  const view = searchParams.get("v") ?? "tiles";
  const filter = searchParams.get("f") ?? "all";

  useGSAP(() => {
    if (isReducedMotionEnabled()) {
      return;
    }

    gsap.from(".filter", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
  }, []);
  return (
    <main className="w-7/8 m-auto min-h-screen pt-20 mb-50">
      <div className="flex filter justify-between border-b-[1px] border-faded/40 pb-1">
        <div className="flex gap-1 text-xl">
          <Link
            href={`/app/events?v=${view}&f=all`}
            className={cn(
              "px-2 hover:bg-faded/40 transition ease-in-out rounded-md",
              {
                "bg-accent text-white pointer-events-none": filter === "all",
              },
            )}
          >
            Összes
          </Link>
          <Link
            href={`/app/events?v=${view}&f=future`}
            className={cn(
              "px-2 hover:bg-faded/40 transition ease-in-out rounded-md",
              {
                "bg-accent text-white pointer-events-none": filter === "future",
              },
            )}
          >
            Jövőbeli
          </Link>
          <Link
            href={`/app/events?v=${view}&f=past`}
            className={cn(
              "px-2 hover:bg-faded/40 transition ease-in-out rounded-md",
              {
                "bg-accent text-white pointer-events-none": filter === "past",
              },
            )}
          >
            Befejezett
          </Link>
        </div>
        <div className="flex gap-3 items-center">
          {view === "tiles" ? (
            <>
              <Link href={`/app/events?v=tiles&f=${filter}`}>
                <PiSquaresFourFill
                  size={30}
                  className="bg-accent rounded-md"
                  color="white"
                />
              </Link>
              <Link href={`/app/events?v=list&f=${filter}`}>
                <FaList
                  size={30}
                  className="hover:bg-faded transition ease-in-out rounded-md p-1"
                />
              </Link>
            </>
          ) : (
            <>
              <Link href={`/app/events?v=tiles&f=${filter}`}>
                <PiSquaresFourFill
                  size={30}
                  className="hover:bg-faded transition ease-in-out rounded-md"
                />
              </Link>
              <Link href={`/app/events?v=list&f=${filter}`}>
                <FaList
                  size={30}
                  className="bg-accent rounded-md p-1"
                  color="white"
                />
              </Link>
            </>
          )}
        </div>
      </div>
      {isLoading ? (
        <Spinner />
      ) : view === "tiles" ? (
        <EventTiles events={events} filter={filter} />
      ) : (
        <Evenlist events={events} filter={filter} />
      )}
    </main>
  );
};

const EventsPage = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <EventsContent />
    </Suspense>
  );
};

export default EventsPage;
