"use client";

import { Spinner } from "@/components/Spinner";
import { GetPublishedNewsResponse, NewsItem } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";

const formatNewsDate = (publishedAt: string | null, createdAt: string) => {
  const date = new Date(publishedAt || createdAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const NewsPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["published-news"],
    queryFn: async () => {
      const { data } = await axios.get<GetPublishedNewsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/events/news`,
        {
          withCredentials: true,
        },
      );

      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <main className="w-7/8 m-auto min-h-screen pt-24 pb-20">
        <div className="card-box h-auto">
          <div className="text-xl text-red-600">
            Nem sikerült betölteni a híreket.
          </div>
        </div>
      </main>
    );
  }

  const newsItems = data?.news ?? [];

  return (
    <main className="w-7/8 m-auto min-h-screen pt-24 pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Hírek</h1>
        <p className="text-faded mt-1">
          A legfrissebb publikált hírek és közlemények.
        </p>
      </div>

      {newsItems.length === 0 ? (
        <div className="card-box h-auto p-6 text-faded text-center">
          Jelenleg nincs publikált hír.
        </div>
      ) : (
        <section className="space-y-4">
          {newsItems.map((news: NewsItem) => (
            <article
              key={news.id}
              className="card-box h-auto p-5 flex flex-col md:flex-row gap-4 items-start"
            >
              {news.imageUrl ? (
                <div className="relative w-full md:w-[220px] h-[160px] shrink-0 rounded-xl overflow-hidden">
                  <Image
                    src={news.imageUrl}
                    alt={news.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 220px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div className="min-w-0">
                <h2 className="text-2xl font-semibold leading-tight mb-2">
                  {news.title}
                </h2>
                <div className="text-xs text-faded mb-3">
                  {news.author?.name
                    ? `Szerző: ${news.author.name}`
                    : "Szerző ismeretlen"}
                  {formatNewsDate(news.publishedAt, news.createdAt)
                    ? ` • ${formatNewsDate(news.publishedAt, news.createdAt)}`
                    : ""}
                </div>
                <p className="text-faded whitespace-pre-wrap">{news.content}</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default NewsPage;
