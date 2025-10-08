import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Blueprint",
  description: "Esemény és időpont kezelő",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <Providers>
        <body className="antialiased min-h-screen">{children}</body>
      </Providers>
    </html>
  );
}
