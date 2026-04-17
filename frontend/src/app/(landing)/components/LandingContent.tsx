"use client";

import { useState } from "react";
import { Header } from "./LandingHeader";
import { Footer } from "../../(main)/components/Footer";
import Background from "./Background";
import { Montserrat } from "next/font/google";
import { Spinner } from "@/components/Spinner";

const montserrat = Montserrat({
  subsets: ["latin"],
});

interface LandingContentProps {
  children: React.ReactNode;
}

export default function LandingContent({ children }: LandingContentProps) {
  const [isBackgroundReady, setIsBackgroundReady] = useState(false);

  return (
    <>
      <Header />

      <main
        className={`${montserrat.className} ${"opacity-100"} transition-opacity duration-500`}
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
