"use client";

import axios from "axios";
import { PiSquaresFourFill } from "react-icons/pi";
import { FaList } from "react-icons/fa6";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/Spinner";
import { useSearchParams } from "next/navigation";
import { EventTiles } from "@/components/EventTiles";
import { Evenlist } from "@/components/EventList";
import Link from "next/link";
import { cn } from "@/lib/utils";

const EventsPage = () => {
  const searchParams = useSearchParams();
  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/events`,
      );
      return data;
    },
  });
  const view = searchParams.get("v") ?? "tiles";
  const filter = searchParams.get("f") ?? "all";

  return (
    <div className="w-7/8 m-auto">
      <div className="flex justify-between border-b-[1px] border-slate-400 pb-1">
        <div className="flex gap-1 text-xl">
          <Link href={`/events?v=${view}&f=all`}>
            <div
              className={cn("px-2", {
                "bg-accent text-white rounded-md": filter === "all",
              })}
            >
              Összes
            </div>
          </Link>
          <Link href={`/events?v=${view}&f=future`}>
            <div
              className={cn("px-2", {
                "bg-accent text-white rounded-md": filter === "future",
              })}
            >
              Jövőbeli
            </div>
          </Link>
          <Link href={`/events?v=${view}&f=past`}>
            <div
              className={cn("px-2", {
                "bg-accent text-white rounded-md": filter === "past",
              })}
            >
              Befejezett
            </div>
          </Link>
        </div>
        <div className="flex gap-3 items-center">
          {view === "tiles" ? (
            <>
              <Link href={`/events?v=tiles&f=${filter}`}>
                <PiSquaresFourFill
                  size={30}
                  className="bg-accent rounded-md"
                  color="white"
                />
              </Link>
              <Link href={`/events?v=list&f=${filter}`}>
                <FaList size={25} />
              </Link>
            </>
          ) : (
            <>
              <Link href={`/events?v=tiles&f=${filter}`}>
                <PiSquaresFourFill size={30} />
              </Link>
              <Link href={`/events?v=list&f=${filter}`}>
                <FaList
                  size={25}
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
    </div>
  );
};

export default EventsPage;
