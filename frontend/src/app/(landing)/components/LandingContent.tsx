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
      <Background
        color={[0, 1, 1]}
        mouseReact={false}
        amplitude={0.1}
        speed={0.1}
        onReady={() => setIsBackgroundReady(true)}
      />

      {/* Loading overlay */}
      {!isBackgroundReady && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
          <Spinner />
        </div>
      )}

      <main
        className={`${montserrat.className} ${
          !isBackgroundReady ? "opacity-0" : "opacity-100"
        } transition-opacity duration-500`}
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
