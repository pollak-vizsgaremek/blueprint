"use client"; // Error boundaries must be Client Components

import Image from "next/image";
import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="text-center text-4xl">
        <Image
          src="/500_koala.png"
          alt="Error"
          loading="eager"
          priority
          width={500}
          height={500}
        />
        <h2>Hiba történt!</h2>
      </div>
    </div>
  );
}
