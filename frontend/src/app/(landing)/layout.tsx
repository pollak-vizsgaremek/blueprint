import type { Metadata } from "next";
import LandingContent from "./components/LandingContent";

export const metadata: Metadata = {
  title: "Blueprint",
  description: "Esemény és időpont kezelő",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LandingContent>{children}</LandingContent>;
}
