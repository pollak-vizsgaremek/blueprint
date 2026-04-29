"use client";

import { Spinner } from "@/components/Spinner";
import { DataState } from "@/components/ui/DataState";
import { GetLatestPublishedNewsResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { Newspaper, TriangleAlert } from "lucide-react";

const truncate = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
};

export const NewsPanel = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["latest-news"],
    queryFn: async () => {
      const { data } = await axios.get<GetLatestPublishedNewsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events/news/latest`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grow flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <DataState
        icon={TriangleAlert}
        title="Nem sikerült betölteni a híreket."
        tone="error"
        compact
      />
    );
  }

  const latestNews = data?.news;

  if (!latestNews) {
    return (
      <DataState
        icon={Newspaper}
        title="Jelenleg nincs publikált hír."
        compact
      />
    );
  }

  const publishedAt = new Date(latestNews.publishedAt || latestNews.createdAt);
  const publishedLabel = Number.isNaN(publishedAt.getTime())
    ? ""
    : publishedAt.toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

  return (
    <Link
      href="/news"
      className="grow flex p-2 justify-between max-md:flex-col hover:bg-faded/20 transition ease-in-out cursor-pointer rounded-xl gap-3"
    >
      <div className="min-w-0 h-full flex flex-col justify-between pb-6">
        <div className="">
          <div className="text-xl leading-tight mb-1 line-clamp-2">
            {latestNews.title}
          </div>
          <div className="text-faded text-sm line-clamp-3">
            {truncate(latestNews.content, 140)}
          </div>
        </div>
        <div className="text-xs text-faded">
          {latestNews.author?.name
            ? `Szerző: ${latestNews.author.name}`
            : "Szerző ismeretlen"}
          {publishedLabel ? ` • ${publishedLabel}` : ""}
        </div>
      </div>
      {latestNews.imageUrl ? (
        <div className="shrink-0">
          <Image
            src={latestNews.imageUrl}
            alt={latestNews.title}
            width={220}
            height={120}
            className="rounded-xl mt-1 object-cover "
          />
        </div>
      ) : null}
    </Link>
  );
};
