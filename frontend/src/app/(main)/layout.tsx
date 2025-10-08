import type { Metadata } from "next";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

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
    <div className="pt-36">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
