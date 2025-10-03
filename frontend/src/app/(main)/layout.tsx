import type { Metadata } from "next";
import { Header } from "./components/Header";

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
    <main className="pt-36">
      <Header />
      {children}
    </main>
  );
}
